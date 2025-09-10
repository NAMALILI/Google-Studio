import React, { useState, useEffect, useCallback } from 'react';
import { generatePortrait } from './services/geminiService';
import ImageUploader from './components/ImageUploader';
import { SparklesIcon, DownloadIcon, ArrowLeftIcon } from './components/icons';
import { LOADING_MESSAGES, STYLES } from './constants';

// Helper to convert a File object to a base64 string and extract mime type
const fileToBase64 = (file: File): Promise<{ data: string; mimeType: string; previewUrl: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const mimeType = result.substring(5, result.indexOf(';'));
      const base64Data = result.split(',')[1];
      resolve({ data: base64Data, mimeType, previewUrl: result });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const App: React.FC = () => {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalImagePreview, setOriginalImagePreview] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>(LOADING_MESSAGES[0]);
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [hoveredStyleDesc, setHoveredStyleDesc] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) {
      let messageIndex = 0;
      const interval = setInterval(() => {
        messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
        setLoadingMessage(LOADING_MESSAGES[messageIndex]);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const handleImageSelect = useCallback(async (file: File) => {
    setOriginalFile(file);
    setError(null);
    try {
      const { previewUrl } = await fileToBase64(file);
      setOriginalImagePreview(previewUrl);
    } catch (e) {
      setError("Failed to read image file.");
      setOriginalFile(null);
    }
  }, []);

  const handleGenerate = async () => {
    if (!originalFile) return;

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setLoadingMessage(LOADING_MESSAGES[0]);

    try {
      const { data, mimeType } = await fileToBase64(originalFile);
      const finalPrompt = `${selectedStyle.prompt} ${customPrompt}`.trim();
      const generatedData = await generatePortrait(data, mimeType, finalPrompt);
      setGeneratedImage(`data:image/png;base64,${generatedData}`);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setOriginalFile(null);
    setOriginalImagePreview(null);
    setGeneratedImage(null);
    setIsLoading(false);
    setError(null);
    setSelectedStyle(STYLES[0]);
    setCustomPrompt('');
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = 'ai_portrait.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderContent = () => {
    if (!originalImagePreview) {
      return <ImageUploader onImageSelect={handleImageSelect} setError={setError} />;
    }

    return (
      <div className="w-full flex flex-col items-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-semibold text-gray-500 mb-4">Original</h2>
            <div className="aspect-square w-full rounded-2xl overflow-hidden bg-white shadow-md border border-gray-200">
              <img src={originalImagePreview} alt="Original upload" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-semibold text-gray-500 mb-4">AI Portrait</h2>
            <div className="aspect-square w-full rounded-2xl overflow-hidden bg-white shadow-md border border-gray-200 flex items-center justify-center">
              {isLoading ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">{loadingMessage}</p>
                </div>
              ) : generatedImage ? (
                <img src={generatedImage} alt="Generated portrait" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-gray-400 p-4">
                  <SparklesIcon className="w-16 h-16 mx-auto mb-2" />
                  <p>Choose a style and generate your portrait.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        { !isLoading && !generatedImage && (
             <div className="w-full max-w-5xl mt-8">
                <h3 className="text-lg font-semibold text-center text-gray-600 mb-4">Choose a Style</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {STYLES.map((style) => (
                        <button
                            key={style.id}
                            onClick={() => setSelectedStyle(style)}
                            onMouseEnter={() => setHoveredStyleDesc(style.description)}
                            onMouseLeave={() => setHoveredStyleDesc(null)}
                            className={`p-3 rounded-xl border-2 transition-all duration-200 text-center font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-blue-500 ${
                                selectedStyle.id === style.id
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                    : 'bg-white border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700'
                            }`}
                        >
                            {style.name}
                        </button>
                    ))}
                </div>

                <div className="mt-4 h-16 w-full bg-gray-100 rounded-xl p-2 flex items-center justify-center text-center transition-all duration-300 border border-gray-200">
                    <p className="text-gray-500 text-sm">
                        {hoveredStyleDesc || 'Hover over a style to see its description.'}
                    </p>
                </div>

                <div className="mt-6">
                    <label htmlFor="custom-prompt" className="block text-sm font-bold text-gray-500 mb-2">
                        自定义需求 (Optional)
                    </label>
                    <textarea
                        id="custom-prompt"
                        rows={3}
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="例如：添加微笑，看向镜头，佩戴银色耳环..."
                        className="w-full bg-white border-2 border-gray-300 rounded-xl p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
                        aria-label="Custom requirements"
                    />
                </div>
            </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
            { !isLoading && !generatedImage && (
                 <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-blue-500 transition-all duration-300 transform hover:scale-105 flex items-center gap-2 text-lg shadow-lg shadow-blue-500/30"
                 >
                    <SparklesIcon className="w-6 h-6" />
                    Generate Portrait
                 </button>
            )}
            { generatedImage && !isLoading && (
                 <>
                    <button
                        onClick={handleDownload}
                        className="bg-green-600 text-white font-bold py-3 px-8 rounded-full hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-green-500 transition-all duration-300 flex items-center gap-2 text-lg shadow-lg shadow-green-500/30"
                    >
                        <DownloadIcon className="w-6 h-6" />
                        Download
                    </button>
                    <button
                        onClick={handleReset}
                        className="bg-gray-200 text-gray-700 font-bold py-3 px-8 rounded-full hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-gray-400 transition-all duration-300 flex items-center gap-2 text-lg border border-gray-300"
                    >
                        <ArrowLeftIcon className="w-6 h-6" />
                        Start Over
                    </button>
                 </>
            )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col items-center p-4 sm:p-8 font-sans">
      <header className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">
          AI Portrait Studio
        </h1>
        <p className="mt-3 text-lg text-gray-500 max-w-2xl mx-auto">
          Transform your photos into timeless masterpieces with different styles.
        </p>
      </header>
      <main className="w-full flex-grow flex items-center justify-center">
        {error && (
            <div className="w-full max-w-2xl mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-6" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
                <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                <svg className="fill-current h-6 w-6 text-red-700" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                </button>
            </div>
        )}
        {renderContent()}
      </main>
      <footer className="text-center text-gray-500 mt-8 text-sm">
        <p>Powered by Gemini. Designed for artistic expression.</p>
      </footer>
    </div>
  );
};

export default App;
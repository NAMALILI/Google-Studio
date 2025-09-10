
import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon } from './icons';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  setError: (error: string | null) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, setError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileValidation = (file: File): boolean => {
    if (!file) return false;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!allowedTypes.includes(file.type)) {
      setError(`Unsupported file type: ${file.type}. Please upload a JPEG, PNG, WEBP or HEIC image.`);
      return false;
    }
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError(`File size exceeds 10MB. Please upload a smaller image.`);
      return false;
    }
    return true;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && handleFileValidation(file)) {
      setError(null);
      onImageSelect(file);
    }
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file && handleFileValidation(file)) {
      setError(null);
      onImageSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-8">
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`w-full h-80 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
          isDragging ? 'border-indigo-400 bg-gray-800/50' : 'border-gray-600 hover:border-gray-500'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/webp,image/heic"
          className="hidden"
        />
        <UploadIcon className="w-16 h-16 text-gray-500 mb-4 transition-transform duration-300 group-hover:scale-110" />
        <p className="text-gray-400 text-lg">
          <span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop
        </p>
        <p className="text-gray-500 text-sm mt-1">PNG, JPG, WEBP, or HEIC (max 10MB)</p>
      </div>
    </div>
  );
};

export default ImageUploader;

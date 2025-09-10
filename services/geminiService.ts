import { GoogleGenAI, Modality } from "@google/genai";

// Ensure the API key is available
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generatePortrait = async (base64ImageData: string, mimeType: string, prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64ImageData,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: prompt,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        // The API can return multiple parts, find the one with image data.
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }

        // Handle cases where no image is returned (e.g., safety filters)
        throw new Error("API did not return an image. The prompt may have been blocked or the response was empty.");

    } catch (error) {
        console.error("Error generating portrait:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate portrait: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the portrait.");
    }
};
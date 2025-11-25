import { GoogleGenAI } from "@google/genai";

// We use the Gemini API here to allow the Admin to GENERATE a template background
// if they don't have one. This showcases the generative capabilities.

export const generateTemplateImage = async (prompt: string): Promise<string | null> => {
  if (!process.env.API_KEY) {
    console.error("API Key not found");
    throw new Error("Missing API Key");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    // Using Imagen model for image generation
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `A high quality, fun photo template background where a person's face can be inserted. ${prompt}. Ensure there is a clear spot for a face.`,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1', // Square templates are easier to handle for this demo
      },
    });

    const base64Data = response.generatedImages?.[0]?.image?.imageBytes;
    if (base64Data) {
      return `data:image/jpeg;base64,${base64Data}`;
    }
    return null;

  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    // Fallback or re-throw depending on UX needs
    throw error;
  }
};

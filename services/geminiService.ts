import { GoogleGenAI } from "@google/genai";
import { EditorSettings, EnhancementMode, IDPhotoSettings, IDPhotoSize, IDPhotoBackground, RestorationSettings, EnhancementQuality } from "../types";

// Helper to convert base64 to strict base64 string without data prefix
const cleanBase64 = (dataUrl: string): string => {
  return dataUrl.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
};

const getMimeType = (dataUrl: string): string => {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  return match ? match[1] : 'image/jpeg';
};

const getApiKey = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }
  return apiKey;
};

const extractImageFromResponse = (response: any): string => {
  if (response.candidates && response.candidates[0].content.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  }
  throw new Error("No image data returned from Gemini.");
};

export const enhanceImageWithGemini = async (
  imageBase64: string,
  settings: EditorSettings
): Promise<string> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  
  // Use Gemini 3 Pro for 8K/High quality, otherwise Flash for speed
  const isPro = settings.quality === EnhancementQuality.Q_8K;
  const model = isPro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

  let prompt = "Edit this image to improve its quality significantly.";
  
  if (settings.mode === EnhancementMode.ENHANCE_RESTORE) {
    prompt += " Restore facial details, fix artifacts, and improve lighting.";
    if (settings.hyperRealism) prompt += " Maintain realistic skin texture (hyper-realism).";
    if (settings.makeup) prompt += " Apply very subtle, natural enhancement to facial features.";
    if (settings.colorize) prompt += " Ensure colors are vibrant and corrected.";
  } else {
    prompt += " Focus strictly on upscaling and sharpening the image details without altering facial features.";
  }

  prompt += ` The target quality should perceive as ${settings.quality}.`;
  prompt += ` Sharpening intensity: ${settings.sharpenLevel}%.`;
  prompt += " Return the processed image in high resolution.";

  try {
    const mimeType = getMimeType(imageBase64);
    const cleanData = cleanBase64(imageBase64);

    const config: any = {};
    if (isPro) {
      config.imageConfig = { imageSize: '4K' };
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { data: cleanData, mimeType: mimeType } },
          { text: prompt },
        ],
      },
      config: config
    });

    return extractImageFromResponse(response);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to process image with AI");
  }
};

export const generateIDPhotoWithGemini = async (
  imageBase64: string,
  settings: IDPhotoSettings
): Promise<string> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });

  // Map background enum to visual description
  const bgMap: Record<IDPhotoBackground, string> = {
    [IDPhotoBackground.WHITE]: "pure white (#FFFFFF)",
    [IDPhotoBackground.BLUE]: "standard ID photo blue (#2196F3)",
    [IDPhotoBackground.RED]: "standard ID photo red (#D32F2F)",
    [IDPhotoBackground.BLACK]: "solid black",
    [IDPhotoBackground.GRAY]: "professional gray"
  };

  // Determine standard aspect ratio for API config
  // Gemini supports: "1:1", "3:4", "4:3", "9:16", "16:9"
  // We force 3:4 for all portrait ID formats to ensure correct vertical cropping
  let apiAspectRatio = "3:4";
  if (settings.size === IDPhotoSize.SIZE_5x5) {
    apiAspectRatio = "1:1";
  }

  // Detailed size description for the prompt
  const sizeMap: Record<IDPhotoSize, string> = {
    [IDPhotoSize.SIZE_2x3]: "vertical ID photo (2cm x 3cm ratio)",
    [IDPhotoSize.SIZE_3x4]: "standard vertical ID photo (3cm x 4cm ratio)",
    [IDPhotoSize.SIZE_4x6]: "large vertical ID photo (4cm x 6cm ratio)",
    [IDPhotoSize.SIZE_35x45]: "passport photo (3.5cm x 4.5cm ratio)",
    [IDPhotoSize.SIZE_5x5]: "square visa photo (5cm x 5cm ratio)"
  };

  let prompt = "Strictly transform this image into a professional official ID/Passport photo. ";
  prompt += `1. CROP & COMPOSITION: Crop the image to a ${apiAspectRatio === '3:4' ? 'Vertical Portrait' : 'Square'} format. `;
  prompt += "The face must be perfectly CENTERED and facing forward. ";
  prompt += "The head (from top of hair to chin) must occupy 70% to 80% of the vertical height. ";
  prompt += "Include the shoulders. Both ears should be visible if possible. Eyes must be level. ";
  
  prompt += `2. BACKGROUND: Remove the original background completely. Replace with a clean, flat ${bgMap[settings.backgroundColor]} background. No shadows on the background. `;
  
  // Retouching instructions
  prompt += "3. ENHANCEMENT: ";
  if (settings.removeBlemishes) prompt += "Remove acne, moles, spots, and scratches from the face. ";
  prompt += `Smooth skin texture naturally (Intensity: ${settings.skinSmoothing}%). `;
  if (settings.fixLighting) prompt += "Fix lighting to be even and soft (studio lighting), removing harsh shadows on the face. ";
  
  prompt += `4. OUTPUT: High resolution, sharp focus. Intended for printing at ${sizeMap[settings.size]}.`;

  try {
    const mimeType = getMimeType(imageBase64);
    const cleanData = cleanBase64(imageBase64);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: cleanData, mimeType: mimeType } },
          { text: prompt },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: apiAspectRatio as any // Force the model to output the correct shape
        }
      }
    });

    return extractImageFromResponse(response);
  } catch (error: any) {
    console.error("Gemini ID Photo API Error:", error);
    throw new Error(error.message || "Failed to create ID photo");
  }
};

export const restoreImageWithGemini = async (
  imageBase64: string,
  settings: RestorationSettings
): Promise<string> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });

  // Always use Gemini 3 Pro for Restoration as requested
  const model = 'gemini-3-pro-image-preview';

  let prompt = "Act as a professional photo restoration expert. Restore this old, damaged, or blurry photo. ";
  
  prompt += `1. DAMAGE REPAIR: Remove scratches, cracks, tears, dust spots, and fold marks. (Intensity: ${settings.scratchReduction}%). `;
  
  prompt += "2. DETAIL RECOVERY: Deblur the image and sharpen details specifically on clothing and background textures. ";
  if (settings.faceRestoration) {
    prompt += "Use advanced facial restoration to recover facial features, eyes, and skin texture. CRITICAL: Do NOT alter the person's identity or facial structure. Keep original angles and features authentic. ";
  }

  if (settings.colorRestoration) {
    prompt += "3. COLORIZATION: If the photo is B&W or sepia, strictly colorize it with natural, historically accurate colors. If it's color but faded, restore vibrancy. ";
  } else {
    prompt += "3. COLOR: Keep the original color profile (B&W or Sepia) but improve contrast and remove yellow aging stains. ";
  }

  prompt += `4. QUALITY: High fidelity restoration. Reduce noise level by ${settings.denoiseLevel}%.`;

  try {
    const mimeType = getMimeType(imageBase64);
    const cleanData = cleanBase64(imageBase64);

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { data: cleanData, mimeType: mimeType } },
          { text: prompt },
        ],
      },
      config: {
        imageConfig: {
            imageSize: '4K' // Use 4K for Pro model to ensure high quality restoration
        }
      }
    });

    return extractImageFromResponse(response);
  } catch (error: any) {
    console.error("Gemini Restoration API Error:", error);
    throw new Error(error.message || "Failed to restore photo");
  }
};
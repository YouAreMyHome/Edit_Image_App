
export enum EnhancementQuality {
  Q_2K = '2K (Fast)',
  Q_4K = '4K (Sharp)',
  Q_8K = '8K ULTRA HDR'
}

export enum EnhancementMode {
  UPSCALE_ONLY = 'Upscale Only',
  ENHANCE_RESTORE = 'Enhance & Restore'
}

export enum IDPhotoSize {
  SIZE_2x3 = '2x3 cm',
  SIZE_3x4 = '3x4 cm',
  SIZE_4x6 = '4x6 cm',
  SIZE_35x45 = '3.5x4.5 cm (Passport)',
  SIZE_5x5 = '5x5 cm (Visa)'
}

export enum IDPhotoBackground {
  WHITE = 'White',
  BLUE = 'Blue',
  RED = 'Red',
  BLACK = 'Black',
  GRAY = 'Gray'
}

export enum AppTab {
  ENHANCE = 'enhance',
  ID_PHOTO = 'id_photo',
  RESTORE = 'restore'
}

export interface EditorSettings {
  quality: EnhancementQuality;
  mode: EnhancementMode;
  retouchLevel: number; // 0-100
  sharpenLevel: number; // 0-100
  upscaleLevel: number; // 0-100
  hyperRealism: boolean;
  colorize: boolean;
  makeup: boolean;
}

export interface IDPhotoSettings {
  size: IDPhotoSize;
  backgroundColor: IDPhotoBackground;
  quality: EnhancementQuality;
  skinSmoothing: number; // 0-100
  removeBlemishes: boolean; // Acne, moles, etc.
  fixLighting: boolean;
}

export interface RestorationSettings {
  scratchReduction: number; // 0-100
  denoiseLevel: number; // 0-100
  colorRestoration: boolean; // Colorize B&W or fix faded colors
  faceRestoration: boolean; // Specific AI model focus on faces
  sharpenArtifacts: boolean; // Fix blur
  quality: EnhancementQuality;
}

export interface ImageState {
  originalUrl: string | null;
  processedUrl: string | null;
  isProcessing: boolean;
  error: string | null;
}

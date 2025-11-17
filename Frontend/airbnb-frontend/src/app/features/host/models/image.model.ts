export interface ImageUpload {
  file: File;
  preview: string;
  progress: number;
  uploaded: boolean;
  error?: string;
}

export interface ImageUploadResponse {
  success: boolean;
  url?: string;
  id?: string;
  message?: string;
  error?: string;
}

export interface ImageMetadata {
  id: string;
  url: string;
  thumbnailUrl?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  width: number;
  height: number;
  uploadedAt: Date;
}

export const IMAGE_UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  maxImages: 20,
  minImages: 5,
  recommendedDimensions: {
    width: 1920,
    height: 1080
  }
};
export interface PropertyImage {
  id: string;
  propertyId: string;
  imageUrl: string;
  isPrimary: boolean;
  order: number;
}

export interface ImageUploadRequest {
  file: File;
  order: number;
  isPrimary: boolean;
}

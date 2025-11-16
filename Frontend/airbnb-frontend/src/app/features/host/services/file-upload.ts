import { Injectable } from '@angular/core';
import { Observable, of, throwError, Subject } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { 
  ImageUpload, 
  ImageUploadResponse, 
  ImageMetadata,
  IMAGE_UPLOAD_CONFIG 
} from '../models/image.model';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private uploadProgress$ = new Subject<{ fileId: string; progress: number }>();

  constructor() {}

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > IMAGE_UPLOAD_CONFIG.maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds ${IMAGE_UPLOAD_CONFIG.maxFileSize / 1024 / 1024}MB limit`
      };
    }

    // Check file type
    if (!IMAGE_UPLOAD_CONFIG.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Allowed: JPEG, PNG, WebP'
      };
    }

    return { valid: true };
  }

  /**
   * Validate multiple files
   */
  validateFiles(files: File[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (files.length > IMAGE_UPLOAD_CONFIG.maxImages) {
      errors.push(`Maximum ${IMAGE_UPLOAD_CONFIG.maxImages} images allowed`);
    }

    files.forEach((file, index) => {
      const validation = this.validateFile(file);
      if (!validation.valid) {
        errors.push(`File ${index + 1}: ${validation.error}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create preview URL for file
   */
  createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * Upload single image
   * In production, this would send to your backend API
   */
  uploadImage(file: File, propertyId?: string): Observable<ImageUploadResponse> {
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.valid) {
      return throwError(() => new Error(validation.error));
    }

    // Simulate image upload with progress
    const fileId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate upload progress
    this.simulateUploadProgress(fileId);

    // Mock successful upload response
    // In production, you would use HttpClient to POST to your API
    const response: ImageUploadResponse = {
      success: true,
      url: this.createPreviewUrl(file), // In production, this would be the CDN URL
      id: fileId,
      message: 'Image uploaded successfully'
    };

    return of(response).pipe(
      delay(1500) // Simulate network delay
    );
  }

  /**
   * Upload multiple images
   */
  uploadMultipleImages(
    files: File[], 
    propertyId?: string
  ): Observable<ImageUploadResponse[]> {
    // Validate files
    const validation = this.validateFiles(files);
    if (!validation.valid) {
      return throwError(() => new Error(validation.errors.join(', ')));
    }

    // Upload each file
    const uploadObservables = files.map(file => this.uploadImage(file, propertyId));
    
    // In production, you might want to use forkJoin to upload in parallel
    // or concat to upload sequentially
    return of(uploadObservables).pipe(
      delay(2000),
      map(() => 
        files.map((file, index) => ({
          success: true,
          url: this.createPreviewUrl(file),
          id: `img-${Date.now()}-${index}`,
          message: 'Image uploaded successfully'
        }))
      )
    );
  }

  /**
   * Simulate upload progress (for UI feedback)
   */
  private simulateUploadProgress(fileId: string): void {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      this.uploadProgress$.next({ fileId, progress });
      
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 150);
  }

  /**
   * Get upload progress observable
   */
  getUploadProgress(): Observable<{ fileId: string; progress: number }> {
    return this.uploadProgress$.asObservable();
  }

  /**
   * Delete image
   * In production, this would call your backend API
   */
  deleteImage(imageId: string): Observable<boolean> {
    // Mock deletion
    return of(true).pipe(delay(500));
  }

  /**
   * Reorder images
   */
  reorderImages(imageIds: string[]): Observable<boolean> {
    // In production, send new order to backend
    return of(true).pipe(delay(300));
  }

  /**
   * Set main image
   */
  setMainImage(imageId: string): Observable<boolean> {
    return of(true).pipe(delay(300));
  }

  /**
   * Get image dimensions
   */
  getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }

  /**
   * Compress image before upload (optional)
   */
  async compressImage(file: File, maxWidth: number = 1920): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Compression failed'));
              }
            },
            'image/jpeg',
            0.85 // Quality
          );
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Batch upload with retry logic
   */
  uploadWithRetry(
    file: File, 
    maxRetries: number = 3
  ): Observable<ImageUploadResponse> {
    let attempts = 0;
    
    const attemptUpload = (): Observable<ImageUploadResponse> => {
      return this.uploadImage(file).pipe(
        map(response => {
          if (!response.success && attempts < maxRetries) {
            attempts++;
            return attemptUpload();
          }
          return of(response);
        })
      ) as any;
    };
    
    return attemptUpload();
  }

  /**
   * Create image metadata
   */
  async createImageMetadata(file: File, url: string, id: string): Promise<ImageMetadata> {
    const dimensions = await this.getImageDimensions(file);
    
    return {
      id,
      url,
      thumbnailUrl: url, // In production, generate thumbnail
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      width: dimensions.width,
      height: dimensions.height,
      uploadedAt: new Date()
    };
  }

  /**
   * Clean up blob URLs
   */
  revokeObjectURL(url: string): void {
    URL.revokeObjectURL(url);
  }
}
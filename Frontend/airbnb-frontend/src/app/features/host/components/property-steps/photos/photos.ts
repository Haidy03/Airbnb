import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';
import { PropertyService } from '../../../services/property';
import { Property } from '../../../models/property.model'; 
import { NotificationService } from '../../../../../core/services/notification.service';
import Swal from 'sweetalert2';

interface UploadedImage {
  id: string;
  file?: File;
  preview: string;
  progress: number;
  uploaded: boolean;
  error?: string;
  displayOrder?: number;
  isPrimary?: boolean;
}

@Component({
  selector: 'app-property-photos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './photos.html',
  styleUrls: ['./photos.css']
})
export class PropertyPhotosComponent implements OnInit {
  // State signals
  uploadedImages = signal<UploadedImage[]>([]);
  isDragging = signal(false);
  isUploading = signal(false);
  uploadProgress = signal(0);
  isLoading = signal(false);
  
  // Draft data
  currentDraft: Property | null = null;
  currentDraftId: string | null = null;

  // Constants
  minPhotos = 5;
  maxPhotos = 20;
  maxFileSize = 5 * 1024 * 1024; 
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  constructor(
    private router: Router,
    private propertyService: PropertyService,
    private http: HttpClient,
    private notificationService: NotificationService 
  ) {}

  ngOnInit(): void {
    this.getCurrentDraft();
  }

  private getCurrentDraft(): void {
    this.currentDraftId = localStorage.getItem('currentDraftId');
    
    if (!this.currentDraftId) {
      console.error('No draft ID found');
      this.router.navigate(['/host/properties/intro']);
      return;
    }

    this.propertyService.getDraftById(this.currentDraftId).subscribe({
      next: (draft) => {
        this.currentDraft = draft;
        console.log('✅ Draft loaded:', draft);
        this.loadSavedImages();
      },
      error: (error) => {
        console.error('Error loading draft:', error);

        this.notificationService.showError('Failed to load property draft');
        this.router.navigate(['/host/properties']);
      }
    });
  }

  private loadSavedImages(): void {
    if (this.currentDraft?.images && this.currentDraft.images.length > 0) {
      const images = this.currentDraft.images.map((img: any, index: number) => ({
        id: img.id?.toString() || `img-${Date.now()}-${index}`,
        preview: img.imageUrl?.startsWith('http') 
          ? img.imageUrl 
          : `${environment.imageBaseUrl}${img.imageUrl}`,
        progress: 100,
        uploaded: true,
        displayOrder: img.displayOrder,
        isPrimary: img.isPrimary
      }));
      this.uploadedImages.set(images);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
      input.value = '';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (event.dataTransfer?.files) {
      this.handleFiles(Array.from(event.dataTransfer.files));
    }
  }

  private handleFiles(files: File[]): void {
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file, index) => {
      if (!this.allowedTypes.includes(file.type)) {
        errors.push(`File ${index + 1}: Invalid file type. Only JPEG, PNG, and WebP allowed.`);
        return;
      }
      if (file.size > this.maxFileSize) {
        errors.push(`File ${index + 1}: File size exceeds 5MB limit.`);
        return;
      }
      validFiles.push(file);
    });

    if (errors.length > 0) {
 
      this.notificationService.showError(errors.join('<br>'));
    }

    if (validFiles.length > 0) {
      this.addFilesToQueue(validFiles);
    }
  }

  private addFilesToQueue(files: File[]): void {
    const current = this.uploadedImages();
    const remaining = this.maxPhotos - current.length;

    if (files.length > remaining) {
    
      this.notificationService.showToast('error', `You can only add ${remaining} more photos.`);
      files = files.slice(0, remaining);
    }

    const newImages: UploadedImage[] = files.map((file, index) => {
      const isFirstImage = current.length === 0 && index === 0;
      return {
        id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        uploaded: false,
        isPrimary: isFirstImage
      };
    });

    this.uploadedImages.set([...current, ...newImages]);
    this.uploadImages(newImages);
  }

  private uploadImages(images: UploadedImage[]): void {
    if (!this.currentDraft?.id) {
      this.notificationService.showError('Property ID not found');
      return;
    }

    this.isUploading.set(true);
    let uploadedCount = 0;
    let failedCount = 0;

    images.forEach((image, index) => {
      if (!image.file) return;

      const formData = new FormData();
      formData.append('file', image.file, image.file.name);

      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      this.http.post(
        `${environment.apiUrl}/host/property/${this.currentDraft!.id}/images`,
        formData,
        { headers, reportProgress: true, observe: 'events' }
      ).subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            const progress = Math.round((100 * event.loaded) / event.total);
            
            const updated = this.uploadedImages();
            const imgIndex = updated.findIndex(img => img.id === image.id);
            if (imgIndex !== -1) {
              updated[imgIndex].progress = progress;
              this.uploadedImages.set([...updated]);
            }
            this.uploadProgress.set(Math.round((progress / images.length) * 100));
          } 
          else if (event.type === HttpEventType.Response) {
            const response = event.body;
            if (response?.success) {
              uploadedCount++;
              const updated = this.uploadedImages();
              const imgIndex = updated.findIndex(img => img.id === image.id);
              if (imgIndex !== -1) {
                updated[imgIndex].uploaded = true;
                updated[imgIndex].progress = 100;
                updated[imgIndex].id = response.data.id?.toString() || updated[imgIndex].id;
                updated[imgIndex].isPrimary = response.data.isPrimary;
                updated[imgIndex].displayOrder = response.data.displayOrder;
                this.uploadedImages.set([...updated]);
              }
              if (uploadedCount + failedCount === images.length) {
                this.handleUploadComplete(uploadedCount, failedCount);
              }
            }
          }
        },
        error: (error) => {
          failedCount++;
          console.error('❌ Upload error:', error);
          const updated = this.uploadedImages();
          const imgIndex = updated.findIndex(img => img.id === image.id);
          if (imgIndex !== -1) {
            const errorMsg = error.error?.message || error.statusText || 'Upload failed';
            updated[imgIndex].error = errorMsg;
            updated[imgIndex].uploaded = false;
            this.uploadedImages.set([...updated]);
          }
          if (uploadedCount + failedCount === images.length) {
            this.handleUploadComplete(uploadedCount, failedCount);
          }
        }
      });
    });
  }

  private handleUploadComplete(successCount: number, failureCount: number): void {
    this.isUploading.set(false);
    this.uploadProgress.set(0);

    if (failureCount > 0) {

      this.notificationService.showError(`⚠️ ${successCount} uploaded, ${failureCount} failed. Please try again.`);
    } else if (successCount > 0) {

      this.notificationService.showToast('success', 'Images uploaded successfully');
    }
  }

  removeImage(imageId: string, event: Event): void {
    event.stopPropagation();
    const updated = this.uploadedImages().filter(img => img.id !== imageId);
    this.uploadedImages.set(updated);
  }

  setPrimary(imageId: string, event: Event): void {
    event.stopPropagation();
    if (!this.currentDraft?.id) return;

    const image = this.uploadedImages().find(img => img.id === imageId);
    if (!image || !image.uploaded) {

      this.notificationService.showToast('error', 'Wait for upload to complete');
      return;
    }

    let actualImageId: any = image.id;
    if (image.id.startsWith('img-')) {
      const parts = image.id.split('-');
      if (parts.length > 1 && !isNaN(parseInt(parts[1]))) {
        actualImageId = parseInt(parts[1]);
      }
    }

    this.propertyService.setPrimaryImage(actualImageId).subscribe({
      next: () => {
        const updated = this.uploadedImages();
        updated.forEach(img => img.isPrimary = false);
        const targetImg = updated.find(img => img.id === imageId);
        if (targetImg) {
          targetImg.isPrimary = true;
        }
        this.uploadedImages.set([...updated]);
  
        this.notificationService.showToast('success', 'Cover photo updated');
      },
      error: (error) => {
        console.error('❌ Error setting primary image:', error);
   
        this.notificationService.showError('Failed to set primary image: ' + (error.error?.message || error.message));
      }
    });
  }

  canProceed(): boolean {
    return this.uploadedImages().filter(img => img.uploaded).length >= this.minPhotos;
  }

  getRemaining(): number {
    const uploaded = this.uploadedImages().filter(img => img.uploaded).length;
    return Math.max(0, this.minPhotos - uploaded);
  }

  getUploadedCount(): number {
    return this.uploadedImages().filter(img => img.uploaded).length;
  }

  
  async saveAndExit(): Promise<void> {
    const confirmed = await this.notificationService.confirmAction(
      'Save & Exit?',
      'Your progress will be saved, and you can resume later.'
    );
    
    if (!confirmed || !this.currentDraft?.id) return;

    this.isLoading.set(true);

    this.propertyService.updateDraftAtStep(
      this.currentDraft.id,
      {
        images: this.uploadedImages().map(img => ({
          id: img.id,
          imageUrl: img.preview,
          isPrimary: img.isPrimary,
          displayOrder: img.displayOrder
        }))
      },
      'photos'
    ).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/host/properties']);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.notificationService.showError('Failed to save progress: ' + error.message);
      }
    });
  }

  showQuestionsModal(): void {
   
    Swal.fire({
      title: 'Photo Tips',
      html: `
        <div style="text-align: left; line-height: 1.6;">
          <ul style="list-style: none; padding: 0;">
            <li>📸 <b>Use good lighting</b> and clear angles</li>
            <li>🏠 <b>Show all rooms</b> and common areas</li>
            <li>✅ Minimum <b>${this.minPhotos}</b> photos required</li>
            <li>🚫 Maximum <b>${this.maxPhotos}</b> photos allowed</li>
            <li>🖼️ Supported: <b>JPEG, PNG, WebP</b></li>
            <li>💾 Max file size: <b>5MB</b> per photo</li>
          </ul>
          <p style="margin-top: 10px; color: #222; font-weight: 600;">💡 Pro tip: Good photos lead to more bookings!</p>
        </div>
      `,
      confirmButtonColor: '#222',
      confirmButtonText: 'Got it'
    });
  }


  async goBack(): Promise<void> {
    const confirmed = await this.notificationService.confirmAction(
      'Go back?',
      'Any unsaved changes might be lost. Are you sure?',
      'Yes, go back'
    );

    if (confirmed) {
      this.router.navigate(['/host/properties/amenities']);
    }
  }

  goNext(): void {
    if (!this.canProceed()) {
     
      this.notificationService.showError(`Please add at least ${this.minPhotos} photos to continue.`);
      return;
    }

    if (!this.currentDraft?.id) return;

    this.isLoading.set(true);

    this.propertyService.updateDraftAtStep(
      this.currentDraft.id,
      {
        images: this.uploadedImages().map(img => ({
          id: img.id,
          imageUrl: img.preview,
          isPrimary: img.isPrimary,
          displayOrder: img.displayOrder
        }))
      },
      'photos'
    ).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/host/properties/title']);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.notificationService.showError('Failed to save progress: ' + error.message);
      }
    });
  }

  getProgressPercentage(): number {
    const uploaded = this.getUploadedCount();
    return Math.round((uploaded / this.minPhotos) * 100);
  }

  getStepName(): string {
    return 'Photos';
  }
}
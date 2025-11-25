import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpEventType, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';
import { PropertyService } from '../../../services/property';
import { Property } from '../../../models/property.model'; 

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
  maxFileSize = 5 * 1024 * 1024; // 5MB
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  constructor(
    private router: Router,
    private propertyService: PropertyService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.getCurrentDraft();
  }

  /**
   * Load current draft
   */
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
        alert('Failed to load property draft');
        this.router.navigate(['/host/properties']);
      }
    });
  }

  /**
   * Load previously uploaded images from draft
   */
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
      console.log('✅ Saved images loaded:', images.length);
    }
  }

  /**
   * Handle file input change
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
      // Reset input so same file can be selected again
      input.value = '';
    }
  }

  /**
   * Handle drag over
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  /**
   * Handle drag leave
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  /**
   * Handle drop
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (event.dataTransfer?.files) {
      this.handleFiles(Array.from(event.dataTransfer.files));
    }
  }

  /**
   * Validate and process files
   */
  private handleFiles(files: File[]): void {
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file, index) => {
      // Check file type
      if (!this.allowedTypes.includes(file.type)) {
        errors.push(`File ${index + 1}: Invalid file type. Only JPEG, PNG, and WebP allowed.`);
        return;
      }

      // Check file size (5MB max)
      if (file.size > this.maxFileSize) {
        errors.push(`File ${index + 1}: File size exceeds 5MB limit.`);
        return;
      }

      validFiles.push(file);
    });

    // Show errors
    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    // Add valid files to queue
    if (validFiles.length > 0) {
      this.addFilesToQueue(validFiles);
    }
  }

  /**
   * Add files to upload queue
   */
  private addFilesToQueue(files: File[]): void {
    const current = this.uploadedImages();
    const remaining = this.maxPhotos - current.length;

    if (files.length > remaining) {
      alert(`You can only add ${remaining} more photos (max ${this.maxPhotos} total).`);
      files = files.slice(0, remaining);
    }

    const newImages: UploadedImage[] = files.map((file) => ({
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      uploaded: false
    }));

    this.uploadedImages.set([...current, ...newImages]);
    
    // Auto-upload files
    this.uploadImages(newImages);
  }

  /**
   * Upload images to server
   */
  private uploadImages(images: UploadedImage[]): void {
    if (!this.currentDraft?.id) {
      alert('Property ID not found');
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
        {
          headers,
          reportProgress: true,
          observe: 'events'
        }
      ).subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            const progress = Math.round((100 * event.loaded) / event.total);
            
            // Update individual image progress
            const updated = this.uploadedImages();
            const imgIndex = updated.findIndex(img => img.id === image.id);
            if (imgIndex !== -1) {
              updated[imgIndex].progress = progress;
              this.uploadedImages.set([...updated]);
            }

            // Update overall progress
            this.uploadProgress.set(Math.round((progress / images.length) * 100));
          } 
          else if (event.type === HttpEventType.Response) {
            const response = event.body;
            
            if (response?.success) {
              uploadedCount++;
              console.log(`✅ Image ${uploadedCount}/${images.length} uploaded`);

              // Mark as uploaded
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

              // Check if all done
              if (uploadedCount + failedCount === images.length) {
                this.handleUploadComplete(uploadedCount, failedCount);
              }
            }
          }
        },
        error: (error) => {
          failedCount++;
          console.error('❌ Upload error:', error);
          
          // Mark image as failed
          const updated = this.uploadedImages();
          const imgIndex = updated.findIndex(img => img.id === image.id);
          if (imgIndex !== -1) {
            const errorMsg = error.error?.message || error.statusText || 'Upload failed';
            updated[imgIndex].error = errorMsg;
            updated[imgIndex].uploaded = false;
            this.uploadedImages.set([...updated]);
          }

          // Check if all done
          if (uploadedCount + failedCount === images.length) {
            this.handleUploadComplete(uploadedCount, failedCount);
          }
        }
      });
    });
  }

  /**
   * Handle upload completion
   */
  private handleUploadComplete(successCount: number, failureCount: number): void {
    this.isUploading.set(false);
    this.uploadProgress.set(0);

    if (failureCount > 0) {
      alert(`⚠️ ${successCount} uploaded, ${failureCount} failed. Please try again.`);
    } else if (successCount > 0) {
      console.log(`✅ All ${successCount} images uploaded successfully`);
    }
  }

  /**
   * Remove image from queue
   */
  removeImage(imageId: string, event: Event): void {
    event.stopPropagation();
    
    const updated = this.uploadedImages().filter(img => img.id !== imageId);
    this.uploadedImages.set(updated);
    console.log('🗑️ Image removed');
  }

  /**
   * Set image as primary
   */
  setPrimary(imageId: string, event: Event): void {
    event.stopPropagation();
    
    if (!this.currentDraft?.id) return;

    // Get the image to find its actual server ID
    const image = this.uploadedImages().find(img => img.id === imageId);
    if (!image || !image.uploaded) {
      alert('Can only set uploaded images as primary');
      return;
    }

    // Extract numeric ID if available, otherwise use the full ID
    let actualImageId: any = image.id;
    
    // Try to parse if it's in format "img-123-abc"
    if (image.id.startsWith('img-')) {
      const parts = image.id.split('-');
      if (parts.length > 1 && !isNaN(parseInt(parts[1]))) {
        actualImageId = parseInt(parts[1]);
      }
    }

    console.log('🔧 Setting primary image:', { imageId, actualImageId, image });

    this.propertyService.setPrimaryImage(actualImageId).subscribe({
      next: () => {
        // Update local state - remove primary from all, set on this one
        const updated = this.uploadedImages();
        updated.forEach(img => img.isPrimary = false);
        const targetImg = updated.find(img => img.id === imageId);
        if (targetImg) {
          targetImg.isPrimary = true;
        }
        this.uploadedImages.set([...updated]);
        console.log('✅ Primary image set successfully');
        alert('✓ Primary image updated');
      },
      error: (error) => {
        console.error('❌ Error setting primary image:', error);
        console.log('Error details:', error.error);
        alert('Failed to set primary image: ' + (error.error?.message || error.message));
      }
    });
  }

  /**
   * Check if minimum photos requirement is met
   */
  canProceed(): boolean {
    return this.uploadedImages().filter(img => img.uploaded).length >= this.minPhotos;
  }

  /**
   * Get remaining photos needed
   */
  getRemaining(): number {
    const uploaded = this.uploadedImages().filter(img => img.uploaded).length;
    return Math.max(0, this.minPhotos - uploaded);
  }

  /**
   * Get uploaded photos count
   */
  getUploadedCount(): number {
    return this.uploadedImages().filter(img => img.uploaded).length;
  }

  /**
   * Save progress and exit
   */
  saveAndExit(): void {
    const confirmed = confirm('Save your progress and exit? You can continue later.');
    
    if (!confirmed || !this.currentDraft?.id) return;

    this.isLoading.set(true);

    // Save current step to draft
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
        console.log('✅ Photos progress saved');
        this.isLoading.set(false);
        this.router.navigate(['/host/properties']);
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Error saving progress:', error);
        alert('Failed to save progress: ' + error.message);
      }
    });
  }

  /**
   * Show help modal
   */
  showQuestionsModal(): void {
    alert(
      `Photos tips:\n\n` +
      `✓ Use good lighting and clear angles\n` +
      `✓ Show all rooms and common areas\n` +
      `✓ Minimum ${this.minPhotos} photos required\n` +
      `✓ Maximum ${this.maxPhotos} photos allowed\n` +
      `✓ Supported formats: JPEG, PNG, WebP\n` +
      `✓ Maximum file size: 5MB per photo\n\n` +
      `💡 Pro tip: Good photos lead to more bookings!`
    );
  }

  /**
   * Go back to previous step
   */
  goBack(): void {
    if (confirm('Go back? Any unsaved progress will be lost.')) {
      this.router.navigate(['/host/properties/amenities']);
    }
  }

  /**
   * Go to next step
   */
  goNext(): void {
    if (!this.canProceed()) {
      alert(`Please add at least ${this.minPhotos} photos to continue.`);
      return;
    }

    if (!this.currentDraft?.id) return;

    this.isLoading.set(true);

    // Save progress before moving to next step
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
        console.log('✅ Photos saved, moving to pricing');
        this.isLoading.set(false);
        this.router.navigate(['/host/properties/title']);
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Error saving progress:', error);
        alert('Failed to save progress: ' + error.message);
      }
    });
  }

  /**
   * Get progress percentage
   */
  getProgressPercentage(): number {
    const uploaded = this.getUploadedCount();
    return Math.round((uploaded / this.minPhotos) * 100);
  }

  /**
   * Get step name for progress
   */
  getStepName(): string {
    return 'Photos';
  }
}
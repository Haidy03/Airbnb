import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ServiceCreationStore } from '../../models/service-creation.store';

interface PhotoPreview {
  file: File;
  url: string;
}

@Component({
  selector: 'app-create-service-photos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './create-service-photos.html',
  styleUrls: ['./create-service-photos.css']
})
export class CreateServicePhotosComponent {
  photos = signal<PhotoPreview[]>([]);

  constructor(private router: Router,
    private store: ServiceCreationStore

  ) {}

  onFileSelected(event: any) {
    const files: FileList = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Create a local preview URL
        const url = URL.createObjectURL(file);
        
        this.photos.update(current => [...current, { file, url }]);
      }
    }
  }

  removePhoto(index: number) {
    this.photos.update(current => current.filter((_, i) => i !== index));
  }

  makeCover(index: number) {
    // Move selected photo to index 0
    this.photos.update(current => {
      const photo = current[index];
      const newPhotos = current.filter((_, i) => i !== index);
      return [photo, ...newPhotos];
    });
  }

  goBack() {
    this.router.navigate(['/host/services/location']);
  }

  onNext() {
    if (this.photos().length > 0) {
     //alert(`Ready to upload ${this.photos().length} photos!`);
     const files = this.photos().map(p => p.file);
    this.store.setPhotos(files);
    this.router.navigate(['/host/services/review']);
    }
  }
}
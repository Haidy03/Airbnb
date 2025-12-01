import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ServiceCreationStore {
  // مكان مؤقت لحفظ ملفات الصور في الذاكرة
  private photos = signal<File[]>([]);

  setPhotos(files: File[]) {
    this.photos.set(files);
  }

  getPhotos() {
    return this.photos();
  }
}
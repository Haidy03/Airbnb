
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../../environments/environment.development';
import { Output, EventEmitter } from '@angular/core'; 

@Component({
  selector: 'app-image-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-gallery.html',
  styleUrl: './image-gallery.scss',
})
export class ImageGallery {
  @Input() images: string[] = [];
  @Output() modalStateChange = new EventEmitter<boolean>(); 
   title: string = 'Property Image';
    showModal: boolean = false; 
    //imageBaseUrl: string = environment.imageBaseUrl;
   getFullImageUrl(imageUrl?: string): string {
    // 1. لو مفيش رابط خالص، رجع صورة افتراضية
    if (!imageUrl) {
      return 'assets/images/placeholder.jpg'; 
    }

    // 2. لو الرابط خارجي (https://...) رجعه زي ما هو
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    // ✅ 3. التعديل الجديد: لو الرابط بيشاور على assets داخلية في الأنجولار
    // (عشان نعالج الحالة اللي في الداتا بيز عندك)
    if (imageUrl.includes('assets/')) {
      return imageUrl; // رجعه زي ما هو عشان الأنجولار يفتحه
    }

    // 4. لو صورة مرفوعة على السيرفر (uploads)، ركب قبلها رابط الباك اند
    const baseUrl = environment.apiUrl.replace('/api', '').replace(/\/$/, '');
    let cleanPath = imageUrl;
    
    if (!cleanPath.startsWith('/')) {
        cleanPath = `/${cleanPath}`;
    }

    return `${baseUrl}${cleanPath}`;
  }
 showAllPhotos(): void {
    this.showModal = true;
    this.modalStateChange.emit(true);
    // يمكن إضافة منطق لمنع التمرير في الخلفية هنا (Scroll lock)
    console.log('Opening full image gallery from within gallery component.');
  }

  /**
   * 3. دالة لإغلاق معرض الصور الموسع
   */
  closeFullGallery(): void {
    this.showModal = false;
     this.modalStateChange.emit(false);
    // إضافة منطق لإعادة تمكين التمرير هنا
  }
}

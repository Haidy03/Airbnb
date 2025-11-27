
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../../environments/environment';
import { Output, EventEmitter } from '@angular/core'; 




@Component({
  selector: 'app-image-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-gallery.html',
  styleUrl: './image-gallery.scss',
})
export class ImageGallery {
   // نستقبل الصور من الـ API عبر المكون الأب
  // تأكدي أن الـ API يرسل 5 صور على الأقل لهذا التصميم
  @Input() images:string[] = [];
  @Output() modalStateChange = new EventEmitter<boolean>(); 
   title: string = 'Property Image';
    showModal: boolean = false; 
    imageBaseUrl: string = environment.imageBaseUrl;
     getFullImageUrl(relativePath: string): string {
    if (!relativePath) {
      return 'assets/images/placeholder.jpg'; // صورة احتياطية
    }
    // دمج عنوان الباك إند الأساسي مع المسار النسبي
    return `${this.imageBaseUrl}${relativePath}`;
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

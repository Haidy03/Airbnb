
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../../environments/environment';



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
   title: string = 'Property Image';
    imageBaseUrl: string = environment.imageBaseUrl;
     getFullImageUrl(relativePath: string): string {
    if (!relativePath) {
      return 'assets/images/placeholder.jpg'; // صورة احتياطية
    }
    // دمج عنوان الباك إند الأساسي مع المسار النسبي
    return `${this.imageBaseUrl}${relativePath}`;
  }

  showAllPhotos() {
    console.log('Open full screen modal');
    // هنا يمكنك إضافة كود لفتح مودال يعرض كل الصور

}
}

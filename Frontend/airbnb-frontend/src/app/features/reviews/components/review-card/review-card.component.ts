import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewResponse } from '../../models/review.model';
import { StarRatingComponent } from '../../../../shared/components/star-rating/star-rating.component';
import { environment } from '../../../../../environments/environment.development';

@Component({
  selector: 'app-review-card',
  standalone: true,
  imports: [CommonModule, StarRatingComponent],
  templateUrl: './review-card.component.html',
  styleUrls: ['./review-card.css']
})
export class ReviewCardComponent {
  @Input() review!: ReviewResponse;
  @Input() showPropertyName: boolean = false;

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  // ✅ UPDATE: Improved image URL handling
  getImageUrl(url?: string): string {
    if (!url) return 'assets/images/user.png'; // تأكد من وجود صورة افتراضية في هذا المسار
    
    // إذا كان الرابط كاملاً (يبدأ بـ http)
    if (url.startsWith('http')) return url;
    
    // إذا كان الرابط نسبي، نقوم بتركيب الـ Base URL الخاص بالـ API (بدون كلمة api إذا لزم الأمر)
    // افترضنا هنا أن الصور مخزنة في الـ Root الخاص بالسيرفر
    const baseUrl = environment.apiUrl.replace('/api', ''); 
    
    // إزالة السلاش في البداية لتجنب الازدواج
    const cleanPath = url.startsWith('/') ? url.substring(1) : url;
    
    return `${baseUrl}/${cleanPath}`;
  }
}
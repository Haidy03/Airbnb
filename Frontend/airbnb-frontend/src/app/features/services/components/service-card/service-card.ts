import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ServiceCard } from '../../models/service.model';

@Component({
  selector: 'app-service-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './service-card.html',
  styleUrls: ['./service-card.css']
})
export class ServiceCardComponent {
  @Input() service!: ServiceCard;

  // دالة مساعدة لمعالجة رابط الصورة
  getImageUrl(url: string): string {
    if (!url) return 'https://placehold.co/600x600?text=No+Image';
    // لو الرابط نسبي من الباك إند، نضيف الـ BaseUrl
    if (!url.startsWith('http')) {
        // يمكنك تعديل هذا الرابط حسب الـ API بتاعك
       // return `${environment.imageBaseUrl}/${url}`; 
       return url; 
    }
    return url;
  }
}
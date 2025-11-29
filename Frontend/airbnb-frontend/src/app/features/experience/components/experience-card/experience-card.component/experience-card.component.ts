import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ExperienceSearchResult } from '../../../../../shared/models/experience.model';
import { ExperienceService } from '../../../../../shared/Services/experience.service';
import { environment } from '../../../../../../environments/environment.development';

@Component({
  selector: 'app-experience-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './experience-card.component.html',
  styleUrls: ['./experience-card.component.css']
})

export class ExperienceCardComponent {
  constructor(private experienceService: ExperienceService) {}
  @Input() experience!: ExperienceSearchResult;
  @Input() showBadge: boolean = false;
  @Input() badgeText: string = 'Popular';

  isWishlisted = false;

  getImageUrl(imageUrl?: string): string {
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

  toggleWishlist(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    this.experienceService.toggleWishlist(this.experience.id).subscribe({
        next: (res) => {
            this.isWishlisted = res.isWishlisted;
        },
        error: (err) => console.error(err)
    });
}
}
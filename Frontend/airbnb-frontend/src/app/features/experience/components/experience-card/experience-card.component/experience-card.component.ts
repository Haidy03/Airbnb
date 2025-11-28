import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ExperienceSearchResult } from '../../../../../shared/models/experience.model';
import { ExperienceService } from '../../../../../shared/Services/experience.service';

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
    if (!imageUrl) {
      // Use placeholder based on experience ID for variety
      return `https://via.placeholder.com/400x500/f0f0f0/222222?text=${this.experience?.title?.substring(0, 1) || 'E'}`;
    }
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    return imageUrl;
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
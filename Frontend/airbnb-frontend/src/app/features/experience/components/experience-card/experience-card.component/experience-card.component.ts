import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
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

export class ExperienceCardComponent implements OnChanges{
  constructor(private experienceService: ExperienceService) {}
  @Input() experience!: any;
  @Input() showBadge: boolean = false;
  @Input() badgeText: string = 'Popular';

  @Input() isWishlisted: boolean = false; 

  getImageUrl(imageUrl?: string): string {
   
    if (!imageUrl) {
      return 'assets/images/placeholder.jpg'; 
    }

    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    if (imageUrl.includes('assets/')) {
      return imageUrl; 
    }

   
    const baseUrl = environment.apiUrl.replace('/api', '').replace(/\/$/, '');
    let cleanPath = imageUrl;
    
    if (!cleanPath.startsWith('/')) {
        cleanPath = `/${cleanPath}`;
    }

    return `${baseUrl}${cleanPath}`;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['experience']) {
       if (this.experience && this.experience.isFavorite !== undefined) {
           this.isWishlisted = this.experience.isFavorite;
       }
    }
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

get cardLink(): any[] {
    if (this.experience.type === 'Home' || this.experience.type === 'Property') {
      return ['/listing', this.experience.id]; 
    }
    return ['/experiences', this.experience.id];
  }
}
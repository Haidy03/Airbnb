import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewResponse } from '../../models/review.model';
import { StarRatingComponent } from '../../../../shared/components/star-rating/star-rating.component';

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

  getDefaultAvatar(): string {
    return 'assets/images/default-avatar.png';
  }
}

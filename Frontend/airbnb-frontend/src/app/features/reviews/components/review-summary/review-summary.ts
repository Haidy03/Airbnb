import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertyReviewsSummary } from '../../models/review.model';
import { StarRatingComponent } from '../../../..//shared/components/star-rating/star-rating.component';

@Component({
  selector: 'app-review-summary',
  standalone: true,
  imports: [CommonModule, StarRatingComponent],
  templateUrl: './review-summary.html',
  styleUrl: './review-summary.css',
})
export class ReviewSummaryComponent {
  @Input() summary!: PropertyReviewsSummary;

  getRatingPercentage(rating?: number): number {
    if (!rating) return 0;
    return (rating / 5) * 100;
  }

  formatRating(rating?: number): string {
    if (!rating) return 'N/A';
    return rating.toFixed(1);
  }
}
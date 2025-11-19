import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './star-rating.component.html',
  styleUrls: ['./star-rating.css']
})
export class StarRatingComponent {
  @Input() rating: number = 0;
  @Input() readonly: boolean = false;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Output() ratingChange = new EventEmitter<number>();

  stars: number[] = [1, 2, 3, 4, 5];
  hoverRating: number = 0;

  onStarClick(rating: number): void {
    if (!this.readonly) {
      this.rating = rating;
      this.ratingChange.emit(rating);
    }
  }

  onStarHover(rating: number): void {
    if (!this.readonly) {
      this.hoverRating = rating;
    }
  }

  onMouseLeave(): void {
    this.hoverRating = 0;
  }

  isStarFilled(star: number): boolean {
    return star <= (this.hoverRating || this.rating);
  }

  getSizeClass(): string {
    return `star-${this.size}`;
  }
}
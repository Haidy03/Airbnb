import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReviewService } from '../../services/review.service';
import { ReviewResponse } from '../../models/review.model';
import { ReviewCardComponent } from '../../components/review-card/review-card.component';

@Component({
  selector: 'app-my-reviews',
  standalone: true,
  imports: [CommonModule, ReviewCardComponent, RouterModule],
  templateUrl: './my-reviews.html',
  styleUrl: './my-reviews.css',
})
export class MyReviews implements OnInit {
  reviews: ReviewResponse[] = [];
  loading = false;
  errorMessage = '';

  // Separate reviews by type
  reviewsGiven: ReviewResponse[] = [];
  reviewsReceived: ReviewResponse[] = [];

  constructor(
    private reviewService: ReviewService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMyReviews();
  }

  loadMyReviews(): void {
    this.loading = true;
    this.errorMessage = '';

    this.reviewService.getMyReviews().subscribe({
      next: (data) => {
        this.reviews = data;
        
        // Separate reviews (assuming you have userId in localStorage or AuthService)
        const currentUserId = this.getCurrentUserId();
        
        this.reviewsGiven = data.filter(r => r.reviewerId === currentUserId);
        this.reviewsReceived = data.filter(r => r.revieweeId === currentUserId);
        
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to load reviews';
        this.loading = false;
      }
    });
  }

  editReview(reviewId: number): void {
    this.router.navigate(['/reviews/edit', reviewId]);
  }

  deleteReview(reviewId: number): void {
    if (confirm('Are you sure you want to delete this review?')) {
      this.reviewService.deleteReview(reviewId).subscribe({
        next: () => {
          this.reviews = this.reviews.filter(r => r.id !== reviewId);
          this.loadMyReviews(); // Reload to update the lists
        },
        error: (error) => {
          alert(error.error?.message || 'Failed to delete review');
        }
      });
    }
  }

  private getCurrentUserId(): string {
    // Get from localStorage or AuthService
    return localStorage.getItem('userId') || '';
  }
}
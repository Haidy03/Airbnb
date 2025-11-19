import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReviewService } from '../../services/review.service';
import { PropertyReviewsSummary } from '../../models/review.model';
import { ReviewCardComponent } from '../../components/review-card/review-card.component';
import { ReviewSummaryComponent } from '../../components/review-summary/review-summary';

@Component({
  selector: 'app-property-reviews',
  standalone: true,
  imports: [CommonModule, ReviewCardComponent, ReviewSummaryComponent],
  templateUrl: './property-reviews.html',
  styleUrl: './property-reviews.css',
})
export class PropertyReviews implements OnInit {
  propertyId!: number;
  reviewsSummary?: PropertyReviewsSummary;
  loading = false;
  errorMessage = '';
  
  currentPage = 1;
  pageSize = 10;
  hasMoreReviews = false;

  constructor(
    private reviewService: ReviewService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.propertyId = +this.route.snapshot.paramMap.get('propertyId')!;
    this.loadReviews();
  }

  loadReviews(page: number = 1): void {
    this.loading = true;
    this.errorMessage = '';
    this.currentPage = page;

    this.reviewService.getPropertyReviews(this.propertyId, page, this.pageSize).subscribe({
      next: (data) => {
        this.reviewsSummary = data;
        
        // Check if there are more reviews
        this.hasMoreReviews = data.reviews.length === this.pageSize;
        
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to load reviews';
        this.loading = false;
      }
    });
  }

  loadMore(): void {
    this.loadReviews(this.currentPage + 1);
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.loadReviews(this.currentPage - 1);
    }
  }

  goToNextPage(): void {
    if (this.hasMoreReviews) {
      this.loadReviews(this.currentPage + 1);
    }
  }
}
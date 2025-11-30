import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReviewService } from '../../services/review.service';
import { PropertyReviewsSummary } from '../../models/review.model';
import { ReviewCardComponent } from '../../components/review-card/review-card.component';
import { ReviewSummaryComponent } from '../../components/review-summary/review-summary';
import { HeaderComponent } from '../../../guest/components/header/header'; // تأكدي من المسار

@Component({
  selector: 'app-property-reviews',
  standalone: true,
  imports: [CommonModule, RouterModule, ReviewCardComponent, ReviewSummaryComponent, HeaderComponent],
  templateUrl: './property-reviews.html',
  styleUrl: './property-reviews.css',
})
export class PropertyReviews implements OnInit {
  propertyId!: number;
  reviewsSummary?: PropertyReviewsSummary;
  loading = false;
  errorMessage = '';
  
  currentUserId: string | null = null;

  constructor(
    private reviewService: ReviewService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.currentUserId = localStorage.getItem('userId');
  }

  ngOnInit(): void {
    this.propertyId = +this.route.snapshot.paramMap.get('propertyId')!;
    this.loadReviews();
  }

  loadReviews(): void {
    this.loading = true;
    this.errorMessage = '';

    // ملاحظة: نفترض هنا جلب كل الريفيوهات في صفحة واحدة أو استخدام Pagination
    // لتبسيط الكود وتوحيده مع التجارب، سنعرض البيانات مباشرة
    this.reviewService.getPropertyReviews(this.propertyId, 1, 100).subscribe({
      next: (data: any) => {
        // التعامل مع هيكل البيانات سواء مباشر أو داخل data
        this.reviewsSummary = data.data || data;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to load reviews';
        this.loading = false;
      }
    });
  }

  isReviewOwner(reviewerId: string): boolean {
    const userRole = localStorage.getItem('userRole');
    return this.currentUserId === reviewerId || userRole === 'Admin';
  }

  deleteReview(id: number): void {
    if (confirm('Are you sure you want to delete this review?')) {
      this.reviewService.deleteReview(id).subscribe({
        next: () => {
          this.loadReviews(); // Refresh
        },
        error: (error) => {
          alert(error.error?.message || 'Failed to delete review');
        }
      });
    }
  }

  editReview(id: number): void {
    this.router.navigate(['/reviews/edit', id]);
  }
}
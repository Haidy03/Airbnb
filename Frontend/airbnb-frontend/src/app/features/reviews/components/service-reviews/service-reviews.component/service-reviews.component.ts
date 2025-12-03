import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ServicesService } from '../../../../services/services/service'; // تأكدي من المسار
import { ReviewService } from '../../../services/review.service';
import { ReviewCardComponent } from '../../review-card/review-card.component';
import { HeaderComponent } from '../../../../guest/components/header/header';
import { ReviewSummaryComponent } from '../../review-summary/review-summary';
import { PropertyReviewsSummary } from '../../../models/review.model';

@Component({
  selector: 'app-service-reviews',
  standalone: true,
  imports: [CommonModule, RouterModule, ReviewCardComponent, HeaderComponent, ReviewSummaryComponent],
  templateUrl: './service-reviews.component.html',
  styleUrls: ['./service-reviews.component.css'] // سنستخدم نفس CSS التجارب
})
export class ServiceReviewsComponent implements OnInit {
  serviceId!: number;
  reviewsSummary: PropertyReviewsSummary | null = null;
  loading = true;
  errorMessage = '';
  currentUserId: string | null = null;

  constructor(
    private servicesService: ServicesService,
    private reviewService: ReviewService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.currentUserId = localStorage.getItem('userId');
  }

  ngOnInit(): void {
    this.serviceId = +this.route.snapshot.paramMap.get('id')!;
    this.loadReviews();
  }

  loadReviews(): void {
    this.loading = true;
    // جلب الريفيوهات من السيرفس
    this.servicesService.getReviews(this.serviceId).subscribe({
      next: (res: any) => {
        console.log('📥 Reviews Response:', res);
        const data = res.success ? res.data : res;
        const reviewsArray = Array.isArray(data) ? data : [];
        this.calculateSummary(reviewsArray);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading reviews:', err);
        this.errorMessage = 'Failed to load reviews.';
        this.loading = false;
      }
    });
  }

  calculateSummary(reviews: any[]) {
    const total = reviews.length;

    if (total === 0) {
      this.reviewsSummary = {
        propertyId: this.serviceId,
        averageRating: 0,
        totalReviews: 0,
        reviews: []
      };
      return;
    }

    // متغيرات التجميع
    let ratingSum = 0;
    let cleanSum = 0, commSum = 0, locSum = 0, valSum = 0;
    let cleanCount = 0, commCount = 0, locCount = 0, valCount = 0;

    reviews.forEach(review => {
      // التقييم العام
      ratingSum += (review.rating || 0);

      // تجميع التفاصيل (مع التأكد أنها ليست null)
      if (review.cleanlinessRating) { cleanSum += review.cleanlinessRating; cleanCount++; }
      if (review.communicationRating) { commSum += review.communicationRating; commCount++; }
      if (review.locationRating) { locSum += review.locationRating; locCount++; }
      if (review.valueRating) { valSum += review.valueRating; valCount++; }
    });

    this.reviewsSummary = {
      propertyId: this.serviceId,
      totalReviews: total,
      averageRating: ratingSum / total,
      
      // ✅ حساب المتوسطات للبارات الملونة
      averageCleanlinessRating: cleanCount > 0 ? cleanSum / cleanCount : 0,
      averageCommunicationRating: commCount > 0 ? commSum / commCount : 0,
      averageLocationRating: locCount > 0 ? locSum / locCount : 0,
      averageValueRating: valCount > 0 ? valSum / valCount : 0,
      
      reviews: reviews
    };
  }

  isReviewOwner(review: any): boolean {
    if (!this.currentUserId || !review) return false;
    const ownerId = review.reviewerId || review.userId;
    return String(this.currentUserId) === String(ownerId);
  }

  deleteReview(id: number): void {
    if(confirm('Are you sure you want to delete this review?')) {
      this.servicesService.deleteReview(id).subscribe({
        next: () => this.loadReviews(),
        error: (err) => alert('Failed to delete review')
      });
    }
  }

  editReview(id: number): void {
    // توجيه لصفحة التعديل مع تحديد النوع service
    this.router.navigate(['/reviews/edit', id], { queryParams: { type: 'service' } });
  }
}
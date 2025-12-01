import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ExperienceService } from '../../../../../shared/Services/experience.service';
import { ReviewService } from '../../../services/review.service';
import { ReviewCardComponent } from '../../../components/review-card/review-card.component';
import { HeaderComponent } from '../../../../guest/components/header/header';
import { ReviewSummaryComponent } from '../../../components/review-summary/review-summary';
import { PropertyReviewsSummary } from '../../../models/review.model';

@Component({
  selector: 'app-experience-reviews',
  standalone: true,
  imports: [CommonModule, RouterModule, ReviewCardComponent, HeaderComponent, ReviewSummaryComponent],
  templateUrl: './experience-reviews.component.html',
  styleUrl: './experience-reviews.component.css'
})
export class ExperienceReviewsComponent implements OnInit {
  experienceId!: number;
  reviewsSummary: PropertyReviewsSummary | null = null;
  loading = true;
  errorMessage = '';
  currentUserId: string | null = null;

  constructor(
    private experienceService: ExperienceService,
    private reviewService: ReviewService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.currentUserId = localStorage.getItem('userId');
    // 👇 1. طباعة الـ ID الخاص بالمستخدم المسجل
    console.log('🔑 Current Logged In User ID:', this.currentUserId);
  }

  ngOnInit(): void {
    this.experienceId = +this.route.snapshot.paramMap.get('id')!;
    this.loadReviews();
  }

  loadReviews(): void {
    this.loading = true;
    this.experienceService.getReviews(this.experienceId).subscribe({
      next: (res: any) => {
        const data = res.success ? res.data : res; 
        const reviewsArray = Array.isArray(data) ? data : [];

        // 👇 2. طباعة شكل الريفيو القادم من الباك إند
        if (reviewsArray.length > 0) {
            console.log('📦 First Review Object FROM API:', reviewsArray[0]);
            console.log('🖼️ Image Field Check:', reviewsArray[0].reviewerProfileImage);
            console.log('🆔 Reviewer ID Check:', reviewsArray[0].reviewerId);
        } else {
            console.warn('⚠️ No reviews found coming from API');
        }

        this.calculateSummary(reviewsArray);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error', err);
        this.loading = false;
      }
    });
  }

  calculateSummary(reviews: any[]) {
  const total = reviews.length;
  
  if (total === 0) {
    this.reviewsSummary = {
      propertyId: this.experienceId,
      averageRating: 0,
      totalReviews: 0,
      reviews: []
    };
    return;
  }

  // مصفوفات لتخزين القيم الموجودة فقط (لتجاهل الـ null)
  let cleanSum = 0, commSum = 0, locSum = 0, valSum = 0;
  let cleanCount = 0, commCount = 0, locCount = 0, valCount = 0;
  let ratingSum = 0;

  reviews.forEach(review => {
    // التقييم العام
    ratingSum += (review.rating || 0);

    // النظافة
    if (review.cleanlinessRating) {
      cleanSum += review.cleanlinessRating;
      cleanCount++;
    }

    // التواصل
    if (review.communicationRating) {
      commSum += review.communicationRating;
      commCount++;
    }

    // الموقع
    if (review.locationRating) {
      locSum += review.locationRating;
      locCount++;
    }

    // القيمة
    if (review.valueRating) {
      valSum += review.valueRating;
      valCount++;
    }
  });

  this.reviewsSummary = {
    propertyId: this.experienceId,
    totalReviews: total,
    averageRating: ratingSum / total,
    
    averageCleanlinessRating: cleanCount > 0 ? cleanSum / cleanCount : 0,
    averageCommunicationRating: commCount > 0 ? commSum / commCount : 0,
    averageLocationRating: locCount > 0 ? locSum / locCount : 0,
    averageValueRating: valCount > 0 ? valSum / valCount : 0,
    
    reviews: reviews
  };
}

  isReviewOwner(review: any): boolean {
    if (!this.currentUserId || !review) return false;
    
    // 👇 محاولة اصطياد الـ ID بأي اسم
    const ownerId = review.reviewerId || review.userId || review.applicationUserId || (review.reviewer ? review.reviewer.id : null);
    
    // 👇 3. طباعة مقارنة لكل ريفيو
    // console.log(`🔍 Comparing: MyID[${this.currentUserId}] vs ReviewID[${ownerId}] -> Match? ${String(this.currentUserId) === String(ownerId)}`);

    return String(this.currentUserId) === String(ownerId);
  }

 deleteReview(id: number): void {
    if(confirm('Are you sure you want to delete this review?')) {
        this.experienceService.deleteReview(id).subscribe({
            next: () => {
                this.loadReviews();
            },
            error: (err) => {
                console.error(err);
                alert('Failed to delete review');
            }
        });
    }
  }
  editReview(id: number): void {
      this.router.navigate(['/reviews/edit', id], { queryParams: { type: 'experience' } });
  }
}
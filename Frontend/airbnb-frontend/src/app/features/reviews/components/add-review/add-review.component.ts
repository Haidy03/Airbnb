import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReviewService } from '../../services/review.service';
import { CreateReviewDto } from '../../models/review.model';
import { StarRatingComponent } from '../../../../shared/components/star-rating/star-rating.component';
import { ExperienceService } from '../../../../shared/Services/experience.service';
import { ServicesService } from '../../../../features/services/services/service';

@Component({
  selector: 'app-add-review',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, StarRatingComponent],
  templateUrl: './add-review.component.html',
  styleUrls: ['./add-review.css']  
})
export class AddReviewComponent implements OnInit {
  reviewForm!: FormGroup;
  bookingId!: number;
  canReview = false;
  loading = false;
  errorMessage = '';
  successMessage = '';
  reviewType: string = 'Property';
  //reviewType: 'Property' | 'Experience' | 'Service' = 'Property';
  overallRating = 0;
  cleanlinessRating = 0;
  communicationRating = 0;
  locationRating = 0;
  valueRating = 0;

  constructor(
    private fb: FormBuilder,
    private reviewService: ReviewService,
    private route: ActivatedRoute,
    private experienceService: ExperienceService,
    private servicesService: ServicesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.bookingId = +this.route.snapshot.paramMap.get('bookingId')!;
    
    // ✅ NEW: استقبال النوع من الـ Query Params
    this.route.queryParams.subscribe(params => {
      this.reviewType = params['type'] ? params['type'].toLowerCase() : 'property';
      this.checkCanReview();
    });

    this.initForm();
  }

  initForm(): void {
    this.reviewForm = this.fb.group({
      comment: ['', [Validators.maxLength(1000)]]
    });
  }

  checkCanReview(): void {
    this.loading = true;

    // ✅ NEW: التحقق بناءً على النوع
    if (this.reviewType === 'Property') {
      this.reviewService.canReview(this.bookingId).subscribe({
        next: (response) => {
          this.canReview = response.canReview;
          if (!response.canReview) {
            this.errorMessage = response.reason || 'You cannot review this booking';
          }
          this.loading = false;
        },
        error: () => {
          this.errorMessage = 'Error checking review eligibility';
          this.loading = false;
        }
      });
    } else {
      // ✅ بالنسبة للتجارب، نفترض السماح طالما الزر ظهر (أو يمكنك إضافة دالة canReviewExperience في السيرفس)
      this.canReview = true; 
      this.loading = false;
    }
  }

  onOverallRatingChange(rating: number): void {
    this.overallRating = rating;
  }

  onCleanlinessRatingChange(rating: number): void {
    this.cleanlinessRating = rating;
  }

  onCommunicationRatingChange(rating: number): void {
    this.communicationRating = rating;
  }

  onLocationRatingChange(rating: number): void {
    this.locationRating = rating;
  }

  onValueRatingChange(rating: number): void {
    this.valueRating = rating;
  }

  onSubmit(): void {
    if (this.overallRating === 0) {
      this.errorMessage = 'Please provide an overall rating';
      return;
    }

    if (this.reviewForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    const reviewData: any = {
      bookingId: this.bookingId,
      rating: this.overallRating,
      comment: this.reviewForm.value.comment,
      cleanlinessRating: this.cleanlinessRating || null,
      communicationRating: this.communicationRating || null,
      locationRating: this.locationRating || null,
      valueRating: this.valueRating || null
    };

    // ✅ NEW: إرسال البيانات حسب النوع
    if (this.reviewType === 'service') {
      // 🛠️ استدعاء سيرفس الخدمات
      this.servicesService.addReview(reviewData).subscribe({
        next: () => this.handleSuccess(),
        error: (error) => this.handleError(error)
      });
    } 
    else if (this.reviewType === 'experience') {
      // 🛠️ استدعاء سيرفس التجارب
      this.experienceService.addReview(reviewData).subscribe({
        next: () => this.handleSuccess(),
        error: (error) => this.handleError(error)
      });
    } 
    else {
      // 🛠️ استدعاء سيرفس العقارات (الافتراضي)
      this.reviewService.createReview(reviewData).subscribe({
        next: () => this.handleSuccess(),
        error: (error) => this.handleError(error)
      });
    }
  }
  handleSuccess() {
  this.successMessage = 'Review submitted successfully!';
  this.loading = false;
  setTimeout(() => {
    this.router.navigate(['/trips']); 
  }, 2000);
  }

  handleError(error: any) {
    this.errorMessage = error.error?.message || 'Error submitting review';
    this.loading = false;
  }

  cancel(): void {
    this.router.navigate(['/guest/trips']);
  }
}
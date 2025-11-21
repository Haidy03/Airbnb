import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReviewService } from '../../services/review.service';
import { CreateReviewDto } from '../../models/review.model';
import { StarRatingComponent } from '../../../../shared/components/star-rating/star-rating.component';

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
  
  overallRating = 0;
  cleanlinessRating = 0;
  communicationRating = 0;
  locationRating = 0;
  valueRating = 0;

  constructor(
    private fb: FormBuilder,
    private reviewService: ReviewService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.bookingId = +this.route.snapshot.paramMap.get('bookingId')!;
    this.initForm();
    this.checkCanReview();
  }

  initForm(): void {
    this.reviewForm = this.fb.group({
      comment: ['', [Validators.maxLength(1000)]]
    });
  }

  checkCanReview(): void {
    this.loading = true;
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

    if (this.reviewForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const reviewData: CreateReviewDto = {
      bookingId: this.bookingId,
      rating: this.overallRating,
      comment: this.reviewForm.value.comment,
      cleanlinessRating: this.cleanlinessRating > 0 ? this.cleanlinessRating : undefined,
      communicationRating: this.communicationRating > 0 ? this.communicationRating : undefined,
      locationRating: this.locationRating > 0 ? this.locationRating : undefined,
      valueRating: this.valueRating > 0 ? this.valueRating : undefined
    };

    this.reviewService.createReview(reviewData).subscribe({
      next: () => {
        this.successMessage = 'Review submitted successfully!';
        this.loading = false;
        
        setTimeout(() => {
          this.router.navigate(['/guest/trips']);
        }, 2000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Error submitting review';
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/guest/trips']);
  }
}
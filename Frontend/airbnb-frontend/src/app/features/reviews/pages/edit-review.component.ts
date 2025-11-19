import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReviewService } from '../../reviews/services/review.service';
import { UpdateReviewDto, ReviewResponse } from '../../reviews/models/review.model';
import { StarRatingComponent } from '../../../../app/shared/components/star-rating/star-rating.component';

@Component({
  selector: 'app-edit-review',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, StarRatingComponent],
  templateUrl: './edit-review.component.html',
  styleUrls: ['./edit-review.component.css']
})
export class EditReviewComponent implements OnInit {
  reviewForm!: FormGroup;
  reviewId!: number;
  review?: ReviewResponse;
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
    this.reviewId = +this.route.snapshot.paramMap.get('id')!;
    this.initForm();
    this.loadReview();
  }

  initForm(): void {
    this.reviewForm = this.fb.group({
      comment: ['', [Validators.maxLength(1000)]]
    });
  }

  loadReview(): void {
    this.loading = true;
    
    this.reviewService.getReviewById(this.reviewId).subscribe({
      next: (data) => {
        this.review = data;
        
        // Populate form with existing data
        this.overallRating = data.rating;
        this.cleanlinessRating = data.cleanlinessRating || 0;
        this.communicationRating = data.communicationRating || 0;
        this.locationRating = data.locationRating || 0;
        this.valueRating = data.valueRating || 0;
        
        this.reviewForm.patchValue({
          comment: data.comment || ''
        });
        
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to load review';
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

    const updateData: UpdateReviewDto = {
      rating: this.overallRating,
      comment: this.reviewForm.value.comment,
      cleanlinessRating: this.cleanlinessRating > 0 ? this.cleanlinessRating : undefined,
      communicationRating: this.communicationRating > 0 ? this.communicationRating : undefined,
      locationRating: this.locationRating > 0 ? this.locationRating : undefined,
      valueRating: this.valueRating > 0 ? this.valueRating : undefined
    };

    this.reviewService.updateReview(this.reviewId, updateData).subscribe({
      next: () => {
        this.successMessage = 'Review updated successfully!';
        this.loading = false;
        
        setTimeout(() => {
          this.router.navigate(['/reviews/my-reviews']);
        }, 2000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Error updating review';
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/reviews/my-reviews']);
  }
}
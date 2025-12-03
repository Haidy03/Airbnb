import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReviewService } from '../../reviews/services/review.service';
import { UpdateReviewDto } from '../../reviews/models/review.model';
import { StarRatingComponent } from '../../../../app/shared/components/star-rating/star-rating.component';
import { ExperienceService } from '../../../../app/shared/Services/experience.service';
import { ServicesService } from '../../../features/services/services/service';

@Component({
  selector: 'app-edit-review',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, StarRatingComponent],
  templateUrl: './edit-review.component.html',
  styleUrls: ['./edit-review.component.css']
})
export class EditReviewComponent implements OnInit {
  reviewForm!: FormGroup;
  
  reviewType: 'property' | 'experience' | 'service' = 'property';
  resourceId: number | null = null;
  reviewId!: number;
  review?: any;
  
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
    private router: Router,
    private servicesService: ServicesService,
    private experienceService: ExperienceService
  ) {}

  ngOnInit(): void {
    this.reviewId = +this.route.snapshot.paramMap.get('id')!;
    
    this.route.queryParams.subscribe(params => {
        this.reviewType = params['type'] === 'experience' ? 'experience' : 
                          params['type'] === 'service' ? 'service' : 'property';
        this.initForm();
        this.loadReview();
    });
  }

  initForm(): void {
    this.reviewForm = this.fb.group({
      comment: ['', [Validators.maxLength(1000)]]
    });
  }

  loadReview(): void {
    this.loading = true;
    
    let service$;
    if (this.reviewType === 'experience') {
        service$ = this.experienceService.getReviewById(this.reviewId);
    } else if (this.reviewType === 'service') {
        service$ = this.servicesService.getReviewById(this.reviewId);
    } else {
        service$ = this.reviewService.getReviewById(this.reviewId);
    }

    service$.subscribe({
      next: (data: any) => {
        const reviewData = data.data || data; 
        this.review = reviewData;
        this.populateForm(reviewData);
        this.loading = false;
      },
      error: (error: any) => {
        this.errorMessage = error.error?.message || 'Failed to load review';
        this.loading = false;
      }
    });
  }

  populateForm(data: any) {
    // ✅ تخزين الـ ID للعودة إليه لاحقاً
    if (this.reviewType === 'experience') {
        this.resourceId = data.experienceId; 
    } else if (this.reviewType === 'service') {
        this.resourceId = data.serviceId; // ✅
    } else {
        this.resourceId = data.propertyId;
    }

    this.overallRating = data.rating || 0;
    this.cleanlinessRating = data.cleanlinessRating || 0;
    this.communicationRating = data.communicationRating || 0;
    this.locationRating = data.locationRating || 0;
    this.valueRating = data.valueRating || 0;

    this.reviewForm.patchValue({
      comment: data.comment || ''
    });
  }

  onOverallRatingChange(r: number) { this.overallRating = r; }
  onCleanlinessRatingChange(r: number) { this.cleanlinessRating = r; }
  onCommunicationRatingChange(r: number) { this.communicationRating = r; }
  onLocationRatingChange(r: number) { this.locationRating = r; }
  onValueRatingChange(r: number) { this.valueRating = r; }

  onSubmit(): void {
    if (this.overallRating === 0) {
      this.errorMessage = 'Please provide an overall rating';
      return;
    }
    if (this.reviewForm.invalid) return;

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

    const handleSuccess = () => {
      this.successMessage = 'Review updated successfully!';
      this.loading = false;
      
      setTimeout(() => {
        // ✅✅ التوجيه الصحيح لصفحة التفاصيل
        if (this.reviewType === 'experience' && this.resourceId) {
            this.router.navigate(['/experiences', this.resourceId]);
        } 
        else if (this.reviewType === 'service' && this.resourceId) {
            this.router.navigate(['/services', this.resourceId]); // ✅ توجيه للخدمة
        }
        else if (this.resourceId) {
            this.router.navigate(['/listing', this.resourceId]); // توجيه للعقار
        } 
        else {
            this.router.navigate(['/guest/trips']);
        }
      }, 1500);
    };

    const handleError = (error: any) => {
      this.errorMessage = error.error?.message || 'Error updating review';
      this.loading = false;
    };

    // ✅ استدعاء السيرفس المناسبة (واحد فقط يعمل)
    if (this.reviewType === 'experience') {
      this.experienceService.updateReview(this.reviewId, updateData).subscribe({ 
          next: handleSuccess, 
          error: handleError 
      });
    } 
    else if (this.reviewType === 'service') {
       this.servicesService.updateReview(this.reviewId, updateData).subscribe({ 
           next: handleSuccess, 
           error: handleError 
       }); 
    } 
    else {
      this.reviewService.updateReview(this.reviewId, updateData).subscribe({ 
          next: handleSuccess, 
          error: handleError 
      });
    }
  }

  cancel(): void {
    if (this.reviewType === 'experience' && this.resourceId) {
        this.router.navigate(['/experiences', this.resourceId]);
    } else if (this.reviewType === 'service' && this.resourceId) {
        this.router.navigate(['/services', this.resourceId]); // ✅
    } else if (this.resourceId) {
        this.router.navigate(['/listing', this.resourceId]);
    } else {
        this.router.navigate(['/guest/trips']);
    }
  }
}
/* import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReviewService } from '../../reviews/services/review.service';
import { UpdateReviewDto, ReviewResponse } from '../../reviews/models/review.model';
import { StarRatingComponent } from '../../../../app/shared/components/star-rating/star-rating.component';
import { ExperienceService } from '../../../../app/shared/Services/experience.service';

@Component({
  selector: 'app-edit-review',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, StarRatingComponent],
  templateUrl: './edit-review.component.html',
  styleUrls: ['./edit-review.component.css']
})
export class EditReviewComponent implements OnInit {
  reviewForm!: FormGroup;
  reviewType: 'property' | 'experience' = 'property'; 
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
    private experienceService: ExperienceService

  ) {}

  ngOnInit(): void {
    this.reviewId = +this.route.snapshot.paramMap.get('id')!;
    this.route.queryParams.subscribe(params => {
        this.reviewType = params['type'] === 'experience' ? 'experience' : 'property';
        this.initForm();
        this.loadReview();
    });
  }

  populateForm(data: any) {
    if (this.reviewType === 'experience') {
        this.resourceId = data.experienceId; 
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

  handleSuccess() {
      this.successMessage = 'Review updated successfully!';
      this.loading = false;
      
      setTimeout(() => {
          // ✅✅ التوجيه حسب النوع والـ ID المخزن ✅✅
          if (this.reviewType === 'experience' && this.resourceId) {
              // توجيه لصفحة ريفيوهات التجارب
              this.router.navigate(['/reviews/experience', this.resourceId]);
          } 
          else if (this.resourceId) {
              // توجيه لصفحة ريفيوهات العقارات
              this.router.navigate(['/reviews/property', this.resourceId]);
          } 
          else {
              // لو حصل مشكلة والـ ID مش موجود، نرجعه لصفحة رحلاته كاحتياطي
              this.router.navigate(['/guest/trips']);
          }
      }, 1500); // قللت الوقت لـ 1.5 ثانية عشان يكون أسرع
  }

  initForm(): void {
    this.reviewForm = this.fb.group({
      comment: ['', [Validators.maxLength(1000)]]
    });
  }

  loadReview(): void {
    this.loading = true;
    
    const service$ = this.reviewType === 'experience' 
      ? this.experienceService.getReviewById(this.reviewId)
      : this.reviewService.getReviewById(this.reviewId);

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
  // 1. التحقق من صحة البيانات
  if (this.overallRating === 0) {
    this.errorMessage = 'Please provide an overall rating';
    return;
  }

  if (this.reviewForm.invalid) {
    return;
  }

  this.loading = true;
  this.errorMessage = '';

  // 2. تجهيز البيانات
  const updateData: UpdateReviewDto = {
    rating: this.overallRating,
    comment: this.reviewForm.value.comment,
    cleanlinessRating: this.cleanlinessRating > 0 ? this.cleanlinessRating : undefined,
    communicationRating: this.communicationRating > 0 ? this.communicationRating : undefined,
    locationRating: this.locationRating > 0 ? this.locationRating : undefined,
    valueRating: this.valueRating > 0 ? this.valueRating : undefined
  };

  // 3. دالة التعامل مع النجاح (عشان نستخدمها في الحالتين)
  const handleSuccess = () => {
    this.successMessage = 'Review updated successfully!';
    this.loading = false;
    
    setTimeout(() => {
      // ✅✅ هنا التوجيه بناءً على النوع والـ ID المخزن ✅✅
      if (this.reviewType === 'experience' && this.resourceId) {
        this.router.navigate(['']);
      } 
      else if (this.resourceId) {
        // الافتراضي هو property
        this.router.navigate(['']);
      } 
      else {
        // رابط احتياطي لو حصلت مشكلة في الـ ID
        this.router.navigate(['/reviews/my-reviews']);
      }
    }, 2000);
  };

  // 4. دالة التعامل مع الخطأ
  const handleError = (error: any) => {
    this.errorMessage = error.error?.message || 'Error updating review';
    this.loading = false;
  };

  // 5. استدعاء السيرفس المناسبة حسب النوع
  if (this.reviewType === 'experience') {
    this.experienceService.updateReview(this.reviewId, updateData).subscribe({
      next: handleSuccess,
      error: handleError
    });
  } else {
    this.reviewService.updateReview(this.reviewId, updateData).subscribe({
      next: handleSuccess,
      error: handleError
    });
  }
}

  cancel(): void {
    this.router.navigate(['']);
  }
} */


  import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReviewService } from '../../reviews/services/review.service';
import { UpdateReviewDto, ReviewResponse } from '../../reviews/models/review.model';
import { StarRatingComponent } from '../../../../app/shared/components/star-rating/star-rating.component';
import { ExperienceService } from '../../../../app/shared/Services/experience.service';

@Component({
  selector: 'app-edit-review',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, StarRatingComponent],
  templateUrl: './edit-review.component.html',
  styleUrls: ['./edit-review.component.css']
})
export class EditReviewComponent implements OnInit {
  reviewForm!: FormGroup;
  // ✅ تعريف المتغيرات لتجنب الأخطاء
  reviewType: 'property' | 'experience' = 'property';
  resourceId: number | null = null;
  reviewId!: number;
  review?: any; // غيرناه لـ any عشان يقبل اختلاف المودلز مؤقتاً
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
    private experienceService: ExperienceService
  ) {}

  ngOnInit(): void {
    this.reviewId = +this.route.snapshot.paramMap.get('id')!;
    // تحديد النوع من الرابط
    this.route.queryParams.subscribe(params => {
        this.reviewType = params['type'] === 'experience' ? 'experience' : 'property';
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
    
    // اختيار السيرفس بناءً على النوع
    const service$ = this.reviewType === 'experience' 
      ? this.experienceService.getReviewById(this.reviewId)
      : this.reviewService.getReviewById(this.reviewId);

    service$.subscribe({
      next: (data: any) => {
        // فك الداتا (أحياناً بتيجي داخل data وأحياناً مباشرة)
        const reviewData = data.data || data; 
        this.review = reviewData;
        
        // ✅ ملء الفورم بالبيانات القديمة
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
    } else {
        this.resourceId = data.propertyId;
    }

    // ✅ تعيين قيم النجوم (عشان تظهر للمستخدم)
    this.overallRating = data.rating || 0;
    this.cleanlinessRating = data.cleanlinessRating || 0;
    this.communicationRating = data.communicationRating || 0;
    this.locationRating = data.locationRating || 0;
    this.valueRating = data.valueRating || 0;

    // تعيين الكومنت
    this.reviewForm.patchValue({
      comment: data.comment || ''
    });
  }

  // دوال تحديث النجوم من الـ UI
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
        // ✅✅ التوجيه الصحيح لصفحة التفاصيل (Listing/Details) ✅✅
        if (this.reviewType === 'experience' && this.resourceId) {
            this.router.navigate(['/experiences', this.resourceId]);
        } 
        else if (this.resourceId) {
            this.router.navigate(['/listing', this.resourceId]);
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

    if (this.reviewType === 'experience') {
      this.experienceService.updateReview(this.reviewId, updateData).subscribe({ next: handleSuccess, error: handleError });
    } else {
      this.reviewService.updateReview(this.reviewId, updateData).subscribe({ next: handleSuccess, error: handleError });
    }
  }

  cancel(): void {
    // زر الإلغاء يرجعك لصفحة التفاصيل أيضاً
    if (this.reviewType === 'experience' && this.resourceId) {
        this.router.navigate(['/experiences', this.resourceId]);
    } else if (this.resourceId) {
        this.router.navigate(['/listing', this.resourceId]);
    } else {
        this.router.navigate(['/guest/trips']);
    }
  }
}
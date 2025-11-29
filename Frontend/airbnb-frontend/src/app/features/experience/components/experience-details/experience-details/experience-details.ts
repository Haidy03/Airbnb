import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ExperienceService } from '../../../../../shared/Services/experience.service';
import { Experience, ExperienceReview } from '../../../../../shared/models/experience.model';
import { environment } from '../../../../../../environments/environment.development';

@Component({
  selector: 'app-experience-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './experience-details.html',
  styleUrls: ['./experience-details.css']
})
export class ExperienceDetailsComponent implements OnInit {
  experience = signal<Experience | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  
  // ✅ NEW: لتخزين حالة المفضلة
  isWishlisted = signal(false);

  // ✅ NEW: لتخزين التقييمات
  reviews = signal<ExperienceReview[]>([]);
  
  selectedImageIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private experienceService: ExperienceService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const expId = parseInt(id);
      this.loadExperience(expId);
      // ✅ NEW: تحميل التقييمات
      this.loadReviews(expId);
    }
  }

  loadExperience(id: number): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.experienceService.getExperienceById(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.experience.set(response.data);
          
          // ✅ NEW: التحقق هل العنصر في المفضلة أم لا عند تحميل الصفحة
          this.checkWishlistStatus(id);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading experience:', error);
        this.error.set('Failed to load experience');
        this.isLoading.set(false);
      }
    });
  }

  // ✅ NEW: دالة تحميل التقييمات
  loadReviews(id: number): void {
    this.experienceService.getReviews(id).subscribe({
        next: (res) => {
            if (res.success) {
                this.reviews.set(res.data);
            }
        }
    });
  }

  // ✅ NEW: دالة للتحقق من حالة الـ Wishlist
  checkWishlistStatus(id: number): void {
    this.experienceService.checkIsWishlisted(id).subscribe({
      next: (isListed) => {
        this.isWishlisted.set(isListed);
      },
      error: () => this.isWishlisted.set(false) // لو حصل خطأ نفترض أنه مش موجود
    });
  }

  // ✅ NEW: دالة التبديل (إضافة/حذف من المفضلة) عند الضغط على القلب
  toggleWishlist(): void {
    const exp = this.experience();
    if (!exp) return;

    // تغيير الحالة فوراً في الواجهة (Optimistic UI)
    this.isWishlisted.update(v => !v);

    this.experienceService.toggleWishlist(exp.id).subscribe({
      next: (res) => {
        // تأكيد الحالة من السيرفر
        this.isWishlisted.set(res.isWishlisted);
      },
      error: (err) => {
        // لو حصل خطأ نرجع الحالة زي ما كانت
        this.isWishlisted.update(v => !v);
        console.error('Wishlist error', err);
      }
    });
  }

  selectImage(index: number): void {
    this.selectedImageIndex = index;
  }

  bookExperience(): void {
    const exp = this.experience();
    if (exp) {
      this.router.navigate(['/experiences', exp.id, 'book']);
    }
  }

  // ✅ UPDATE: تعديل دالة مراسلة المضيف
  contactHost(): void {
    const exp = this.experience();
    if (exp) {
      // التوجيه لصفحة الرسائل مع تمرير البيانات اللازمة لبدء المحادثة
      this.router.navigate(['/messages'], {
        queryParams: { 
            hostId: exp.hostId,      // عشان نعرف هنكلم مين
            contextId: exp.id,       // عشان نعرف بنتكلم عن أنهي تجربة
            type: 'experience'       // نوع السياق
        }
      });
    }
  }

  shareExperience(): void {
    if (navigator.share) {
      navigator.share({
        title: this.experience()?.title,
        text: this.experience()?.description,
        url: window.location.href
      });
    }
  }

  getImageUrl(imageUrl: string): string {
    if (!imageUrl) return 'assets/images/placeholder.jpg';
    
    // لو الصورة رابط خارجي رجعها زي ما هي
    if (imageUrl.startsWith('http')) return imageUrl;
    
    // ✅ التصحيح: نضيف رابط السيرفر (الباك اند) قبل مسار الصورة
    // بنشيل كلمة '/api' عشان نوصل للروت بتاع السيرفر اللي عليه فولدر uploads
    const baseUrl = environment.apiUrl.replace('/api', '');
    
    return `${baseUrl}${imageUrl}`;
  }
}
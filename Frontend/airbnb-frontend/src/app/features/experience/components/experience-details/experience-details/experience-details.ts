import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ExperienceService } from '../../../../../shared/Services/experience.service';
import { Experience, ExperienceReview } from '../../../../../shared/models/experience.model';
import { environment } from '../../../../../../environments/environment.development';
import { HeaderComponent } from "../../../../guest/components/header/header";
import { AuthService } from '../../../../../core/services/auth.service';
import { Conversation } from '../../../../messages/models/message.model';
import { MessageService } from '../../../../guest/services/message.service';
@Component({
  selector: 'app-experience-details',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent],
  templateUrl: './experience-details.html',
  styleUrls: ['./experience-details.css']
})
export class ExperienceDetailsComponent implements OnInit {
  experience = signal<Experience | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  isOwner = signal(false); 
  isWishlisted = signal(false);
  reviews = signal<ExperienceReview[]>([]);
  
  selectedImageIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private experienceService: ExperienceService,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const expId = parseInt(id);
      this.loadExperience(expId);
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
          
          this.checkWishlistStatus(id);
           const currentUserId = this.authService.getUserId();
          if (currentUserId && response.data.hostId === currentUserId) {
            this.isOwner.set(true);
          }
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

  loadReviews(id: number): void {
    this.experienceService.getReviews(id).subscribe({
        next: (res) => {
            if (res.success) {
                this.reviews.set(res.data);
            }
        }
    });
  }

  checkWishlistStatus(id: number): void {
    this.experienceService.checkIsWishlisted(id).subscribe({
      next: (isListed) => {
        this.isWishlisted.set(isListed);
      },
      error: () => this.isWishlisted.set(false) 
    });
  }

  toggleWishlist(): void {
    const exp = this.experience();
    if (!exp) return;

    this.isWishlisted.update(v => !v);

    this.experienceService.toggleWishlist(exp.id).subscribe({
      next: (res) => {
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

 contactHost(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    const exp = this.experience();
    if (exp) {
      
      // استخراج صورة التجربة
      let experienceImage = '';
      if (exp.images && exp.images.length > 0) {
         experienceImage = exp.images[0].imageUrl;
      }

      // ✅ تجهيز صورة الهوست (كاملة)
      const fullHostImage = this.getImageUrl(exp.hostAvatar);

      this.router.navigate(['/messages'], {
        queryParams: { 
            hostId: exp.hostId,      
            hostName: exp.hostName,
            hostImage: fullHostImage, // ✅✅ الإضافة هنا: إرسال صورة الهوست
            
            contextId: exp.id,       
            type: 'experience',
            title: exp.title,
            propertyImage: experienceImage // صورة التجربة نفسها
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

  getImageUrl(imageUrl: string | undefined | null): string {
    if (!imageUrl) {
      return 'assets/images/default-avatar.png'; // تأكدي من مسار صورة الـ Avatar الافتراضية
    }

    if (imageUrl.startsWith('http') || imageUrl.includes('assets/')) {
      return imageUrl;
    }

    const baseUrl = environment.apiUrl.replace('/api', '').replace(/\/$/, '');
    let cleanPath = imageUrl;
    
    if (!cleanPath.startsWith('/')) {
        cleanPath = `/${cleanPath}`;
    }

    return `${baseUrl}${cleanPath}`;
  }
}
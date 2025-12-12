import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // ✅ DatePipe Added
import { ActivatedRoute, RouterModule ,Router } from '@angular/router';
import { ServicesService } from '../../services/service';
import { ServiceDetails, ServicePackage } from '../../models/service.model';
import { environment } from '../../../../../environments/environment';
import { ServiceBookingModalComponent } from '../service-booking-modal/service-booking-modal';
import { AuthService } from '../../../auth/services/auth.service';
import { ReviewCardComponent } from '../../../reviews/components/review-card/review-card.component';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-service-details',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, ServiceBookingModalComponent, ReviewCardComponent], // ✅ DatePipe Imported
  templateUrl: './service-details.html',
  styleUrls: ['./service-details.css']
})
export class ServiceDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private servicesService = inject(ServicesService);
  private authService = inject(AuthService);
  private router = inject(Router);  
  private notificationService = inject(NotificationService);
  isGalleryOpen = false;
  service = signal<ServiceDetails | null>(null);
  isLoading = signal(true);
  selectedPackage = signal<ServicePackage | null>(null);
  showBookingModal = false;
  isWishlisted = signal(false);
  private baseUrl = environment.apiUrl.replace('/api', '').replace(/\/$/, '');
  reviews = signal<any[]>([]);

  ngOnInit() {
    window.scrollTo(0, 0);
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadService(Number(id));
      this.loadReviews(Number(id));

      if (this.authService.isAuthenticated) {
        this.checkWishlistStatus(Number(id));
      }
    }
  }

  checkWishlistStatus(id: number): void {
    this.servicesService.checkIsWishlisted(id).subscribe({
      next: (isListed) => {
        this.isWishlisted.set(isListed);
      },
      error: () => this.isWishlisted.set(false) 
    });
  }
  toggleWishlist(): void {
    const s = this.service();
    if (!s) return;

    if (!this.authService.isAuthenticated) {
      this.notificationService.showToast('info', 'Please log in to save services.');
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    const previousState = this.isWishlisted();
    this.isWishlisted.update(v => !v);

    this.servicesService.toggleWishlist(s.id).subscribe({
      next: (res) => {
        this.isWishlisted.set(res.isWishlisted);
        const msg = res.isWishlisted ? 'Saved to wishlist' : 'Removed from wishlist';
        this.notificationService.showToast('success', msg);
      },
      error: (err) => {
        this.isWishlisted.set(previousState);
        this.notificationService.showError('Failed to update wishlist');
      }
    });
  }

  shareService(): void {
    if (navigator.share) {
      navigator.share({
        title: this.service()?.title,
        text: `Check out this service on Airbnb Clone: ${this.service()?.title}`,
        url: window.location.href
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      this.notificationService.showToast('success', 'Link copied to clipboard!');
    }
  }
  loadReviews(id: number) {
    this.servicesService.getReviews(id).subscribe({
      next: (res: any) => {
        const data = res.success ? res.data : res;
        if (Array.isArray(data)) {
          this.reviews.set(data);
        }
      }
    });
  }

  loadService(id: number) {
    this.servicesService.getServiceDetails(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.service.set(res.data);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  selectPackage(pkg: ServicePackage) {
    if (this.selectedPackage() === pkg) {
      this.selectedPackage.set(null);
    } else {
      this.selectedPackage.set(pkg);
    }
  }

  getImageUrl(image: any): string { 
    if (!image) return 'assets/images/placeholder.jpg';
    
    if (typeof image === 'object' && image.url) {
        return this.formatUrl(image.url);
    }
    if (typeof image === 'string') {
        return this.formatUrl(image);
    }

    return 'assets/images/placeholder.jpg';
  }

  private formatUrl(url: string): string {
    if (url.startsWith('http')) return url;
    const cleanPath = url.startsWith('/') ? url.substring(1) : url;
    return `${this.baseUrl}/${cleanPath}`;
  }

  formatUnit(unit: string): string {
    const map: any = { 
      'PerPerson': 'guest', 
      'PerHour': 'hour', 
      'PerSession': 'session', 
      'FlatFee': 'service' 
    };
    return map[unit] || unit.toLowerCase();
  }

 
  getLocationText(s: ServiceDetails): string {
    if (s.locationType === 'Mobile') {
      return `Mobile Service • Host travels to you in ${s.city}`;
    }
    return `On-Site Service • Located in ${s.city}`;
  }

  openBookingModal() {
    this.showBookingModal = true;
  }

  closeBookingModal() {
    this.showBookingModal = false;
  }

   contactHost() {
    
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    const s = this.service();
    if (s) {
      const hostId = s.hostId;
      const hostName = s.hostName;
      const propertyId = s.id; 
      const propertyTitle = s.title; 
      
     
      let propertyImage = '';
       if (s.images && s.images.length > 0) {
         propertyImage = this.getImageUrl(s.images[0]); 
      }

      this.router.navigate(['/messages'], { 
        queryParams: { 
          hostId: hostId,
          hostName: hostName,
          propertyId: propertyId,    
          propertyTitle: propertyTitle,
          hostImage: this.getImageUrl(s.hostAvatar), 
          propertyImage: propertyImage,
          autoOpen: 'true',
          type: 'service' 
        } 
      });
    }}

    showAllPhotos() {
    this.isGalleryOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeGallery() {
    this.isGalleryOpen = false;
    document.body.style.overflow = 'auto';
  }
}
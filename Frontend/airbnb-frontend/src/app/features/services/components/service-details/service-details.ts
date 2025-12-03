import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // ✅ DatePipe Added
import { ActivatedRoute, RouterModule ,Router } from '@angular/router';
import { ServicesService } from '../../services/service';
import { ServiceDetails, ServicePackage } from '../../models/service.model';
import { environment } from '../../../../../environments/environment';
import { ServiceBookingModalComponent } from '../service-booking-modal/service-booking-modal';
import { AuthService } from '../../../auth/services/auth.service';
import { ReviewCardComponent } from '../../../reviews/components/review-card/review-card.component';


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
  
  service = signal<ServiceDetails | null>(null);
  isLoading = signal(true);
  selectedPackage = signal<ServicePackage | null>(null);
  showBookingModal = false;
  private baseUrl = environment.apiUrl.replace('/api', '').replace(/\/$/, '');
  reviews = signal<any[]>([]);

  ngOnInit() {
    window.scrollTo(0, 0);
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadService(Number(id));
      this.loadReviews(Number(id));
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

  getImageUrl(url: string | undefined | null): string {
    if (!url) return 'assets/images/placeholder.jpg';
    if (url.startsWith('http')) return url;
    const cleanPath = url.startsWith('/') ? url.substring(1) : url;
    return `${this.baseUrl}/${cleanPath}`;
  }

  // ✅ 1. تنسيق وحدة السعر
  formatUnit(unit: string): string {
    const map: any = { 
      'PerPerson': 'guest', 
      'PerHour': 'hour', 
      'PerSession': 'session', 
      'FlatFee': 'service' 
    };
    return map[unit] || unit.toLowerCase();
  }

  // ✅ 2. نص الموقع (مهم جداً)
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
         propertyImage = s.images[0]; 
         
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
}
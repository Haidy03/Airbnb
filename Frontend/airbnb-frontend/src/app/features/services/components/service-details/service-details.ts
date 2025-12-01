import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // ✅ DatePipe Added
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ServicesService } from '../../services/service';
import { ServiceDetails, ServicePackage } from '../../models/service.model';
import { environment } from '../../../../../environments/environment';
import { ServiceBookingModalComponent } from '../service-booking-modal/service-booking-modal';
@Component({
  selector: 'app-service-details',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, ServiceBookingModalComponent], // ✅ DatePipe Imported
  templateUrl: './service-details.html',
  styleUrls: ['./service-details.css']
})
export class ServiceDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private servicesService = inject(ServicesService);
  
  service = signal<ServiceDetails | null>(null);
  isLoading = signal(true);
  selectedPackage = signal<ServicePackage | null>(null);
  showBookingModal = false;
  private baseUrl = environment.apiUrl.replace('/api', '').replace(/\/$/, '');

  ngOnInit() {
    window.scrollTo(0, 0);
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadService(Number(id));
    }
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
}
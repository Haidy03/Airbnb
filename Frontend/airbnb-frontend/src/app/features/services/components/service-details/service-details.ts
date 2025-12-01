import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ServicesService } from '../../services/service';
import { ServiceDetails, ServicePackage } from '../../models/service.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-service-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './service-details.html',
  styleUrls: ['./service-details.css']
})
export class ServiceDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private servicesService = inject(ServicesService);
  
  // Data Signals
  service = signal<ServiceDetails | null>(null);
  isLoading = signal(true);
  
  // Logic
  selectedPackage = signal<ServicePackage | null>(null);
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
          // لو فيه باقات، نختار الأولى افتراضياً (اختياري)
          // if (res.data.packages.length > 0) {
          //   this.selectedPackage.set(res.data.packages[0]);
          // }
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
      }
    });
  }

  selectPackage(pkg: ServicePackage) {
    // لو ضغط على نفس الباقة يلغي الاختيار، وإلا يختارها
    if (this.selectedPackage() === pkg) {
      this.selectedPackage.set(null);
    } else {
      this.selectedPackage.set(pkg);
    }
  }

  // ✅ دالة معالجة الصور (نفس اللوجيك السليم)
  getImageUrl(url: string | undefined | null): string {
    if (!url) return 'assets/images/placeholder.jpg';
    if (url.startsWith('http')) return url;
    const cleanPath = url.startsWith('/') ? url.substring(1) : url;
    return `${this.baseUrl}/${cleanPath}`;
  }

  // Helper formatting text
  formatPricingUnit(unit: string): string {
    // يحول "PerPerson" إلى "guest" أو "PerSession" إلى "session"
    return unit.replace('Per', '').toLowerCase(); 
  }
}
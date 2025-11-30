import { Component, OnInit, inject } from '@angular/core';
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
  
  service: ServiceDetails | null = null; 
  isLoading = true;
  selectedPackage: ServicePackage | null = null;

  // رابط الباك إند للصور المحلية
  private backendUrl = environment.apiUrl.replace('/api', ''); 

  ngOnInit() {
    window.scrollTo(0, 0); // البدء من أعلى الصفحة
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadService(Number(id));
    }
  }

  loadService(id: number) {
    this.servicesService.getServiceDetails(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.service = res.data;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching service details:', err);
        this.isLoading = false;
      }
    });
  }

  selectPackage(pkg: ServicePackage) {
    this.selectedPackage = pkg;
  }

  // دالة ذكية لمعالجة الصور (محلية أو خارجية)
  getImageUrl(url: string | undefined | null): string {
    if (!url) return 'assets/images/placeholder.jpg';
    if (url.startsWith('http')) return url;
    
    // إزالة السلاش في البداية لتجنب الازدواج
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    return `${this.backendUrl}/${cleanUrl}`;
  }
}
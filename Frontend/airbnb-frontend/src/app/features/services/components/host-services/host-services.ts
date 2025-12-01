import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ServicesService } from '../../services/service'; 
import { HostService } from '../../models/service.model'; 
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-host-services',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './host-services.html',
  styleUrls: ['./host-services.css']
})
export class HostServicesComponent implements OnInit {
  services = signal<HostService[]>([]);
  isLoading = signal(false);
  
  private baseUrl = environment.apiUrl.replace('/api', '');

  constructor(
    private servicesService: ServicesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices() {
    this.isLoading.set(true);
    this.servicesService.getHostServices().subscribe({
      next: (res) => {
        if (res.success) {
          this.services.set(res.data);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
      }
    });
  }

  createService() {
    // التوجيه لأول خطوة في إنشاء الخدمة
    this.router.navigate(['/host/services/create']);
  }

  
  getImageUrl(url: string): string {
    if (!url) return 'assets/images/placeholder.jpg';
    if (url.startsWith('http')) return url;
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    return `${this.baseUrl}/${cleanUrl}`;
  }

  
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Active': return 'badge-success'; // أخضر
      case 'PendingApproval': return 'badge-warning'; // برتقالي
      case 'Rejected': return 'badge-danger'; // أحمر
      default: return 'badge-secondary'; // رمادي
    }
  }
}
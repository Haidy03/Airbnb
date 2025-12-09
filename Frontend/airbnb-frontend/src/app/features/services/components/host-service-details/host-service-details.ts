import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router,RouterModule  } from '@angular/router';
import { ServicesService } from '../../services/service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-host-service-details',
  standalone: true,
  imports: [CommonModule,RouterModule],
  templateUrl: './host-service-details.html',
  styleUrls: ['./host-service-details.css']
})
export class HostServiceDetailsComponent implements OnInit {
  service: any = null;
  isLoading = signal(true);
  isToggling = signal(false);
  
  private baseUrl = environment.apiUrl.replace('/api', '');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private servicesService: ServicesService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadDetails(Number(id));
  }

  loadDetails(id: number) {
    this.servicesService.getHostServiceDetails(id).subscribe({
      next: (res) => {
        this.service = res.data;
        this.isLoading.set(false);
      },
      error: () => this.router.navigate(['/host/services'])
    });
  }

  getImageUrl(url: string | undefined | null) {
  if (!url) return 'assets/images/placeholder.jpg';
  
  if (url.startsWith('http')) return url;
  const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
  const cleanBase = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
  return `${cleanBase}/${cleanUrl}`;
  }
  
  getMainImageUrl(): string {
    if (!this.service || !this.service.images || this.service.images.length === 0) {
      return 'assets/images/placeholder.jpg';
    }
    const coverImage = this.service.images.find((img: any) => img.isCover === true);
    const targetImage = coverImage || this.service.images[0];
    
    const url = targetImage.url || targetImage; 
    return this.getImageUrl(url);
  }

  // Toggle Status Logic
  toggleStatus() {
    if (!this.service) return;
    
    
    if (this.service.status === 'PendingApproval' || this.service.status === 'Rejected') {
      alert('Cannot change status while Pending or Rejected.');
      return;
    }

    this.isToggling.set(true);
    this.servicesService.toggleServiceStatus(this.service.id).subscribe({
      next: () => {
        
        this.service.status = this.service.status === 'Active' ? 'Inactive' : 'Active';
        this.isToggling.set(false);
      },
      error: () => {
        alert('Failed to update status');
        this.isToggling.set(false);
      }
    });
  }

  // Delete Logic
  deleteService() {
    if (confirm('Are you sure you want to delete this service? This cannot be undone.')) {
      this.servicesService.deleteService(this.service.id).subscribe({
        next: () => {
          alert('Service deleted.');
          this.router.navigate(['/host/services']);
        },
        error: () => alert('Failed to delete service.')
      });
    }
  }

  goBack() {
    this.router.navigate(['/host/services']);
  }
}
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../serevices/admin.service';
import { AdminServiceItem } from '../../models/admin.models';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-admin-services',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-services.html',
  styleUrls: ['./admin-services.css']
})
export class AdminServicesComponent implements OnInit {
  services = signal<AdminServiceItem[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Modal State
  selectedService = signal<AdminServiceItem | null>(null);
  showApproveModal = signal(false);
  showRejectModal = signal(false);
  rejectionReason = signal('');

  private baseUrl = environment.apiUrl.replace('/api', '');

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadPendingServices();
  }

  loadPendingServices() {
    this.loading.set(true);
    this.adminService.getPendingServices().subscribe({
      next: (res) => {
        // الباك إند بيرجع { success: true, data: [] }
        this.services.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('Failed to load services');
        this.loading.set(false);
      }
    });
  }

  // Helpers
  getImageUrl(url?: string): string {
    if (!url) return 'assets/images/placeholder.jpg';
    if (url.startsWith('http')) return url;
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    return `${this.baseUrl}/${cleanUrl}`;
  }

  // Approve Logic
  openApproveModal(service: AdminServiceItem) {
    this.selectedService.set(service);
    this.showApproveModal.set(true);
  }

  closeApproveModal() {
    this.showApproveModal.set(false);
    this.selectedService.set(null);
  }

  approveService() {
    const service = this.selectedService();
    if (!service) return;

    this.adminService.approveService(service.id).subscribe({
      next: () => {
        alert('Service approved successfully');
        this.loadPendingServices();
        this.closeApproveModal();
      },
      error: () => alert('Failed to approve service')
    });
  }

  // Reject Logic
  openRejectModal(service: AdminServiceItem) {
    this.selectedService.set(service);
    this.showRejectModal.set(true);
    this.rejectionReason.set('');
  }

  closeRejectModal() {
    this.showRejectModal.set(false);
    this.selectedService.set(null);
  }

  rejectService() {
    const service = this.selectedService();
    if (!service || !this.rejectionReason().trim()) return;

    this.adminService.rejectService(service.id, this.rejectionReason()).subscribe({
      next: () => {
        alert('Service rejected');
        this.loadPendingServices();
        this.closeRejectModal();
      },
      error: () => alert('Failed to reject service')
    });
  }
}
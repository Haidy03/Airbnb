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

  // Filters
  selectedStatus = signal<string>('PendingApproval');
  searchTerm = signal<string>('');
  pageNumber = signal(1);
  pageSize = 10;

  // Modals
  selectedService = signal<AdminServiceItem | null>(null);
  showApproveModal = signal(false);
  showRejectModal = signal(false);
  showDeleteModal = signal(false);
  rejectionReason = signal('');

  private baseUrl = environment.apiUrl.replace('/api', '');

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadServices();
  }

  loadServices() {
    this.loading.set(true);
    const status = this.selectedStatus() === 'All' ? undefined : this.selectedStatus();
    const search = this.searchTerm() || undefined;

    this.adminService.getAllServices(status, search, this.pageNumber(), this.pageSize).subscribe({
      next: (data) => {
        this.services.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('Failed to load services');
        this.loading.set(false);
      }
    });
  }

  // Filter Actions
  onStatusChange(status: string) {
    this.selectedStatus.set(status);
    this.pageNumber.set(1);
    this.loadServices();
  }

  onSearch() {
    this.pageNumber.set(1);
    this.loadServices();
  }

  // Helpers
  getImageUrl(url?: string): string {
    if (!url) return 'assets/images/placeholder.jpg';
    if (url.startsWith('http')) return url;
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    return `${this.baseUrl}/${cleanUrl}`;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  getStatusBadgeClass(status: string): string {
    const map: {[key: string]: string} = {
      'PendingApproval': 'pendingapproval',
      'Active': 'active',
      'Rejected': 'rejected',
      'Inactive': 'inactive',
      'Draft': 'inactive'
    };
    return map[status] || 'inactive';
  }

  // Actions Logic
  
  // Approve
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
        this.loadServices();
        this.closeApproveModal();
      },
      error: () => alert('Failed to approve service')
    });
  }

  // Reject
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
        this.loadServices();
        this.closeRejectModal();
      },
      error: () => alert('Failed to reject service')
    });
  }

  // Delete
  openDeleteModal(service: AdminServiceItem) {
    this.selectedService.set(service);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.selectedService.set(null);
  }

  deleteService() {
    const service = this.selectedService();
    if (!service) return;

    this.adminService.deleteService(service.id).subscribe({
      next: () => {
        this.services.update(list => list.filter(s => s.id !== service.id));
        this.closeDeleteModal();
      },
      error: () => alert('Failed to delete service')
    });
  }

  // Other Status Changes
  suspendService(service: AdminServiceItem) {
    if(!confirm('Suspend this service?')) return;
    this.adminService.updateServiceStatus(service.id, 'Inactive').subscribe({
      next: () => this.loadServices(),
      error: () => alert('Failed to suspend')
    });
  }

  activateService(service: AdminServiceItem) {
    this.adminService.updateServiceStatus(service.id, 'Active').subscribe({
      next: () => this.loadServices(),
      error: () => alert('Failed to activate')
    });
  }

  moveToPending(service: AdminServiceItem) {
    if(!confirm('Move back to Pending?')) return;
    this.adminService.updateServiceStatus(service.id, 'PendingApproval').subscribe({
      next: () => this.loadServices(),
      error: () => alert('Failed to update status')
    });
  }
}
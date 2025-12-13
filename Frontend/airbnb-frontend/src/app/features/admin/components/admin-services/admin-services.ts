import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../serevices/admin.service';
import { AdminServiceItem } from '../../models/admin.models';
import { environment } from '../../../../../environments/environment';
// تأكد من أن هذا المسار يطابق مكان الخدمة في مشروعك
import { NotificationService } from '../../../../core/services/notification.service'; 

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

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationService // حقن الخدمة
  ) {}

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
        this.notificationService.showToast('error', 'Failed to load services');
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
        this.notificationService.showSuccess('Approved!', 'Service approved successfully');
        this.loadServices();
        this.closeApproveModal();
      },
      error: () => this.notificationService.showToast('error', 'Failed to approve service')
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
    if (!service || !this.rejectionReason().trim()) {
      this.notificationService.showToast('warning', 'Rejection reason is required');
      return;
    }

    this.adminService.rejectService(service.id, this.rejectionReason()).subscribe({
      next: () => {
        this.notificationService.showSuccess('Rejected', 'Service rejected successfully');
        this.loadServices();
        this.closeRejectModal();
      },
      error: () => this.notificationService.showToast('error', 'Failed to reject service')
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
        this.notificationService.showSuccess('Deleted', 'Service deleted successfully');
        this.closeDeleteModal();
      },
      error: () => this.notificationService.showToast('error', 'Failed to delete service')
    });
  }

  // Other Status Changes - Async for confirmations
  async suspendService(service: AdminServiceItem) {
    const confirmed = await this.notificationService.confirmAction(
      'Suspend Service?',
      'Are you sure you want to suspend this service?'
    );
    if(!confirmed) return;

    this.adminService.updateServiceStatus(service.id, 'Inactive').subscribe({
      next: () => {
        this.notificationService.showToast('success', 'Service suspended');
        this.loadServices();
      },
      error: () => this.notificationService.showToast('error', 'Failed to suspend')
    });
  }

  activateService(service: AdminServiceItem) {
    this.adminService.updateServiceStatus(service.id, 'Active').subscribe({
      next: () => {
        this.notificationService.showToast('success', 'Service activated');
        this.loadServices();
      },
      error: () => this.notificationService.showToast('error', 'Failed to activate')
    });
  }

  async moveToPending(service: AdminServiceItem) {
    const confirmed = await this.notificationService.confirmAction(
      'Move to Pending?',
      'Are you sure you want to move this service back to pending?'
    );
    if(!confirmed) return;

    this.adminService.updateServiceStatus(service.id, 'PendingApproval').subscribe({
      next: () => {
        this.notificationService.showToast('success', 'Moved to pending successfully');
        this.loadServices();
      },
      error: () => this.notificationService.showToast('error', 'Failed to update status')
    });
  }
}
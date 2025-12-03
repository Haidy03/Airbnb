import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../serevices/admin.service';
import { AdminProperty } from '../../../models/admin.models';
import { environment } from '../../../../../../environments/environment.development';

@Component({
  selector: 'app-admin-properties',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './properties.component.html',
  styleUrls: ['./properties.component.css']
})
export class AdminPropertiesComponent implements OnInit {
  properties = signal<AdminProperty[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  
  selectedStatus = signal<string>('PendingApproval');
  searchTerm = signal<string>('');
  pageNumber = signal(1);
  pageSize = 10;

  // Modal states
  selectedProperty = signal<AdminProperty | null>(null);
  showApproveModal = signal(false);
  showRejectModal = signal(false);
  showDeleteModal = signal(false);
  rejectionReason = signal('');

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    this.loading.set(true);
    this.error.set(null);

    const status = this.selectedStatus() === 'All' ? undefined : this.selectedStatus();
    const search = this.searchTerm() || undefined;

    this.adminService.getAllProperties(status, search, this.pageNumber(), this.pageSize)
      .subscribe({
        next: (data) => {
          this.properties.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load properties');
          this.loading.set(false);
          console.error('Error loading properties:', err);
        }
      });
  }
  moveToPending(property: AdminProperty): void {
    if(!confirm('Are you sure you want to move this property back to pending approval?')) return;

    // نستخدم دالة updatePropertyStatus الموجودة بالفعل في السيرفس
    this.adminService.updatePropertyStatus(property.id, 'PendingApproval').subscribe({
      next: () => {
        this.loadProperties(); // تحديث القائمة
        this.showNotification('Property moved to pending successfully');
      },
      error: (err) => {
        console.error(err);
        this.showNotification('Failed to update status', 'error');
      }
    });
  }

  onStatusChange(status: string): void {
    this.selectedStatus.set(status);
    this.pageNumber.set(1);
    this.loadProperties();
  }

  onSearch(): void {
    this.pageNumber.set(1);
    this.loadProperties();
  }

  openApproveModal(property: AdminProperty): void {
    this.selectedProperty.set(property);
    this.showApproveModal.set(true);
  }

  closeApproveModal(): void {
    this.showApproveModal.set(false);
    this.selectedProperty.set(null);
  }

  approveProperty(): void {
    const property = this.selectedProperty();
    if (!property) return;

    this.adminService.approveProperty(property.id).subscribe({
      next: () => {
        this.loadProperties();
        this.closeApproveModal();
        this.showNotification('Property approved successfully');
      },
      error: (err) => {
        console.error('Error approving property:', err);
        this.showNotification('Failed to approve property', 'error');
      }
    });
  }

  openRejectModal(property: AdminProperty): void {
    this.selectedProperty.set(property);
    this.showRejectModal.set(true);
    this.rejectionReason.set('');
  }

  closeRejectModal(): void {
    this.showRejectModal.set(false);
    this.selectedProperty.set(null);
    this.rejectionReason.set('');
  }

  rejectProperty(): void {
    const property = this.selectedProperty();
    if (!property || !this.rejectionReason().trim()) {
      this.showNotification('Please provide a rejection reason', 'error');
      return;
    }

    this.adminService.rejectProperty(property.id, this.rejectionReason()).subscribe({
      next: () => {
        this.loadProperties();
        this.closeRejectModal();
        this.showNotification('Property rejected successfully');
      },
      error: (err) => {
        console.error('Error rejecting property:', err);
        this.showNotification('Failed to reject property', 'error');
      }
    });
  }

  suspendProperty(property: AdminProperty): void {
    this.adminService.updatePropertyStatus(property.id, 'Suspended', 'Admin suspended').subscribe({
      next: () => {
        property.status = 'Suspended';
        this.showNotification('Property suspended successfully');
      },
      error: (err) => {
        console.error('Error suspending property:', err);
        this.showNotification('Failed to suspend property', 'error');
      }
    });
  }

  activateProperty(property: AdminProperty): void {
    this.adminService.updatePropertyStatus(property.id, 'Active').subscribe({
      next: () => {
        property.status = 'Active';
        this.showNotification('Property activated successfully');
      },
      error: (err) => {
        console.error('Error activating property:', err);
        this.showNotification('Failed to activate property', 'error');
      }
    });
  }

  openDeleteModal(property: AdminProperty): void {
    this.selectedProperty.set(property);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.selectedProperty.set(null);
  }

  deleteProperty(): void {
    const property = this.selectedProperty();
    if (!property) return;

    this.adminService.deleteProperty(property.id).subscribe({
      next: () => {
        const currentProperties = this.properties();
        this.properties.set(currentProperties.filter(p => p.id !== property.id));
        this.closeDeleteModal();
        this.showNotification('Property deleted successfully');
      },
      error: (err) => {
        console.error('Error deleting property:', err);
        this.showNotification('Failed to delete property', 'error');
      }
    });
  }
  getImageUrl(url: string | undefined): string {
    if (!url) return 'assets/images/placeholder-property.jpg';
    
    if (url.startsWith('http') || url.includes('assets/')) {
      return url;
    }
    const baseUrl = environment.apiUrl.replace('/api', '').replace(/\/$/, '');
    let cleanPath = url.startsWith('/') ? url : `/${url}`;
    
    return `${baseUrl}${cleanPath}`;
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PendingApproval': 'pending',
      'Approved': 'approved',
      'Rejected': 'rejected',
      'Active': 'active',
      'Suspended': 'suspended',
      'Inactive': 'inactive'
    };
    return statusMap[status] || 'default';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  nextPage(): void {
    this.pageNumber.set(this.pageNumber() + 1);
    this.loadProperties();
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.set(this.pageNumber() - 1);
      this.loadProperties();
    }
  }

  private showNotification(message: string, type: 'success' | 'error' = 'success'): void {
    console.log(`${type}: ${message}`);
  }
}
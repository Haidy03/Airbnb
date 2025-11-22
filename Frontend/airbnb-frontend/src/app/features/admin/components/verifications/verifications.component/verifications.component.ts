import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../serevices/admin.service';
import { VerificationRequest } from '../../../models/admin.models';

@Component({
  selector: 'app-admin-verifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verifications.component.html',
  styleUrls: ['./verifications.component.css']
})
export class AdminVerificationsComponent implements OnInit {
  verifications = signal<VerificationRequest[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  selectedStatus = signal<string>('Pending');

  // Modal states
  selectedVerification = signal<VerificationRequest | null>(null);
  showApproveModal = signal(false);
  showRejectModal = signal(false);
  showImageModal = signal(false);
  adminNotes = signal('');
  rejectionReason = signal('');

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadVerifications();
  }

  loadVerifications(): void {
    this.loading.set(true);
    this.error.set(null);

    const status = this.selectedStatus() === 'All' ? undefined : this.selectedStatus();

    this.adminService.getAllVerifications(status).subscribe({
      next: (data) => {
        this.verifications.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load verifications');
        this.loading.set(false);
        console.error('Error loading verifications:', err);
      }
    });
  }

  onStatusChange(status: string): void {
    this.selectedStatus.set(status);
    this.loadVerifications();
  }

  openImageModal(verification: VerificationRequest): void {
    this.selectedVerification.set(verification);
    this.showImageModal.set(true);
  }

  closeImageModal(): void {
    this.showImageModal.set(false);
    this.selectedVerification.set(null);
  }

  openApproveModal(verification: VerificationRequest): void {
    this.selectedVerification.set(verification);
    this.showApproveModal.set(true);
    this.adminNotes.set('');
  }

  closeApproveModal(): void {
    this.showApproveModal.set(false);
    this.selectedVerification.set(null);
    this.adminNotes.set('');
  }

  approveVerification(): void {
    const verification = this.selectedVerification();
    if (!verification) return;

    this.adminService.approveVerification(verification.id, this.adminNotes()).subscribe({
      next: () => {
        this.loadVerifications();
        this.closeApproveModal();
        this.showNotification('Verification approved successfully');
      },
      error: (err) => {
        console.error('Error approving verification:', err);
        this.showNotification('Failed to approve verification', 'error');
      }
    });
  }

  openRejectModal(verification: VerificationRequest): void {
    this.selectedVerification.set(verification);
    this.showRejectModal.set(true);
    this.rejectionReason.set('');
    this.adminNotes.set('');
  }

  closeRejectModal(): void {
    this.showRejectModal.set(false);
    this.selectedVerification.set(null);
    this.rejectionReason.set('');
    this.adminNotes.set('');
  }

  rejectVerification(): void {
    const verification = this.selectedVerification();
    if (!verification || !this.rejectionReason().trim()) {
      this.showNotification('Please provide a rejection reason', 'error');
      return;
    }

    this.adminService.rejectVerification(
      verification.id,
      this.rejectionReason(),
      this.adminNotes()
    ).subscribe({
      next: () => {
        this.loadVerifications();
        this.closeRejectModal();
        this.showNotification('Verification rejected successfully');
      },
      error: (err) => {
        console.error('Error rejecting verification:', err);
        this.showNotification('Failed to reject verification', 'error');
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    return status.toLowerCase();
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private showNotification(message: string, type: 'success' | 'error' = 'success'): void {
    console.log(`${type}: ${message}`);
  }
}
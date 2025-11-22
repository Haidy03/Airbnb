import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../serevices/admin.service';
import { AdminBooking } from '../../../models/admin.models';

@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.css']
})
export class AdminBookingsComponent implements OnInit {
  bookings = signal<AdminBooking[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  
  selectedStatus = signal<string>('All');
  startDate = signal<string>('');
  endDate = signal<string>('');
  pageNumber = signal(1);
  pageSize = 10;

  // Modal states
  selectedBooking = signal<AdminBooking | null>(null);
  showCancelModal = signal(false);
  showRefundModal = signal(false);
  cancelReason = signal('');
  refundAmount = signal<number>(0);
  refundReason = signal('');

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading.set(true);
    this.error.set(null);

    const status = this.selectedStatus() === 'All' ? undefined : this.selectedStatus();
    const start = this.startDate() ? new Date(this.startDate()) : undefined;
    const end = this.endDate() ? new Date(this.endDate()) : undefined;

    this.adminService.getAllBookings(status, start, end, this.pageNumber(), this.pageSize)
      .subscribe({
        next: (data) => {
          this.bookings.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load bookings');
          this.loading.set(false);
          console.error('Error loading bookings:', err);
        }
      });
  }

  onStatusChange(status: string): void {
    this.selectedStatus.set(status);
    this.pageNumber.set(1);
    this.loadBookings();
  }

  onDateFilter(): void {
    this.pageNumber.set(1);
    this.loadBookings();
  }

  clearDateFilter(): void {
    this.startDate.set('');
    this.endDate.set('');
    this.loadBookings();
  }

  openCancelModal(booking: AdminBooking): void {
    this.selectedBooking.set(booking);
    this.showCancelModal.set(true);
    this.cancelReason.set('');
  }

  closeCancelModal(): void {
    this.showCancelModal.set(false);
    this.selectedBooking.set(null);
    this.cancelReason.set('');
  }

  cancelBooking(): void {
    const booking = this.selectedBooking();
    if (!booking || !this.cancelReason().trim()) {
      this.showNotification('Please provide a cancellation reason', 'error');
      return;
    }

    this.adminService.cancelBooking(booking.id, this.cancelReason()).subscribe({
      next: () => {
        this.loadBookings();
        this.closeCancelModal();
        this.showNotification('Booking cancelled successfully');
      },
      error: (err) => {
        console.error('Error cancelling booking:', err);
        this.showNotification('Failed to cancel booking', 'error');
      }
    });
  }

  openRefundModal(booking: AdminBooking): void {
    this.selectedBooking.set(booking);
    this.showRefundModal.set(true);
    this.refundAmount.set(booking.totalPrice);
    this.refundReason.set('');
  }

  closeRefundModal(): void {
    this.showRefundModal.set(false);
    this.selectedBooking.set(null);
    this.refundAmount.set(0);
    this.refundReason.set('');
  }

  processRefund(): void {
    const booking = this.selectedBooking();
    if (!booking || !this.refundReason().trim()) {
      this.showNotification('Please provide a refund reason', 'error');
      return;
    }

    if (this.refundAmount() <= 0 || this.refundAmount() > booking.totalPrice) {
      this.showNotification('Invalid refund amount', 'error');
      return;
    }

    this.adminService.refundBooking(booking.id, this.refundAmount(), this.refundReason()).subscribe({
      next: () => {
        this.loadBookings();
        this.closeRefundModal();
        this.showNotification('Refund processed successfully');
      },
      error: (err) => {
        console.error('Error processing refund:', err);
        this.showNotification('Failed to process refund', 'error');
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Pending': 'pending',
      'Confirmed': 'confirmed',
      'Completed': 'completed',
      'Cancelled': 'cancelled'
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

  calculateNights(checkIn: Date, checkOut: Date): number {
    const diffTime = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  nextPage(): void {
    this.pageNumber.set(this.pageNumber() + 1);
    this.loadBookings();
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.set(this.pageNumber() - 1);
      this.loadBookings();
    }
  }

  private showNotification(message: string, type: 'success' | 'error' = 'success'): void {
    console.log(`${type}: ${message}`);
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header';
import { BookingService, Booking } from '../../services/booking.service'; // استيراد السيرفس الجديدة
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent],
  templateUrl: './trips.html',
  styleUrls: ['./trips.css']
})
export class TripsComponent implements OnInit {

  activeTab: 'upcoming' | 'past' | 'cancelled' = 'upcoming';
  isLoading = true;

  // المصفوفات الثلاثة
  upcomingTrips: Booking[] = [];
  pastTrips: Booking[] = [];
  cancelledTrips: Booking[] = [];

  constructor(
    private bookingService: BookingService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadTrips();
  }

  loadTrips() {
    this.isLoading = true;
    this.bookingService.getMyTrips().subscribe({
      next: (bookings) => {
        this.categorizeTrips(bookings);
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  private categorizeTrips(bookings: Booking[]) {
    const today = new Date();

    this.upcomingTrips = bookings.filter(b =>
      b.status !== 'Cancelled' && new Date(b.checkInDate) >= today
    );

    this.pastTrips = bookings.filter(b =>
      b.status === 'Completed' || (b.status !== 'Cancelled' && new Date(b.checkInDate) < today)
    );

    this.cancelledTrips = bookings.filter(b => b.status === 'Cancelled');
  }

  setActiveTab(tab: 'upcoming' | 'past' | 'cancelled') {
    this.activeTab = tab;
  }

  // دالة لإلغاء الحجز (لو حبيت تضيف زرار Cancel)
  cancelBooking(id: number) {
    if(confirm('Are you sure you want to cancel this trip?')) {
      this.bookingService.cancelTrip(id).subscribe({
        next: () => {
          this.toastService.showSuccess('Trip cancelled successfully');
          this.loadTrips(); // إعادة التحميل لتحديث القوائم
        },
        error: () => this.toastService.showError('Failed to cancel trip')
      });
    }
  }

  // دالة مساعدة لمعرفة القائمة الحالية للعرض في الـ HTML
  get currentTrips(): Booking[] {
    if (this.activeTab === 'upcoming') return this.upcomingTrips;
    if (this.activeTab === 'past') return this.pastTrips;
    return this.cancelledTrips;
  }
}

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { BookingService } from '../../services/booking';
import { Booking, BookingStatus } from '../../models/booking.model';

@Component({
  selector: 'app-host-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './host-dashboard.html',
  styleUrls: ['./host-dashboard.css']
})
export class HostDashboardComponent implements OnInit {
  // Active tab: 'today' or 'upcoming'
  activeTab = signal<'today' | 'upcoming'>('today');
  
  // Bookings data
  todayBookings = signal<Booking[]>([]);
  upcomingBookings = signal<Booking[]>([]);
  loading = signal<boolean>(true);

  constructor(
    private bookingService: BookingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTodayBookings();
  }

  /**
   * Switch between Today and Upcoming tabs
   */
  setActiveTab(tab: 'today' | 'upcoming'): void {
    this.activeTab.set(tab);
    if (tab === 'upcoming') {
      this.loadUpcomingBookings();
    }
  }

  /**
   * Load today's bookings (check-ins and check-outs)
   */
  loadTodayBookings(): void {
    this.loading.set(true);
    
    this.bookingService.getAllBookings().subscribe({
      next: (bookings) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Filter bookings for today (check-ins or check-outs)
        const todayBookings = bookings.filter(booking => {
          const checkIn = new Date(booking.checkInDate);
          const checkOut = new Date(booking.checkOutDate);
          checkIn.setHours(0, 0, 0, 0);
          checkOut.setHours(0, 0, 0, 0);
          
          return (checkIn.getTime() === today.getTime() || 
                  checkOut.getTime() === today.getTime()) &&
                 (booking.status === BookingStatus.CONFIRMED || 
                  booking.status === BookingStatus.CHECKED_IN);
        });

        this.todayBookings.set(todayBookings);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading bookings:', err);
        this.loading.set(false);
      }
    });
  }

  /**
   * Load upcoming bookings
   */
  loadUpcomingBookings(): void {
    this.loading.set(true);
    
    this.bookingService.getUpcomingBookings().subscribe({
      next: (bookings) => {
        this.upcomingBookings.set(bookings);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading upcoming bookings:', err);
        this.loading.set(false);
      }
    });
  }

  /**
   * Navigate to complete listing
   */
  completeYourListing(): void {
    this.router.navigate(['/host/properties/add']);
  }

  /**
   * Get booking event type
   */
  getEventType(booking: Booking): 'check-in' | 'check-out' {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkIn = new Date(booking.checkInDate);
    checkIn.setHours(0, 0, 0, 0);
    
    return checkIn.getTime() === today.getTime() ? 'check-in' : 'check-out';
  }

  /**
   * Format date
   */
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }

  /**
   * Format date range
   */
  formatDateRange(checkIn: Date, checkOut: Date): string {
    const checkInFormatted = this.formatDate(checkIn);
    const checkOutFormatted = this.formatDate(checkOut);
    return `${checkInFormatted} - ${checkOutFormatted}`;
  }
}
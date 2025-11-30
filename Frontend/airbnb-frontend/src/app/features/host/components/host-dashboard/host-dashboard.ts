import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { BookingService, Booking } from '../../services/booking';

@Component({
  selector: 'app-host-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './host-dashboard.html',
  styleUrls: ['./host-dashboard.css']
})
export class HostDashboardComponent implements OnInit {
  // Active tab: 'today' or 'upcoming'
  activeTab = signal<'today' | 'upcoming' >('today');  
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
    } else if (tab === 'today') {
      this.loadTodayBookings();
    }
  }

  /**
   * ✅ Load today's bookings (check-ins and check-outs)
   */
  loadTodayBookings(): void {
    this.loading.set(true);
    
    this.bookingService.getTodayBookings().subscribe({
      next: (bookings) => {
        this.todayBookings.set(bookings);
        this.loading.set(false);
        console.log('✅ Today bookings loaded:', bookings.length);
      },
      error: (err) => {
        console.error('Error loading today bookings:', err);
        this.loading.set(false);
      }
    });
  }
  /**
 * Open chat with specific guest
 */
openChat(booking: Booking): void {
  this.router.navigate(['/host/messages'], {
    queryParams: {
      guestId: booking.guestId,
      propertyId: booking.propertyId,
      bookingId: booking.id,
      autoOpen: 'true' // ✅ علامة لفتح الشات تلقائياً
    }
  });
}

  /**
   * ✅ Load upcoming bookings
   */
  loadUpcomingBookings(): void {
    this.loading.set(true);
    
    this.bookingService.getUpcomingBookings().subscribe({
      next: (bookings) => {
        this.upcomingBookings.set(bookings);
        this.loading.set(false);
        console.log('✅ Upcoming bookings loaded:', bookings.length);
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
    this.router.navigate(['/host/properties/intro']);
  }

  /**
   * Get booking event type (check-in or check-out)
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

  /**
 * Get check-in or check-out time for display
 */
getCheckInOutTime(booking: Booking): string {
  // Default times if not provided
  const checkInTime = '3:00 PM';
  const checkOutTime = '11:00 AM';
  
  return this.getEventType(booking) === 'check-in' ? checkInTime : checkOutTime;
}
}

import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { 
  Booking, 
  BookingStatus, 
  BookingFilters,
  BookingActionDto,
  BookingResponse,
  BookingStats,
  CalendarBooking,
  PaymentStatus
} from '../models/booking.model';
import { MOCK_BOOKINGS } from '../models/mock-data';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  // Reactive state with signals
  private bookingsSignal = signal<Booking[]>([...MOCK_BOOKINGS]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  // Public readonly signals
  readonly bookings = this.bookingsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor() {
    this.loadBookings();
  }

  /**
   * Load all bookings
   */
  loadBookings(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    setTimeout(() => {
      this.bookingsSignal.set([...MOCK_BOOKINGS]);
      this.loadingSignal.set(false);
    }, 500);
  }

  /**
   * Get all bookings
   */
  getAllBookings(): Observable<Booking[]> {
    this.loadingSignal.set(true);
    
    return of([...MOCK_BOOKINGS]).pipe(
      delay(300),
      map(bookings => {
        this.loadingSignal.set(false);
        return bookings;
      })
    );
  }

  /**
   * Get booking by ID
   */
  getBookingById(id: string): Observable<Booking | undefined> {
    this.loadingSignal.set(true);
    
    return of(MOCK_BOOKINGS.find(b => b.id === id)).pipe(
      delay(300),
      map(booking => {
        this.loadingSignal.set(false);
        if (!booking) {
          this.errorSignal.set('Booking not found');
        }
        return booking;
      })
    );
  }

  /**
   * Get filtered bookings
   */
  getFilteredBookings(filters: BookingFilters): Observable<Booking[]> {
    this.loadingSignal.set(true);
    
    let filtered = [...MOCK_BOOKINGS];

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(b => filters.status!.includes(b.status));
    }

    // Apply property filter
    if (filters.propertyId) {
      filtered = filtered.filter(b => b.propertyId === filters.propertyId);
    }

    // Apply date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(b => b.checkInDate >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(b => b.checkOutDate <= filters.dateTo!);
    }

    // Apply guest name search
    if (filters.guestName) {
      const query = filters.guestName.toLowerCase();
      filtered = filtered.filter(b => 
        b.guestName.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (filters.sortBy) {
          case 'checkInDate':
            aValue = a.checkInDate.getTime();
            bValue = b.checkInDate.getTime();
            break;
          case 'bookedAt':
            aValue = a.bookedAt.getTime();
            bValue = b.bookedAt.getTime();
            break;
          case 'total':
            aValue = a.pricing.total;
            bValue = b.pricing.total;
            break;
          default:
            return 0;
        }

        const order = filters.sortOrder === 'desc' ? -1 : 1;
        return (aValue - bValue) * order;
      });
    }

    return of(filtered).pipe(
      delay(300),
      map(bookings => {
        this.loadingSignal.set(false);
        return bookings;
      })
    );
  }

  /**
   * Get bookings by status
   */
  getBookingsByStatus(status: BookingStatus): Observable<Booking[]> {
    return this.getFilteredBookings({ status: [status] });
  }

  /**
   * Get upcoming bookings (confirmed and within next 30 days)
   */
  getUpcomingBookings(): Observable<Booking[]> {
    const today = new Date();
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const upcoming = MOCK_BOOKINGS.filter(b => 
      (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.PENDING) &&
      b.checkInDate >= today &&
      b.checkInDate <= thirtyDaysLater
    );

    return of(upcoming).pipe(delay(300));
  }

  /**
   * Get pending bookings (requiring action)
   */
  getPendingBookings(): Observable<Booking[]> {
    return this.getBookingsByStatus(BookingStatus.PENDING);
  }

  /**
   * Get current guests (checked in)
   */
  getCurrentGuests(): Observable<Booking[]> {
    return this.getBookingsByStatus(BookingStatus.CHECKED_IN);
  }

  /**
   * Approve booking
   */
  approveBooking(bookingId: string): Observable<BookingResponse> {
    this.loadingSignal.set(true);
    
    const current = this.bookingsSignal();
    const index = current.findIndex(b => b.id === bookingId);

    if (index === -1) {
      return throwError(() => new Error('Booking not found'));
    }

    const updatedBooking: Booking = {
      ...current[index],
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      updatedAt: new Date()
    };

    return of({
      success: true,
      message: 'Booking approved successfully',
      booking: updatedBooking
    }).pipe(
      delay(500),
      map(response => {
        const updated = [...current];
        updated[index] = updatedBooking;
        this.bookingsSignal.set(updated);
        this.loadingSignal.set(false);
        return response;
      })
    );
  }

  /**
   * Decline booking
   */
  declineBooking(bookingId: string, reason?: string): Observable<BookingResponse> {
    this.loadingSignal.set(true);
    
    const current = this.bookingsSignal();
    const index = current.findIndex(b => b.id === bookingId);

    if (index === -1) {
      return throwError(() => new Error('Booking not found'));
    }

    const updatedBooking: Booking = {
      ...current[index],
      status: BookingStatus.DECLINED,
      cancelledBy: 'host',
      cancellationReason: reason,
      cancelledAt: new Date(),
      updatedAt: new Date()
    };

    return of({
      success: true,
      message: 'Booking declined',
      booking: updatedBooking
    }).pipe(
      delay(500),
      map(response => {
        const updated = [...current];
        updated[index] = updatedBooking;
        this.bookingsSignal.set(updated);
        this.loadingSignal.set(false);
        return response;
      })
    );
  }

  /**
   * Cancel booking
   */
  cancelBooking(bookingId: string, reason?: string): Observable<BookingResponse> {
    this.loadingSignal.set(true);
    
    const current = this.bookingsSignal();
    const index = current.findIndex(b => b.id === bookingId);

    if (index === -1) {
      return throwError(() => new Error('Booking not found'));
    }

    const booking = current[index];
    const refundAmount = this.calculateRefund(booking);

    const updatedBooking: Booking = {
      ...booking,
      status: BookingStatus.CANCELLED,
      cancelledBy: 'host',
      cancellationReason: reason,
      cancelledAt: new Date(),
      refundAmount,
      paymentStatus: refundAmount > 0 ? PaymentStatus.PARTIALLY_REFUNDED : booking.paymentStatus,
      updatedAt: new Date()
    };

    return of({
      success: true,
      message: `Booking cancelled. Refund: $${refundAmount}`,
      booking: updatedBooking
    }).pipe(
      delay(500),
      map(response => {
        const updated = [...current];
        updated[index] = updatedBooking;
        this.bookingsSignal.set(updated);
        this.loadingSignal.set(false);
        return response;
      })
    );
  }

  /**
   * Calculate refund based on cancellation policy
   */
  private calculateRefund(booking: Booking): number {
    const today = new Date();
    const daysUntilCheckIn = Math.floor(
      (booking.checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Simple cancellation policy
    if (daysUntilCheckIn >= 14) {
      return booking.pricing.total; // Full refund
    } else if (daysUntilCheckIn >= 7) {
      return booking.pricing.total * 0.5; // 50% refund
    } else {
      return 0; // No refund
    }
  }

  /**
   * Mark booking as checked in
   */
  checkIn(bookingId: string): Observable<BookingResponse> {
    const current = this.bookingsSignal();
    const index = current.findIndex(b => b.id === bookingId);

    if (index === -1) {
      return throwError(() => new Error('Booking not found'));
    }

    const updatedBooking: Booking = {
      ...current[index],
      status: BookingStatus.CHECKED_IN,
      actualCheckInTime: new Date(),
      updatedAt: new Date()
    };

    return of({
      success: true,
      message: 'Guest checked in',
      booking: updatedBooking
    }).pipe(
      delay(300),
      map(response => {
        const updated = [...current];
        updated[index] = updatedBooking;
        this.bookingsSignal.set(updated);
        return response;
      })
    );
  }

  /**
   * Mark booking as checked out
   */
  checkOut(bookingId: string): Observable<BookingResponse> {
    const current = this.bookingsSignal();
    const index = current.findIndex(b => b.id === bookingId);

    if (index === -1) {
      return throwError(() => new Error('Booking not found'));
    }

    const updatedBooking: Booking = {
      ...current[index],
      status: BookingStatus.CHECKED_OUT,
      actualCheckOutTime: new Date(),
      updatedAt: new Date()
    };

    return of({
      success: true,
      message: 'Guest checked out',
      booking: updatedBooking
    }).pipe(
      delay(300),
      map(response => {
        const updated = [...current];
        updated[index] = updatedBooking;
        this.bookingsSignal.set(updated);
        return response;
      })
    );
  }

  /**
   * Get bookings for calendar view
   */
  getCalendarBookings(propertyId?: string): Observable<CalendarBooking[]> {
    let bookings = [...MOCK_BOOKINGS];
    
    if (propertyId) {
      bookings = bookings.filter(b => b.propertyId === propertyId);
    }

    const calendarBookings: CalendarBooking[] = bookings.map(b => ({
      id: b.id,
      propertyId: b.propertyId,
      guestName: b.guestName,
      checkInDate: b.checkInDate,
      checkOutDate: b.checkOutDate,
      status: b.status,
      pricing: {
        total: b.pricing.total,
        currency: b.pricing.currency
      }
    }));

    return of(calendarBookings).pipe(delay(300));
  }

  /**
   * Get booking statistics
   */
  getBookingStats(): Observable<BookingStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const stats: BookingStats = {
      todayCheckIns: MOCK_BOOKINGS.filter(b => 
        b.checkInDate >= today && b.checkInDate < tomorrow
      ).length,
      todayCheckOuts: MOCK_BOOKINGS.filter(b => 
        b.checkOutDate >= today && b.checkOutDate < tomorrow
      ).length,
      currentGuests: MOCK_BOOKINGS.filter(b => 
        b.status === BookingStatus.CHECKED_IN
      ).length,
      upcomingBookings: MOCK_BOOKINGS.filter(b => 
        b.status === BookingStatus.CONFIRMED && b.checkInDate >= today
      ).length,
      pendingApprovals: MOCK_BOOKINGS.filter(b => 
        b.status === BookingStatus.PENDING
      ).length,
      thisMonthBookings: MOCK_BOOKINGS.filter(b => 
        b.checkInDate >= thisMonth && b.checkInDate < nextMonth
      ).length,
      thisMonthEarnings: MOCK_BOOKINGS
        .filter(b => b.checkInDate >= thisMonth && b.checkInDate < nextMonth)
        .reduce((sum, b) => sum + b.pricing.hostEarnings, 0),
      nextMonthBookings: MOCK_BOOKINGS.filter(b => 
        b.checkInDate >= nextMonth
      ).length,
      occupancyRate: 76 // This would be calculated based on available vs booked nights
    };

    return of(stats).pipe(delay(300));
  }

  /**
   * Mark message as read
   */
  markMessagesRead(bookingId: string): Observable<boolean> {
    const current = this.bookingsSignal();
    const index = current.findIndex(b => b.id === bookingId);

    if (index === -1) {
      return of(false);
    }

    const updated = [...current];
    updated[index] = { ...updated[index], hasUnreadMessages: false };
    this.bookingsSignal.set(updated);

    return of(true).pipe(delay(200));
  }

  /**
   * Get bookings by property
   */
  getBookingsByProperty(propertyId: string): Observable<Booking[]> {
    return this.getFilteredBookings({ propertyId });
  }
}
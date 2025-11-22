import { Injectable } from '@angular/core';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import {
  Booking,
  CreateBookingDto,
  UpdateBookingDto,
  BookingResponse,
  BookingStatus,
  PaymentStatus,
  PaymentMethod,
  BookingFilters,
  GuestBookingStats,
  PriceBreakdown
} from '../models/booking_model';

@Injectable({
  providedIn: 'root'
})
export class BookingService {

  // Mock bookings storage
  private bookings: Booking[] = [];
  private bookingsSubject = new BehaviorSubject<Booking[]>([]);
  public bookings$ = this.bookingsSubject.asObservable();

  // Current booking being created
  private currentBookingSubject = new BehaviorSubject<Booking | null>(null);
  public currentBooking$ = this.currentBookingSubject.asObservable();

  constructor() {
    this.loadMockBookings();
  }

  /**
   * Load mock bookings for testing
   */
  private loadMockBookings(): void {
    this.bookings = [
      {
        id: 'booking-1',
        guestId: 'user-123',
        guestName: 'Ahmed Mohamed',
        guestEmail: 'ahmed@example.com',
        guestPhone: '+20 123 456 7890',
        property: {
          id: 'property-1',
          title: 'Amigos Lunarena studio with Roof Terrace 304',
          address: 'Dahab Center',
          city: 'Dahab',
          country: 'Egypt',
          image: 'https://example.com/property1.jpg',
          hostId: 'host-1',
          hostName: 'Karen',
          hostImage: 'https://i.pravatar.cc/150?img=5'
        },
        checkIn: new Date('2026-02-13'),
        checkOut: new Date('2026-02-15'),
        guests: {
          adults: 1,
          children: 0,
          infants: 0,
          pets: 0
        },
        pricing: {
          pricePerNight: 1703.55,
          numberOfNights: 2,
          basePrice: 3407.10,
          cleaningFee: 0,
          serviceFee: 476.99,
          tax: 169.32,
          totalPrice: 4053.41,
          currency: 'EGP'
        },
        status: BookingStatus.CONFIRMED,
        payment: {
          method: PaymentMethod.CREDIT_CARD,
          status: PaymentStatus.PAID,
          transactionId: 'txn-123456',
          paidAt: new Date('2026-02-01')
        },
        createdAt: new Date('2026-02-01'),
        updatedAt: new Date('2026-02-01')
      }
    ];

    this.bookingsSubject.next(this.bookings);
  }

  /**
   * Calculate price breakdown
   */
  calculatePrice(
    pricePerNight: number,
    checkIn: Date,
    checkOut: Date,
    cleaningFee: number = 0,
    serviceFeePercent: number = 14,
    taxPercent: number = 5,
    currency: string = 'EGP'
  ): PriceBreakdown {
    // Calculate number of nights
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    const numberOfNights = Math.ceil(timeDiff / (1000 * 3600 * 24));

    // Base price
    const basePrice = pricePerNight * numberOfNights;

    // Service fee (percentage of base price)
    const serviceFee = basePrice * (serviceFeePercent / 100);

    // Tax (percentage of base + service fee)
    const taxableAmount = basePrice + serviceFee;
    const tax = taxableAmount * (taxPercent / 100);

    // Long stay discount (7+ nights = 10% off)
    let discount = 0;
    if (numberOfNights >= 7) {
      discount = basePrice * 0.1;
    } else if (numberOfNights >= 28) {
      discount = basePrice * 0.15; // 15% for monthly stays
    }

    // Total price
    const totalPrice = basePrice + cleaningFee + serviceFee + tax - discount;

    return {
      pricePerNight,
      numberOfNights,
      basePrice,
      cleaningFee,
      serviceFee,
      tax,
      discount: discount > 0 ? discount : undefined,
      totalPrice,
      currency
    };
  }

  /**
   * Create new booking
   */
  createBooking(bookingData: CreateBookingDto, pricing: PriceBreakdown): Observable<BookingResponse> {
    // Simulate API delay
    return of(null).pipe(
      delay(1500),
      map(() => {
        // Generate unique ID
        const bookingId = `booking-${Date.now()}`;

        // Create booking object
        const newBooking: Booking = {
          id: bookingId,
          guestId: 'current-user-id', // Would come from auth service
          guestName: 'Current User',
          guestEmail: 'user@example.com',
          property: {
            id: bookingData.propertyId,
            title: 'Property Title', // Would come from property data
            address: 'Property Address',
            city: 'City',
            country: 'Country',
            image: 'property-image.jpg',
            hostId: 'host-id',
            hostName: 'Host Name'
          },
          checkIn: new Date(bookingData.checkIn),
          checkOut: new Date(bookingData.checkOut),
          guests: bookingData.guests,
          pricing,
          status: BookingStatus.PENDING,
          payment: {
            method: bookingData.paymentMethod,
            status: PaymentStatus.PENDING
          },
          messageToHost: bookingData.messageToHost,
          specialRequests: bookingData.specialRequests,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Add to bookings array
        this.bookings.push(newBooking);
        this.bookingsSubject.next(this.bookings);

        // Set as current booking
        this.currentBookingSubject.next(newBooking);

        return {
          success: true,
          message: 'Booking created successfully',
          booking: newBooking
        };
      })
    );
  }

  /**
   * Get booking by ID
   */
  getBookingById(bookingId: string): Observable<Booking | null> {
    return of(null).pipe(
      delay(500),
      map(() => {
        const booking = this.bookings.find(b => b.id === bookingId);
        return booking || null;
      })
    );
  }

  /**
   * Get all bookings for current user
   */
  getUserBookings(filters?: BookingFilters): Observable<Booking[]> {
    return of(null).pipe(
      delay(800),
      map(() => {
        let filteredBookings = [...this.bookings];

        if (filters) {
          // Filter by status
          if (filters.status) {
            const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
            filteredBookings = filteredBookings.filter(b => statuses.includes(b.status));
          }

          // Filter by date range
          if (filters.startDate) {
            filteredBookings = filteredBookings.filter(
              b => new Date(b.checkIn) >= filters.startDate!
            );
          }

          if (filters.endDate) {
            filteredBookings = filteredBookings.filter(
              b => new Date(b.checkOut) <= filters.endDate!
            );
          }

          // Filter by property
          if (filters.propertyId) {
            filteredBookings = filteredBookings.filter(
              b => b.property.id === filters.propertyId
            );
          }

          // Filter by price range
          if (filters.minPrice) {
            filteredBookings = filteredBookings.filter(
              b => b.pricing.totalPrice >= filters.minPrice!
            );
          }

          if (filters.maxPrice) {
            filteredBookings = filteredBookings.filter(
              b => b.pricing.totalPrice <= filters.maxPrice!
            );
          }
        }

        // Sort by creation date (newest first)
        return filteredBookings.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      })
    );
  }

  /**
   * Update booking
   */
  updateBooking(bookingId: string, updates: UpdateBookingDto): Observable<BookingResponse> {
    return of(null).pipe(
      delay(1000),
      map(() => {
        const bookingIndex = this.bookings.findIndex(b => b.id === bookingId);

        if (bookingIndex === -1) {
          throw new Error('Booking not found');
        }

        const booking = this.bookings[bookingIndex];

        // Update booking
        const updatedBooking: Booking = {
          ...booking,
          checkIn: updates.checkIn ? new Date(updates.checkIn) : booking.checkIn,
          checkOut: updates.checkOut ? new Date(updates.checkOut) : booking.checkOut,
          guests: updates.guests || booking.guests,
          messageToHost: updates.messageToHost || booking.messageToHost,
          specialRequests: updates.specialRequests || booking.specialRequests,
          updatedAt: new Date()
        };

        this.bookings[bookingIndex] = updatedBooking;
        this.bookingsSubject.next(this.bookings);

        return {
          success: true,
          message: 'Booking updated successfully',
          booking: updatedBooking
        };
      })
    );
  }

  /**
   * Cancel booking
   */
  cancelBooking(bookingId: string, reason?: string): Observable<BookingResponse> {
    return of(null).pipe(
      delay(1000),
      map(() => {
        const bookingIndex = this.bookings.findIndex(b => b.id === bookingId);

        if (bookingIndex === -1) {
          throw new Error('Booking not found');
        }

        const booking = this.bookings[bookingIndex];

        // Update status to cancelled
        const cancelledBooking: Booking = {
          ...booking,
          status: BookingStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: reason,
          updatedAt: new Date()
        };

        this.bookings[bookingIndex] = cancelledBooking;
        this.bookingsSubject.next(this.bookings);

        return {
          success: true,
          message: 'Booking cancelled successfully',
          booking: cancelledBooking
        };
      })
    );
  }

  /**
   * Complete payment
   */
  completePayment(bookingId: string, paymentMethod: PaymentMethod): Observable<BookingResponse> {
    return of(null).pipe(
      delay(2000), // Simulate payment processing
      map(() => {
        const bookingIndex = this.bookings.findIndex(b => b.id === bookingId);

        if (bookingIndex === -1) {
          throw new Error('Booking not found');
        }

        const booking = this.bookings[bookingIndex];

        // Update payment status
        const paidBooking: Booking = {
          ...booking,
          status: BookingStatus.CONFIRMED,
          payment: {
            method: paymentMethod,
            status: PaymentStatus.PAID,
            transactionId: `txn-${Date.now()}`,
            paidAt: new Date()
          },
          updatedAt: new Date()
        };

        this.bookings[bookingIndex] = paidBooking;
        this.bookingsSubject.next(this.bookings);

        return {
          success: true,
          message: 'Payment completed successfully',
          booking: paidBooking
        };
      })
    );
  }

  /**
   * Get booking statistics
   */
  getBookingStats(): Observable<GuestBookingStats> {
    return of(null).pipe(
      delay(500),
      map(() => {
        const totalBookings = this.bookings.length;
        const upcomingBookings = this.bookings.filter(
          b => b.status === BookingStatus.CONFIRMED && new Date(b.checkIn) > new Date()
        ).length;
        const completedBookings = this.bookings.filter(
          b => b.status === BookingStatus.COMPLETED
        ).length;
        const cancelledBookings = this.bookings.filter(
          b => b.status === BookingStatus.CANCELLED
        ).length;
        const totalSpent = this.bookings
          .filter(b => b.payment.status === PaymentStatus.PAID)
          .reduce((sum, b) => sum + b.pricing.totalPrice, 0);

        return {
          totalBookings,
          upcomingBookings,
          completedBookings,
          cancelledBookings,
          totalSpent
        };
      })
    );
  }

  /**
   * Check if dates are available
   */
  checkAvailability(propertyId: string, checkIn: Date, checkOut: Date): Observable<boolean> {
    return of(null).pipe(
      delay(500),
      map(() => {
        // Check if any confirmed booking overlaps with requested dates
        const hasConflict = this.bookings.some(booking => {
          if (booking.property.id !== propertyId) return false;
          if (booking.status === BookingStatus.CANCELLED) return false;

          const bookingStart = new Date(booking.checkIn);
          const bookingEnd = new Date(booking.checkOut);

          // Check for overlap
          return (
            (checkIn >= bookingStart && checkIn < bookingEnd) ||
            (checkOut > bookingStart && checkOut <= bookingEnd) ||
            (checkIn <= bookingStart && checkOut >= bookingEnd)
          );
        });

        return !hasConflict;
      })
    );
  }

  /**
   * Get blocked dates for a property
   */
  getBlockedDates(propertyId: string): Observable<Date[]> {
    return of(null).pipe(
      delay(500),
      map(() => {
        const blockedDates: Date[] = [];

        // Get all confirmed bookings for this property
        const confirmedBookings = this.bookings.filter(
          b => b.property.id === propertyId &&
          b.status !== BookingStatus.CANCELLED
        );

        // Add all dates in booking ranges
        confirmedBookings.forEach(booking => {
          const start = new Date(booking.checkIn);
          const end = new Date(booking.checkOut);

          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            blockedDates.push(new Date(d));
          }
        });

        return blockedDates;
      })
    );
  }

  /**
   * Clear current booking
   */
  clearCurrentBooking(): void {
    this.currentBookingSubject.next(null);
  }

  /**
   * Get current booking
   */
  getCurrentBooking(): Booking | null {
    return this.currentBookingSubject.value;
  }
}

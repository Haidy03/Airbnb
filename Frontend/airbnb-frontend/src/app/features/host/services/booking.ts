import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

// Booking Interface
export interface Booking {
  id: number;
  propertyId: number;
  propertyTitle: string;
  propertyImage: string;
  type: 'Property' | 'Experience' | 'Service';
  // Guest Information
  guestId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  guestProfileImage?: string;
  
  // Dates
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
  numberOfNights: number;
  
  // Pricing
  pricePerNight: number;
  cleaningFee: number;
  totalPrice: number;
  
  // Status
  status: string; // 'Pending', 'Confirmed', 'Cancelled', 'Completed'
  
  // Additional
  specialRequests?: string;
  createdAt: Date;
  confirmedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = `${environment.apiUrl}/host/booking`;
  
  // Reactive state
  private bookingsSignal = signal<Booking[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  // Public readonly signals
  readonly bookings = this.bookingsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor(private http: HttpClient) {}

  /**
   * Get HTTP headers with auth token
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * Map API response to Booking model
   */
  private mapApiToBooking(apiData: any): Booking {
    let imageUrl = apiData.propertyImage || apiData.imageUrl;
    if (imageUrl) {
        // لو الرابط مش كامل (نسبي)، نضيف رابط الباك إند
        if (!imageUrl.startsWith('http') && !imageUrl.includes('assets/')) {
            const baseUrl = environment.apiUrl.replace('/api', '').replace(/\/$/, '');
            // تأكد من وجود / في البداية
            if (!imageUrl.startsWith('/')) imageUrl = `/${imageUrl}`;
            imageUrl = `${baseUrl}${imageUrl}`;
        }
    } else {
        // صورة افتراضية لو مفيش صورة
        imageUrl = 'assets/images/placeholder.jpg'; // تأكدي أن هذا الملف موجود
    }
    return {
      id: apiData.id,
      propertyId: apiData.propertyId,
      type: apiData.type || 'Property',
      propertyTitle: apiData.itemTitle || apiData.propertyTitle,
      // propertyImage: apiData.propertyImage 
      //   ? `${environment.apiUrl.replace('/api', '')}${apiData.propertyImage}`
      //   : '/assets/images/placeholder-property.jpg',
      propertyImage: imageUrl, 
      guestId: apiData.guestId,
      guestName: apiData.guestName || 'Guest',
      guestEmail: apiData.guestEmail || '',
      guestPhone: apiData.guestPhone,
      guestProfileImage: apiData.guestProfileImage, 
      checkInDate: new Date(apiData.checkInDate),
      checkOutDate: new Date(apiData.checkOutDate),
      numberOfGuests: apiData.numberOfGuests,
      numberOfNights: apiData.numberOfNights,
      pricePerNight: apiData.pricePerNight,
      cleaningFee: apiData.cleaningFee,
      totalPrice: apiData.totalPrice,
      status: apiData.status,
      specialRequests: apiData.specialRequests,
      createdAt: new Date(apiData.createdAt),
      confirmedAt: apiData.confirmedAt ? new Date(apiData.confirmedAt) : undefined
    };
  }

  /**
   * ✅ Get all bookings
   */
  getAllBookings(): Observable<Booking[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.get<{ success: boolean; data: any[] }>(
      this.apiUrl,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        const bookings = response.data.map(b => this.mapApiToBooking(b));
        this.bookingsSignal.set(bookings);
        this.loadingSignal.set(false);
        return bookings;
      }),
      catchError(error => {
        this.loadingSignal.set(false);
        this.errorSignal.set(error.message || 'Failed to load bookings');
        console.error('Error loading bookings:', error);
        return of([]);
      })
    );
  }

  /**
   * ✅ Get today's bookings (check-ins & check-outs)
   */
  getTodayBookings(): Observable<Booking[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.get<{ success: boolean; data: any[] }>(
      `${this.apiUrl}/today`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        const bookings = response.data.map(b => this.mapApiToBooking(b));
        this.loadingSignal.set(false);
        console.log('✅ Today bookings loaded:', bookings.length);
        return bookings;
      }),
      catchError(error => {
        this.loadingSignal.set(false);
        this.errorSignal.set(error.message || 'Failed to load today bookings');
        console.error('Error loading today bookings:', error);
        return of([]);
      })
    );
  }

  /**
   * ✅ Get upcoming bookings (next 30 days)
   */
  getUpcomingBookings(): Observable<Booking[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.get<{ success: boolean; data: any[] }>(
      `${this.apiUrl}/upcoming`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        const bookings = response.data.map(b => this.mapApiToBooking(b));
        this.loadingSignal.set(false);
        console.log('✅ Upcoming bookings loaded:', bookings.length);
        return bookings;
      }),
      catchError(error => {
        this.loadingSignal.set(false);
        this.errorSignal.set(error.message || 'Failed to load upcoming bookings');
        console.error('Error loading upcoming bookings:', error);
        return of([]);
      })
    );
  }

  /**
   * ✅ Get pending bookings
   */
  getPendingBookings(): Observable<Booking[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.get<{ success: boolean; data: any[] }>(
      `${this.apiUrl}/pending`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        const bookings = response.data.map(b => this.mapApiToBooking(b));
        this.loadingSignal.set(false);
        return bookings;
      }),
      catchError(error => {
        this.loadingSignal.set(false);
        this.errorSignal.set(error.message);
        return of([]);
      })
    );
  }

  /**
   * ✅ Get booking by ID
   */
  getBookingById(id: number): Observable<Booking> {
    return this.http.get<{ success: boolean; data: any }>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => this.mapApiToBooking(response.data)),
      catchError(error => {
        console.error('Error loading booking:', error);
        throw error;
      })
    );
  }

  /**
   * ✅ Approve booking
   */
  approveBooking(bookingId: number): Observable<boolean> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/${bookingId}/approve`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.success),
      tap(() => console.log('✅ Booking approved')),
      catchError(error => {
        console.error('Error approving booking:', error);
        throw error;
      })
    );
  }

  /**
   * ✅ Decline booking
   */
  declineBooking(bookingId: number): Observable<boolean> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/${bookingId}/decline`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.success),
      tap(() => console.log('✅ Booking declined')),
      catchError(error => {
        console.error('Error declining booking:', error);
        throw error;
      })
    );
  }

  /**
   * ✅ Cancel booking
   */
  cancelBooking(bookingId: number): Observable<boolean> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/${bookingId}/cancel`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.success),
      tap(() => console.log('✅ Booking cancelled')),
      catchError(error => {
        console.error('Error cancelling booking:', error);
        throw error;
      })
    );
  }

  /**
   * ✅ Get bookings for specific property
   */
  getPropertyBookings(propertyId: number): Observable<Booking[]> {
    return this.http.get<{ success: boolean; data: any[] }>(
      `${this.apiUrl}/property/${propertyId}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.data.map(b => this.mapApiToBooking(b))),
      catchError(error => {
        console.error('Error loading property bookings:', error);
        return of([]);
      })
    );
  }
}
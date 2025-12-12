import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GuestBookingService, CreateBookingDto } from '../../services/booking.service';
import { CommonModule } from '@angular/common';
import { ServicesService } from '../../../services/services/service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-success.html',
  styleUrls: ['./payment-success.css']
})
export class PaymentSuccessComponent implements OnInit {
  sessionId: string = '';
  isProcessing: boolean = true;
  hasError: boolean = false;
  errorMessage: string = '';
  successMessage: string = 'Your booking has been confirmed.';

  // ✅ Inject ServicesService here
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private guestBookingService: GuestBookingService,
    private servicesService: ServicesService 
  ) {}

  ngOnInit() {
    this.sessionId = this.route.snapshot.queryParamMap.get('session_id') || 'Unknown';
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      this.hasError = true;
      this.errorMessage = 'Please log in to complete your booking.';
      this.isProcessing = false;
      setTimeout(() => {
        this.router.navigate(['/login'], { 
          queryParams: { returnUrl: '/payment-success', session_id: this.sessionId } 
        });
      }, 3000);
      return;
    }

    // =========================================================
    // ✅ 1. Check for Service Booking (NEW)
    // =========================================================
    const serviceBookingId = sessionStorage.getItem('pendingServiceBookingId');
    if (serviceBookingId) {
      this.confirmServiceBooking(Number(serviceBookingId));
      return; // Stop here, don't check properties
    }

    // =========================================================
    // 2. Check for Property Bookings (Existing Logic)
    // =========================================================
    const payingBookingId = sessionStorage.getItem('payingBookingId');
    const pendingBooking = sessionStorage.getItem('pendingBooking');
    
    if (payingBookingId) {
     
      this.confirmExistingBooking(payingBookingId);
    } else if (pendingBooking) {
     
      const bookingData = JSON.parse(pendingBooking);
      this.createBooking(bookingData);
    } else {
   
      this.hasError = true;
      this.errorMessage = 'No booking data found. Payment processed but booking details are missing.';
      this.isProcessing = false;
    }
  }

  // ✅ New Method for Service Booking
  confirmServiceBooking(id: number) {
    console.log('🔄 Confirming Service Booking ID:', id);

    this.servicesService.confirmPayment(id).subscribe({
      next: (res) => {
        console.log('✅ Service Booking confirmed:', res);
        sessionStorage.removeItem('pendingServiceBookingId'); 
        this.successMessage = 'Your service has been successfully booked!';
        this.isProcessing = false;
        this.hasError = false;
      },
      error: (err) => this.handleError(err)
    });
  }


  createBooking(data: any) {
    const payload: CreateBookingDto = {
      propertyId: Number(data.propertyId),
      checkInDate: new Date(data.checkIn).toISOString(),
      checkOutDate: new Date(data.checkOut).toISOString(),
      numberOfGuests: Number(data.guests),
      specialRequests: ''
    };

    console.log('📤 Creating New Property Booking:', payload);

    this.guestBookingService.createBooking(payload).subscribe({
      next: (res) => {
        console.log('✅ Booking created:', res);
        sessionStorage.removeItem('pendingBooking'); // تنظيف
        this.successMessage = 'Your new reservation is confirmed!';
        this.isProcessing = false;
        this.hasError = false;
      },
      error: (err) => this.handleError(err)
    });
  }


  confirmExistingBooking(bookingId: string) {
    console.log('🔄 Confirming Existing Booking ID:', bookingId);

    this.guestBookingService.confirmBookingPayment(Number(bookingId)).subscribe({
      next: (res) => {
        console.log('✅ Booking confirmed:', res);
        sessionStorage.removeItem('payingBookingId'); 
        this.successMessage = 'Payment received! Your booking is now fully confirmed.';
        this.isProcessing = false;
        this.hasError = false;
      },
      error: (err) => this.handleError(err)
    });
  }

  handleError(err: any) {
    console.error('❌ Error:', err);
    this.isProcessing = false;
    this.hasError = true;
    
    if (err.status === 401) {
      this.errorMessage = 'Session expired. Please log in again.';
    } else if (err.status === 403) {
      this.errorMessage = 'Permission denied. Identity verification required.';
    } else if (err.status === 400 || err.status === 409) {
      this.errorMessage = err.error?.message || 'Booking conflict or invalid request.';
    } else {
      this.errorMessage = 'An unexpected error occurred. Please contact support.';
    }
  }

  retry() {
    this.hasError = false;
    this.isProcessing = true;
    this.ngOnInit(); 
  }

  goToTrips() {
    this.router.navigate(['/trips']);
  }

  goHome() {
    this.router.navigate(['/']);
  }
}
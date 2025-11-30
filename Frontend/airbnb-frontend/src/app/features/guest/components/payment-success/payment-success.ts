import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GuestBookingService, CreateBookingDto } from '../../services/booking.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="success-container">
      <!-- Success Card -->
      <div class="success-card" *ngIf="!isProcessing && !hasError">
        <div class="icon-wrapper">
          <i class="fa-solid fa-circle-check"></i>
        </div>
        <h1>Payment Successful!</h1>
        <p>{{ successMessage }}</p>
        <p class="session-id">Session ID: {{ sessionId }}</p>
        <button class="btn-primary" (click)="goToTrips()">
          View My Trips
        </button>
      </div>

      <!-- Processing Card -->
      <div class="processing-card" *ngIf="isProcessing">
        <i class="fa-solid fa-spinner fa-spin"></i>
        <p>Finalizing your booking...</p>
      </div>

      <!-- Error Card -->
      <div class="error-card" *ngIf="hasError">
        <div class="icon-wrapper error">
          <i class="fa-solid fa-circle-xmark"></i>
        </div>
        <h1>Action Failed</h1>
        <p>{{ errorMessage }}</p>
        <button class="btn-secondary" (click)="retry()">
          Retry
        </button>
        <button class="btn-primary" (click)="goHome()">
          Go Home
        </button>
      </div>
    </div>
  `,
  styles: [`
    .success-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .success-card, .processing-card, .error-card {
      background: white;
      padding: 60px 40px;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      text-align: center;
      max-width: 500px;
      width: 100%;
    }

    .icon-wrapper {
      font-size: 80px;
      color: #10b981;
      margin-bottom: 20px;
    }

    .icon-wrapper.error {
      color: #ef4444;
    }

    h1 {
      font-size: 32px;
      color: #1f2937;
      margin-bottom: 10px;
    }

    p {
      color: #6b7280;
      font-size: 16px;
      margin-bottom: 10px;
    }

    .session-id {
      font-family: monospace;
      background: #f3f4f6;
      padding: 10px;
      border-radius: 8px;
      font-size: 12px;
      word-break: break-all;
      margin: 20px 0;
    }

    .btn-primary, .btn-secondary {
      margin-top: 15px;
      background: #ff385c;
      color: white;
      border: none;
      padding: 14px 40px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      margin-right: 10px;
    }

    .btn-secondary {
      background: #6b7280;
    }

    .btn-primary:hover {
      background: #e31c5f;
      transform: translateY(-2px);
    }

    .btn-secondary:hover {
      background: #4b5563;
      transform: translateY(-2px);
    }

    .fa-spinner {
      font-size: 50px;
      color: #667eea;
      margin-bottom: 20px;
    }
  `]
})
export class PaymentSuccessComponent implements OnInit {
  sessionId: string = '';
  isProcessing: boolean = true;
  hasError: boolean = false;
  errorMessage: string = '';
  successMessage: string = 'Your booking has been confirmed.';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private guestBookingService: GuestBookingService
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

    // 1. Check for Existing Booking Payment (From Trips Page)
    // يتم تخزين هذا الـ ID عند الضغط على Pay Now في صفحة Trips
    const payingBookingId = sessionStorage.getItem('payingBookingId');

    // 2. Check for New Instant Booking (From Checkout Page)
    const pendingBooking = sessionStorage.getItem('pendingBooking');
    
    if (payingBookingId) {
      // ✅ السيناريو الأول: دفع لحجز موجود مسبقاً
      this.confirmExistingBooking(payingBookingId);
    } else if (pendingBooking) {
      // ✅ السيناريو الثاني: إنشاء حجز جديد فوري
      const bookingData = JSON.parse(pendingBooking);
      this.createBooking(bookingData);
    } else {
      // خطأ: لا توجد بيانات حجز
      this.hasError = true;
      this.errorMessage = 'No booking data found. Payment processed but booking details are missing.';
      this.isProcessing = false;
    }
  }

  // --- السيناريو الأول: إنشاء حجز جديد ---
  createBooking(data: any) {
    const payload: CreateBookingDto = {
      propertyId: Number(data.propertyId),
      checkInDate: new Date(data.checkIn).toISOString(),
      checkOutDate: new Date(data.checkOut).toISOString(),
      numberOfGuests: Number(data.guests),
      specialRequests: ''
    };

    console.log('📤 Creating New Booking:', payload);

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

  // --- السيناريو الثاني: تأكيد حجز موجود ---
  confirmExistingBooking(bookingId: string) {
    console.log('🔄 Confirming Existing Booking ID:', bookingId);

    this.guestBookingService.confirmBookingPayment(Number(bookingId)).subscribe({
      next: (res) => {
        console.log('✅ Booking confirmed:', res);
        sessionStorage.removeItem('payingBookingId'); // تنظيف
        this.successMessage = 'Payment received! Your booking is now fully confirmed.';
        this.isProcessing = false;
        this.hasError = false;
      },
      error: (err) => this.handleError(err)
    });
  }

  // --- معالجة الأخطاء الموحدة ---
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
    this.ngOnInit(); // إعادة المحاولة
  }

  goToTrips() {
    this.router.navigate(['/trips']);
  }

  goHome() {
    this.router.navigate(['/']);
  }
}
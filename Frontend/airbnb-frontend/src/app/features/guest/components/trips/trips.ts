/* import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // ✅ مهم عشان routerLink يشتغل
import { HeaderComponent } from '../header/header';
import { FormsModule } from '@angular/forms';
import { ExperienceService } from '../../../../../app/shared/Services/experience.service';
@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [CommonModule,FormsModule, RouterModule, HeaderComponent],
  templateUrl: './trips.html',
  styleUrls: ['./trips.css']
})
export class TripsComponent implements OnInit {
  activeTab: 'upcoming' | 'past' | 'cancelled' = 'upcoming';
  trips = signal<any[]>([]);
  loading = signal(true);
  showReviewModal = false;
  isSubmitting = false;
  selectedBookingId: number | null = null;
  reviewForm = {
    rating: 0,
    comment: ''
  };
  filteredTrips = computed(() => {
    const allTrips = this.trips();
    const tab = this.activeTab;
    const now = new Date();
    return allTrips.filter((trip: any) => {
      console.log('Trip Status:', trip.status, 'Normalized:', trip.status?.toLowerCase().trim());
      const tripDate = new Date(trip.date); 
      const status = trip.status?.toLowerCase() || ''; 
      if (tab === 'cancelled') {
        return status === 'cancelled' || status === 'rejected' || status === 'declined';
      }
      if (tab === 'past') {
        return status === 'completed' || (tripDate < now && status !== 'cancelled' && status !== 'rejected');
      }
      if (tab === 'upcoming') {
        return tripDate >= now && status !== 'completed' && status !== 'cancelled' && status !== 'rejected';
      }
      return false;
    });
  });

  constructor(private experienceService: ExperienceService) {} 

  ngOnInit(): void {
    this.loadTrips(); 
  }

  loadTrips(): void {
    this.experienceService.getMyBookings().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.trips.set(res.data);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      }
    });
  }


  setActiveTab(tab: 'upcoming' | 'past' | 'cancelled') {
    this.activeTab = tab;
  }

  openReviewModal(bookingId: number): void {
    this.selectedBookingId = bookingId;
    this.reviewForm = { rating: 0, comment: '' }; // Reset form
    this.showReviewModal = true;
  }

  // ✅ NEW: إغلاق النافذة
  closeReviewModal(): void {
    this.showReviewModal = false;
    this.selectedBookingId = null;
  }

  // ✅ NEW: تحديد النجوم
  setRating(stars: number): void {
    this.reviewForm.rating = stars;
  }

  // ✅ NEW: إرسال التقييم
  submitReview(): void {
    if (!this.selectedBookingId || this.reviewForm.rating === 0) {
      alert('Please select a star rating.');
      return;
    }

    this.isSubmitting = true;

    const dto = {
      bookingId: this.selectedBookingId,
      rating: this.reviewForm.rating,
      comment: this.reviewForm.comment
    };

    this.experienceService.addReview(dto).subscribe({
      next: (res) => {
        if (res.success) {
          alert('Thank you for your review!');
          this.closeReviewModal();
          this.loadTrips(); // Reload to update status if needed
        }
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error(err);
        alert(err.error?.message || 'Failed to submit review');
        this.isSubmitting = false;
      }
    });
  }
}
 */


import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http'; // ✅ للاتصال بالدفع
import { HeaderComponent } from '../header/header';
import { GuestBookingService } from '../../services/booking.service'; // أو ExperienceService حسب استخدامك
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HeaderComponent],
  templateUrl: './trips.html',
  styleUrls: ['./trips.css']
})
export class TripsComponent implements OnInit {
  private http = inject(HttpClient);
  private bookingService = inject(GuestBookingService);

  // State Signals
  activeTab = signal<'upcoming' | 'past' | 'cancelled'>('upcoming');
  trips = signal<any[]>([]);
  loading = signal(true);
  isProcessingPayment = signal(false); // لمنع النقر المتكرر على زر الدفع

  // Review Modal State
  showReviewModal = false;
  isSubmitting = false;
  selectedBookingId: number | null = null;
  reviewForm = { rating: 0, comment: '' };

  // ✅ Filter Logic (Updated)
  filteredTrips = computed(() => {
    const allTrips = this.trips();
    const tab = this.activeTab(); 
    const now = new Date();

    return allTrips.filter((trip: any) => {
      const tripDate = new Date(trip.checkInDate || trip.date); 
      // تنظيف الحالة (إزالة المسافات وتحويلها لحروف صغيرة للمقارنة)
      const status = (trip.status || '').toLowerCase().trim(); 

      // 1. Cancelled Tab
      if (tab === 'cancelled') {
        return status === 'cancelled' || status === 'rejected' || status === 'declined';
      }

      // 2. Past Tab
      if (tab === 'past') {
        return status === 'completed' || (tripDate < now && status !== 'cancelled' && status !== 'rejected' && status !== 'awaitingpayment' && status !== 'pending');
      }

      // 3. Upcoming Tab (يشمل المعلق وبانتظار الدفع والمؤكد المستقبلي)
      if (tab === 'upcoming') {
        return (tripDate >= now || status === 'awaitingpayment' || status === 'pending') && 
               status !== 'completed' && 
               status !== 'cancelled' && 
               status !== 'rejected';
      }
      
      return false;
    });
  });

  ngOnInit(): void {
    this.loadTrips();
  }

  loadTrips(): void {
    this.loading.set(true);
    // استخدمي السيرفس الخاصة بك سواء BookingService أو ExperienceService
    this.bookingService.getMyTrips().subscribe({
      next: (res: any) => {
        // تأكدي إذا كان الرد مصفوفة مباشرة أو داخل خاصية data
        const data = Array.isArray(res) ? res : (res.data || []);
        this.trips.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading trips:', err);
        this.loading.set(false);
      }
    });
  }

  setActiveTab(tab: 'upcoming' | 'past' | 'cancelled') {
    this.activeTab.set(tab);
  }

  // ==========================================
  // ✅ NEW: Payment Logic
  // ==========================================
  payForBooking(trip: any): void {
    this.isProcessingPayment.set(true);

    // استدعاء الـ Endpoint الجديد في PaymentController
    this.http.post<{ url: string }>(`${environment.apiUrl}/Payment/pay-booking/${trip.id}`, {}).subscribe({
      next: (response) => {
        console.log('Redirecting to Stripe:', response.url);
        
        // ⚠️ هام: حفظ ID الحجز في SessionStorage عشان صفحة النجاح تعرف تحدثه
        sessionStorage.setItem('payingBookingId', trip.id.toString());
        
        // التوجيه لصفحة الدفع
        window.location.href = response.url;
      },
      error: (err) => {
        console.error('Payment init failed:', err);
        alert('Failed to initiate payment: ' + (err.error?.message || 'Unknown error'));
        this.isProcessingPayment.set(false);
      }
    });
  }

  // ==========================================
  // Review Logic
  // ==========================================
  openReviewModal(bookingId: number): void {
    this.selectedBookingId = bookingId;
    this.reviewForm = { rating: 0, comment: '' }; 
    this.showReviewModal = true;
  }

  closeReviewModal(): void {
    this.showReviewModal = false;
    this.selectedBookingId = null;
  }

  setRating(stars: number): void {
    this.reviewForm.rating = stars;
  }

  submitReview(): void {
    if (!this.selectedBookingId || this.reviewForm.rating === 0) {
      alert('Please select a star rating.');
      return;
    }

    this.isSubmitting = true;
    // استدعاء سيرفس التقييم (عدليها حسب السيرفس الموجودة عندك)
    console.log('Submitting review...', this.reviewForm);
    
    setTimeout(() => {
        alert('Review submitted!');
        this.closeReviewModal();
        this.isSubmitting = false;
    }, 1000);
  }
}
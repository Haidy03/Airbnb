import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { HeaderComponent } from '../header/header';
import { GuestBookingService } from '../../services/booking.service';
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
  private router = inject(Router); 

  // State Signals
  activeTab = signal<'upcoming' | 'past' | 'cancelled'>('upcoming');
  trips = signal<any[]>([]);
  loading = signal(true);
  isProcessingPayment = signal(false);

  // Filter Logic (نفس القديم)
  filteredTrips = computed(() => {
    const allTrips = this.trips();
    const tab = this.activeTab(); 
    
    // نحصل على تاريخ اليوم فقط (بدون ساعات) للمقارنة الدقيقة
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    return allTrips.filter((trip: any) => {
      // نحول تاريخ الحجز لتاريخ صافي أيضاً
      const tripDate = new Date(trip.checkInDate);
      tripDate.setHours(0, 0, 0, 0);

      const status = (trip.status || '').toLowerCase().trim(); 

      // 1. Cancelled Tab
      if (tab === 'cancelled') {
        return status === 'cancelled' || status === 'rejected' || status === 'declined';
      }

      // 2. Past Tab (الماضي فقط والمكتمل)
      // الشرط: التاريخ أصغر من اليوم (يعني امبارح أو قبل كده)
      if (tab === 'past') {
        // ملاحظة: بنعتبر Completed حتى لو التاريخ لسه مجاش لو السيستم حولها Completed يدوياً
        // لكن الأساس هو التاريخ < اليوم
        return status === 'completed' || (tripDate < today && status !== 'cancelled' && status !== 'rejected' && status !== 'awaitingpayment' && status !== 'pending' && status !== 'pendingpayment');
      }

      // 3. Upcoming Tab (اليوم + المستقبل)
      // الشرط: التاريخ أكبر من أو يساوي اليوم
      if (tab === 'upcoming') {
        return (tripDate >= today || status === 'awaitingpayment' || status === 'pending' || status === 'pendingpayment') && 
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
    this.bookingService.getMyTrips().subscribe({
      next: (res: any) => {
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
  // ✅ PAYMENT LOGIC (UPDATED)
  // ==========================================
  payForBooking(trip: any): void {
    this.isProcessingPayment.set(true);

    // 1. تحديد نوع الحجز
    if (trip.type === 'Service') {
      
      // للخدمات: نستخدم الـ Endpoint الخاص بالخدمة
      // ملاحظة: الـ Body هنا يعتمد على ServiceCheckoutRequest في الباك
      const payload = {
        serviceId: trip.serviceId,
        serviceName: trip.title, // أو trip.propertyTitle
        totalPrice: trip.totalPrice
      };

      this.http.post<{ url: string }>(`${environment.apiUrl}/Payment/create-service-checkout`, payload).subscribe({
        next: (response) => {
          // تخزين ID حجز الخدمة
          sessionStorage.setItem('pendingServiceBookingId', trip.id.toString());
          window.location.href = response.url;
        },
        error: (err) => {
          console.error('Service Payment failed:', err);
          alert('Failed to initiate service payment.');
          this.isProcessingPayment.set(false);
        }
      });

    } else {
      // 2. للعقارات (القديم كما هو)
      this.http.post<{ url: string }>(`${environment.apiUrl}/Payment/pay-booking/${trip.id}`, {}).subscribe({
        next: (response) => {
          sessionStorage.setItem('payingBookingId', trip.id.toString());
          window.location.href = response.url;
        },
        error: (err) => {
          console.error('Property Payment failed:', err);
          alert('Failed to initiate payment: ' + (err.error?.message || 'Unknown error'));
          this.isProcessingPayment.set(false);
        }
      });
    }
  }

  openReviewPage(trip: any): void {
    this.router.navigate(['/reviews/add', trip.id], {
      queryParams: { type: trip.type } 
    });
  }

  getImageUrl(url: string): string {
      if(!url) return 'assets/images/placeholder.jpg';
      if(url.startsWith('http') || url.includes('assets/')) return url;
      const baseUrl = environment.apiUrl.replace('/api', '').replace(/\/$/, '');
      let cleanPath = url.startsWith('/') ? url : `/${url}`;
      return `${baseUrl}${cleanPath}`;
  }
}
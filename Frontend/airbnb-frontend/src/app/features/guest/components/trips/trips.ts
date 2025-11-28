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


import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header';
import { ExperienceService } from '../../../../shared/Services/experience.service';

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HeaderComponent],
  templateUrl: './trips.html',
  styleUrls: ['./trips.css']
})
export class TripsComponent implements OnInit {
  // ✅ تعديل 1: تحويل activeTab لـ signal
  activeTab = signal<'upcoming' | 'past' | 'cancelled'>('upcoming');
  
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
    // ✅ تعديل 2: قراءة قيمة التاب من الـ signal
    const tab = this.activeTab(); 
    const now = new Date();

    return allTrips.filter((trip: any) => {
      const tripDate = new Date(trip.date); 
      const status = trip.status?.toLowerCase().trim() || ''; 

      // 1. Cancelled Tab
      if (tab === 'cancelled') {
        return status === 'cancelled' || status === 'rejected' || status === 'declined';
      }

      // 2. Past Tab
      if (tab === 'past') {
        // تظهر هنا لو مكتملة، أو لو تاريخها فات ومش ملغية
        return status === 'completed' || (tripDate < now && status !== 'cancelled' && status !== 'rejected');
      }

      // 3. Upcoming Tab
      if (tab === 'upcoming') {
        // تظهر هنا لو في المستقبل ومش مكتملة ومش ملغية
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

  // ✅ تعديل 3: تحديث الـ signal عند تغيير التاب
  setActiveTab(tab: 'upcoming' | 'past' | 'cancelled') {
    this.activeTab.set(tab);
  }

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
          this.loadTrips(); 
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
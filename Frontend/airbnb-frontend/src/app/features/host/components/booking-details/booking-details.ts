import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService, Booking } from '../../services/booking';

@Component({
  selector: 'app-booking-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './booking-details.html',
  styleUrls: ['./booking-details.css']
})
export class BookingDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bookingService = inject(BookingService);

  // Signals
  booking = signal<Booking | null>(null);
  isLoading = signal(true);
  isProcessing = signal(false);

  // Computed properties
  nightsCount = computed(() => {
    const b = this.booking();
    if (!b) return 0;
    const start = new Date(b.checkInDate);
    const end = new Date(b.checkOutDate);
   
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
  });

  isPending = computed(() => {
    return this.booking()?.status === 'Pending';
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBooking(Number(id));
    }
  }

  loadBooking(id: number) {
    this.isLoading.set(true);
    this.bookingService.getBookingById(id).subscribe({
      next: (res) => {
        // @ts-ignore (Fix if API response structure differs)
        this.booking.set(res); 
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
        alert('Could not load booking details');
        this.router.navigate(['/host/dashboard']);
      }
    });
  }

  approve() {
    if (!confirm('Are you sure you want to accept this reservation?')) return;
    this.processAction('approve');
  }

  decline() {
    if (!confirm('Are you sure you want to decline this request?')) return;
    this.processAction('decline');
  }

  getGuestInitial(): string {
  const name = this.booking()?.guestName;
  return name ? name.charAt(0).toUpperCase() : 'G';
}

  private processAction(action: 'approve' | 'decline') {
    const b = this.booking();
    if (!b) return;

    this.isProcessing.set(true);
    
    const request$ = action === 'approve' 
      ? this.bookingService.approveBooking(b.id) 
      : this.bookingService.declineBooking(b.id);

    request$.subscribe({
      next: () => {
        alert(action === 'approve' ? 'Reservation Confirmed! 🎉' : 'Reservation Declined.');
  
        this.loadBooking(b.id); 
        this.isProcessing.set(false);
      },
      error: (err) => {
        alert('Error processing request: ' + err.message);
        this.isProcessing.set(false);
      }
    });
  }

  goBack() {
    this.router.navigate(['/host/dashboard']);
  }
}
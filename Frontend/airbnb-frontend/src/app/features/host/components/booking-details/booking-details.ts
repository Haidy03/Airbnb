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
    this.route.queryParams.subscribe(params => {
      const type = params['type'] || 'Property';
      
      if (id) {
        this.loadBooking(Number(id), type);
      }
    });
  }

  loadBooking(id: number, type: string) { 
    this.isLoading.set(true);
    this.bookingService.getBookingById(id, type).subscribe({
      next: (res) => {
        // @ts-ignore
        this.booking.set(res.data || res); // Handle potential response wrapping
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
    
    // Note: You might need to update approve/decline services to accept 'type' as well
    // if the backend requires different endpoints for Experiences vs Properties.
    const request$ = action === 'approve' 
      ? this.bookingService.approveBooking(b.id) 
      : this.bookingService.declineBooking(b.id);

    request$.subscribe({
      next: () => {
        alert(action === 'approve' ? 'Reservation Confirmed! 🎉' : 'Reservation Declined.');
  
        // ✅ FIXED: Passed the type argument here
        this.loadBooking(b.id, b.type || 'Property'); 
        
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
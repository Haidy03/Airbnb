import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService, Booking } from '../../services/booking';
import { NotificationService } from '../../../../core/services/notification.service';
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
  private notificationService = inject(NotificationService);

  isProperty = computed(() => !this.booking()?.type || this.booking()?.type === 'Property');
  isExperience = computed(() => this.booking()?.type === 'Experience');
  isService = computed(() => this.booking()?.type === 'Service');

  
  // Signals
  booking = signal<Booking | null>(null);
  isLoading = signal(true);
  isProcessing = signal(false);

  // Computed properties
  nightsCount = computed(() => {
    const b = this.booking();
    if (!b || this.isExperience() || this.isService()) return 0; 
    
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
        this.notificationService.showError('Could not load booking details');
        this.router.navigate(['/host/dashboard']);
      }
    });
  }

  async approve() {
    const confirmed = await this.notificationService.confirmAction(
      'Accept Reservation?',
      'Are you sure you want to accept this reservation request?',
      'Accept'
    );

    if (confirmed) {
      this.processAction('approve');
    }
  }

  async decline() {
    const confirmed = await this.notificationService.confirmAction(
      'Decline Request?',
      'Are you sure you want to decline this request?',
      'Decline'
    );

    if (confirmed) {
      this.processAction('decline');
    }
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
         if (action === 'approve') {
          this.notificationService.showSuccess('Confirmed!', 'Reservation has been accepted successfully.');
        } else {
          this.notificationService.showToast('info', 'Reservation request declined.');
        }
        this.loadBooking(b.id, b.type || 'Property'); 
        
        this.isProcessing.set(false);
      },
      error: (err) => {
        this.notificationService.showError('Error processing request: ' + (err.error?.message || err.message));
        this.isProcessing.set(false);
      }
    });
  }

  goBack() {
    this.router.navigate(['/host/dashboard']);
  }
}
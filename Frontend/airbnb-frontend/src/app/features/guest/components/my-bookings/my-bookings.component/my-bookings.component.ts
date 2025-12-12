import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { GuestBookingService } from '../../../../guest/services/booking.service';
import { ServicesService } from '../../../../services/services/service';
import { ExperienceService } from '../../../../../shared/Services/experience.service';
import { environment } from '../../../../../../environments/environment';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-bookings.component.html',
  styleUrls: ['./my-bookings.component.css']
})
export class MyBookingsComponent implements OnInit {
  private bookingService = inject(GuestBookingService);
  private servicesService = inject(ServicesService);
  private experienceService = inject(ExperienceService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  loading = signal(true);

  propertyBookings = signal<any[]>([]);
  experienceBookings = signal<any[]>([]);
  serviceBookings = signal<any[]>([]);

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading.set(true);
    this.bookingService.getMyTrips().subscribe({
      next: (res: any) => {
        const allData = Array.isArray(res) ? res : (res.data || []);

        this.propertyBookings.set(allData.filter((t: any) => t.type === 'Property'));
        this.experienceBookings.set(allData.filter((t: any) => t.type === 'Experience'));
        this.serviceBookings.set(allData.filter((t: any) => t.type === 'Service'));
        
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  canCancel(dateStr: string): boolean {
    const tripDate = new Date(dateStr);
    const now = new Date();
    const diffHours = (tripDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours > 24;
  }

  async cancelBooking(trip: any): Promise<void> {
    
    const confirmed = await this.notificationService.confirmAction(
      'Cancel Booking?', 
      'Are you sure you want to cancel? Any applicable refund will be processed.',
      'Yes, cancel'
    );

    if (!confirmed) return;

    let cancelObs;
    
    if (trip.type === 'Service') {
       cancelObs = this.servicesService.cancelBooking(trip.id);
    } else if (trip.type === 'Experience') {
       cancelObs = this.experienceService.cancelBooking(trip.id);
    } else {
       cancelObs = this.bookingService.cancelTrip(trip.id);
    }

    if(cancelObs) {
        cancelObs.subscribe({
          next: () => {
            this.notificationService.showSuccess('Cancelled', 'Booking cancelled successfully.');
            this.loadBookings(); 
          },
          error: (err: any) => {
            this.notificationService.showError(err.error?.message || 'Failed to cancel booking.');
          }
        });
    }
  }

  getImageUrl(url: string): string {
    if (!url) return 'assets/images/placeholder.jpg';
    if (url.startsWith('http')) return url;
    const baseUrl = environment.apiUrl.replace('/api', '').replace(/\/$/, '');
    return `${baseUrl}${url.startsWith('/') ? url : '/' + url}`;
  }
}
import { Component, OnInit, signal, inject } from '@angular/core'; // ✅ Added inject
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExperienceService } from '../../../../../shared/Services/experience.service';
import { Experience, BookExperienceDto, ExperienceAvailability } from '../../../../../shared/models/experience.model';
import { HeaderComponent } from "../../../../guest/components/header/header";
import { environment } from '../../../../../../environments/environment';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
  selector: 'app-experience-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './experience-booking.component.html',
  styleUrls: ['./experience-booking.component.css']
})
export class ExperienceBookingComponent implements OnInit {
  experience = signal<Experience | null>(null);
  isLoading = signal(true);
  isBooking = signal(false);
  error = signal<string | null>(null);
  
  private notificationService = inject(NotificationService);

  userBookingsIds: number[] = [];
  selectedDate: string = '';
  selectedTime: string = '';
  numberOfGuests: number = 1;
  specialRequests: string = '';
  paymentDetails = { cardNumber: '', expiration: '', cvv: '' };
  
  allAvailabilities: ExperienceAvailability[] = [];
  availableDates: Date[] = [];
  availableTimes: { time: string; availabilityId: number; spots: number }[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private experienceService: ExperienceService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadExperience(parseInt(id));
      this.loadAvailability(parseInt(id));
      this.loadUserBookings(); 
    }
  }

  loadUserBookings(): void {
    this.experienceService.getMyBookings().subscribe({
        next: (response: any) => {
            if (response.success) {
              this.userBookingsIds = response.data.map((b: any) => b.availabilityId || 0); 
            }
        }
    });
  }

  loadExperience(id: number): void {
    this.isLoading.set(true);
    this.experienceService.getExperienceById(id).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.experience.set(response.data);
          this.numberOfGuests = response.data.minGroupSize;
        }
      },
      error: (error: any) => {
        console.error('Error loading experience:', error);
        this.error.set('Failed to load experience');
        this.isLoading.set(false);
      }
    });
  }

  loadAvailability(experienceId: number): void {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 180); 

    this.experienceService.getAvailability(experienceId, startDate, endDate).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.allAvailabilities = response.data;
          this.generateAvailableDatesFromData();
        } else {
          this.allAvailabilities = [];
        }
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('API Error', error);
        this.allAvailabilities = []; 
        this.isLoading.set(false);
      }
    });
  }

  generateAvailableDatesFromData(): void {
    const uniqueDates = new Set<string>();
    this.availableDates = [];

    this.allAvailabilities.forEach(slot => {
      if (slot.isAvailable && slot.availableSpots > 0) {
        const dateObj = new Date(slot.date);
        const dateStr = dateObj.toDateString();
        
        if (!uniqueDates.has(dateStr)) {
          uniqueDates.add(dateStr);
          this.availableDates.push(dateObj);
        }
      }
    });
    this.availableDates.sort((a, b) => a.getTime() - b.getTime());
  }

  onDateSelected(): void {
    this.selectedTime = '';
    
    if (!this.selectedDate) {
      this.availableTimes = [];
      return;
    }

    const selectedDateStr = new Date(this.selectedDate).toDateString();

    const daySlots = this.allAvailabilities.filter(slot => {
      const slotDateStr = new Date(slot.date).toDateString();
      return slotDateStr === selectedDateStr && 
             slot.isAvailable && 
             slot.availableSpots > 0 &&
             !this.userBookingsIds.includes(slot.id); 
    });

    this.availableTimes = daySlots.map(slot => ({
      time: this.formatTime(slot.startTime),
      availabilityId: slot.id,
      spots: slot.availableSpots
    }));
  }

  selectTime(time: string): void {
    this.selectedTime = time;
  }

  formatTime(time: string): string {
    if (!time) return '';
    const parts = time.split(':');
    return `${parts[0]}:${parts[1]}`;
  }

  calculateTotalPrice(): number {
    const exp = this.experience();
    if (!exp) return 0;
    return exp.pricePerPerson * this.numberOfGuests;
  }

  formatCardNumber(event: any): void {
    let input = event.target.value.replace(/\D/g, '').substring(0, 16);
    input = input != '' ? input.match(/.{1,4}/g)?.join(' ') : '';
    this.paymentDetails.cardNumber = input || '';
  }

  isPaymentValid(): boolean {
    const { cardNumber, expiration, cvv } = this.paymentDetails;
    return (
      cardNumber.length >= 19 &&
      expiration.length === 5 &&
      cvv.length === 3
    );
  }

  onSubmit(): void {
    if (!this.selectedDate || !this.selectedTime) {
      this.notificationService.showError('Please select date and time'); 
      return;
    }

    if (!this.isPaymentValid()) {
      this.notificationService.showError('Please enter valid card details'); 
      return;
    }

    const exp = this.experience();
    if (!exp) return;

    if (this.numberOfGuests < exp.minGroupSize || this.numberOfGuests > exp.maxGroupSize) {
      this.notificationService.showError(`Group size must be between ${exp.minGroupSize} and ${exp.maxGroupSize}`);
      return;
    }

    const selectedTimeSlot = this.availableTimes.find(t => t.time === this.selectedTime);
    
    if (!selectedTimeSlot || !selectedTimeSlot.availabilityId) {
      this.notificationService.showError('Selected time slot is invalid or unavailable'); 
      return;
    }

    this.isBooking.set(true);

    const dto: BookExperienceDto = {
      availabilityId: selectedTimeSlot.availabilityId, 
      numberOfGuests: this.numberOfGuests,
      specialRequests: this.specialRequests || undefined
    };

    setTimeout(() => {
      this.experienceService.bookExperience(exp.id, dto).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.notificationService.showSuccess('Booking Confirmed', 'Payment Successful! Your experience is booked.');
            this.router.navigate(['/']);
          }
          this.isBooking.set(false);
        },
        error: (error: any) => {
          console.error('Error booking experience:', error);
          
          this.notificationService.showError(error.error?.message || 'Transaction failed. Please try again.');
          this.isBooking.set(false);
        }
      });
    }, 1500);
  }

  goBack(): void {
    this.router.navigate(['/experiences', this.experience()?.id]);
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  getImageUrl(imageUrl: string | undefined | null): string {
    if (!imageUrl) return 'assets/images/placeholder.jpg';
    if (imageUrl.startsWith('http') || imageUrl.includes('assets/')) return imageUrl;
  
    const baseUrl = environment.apiUrl.replace('/api', '').replace(/\/$/, '');
    const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    return `${baseUrl}${cleanPath}`;
  }
}
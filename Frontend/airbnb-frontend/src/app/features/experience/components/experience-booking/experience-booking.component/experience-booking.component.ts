import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExperienceService } from '../../../../../shared/Services/experience.service';
import { Experience, BookExperienceDto, ExperienceAvailability } from '../../../../../shared/models/experience.model';
import { HeaderComponent } from "../../../../guest/components/header/header";

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
  userBookingsIds: number[] = [];
  selectedDate: string = '';
  selectedTime: string = '';
  numberOfGuests: number = 1;
  specialRequests: string = '';
  paymentDetails = {
    cardNumber: '',
    expiration: '',
    cvv: ''
  };
  
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
                // بنجمع كل الـ AvailabilityIds اللي المستخدم حاجزها
                // (السطر ده بيعتمد على إن الـ API بيرجع تفاصيل الحجز وفيها AvailabilityId)
                // لو الـ DTO مش مرجع AvailabilityId، قوليلي نعدله في الباك اند
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
    // ✅ التعديل 1: زودنا المدة لـ 180 يوم (6 شهور) عشان نجيب تواريخ فبراير ومارس براحتنا
    endDate.setDate(endDate.getDate() + 180); 

    this.experienceService.getAvailability(experienceId, startDate, endDate).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          console.log('✅ Dates loaded from Database:', response.data.length);
          this.allAvailabilities = response.data;
          this.generateAvailableDatesFromData();
        } else {
          this.allAvailabilities = [];
        }
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('API Error', error);
        // ✅ التعديل 2: شيلنا الـ Mock Data تماماً عشان نعتمد عالداتا بيز بس
        this.allAvailabilities = []; 
        this.isLoading.set(false);
      }
    });
  }

  generateAvailableDatesFromData(): void {
    const uniqueDates = new Set<string>();
    this.availableDates = [];

    this.allAvailabilities.forEach(slot => {
      // التأكد من أن الموعد متاح وفي المستقبل
      if (slot.isAvailable && slot.availableSpots > 0) {
        const dateObj = new Date(slot.date);
        const dateStr = dateObj.toDateString();
        
        if (!uniqueDates.has(dateStr)) {
          uniqueDates.add(dateStr);
          this.availableDates.push(dateObj);
        }
      }
    });

    // ترتيب التواريخ تصاعدياً (من الأقرب للأبعد)
    this.availableDates.sort((a, b) => a.getTime() - b.getTime());
  }

  onDateSelected(): void {
    this.selectedTime = '';
    
    if (!this.selectedDate) {
      this.availableTimes = [];
      return;
    }

    const selectedDateStr = new Date(this.selectedDate).toDateString();

    // الفلترة الصحيحة: التاريخ + الإتاحة + عدم الحجز المسبق
    const daySlots = this.allAvailabilities.filter(slot => {
      const slotDateStr = new Date(slot.date).toDateString();
      
      return slotDateStr === selectedDateStr && 
             slot.isAvailable && 
             slot.availableSpots > 0 &&
             !this.userBookingsIds.includes(slot.id); // استبعاد المواعيد المحجوزة
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
    return `${parts[0]}:${parts[1]}`; // HH:mm
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
      alert('Please select date and time');
      return;
    }

    if (!this.isPaymentValid()) {
      alert('Please enter valid card details');
      return;
    }

    const exp = this.experience();
    if (!exp) return;

    if (this.numberOfGuests < exp.minGroupSize || this.numberOfGuests > exp.maxGroupSize) {
      alert(`Group size must be between ${exp.minGroupSize} and ${exp.maxGroupSize}`);
      return;
    }

    const selectedTimeSlot = this.availableTimes.find(t => t.time === this.selectedTime);
    
    if (!selectedTimeSlot || !selectedTimeSlot.availabilityId) {
      alert('Selected time slot is invalid or unavailable');
      return;
    }

    this.isBooking.set(true);

    const dto: BookExperienceDto = {
      availabilityId: selectedTimeSlot.availabilityId, 
      numberOfGuests: this.numberOfGuests,
      specialRequests: this.specialRequests || undefined
    };

    // محاكاة وقت الدفع (1.5 ثانية) ثم الحجز الفعلي
    setTimeout(() => {
      this.experienceService.bookExperience(exp.id, dto).subscribe({
        next: (response: any) => {
          if (response.success) {
            alert('Payment Successful! Booking Confirmed.');
            this.router.navigate(['/']);
          }
          this.isBooking.set(false);
        },
        error: (error: any) => {
          console.error('Error booking experience:', error);
          alert(error.error?.message || 'Transaction failed. Please try again.');
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
}
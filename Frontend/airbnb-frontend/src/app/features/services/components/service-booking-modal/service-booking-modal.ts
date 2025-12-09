import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // ✅ Added DatePipe
import { FormsModule } from '@angular/forms';
import { ServiceDetails, ServicePackage } from '../../models/service.model';
import { ServicesService } from '../../services/service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-service-booking-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe], 
  templateUrl: './service-booking-modal.html',
  styleUrls: ['./service-booking-modal.css']
})
export class ServiceBookingModalComponent implements OnInit {
  @Input() service!: ServiceDetails;
  @Input() selectedPackage: ServicePackage | null = null;
  @Output() close = new EventEmitter<void>();

  private servicesService = inject(ServicesService);
  private router = inject(Router);
  private datePipe = inject(DatePipe); 
  
  guestCount = 1;
  selectedDate: Date = new Date();
  selectedTime: string | null = null;
  isSubmitting = false;

  filteredTimeSlots: string[] = []; 
  fullyBookedSlots: string[] = []; 
  isLoadingSlots = false;
 
  daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  ngOnInit() {
    this.selectedDate = new Date();
   
    if (!this.service.availabilities) {
      this.service.availabilities = [];
    }
    
   
    this.updateAvailableTimes();
    
 
    const dateStr = this.datePipe.transform(this.selectedDate, 'yyyy-MM-dd') || '';
    this.checkBlockedSlots(dateStr);
  }

  onDateChange(event: any) {
    const dateString = event.target.value;
    if (!dateString) return;

    this.selectedDate = new Date(dateString);
    this.updateAvailableTimes();
    this.checkBlockedSlots(dateString); 
  }

  checkBlockedSlots(dateStr: string) {
    console.log('📅 Checking Blocked Slots for Date:', dateStr);

    this.isLoadingSlots = true;
    this.fullyBookedSlots = []; 

    this.servicesService.getBlockedSlots(this.service.id, dateStr).subscribe({
      next: (res: any) => {
        if (res.success) {
          console.log('🚀 Backend Raw Blocked Times:', res.data);

          this.fullyBookedSlots = res.data.map((time24: string) => this.convertToAmPm(time24));
          
          console.log('🔒 Converted Blocked List:', this.fullyBookedSlots);
        }
        this.isLoadingSlots = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoadingSlots = false;
      }
    });
  }

  convertToAmPm(time24: string): string {
    if (!time24) return '';
    const [h, m] = time24.split(':');
    let hours = parseInt(h);
    const minutes = m; 
    
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    
    
    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  }

  isSlotDisabled(timeSlot: string): boolean {
    const isDisabled = this.fullyBookedSlots.includes(timeSlot);
    
    
    if(timeSlot.includes('12:28')) {
        console.log(`🔍 Checking [${timeSlot}]: Disabled? ${isDisabled}`);
    }
    
    return isDisabled;
  }

  updateAvailableTimes() {
    if (!this.service.availabilities) return;

    const dayOfWeek = this.selectedDate.getDay();
    
    this.filteredTimeSlots = this.service.availabilities
      .filter(slot => slot.dayOfWeek == dayOfWeek)
      .map(slot => this.formatTime(slot.startTime)); 
      
    this.selectedTime = null; 
  }
  
  getAvailableDayNames(): string {
    const uniqueDays = [...new Set(this.service.availabilities.map(s => s.dayOfWeek))];
    return uniqueDays.map(d => this.daysMap[d]).join(', ');
  }

  formatTime(timeStr: string): string {
    if(!timeStr) return '';
    
    const cleanTime = timeStr.split('.')[0]; 
    const [hour, minute] = cleanTime.split(':');
    
    const h = parseInt(hour);
    const m = parseInt(minute);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12; 
    
    return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
  }
  
  updateGuests(value: number) {
    const newVal = this.guestCount + value;
    if (newVal >= 1 && newVal <= this.service.maxGuests) {
      this.guestCount = newVal;
    }
  }

  selectTime(time: string) {
    this.selectedTime = time;
  }

  confirmReservation() {
    if (!this.selectedTime) return;
    const year = this.selectedDate.getFullYear();
    const month = (this.selectedDate.getMonth() + 1).toString().padStart(2, '0');
    const day = this.selectedDate.getDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    this.router.navigate(['/service-checkout', this.service.id], {
      queryParams: {
        date: dateStr, 
        time: this.selectedTime,
        guests: this.guestCount,
        packageId: this.selectedPackage?.id
      }
    });
    this.close.emit();
  }
}
import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceDetails, ServicePackage } from '../../models/service.model';
import { ServicesService } from '../../services/service';

@Component({
  selector: 'app-service-booking-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './service-booking-modal.html',
  styleUrls: ['./service-booking-modal.css']
})
export class ServiceBookingModalComponent implements OnInit {
  @Input() service!: ServiceDetails;
  @Input() selectedPackage: ServicePackage | null = null;
  @Output() close = new EventEmitter<void>();

  private servicesService = inject(ServicesService);

  // Form State
  guestCount = 1;
  selectedDate: Date = new Date();
  selectedTime: string | null = null;
  isSubmitting = false;

  // Mock Time Slots (كما في الصورة)
  timeSlots: string[] = [
    '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM',
    '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM',
    '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM',
    '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM'
  ];

  ngOnInit() {
    // التأكد من أن التاريخ يبدأ من اليوم
    this.selectedDate.setHours(0,0,0,0);
  }

  updateGuests(value: number) {
    if (this.guestCount + value >= 1) {
      this.guestCount += value;
    }
  }

  selectTime(time: string) {
    this.selectedTime = time;
  }

  // دمج التاريخ والوقت
  private getCombinedDateTime(): string {
    if (!this.selectedTime) return '';
    
    // تحويل الوقت (01:30 PM) إلى ساعات ودقائق
    const [time, modifier] = this.selectedTime.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = (parseInt(hours, 10) + 12).toString();
    
    const date = new Date(this.selectedDate);
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    
    return date.toISOString();
  }

  confirmReservation() {
    if (!this.selectedTime) return;

    this.isSubmitting = true;

    const bookingDto = {
      serviceId: this.service.id,
      packageId: this.selectedPackage?.id || null, 
      date: this.getCombinedDateTime(),
      numberOfGuests: this.guestCount
    };

    this.servicesService.bookService(bookingDto).subscribe({
      next: (res) => {
        alert('Booking Confirmed Successfully!');
        this.close.emit();
      },
      error: (err) => {
        console.error(err);
        alert('Booking failed.');
        this.isSubmitting = false;
      }
    });
  }
}
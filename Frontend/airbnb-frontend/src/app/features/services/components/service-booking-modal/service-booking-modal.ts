import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceDetails, ServicePackage } from '../../models/service.model';
import { ServicesService } from '../../services/service';
import { Router } from '@angular/router';

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

  private router = inject(Router);
  
  guestCount = 1;
  selectedDate: Date = new Date();
  selectedTime: string | null = null;
  isSubmitting = false;

  filteredTimeSlots: string[] = []; 
  
  // لترجمة الأرقام لأسماء أيام عشان نعرضها لليوزر
  daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  ngOnInit() {
    this.selectedDate = new Date();
    // التأكد من وجود المصفوفة
    if (!this.service.availabilities) {
      this.service.availabilities = [];
    }
    
    // Debugging: نشوف الداتا اللي جاية شكلها ايه
    console.log('Service Availabilities form DB:', this.service.availabilities);

    this.updateAvailableTimes();
  }

  onDateChange(event: any) {
    // التأكد من إنشاء التاريخ بشكل صحيح بناءً على التوقيت المحلي
    const dateString = event.target.value; 
    if(!dateString) return;

    this.selectedDate = new Date(dateString);
    this.updateAvailableTimes();
  }

  updateAvailableTimes() {
    if (!this.service.availabilities) return;

    // 1. الحصول على رقم اليوم (0 = Sunday, 3 = Wednesday)
    const dayOfWeek = this.selectedDate.getDay();
    
    console.log('Selected Date:', this.selectedDate);
    console.log('Selected Day Index:', dayOfWeek, `(${this.daysMap[dayOfWeek]})`);

    // 2. الفلترة
    // بنستخدم (==) بدل (===) عشان لو الداتا جاية string "3" تقارن ب number 3 عادي
    this.filteredTimeSlots = this.service.availabilities
      .filter(slot => slot.dayOfWeek == dayOfWeek)
      .map(slot => this.formatTime(slot.startTime)); 
      
    console.log('Filtered Slots:', this.filteredTimeSlots);

    this.selectedTime = null; 
  }

  // دالة لمعرفة الأيام المتاحة لعرضها في رسالة الخطأ
  getAvailableDayNames(): string {
    const uniqueDays = [...new Set(this.service.availabilities.map(s => s.dayOfWeek))];
    return uniqueDays.map(d => this.daysMap[d]).join(', ');
  }

  formatTime(timeStr: string): string {
    if(!timeStr) return '';
    
    // التعامل مع الصيغة اللي جاية من الداتابيز: "12:28:00.0000000"
    // بناخد أول جزء بس "12:28"
    const cleanTime = timeStr.split('.')[0]; 
    const [hour, minute] = cleanTime.split(':');
    
    const h = parseInt(hour);
    const m = parseInt(minute);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12; 
    
    return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

  // ... (updateGuests, selectTime, confirmReservation كما هم) ...
  
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

    this.router.navigate(['/service-checkout', this.service.id], {
      queryParams: {
        date: this.selectedDate.toISOString(),
        time: this.selectedTime,
        guests: this.guestCount,
        packageId: this.selectedPackage?.id
      }
    });
    this.close.emit();
  }
}
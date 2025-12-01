import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-service-availability',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-service-availability.html',
  styleUrls: ['./create-service-availability.css']
})
export class CreateServiceAvailabilityComponent {
  maxGuests = signal<number>(1);
  timeSlots = signal<string[]>([]);
  
  // لإضافة وقت جديد
  newTime = signal<string>('');

  constructor(private router: Router) {
    // استرجاع البيانات لو محفوظة
    const savedMax = localStorage.getItem('draftServiceMaxGuests');
    const savedSlots = localStorage.getItem('draftServiceTimeSlots'); // سنخزنه كـ JSON String

    if (savedMax) this.maxGuests.set(Number(savedMax));
    if (savedSlots) this.timeSlots.set(JSON.parse(savedSlots));
  }

  addTimeSlot() {
    if (this.newTime() && !this.timeSlots().includes(this.newTime())) {
      this.timeSlots.update(slots => [...slots, this.newTime()].sort());
      this.newTime.set(''); // مسح الحقل
    }
  }

  removeTimeSlot(index: number) {
    this.timeSlots.update(slots => slots.filter((_, i) => i !== index));
  }

  goBack() {
    this.router.navigate(['/host/services/location']);
  }

  onNext() {
    // حفظ البيانات
    localStorage.setItem('draftServiceMaxGuests', this.maxGuests().toString());
    localStorage.setItem('draftServiceTimeSlots', JSON.stringify(this.timeSlots()));

    // التوجيه لصفحة الصور
    this.router.navigate(['/host/services/photos']);
  }
}
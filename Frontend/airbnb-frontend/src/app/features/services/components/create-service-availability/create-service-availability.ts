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
  duration = signal<number>(60); 
  slots = signal<{ day: number, time: string }[]>([]); 
  

  tempDay = signal<number>(0);
  tempTime = signal<string>('');

  days = [
    { id: 0, name: 'Sunday' },
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' }
  ];

  constructor(private router: Router) {
   
    const savedMax = localStorage.getItem('draftServiceMaxGuests');
    const savedDuration = localStorage.getItem('draftServiceDuration');
    const savedSlots = localStorage.getItem('draftServiceAvailabilityJson'); 

    if (savedMax) this.maxGuests.set(Number(savedMax));
    if (savedDuration) this.duration.set(Number(savedDuration));
    if (savedSlots) this.slots.set(JSON.parse(savedSlots));
  }

  getDayName(id: number): string {
    return this.days.find(d => d.id == id)?.name || 'Unknown';
  }

  addSlot() {
    const day = Number(this.tempDay());
    const time = this.tempTime();

    if (time) {
 
      const exists = this.slots().some(s => s.day === day && s.time === time);
      
      if (!exists) {
        this.slots.update(current => {
          const updated = [...current, { day, time }];
   
          return updated.sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
        });
  
      }
    }
  }

  removeSlot(index: number) {
    this.slots.update(current => current.filter((_, i) => i !== index));
  }

  goBack() {
    this.router.navigate(['/host/services/location']);
  }

  onNext() {
    
    localStorage.setItem('draftServiceMaxGuests', this.maxGuests().toString());
    localStorage.setItem('draftServiceDuration', this.duration().toString());
    localStorage.setItem('draftServiceAvailabilityJson', JSON.stringify(this.slots()));

    this.router.navigate(['/host/services/photos']);
  }
}
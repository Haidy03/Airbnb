import { Component, Input, OnInit, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarSection } from '../calendar-section/calendar-section';

export interface GuestCounts {
  adults: number;
  children: number;
  infants: number;
  pets: number;
}

@Component({
  selector: 'app-super-card',
  standalone: true,
  imports: [CommonModule, FormsModule, CalendarSection],
  templateUrl: './booking-card.html',
  styleUrls: ['./booking-card.scss']
})
export class BookingCard implements OnInit, OnChanges {

  @Input() listingId!: string;
  @Input() pricePerNight: number = 0;
  @Input() rating?: number = 0;
  @Input() reviewsCount?: number = 0;
  @Input() currency: string = 'EGP';
  @Input() serviceFee: number = 0;
  @Input() cleaningFee: number = 0;
  @Input() isInstantBook: boolean = false;
  @Input() maxGuests: number = 100;


  @Input() blockedDates: string[] = [];
  @Input() checkInDate: string = '';
  @Input() checkOutDate: string = '';

  
  @Output() dateChanged = new EventEmitter<{checkIn: string, checkOut: string}>();
  @Output() reserve = new EventEmitter<void>();
  @Output() guestsChange = new EventEmitter<number>();

  isGuestMenuOpen: boolean = false;
  isCalendarOpen: boolean = false; 

  guests: GuestCounts = { adults: 1, children: 0, infants: 0, pets: 0 };
  priceBreakdown: any = null;

  constructor() { }

  ngOnInit(): void {
    this.guestsChange.emit(this.guests.adults + this.guests.children);
    this.calculateTotal();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['checkInDate'] || changes['checkOutDate']) {
      this.calculateTotal();
    }
  }

 
  
  toggleCalendarModal() {
    this.isCalendarOpen = !this.isCalendarOpen;
    this.isGuestMenuOpen = false; 
  }

  closeCalendar() {
    this.isCalendarOpen = false;
  }

  
  onPopupDatesSelected(dates: {checkIn: string, checkOut: string}) {

  this.checkInDate = dates.checkIn;
  this.checkOutDate = dates.checkOut;
  

  this.dateChanged.emit(dates);
  

  if (dates.checkIn && dates.checkOut) {

    setTimeout(() => {
      this.closeCalendar();
    }, 300);
  }
}



  calculateTotal() {
    if (!this.checkInDate || !this.checkOutDate) {
      this.priceBreakdown = null;
      return;
    }

    const start = new Date(this.checkInDate);
    const end = new Date(this.checkOutDate);
    const timeDiff = end.getTime() - start.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (nights > 0) {
      const baseTotal = this.pricePerNight * nights;
      const finalTotal = baseTotal + this.serviceFee + this.cleaningFee;

      this.priceBreakdown = {
        basePrice: this.pricePerNight,
        totalNights: nights,
        subTotal: baseTotal,
        cleaningFee: this.cleaningFee,
        serviceFee: this.serviceFee,
        finalTotalPrice: finalTotal,
        currency: this.currency
      };
    } else {
      this.priceBreakdown = null;
    }
  }

  toggleGuestMenu() {
    this.isGuestMenuOpen = !this.isGuestMenuOpen;
    this.isCalendarOpen = false;
  }

  updateCount(type: keyof GuestCounts, change: number) {

    const currentTotal = this.guests.adults + this.guests.children;
    const newValue = this.guests[type] + change;
    if (type === 'adults' && newValue < 1) return;
    if (newValue < 0) return;
    if (change > 0 && (type === 'adults' || type === 'children')) {
      if (currentTotal >= this.maxGuests) {
        alert(`Max ${this.maxGuests} guests.`);
        return;
      }
    }
    this.guests[type] = newValue;
    this.guestsChange.emit(this.guests.adults + this.guests.children);
  }

  get guestLabel(): string {

     return `${this.guests.adults + this.guests.children} guests`;
  }

  onReserve() {
    this.reserve.emit();
  }
}
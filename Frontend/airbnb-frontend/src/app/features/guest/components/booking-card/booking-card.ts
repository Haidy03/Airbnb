import { Component, Input, OnInit, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// ✅ 1. استيراد CalendarSection لاستخدامه داخل الـ Popup
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
  // ✅ 2. إضافة CalendarSection للـ imports
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

  // ✅ 3. إضافة المدخلات الناقصة (حل الخطأ الأول)
  @Input() blockedDates: string[] = [];
  @Input() checkInDate: string = '';
  @Input() checkOutDate: string = '';

  // ✅ 4. تحديد نوع البيانات المرسلة بدقة (حل الخطأ الثاني)
  @Output() dateChanged = new EventEmitter<{checkIn: string, checkOut: string}>();
  @Output() reserve = new EventEmitter<void>();
  @Output() guestsChange = new EventEmitter<number>();

  isGuestMenuOpen: boolean = false;
  isCalendarOpen: boolean = false; // للتحكم في ظهور الـ Popup

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

  // --- منطق الـ Popup Calendar ---
  
  toggleCalendarModal() {
    this.isCalendarOpen = !this.isCalendarOpen;
    this.isGuestMenuOpen = false; // إغلاق قائمة الضيوف إذا كانت مفتوحة
  }

  closeCalendar() {
    this.isCalendarOpen = false;
  }

  // دالة تستقبل التاريخ من CalendarSection الداخلي وترسله للأب
  onPopupDatesSelected(dates: {checkIn: string, checkOut: string}) {
  // 1. تحديث القيم المحلية فوراً (ليظهر التاريخ في الـ fake-input)
  this.checkInDate = dates.checkIn;
  this.checkOutDate = dates.checkOut;
  
  // 2. إرسال التحديث للأب (ListingDetails)
  this.dateChanged.emit(dates);
  
  // 3. إغلاق الـ Popup فقط إذا اكتمل الاختيار (التاريخين موجودين)
  if (dates.checkIn && dates.checkOut) {
    // تأخير بسيط لإعطاء المستخدم فرصة لرؤية التحديد قبل الإغلاق
    setTimeout(() => {
      this.closeCalendar();
    }, 300); // 300ms تأخير جمالي
  }
}

  // --- باقي المنطق (الحسابات والضيوف) ---

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
    // ... (نفس كود الضيوف السابق) ...
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
     // ... (نفس الكود السابق) ...
     return `${this.guests.adults + this.guests.children} guests`;
  }

  onReserve() {
    this.reserve.emit();
  }
}
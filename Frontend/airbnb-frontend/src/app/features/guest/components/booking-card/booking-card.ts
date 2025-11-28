import { Component, Input, OnInit ,Output, EventEmitter  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


// تعريف الموديلات المطلوبة داخلياً لتجنب أخطاء الاستيراد
export interface GuestCounts {
  adults: number;
  children: number;
  infants: number;
  pets: number;
}

export interface PriceDetails {
  basePrice: number;
  totalNights: number;
  subTotal: number;
  cleaningFee: number;
  serviceFee: number;
  finalTotalPrice: number;
  currency: string;
}

@Component({
  selector: 'app-super-card', // <--- تأكدي أن هذا الاسم هو app-booking-card
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking-card.html', // تأكدي أن اسم ملف الـ html صحيح
  styleUrls: ['./booking-card.scss']  // تأكدي أن اسم ملف الـ scss صحيح
})
export class BookingCard implements OnInit { // <--- تم تغيير الاسم هنا ليكون BookingCard فقط

  @Input() listingId!: string;
  @Input() pricePerNight: number = 0;
  @Input() rating?: number = 0;
  @Input() reviewsCount?: number = 0;
  @Input() currency: string = 'EGP';
  @Input() serviceFee: number = 0;
  @Input() cleaningFee: number = 0;
  @Input() isInstantBook: boolean = false; // القيمة الافتراضية
    // 2. ده الحدث اللي هنبعته للأب
  @Output() dateChanged = new EventEmitter<{checkIn: string, checkOut: string}>();
  @Output() reserve = new EventEmitter<void>(); // تعريف الحدث

  checkInDate: string = '';
  checkOutDate: string = '';
    minDate: string = '';

   isGuestMenuOpen: boolean = false;

  // 2. كائن أعداد الضيوف
  guests: GuestCounts = {
    adults: 1,
    children: 0,
    infants: 0,
    pets: 0
  };

   priceBreakdown: any = null; // (PriceDetails)

  constructor() { }

  ngOnInit(): void {
    // 2. كود لحساب تاريخ اليوم بصيغة YYYY-MM-DD
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
  }

  onDateChange() {
    if (this.checkInDate && this.checkOutDate) {
      this.calculateTotal();
    }

    // 3. (الجديد) ابعتي التواريخ الجديدة للأب
    this.dateChanged.emit({
      checkIn: this.checkInDate,
      checkOut: this.checkOutDate
    });
  }

  calculateTotal() {
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
  }

  // 4. دالة لتحديث العدادات (زيادة ونقصان)
  updateCount(type: keyof GuestCounts, change: number) {
    const newValue = this.guests[type] + change;

    // شروط:
    // البالغين: أقل حاجة 1
    if (type === 'adults' && newValue < 1) return;
    // الباقي: أقل حاجة 0
    if (newValue < 0) return;
    // ممكن نحط حد أقصى مثلاً 10

    this.guests[type] = newValue;
  }

  // 5. دالة لحساب النص اللي هيظهر في الصندوق (مثال: 3 guests, 1 infant)
  get guestLabel(): string {
    const totalGuests = this.guests.adults + this.guests.children;
    let label = `${totalGuests} guest${totalGuests > 1 ? 's' : ''}`;

    if (this.guests.infants > 0) {
      label += `, ${this.guests.infants} infant${this.guests.infants > 1 ? 's' : ''}`;
    }
    if (this.guests.pets > 0) {
      label += `, ${this.guests.pets} pet${this.guests.pets > 1 ? 's' : ''}`;
    }

    return label;
  }

  onReserve() {
 this.reserve.emit();
  }
}

import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CalendarDay {
  date: Date;
  dayNum: number;
  isPast: boolean;
  isCheckIn: boolean;
  isCheckOut: boolean;
  isInRange: boolean;
  isEmpty: boolean; // للأيام الفارغة في بداية الشهر
}

@Component({
  selector: 'app-calendar-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar-section.html',
  styleUrls: ['./calendar-section.scss']
})
export class CalendarSection implements OnChanges {
  @Input() location: string = 'Hurghada';
  @Input() checkIn: string | null = null;
  @Input() checkOut: string | null = null;

  // الشهر الحالي الذي يعرضه التقويم (لأغراض التصفح)
  currentViewDate: Date = new Date();

  month1: CalendarDay[] = [];
  month2: CalendarDay[] = [];
  month1Name: string = '';
  month2Name: string = '';

  nightsCount: number = 0;
  dateRangeString: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    // تحديث التقويم عند تغير المدخلات
    this.generateCalendar();
    this.calculateSummary();
  }

  generateCalendar() {
    // الشهر الأول (يسار)
    const m1 = new Date(this.currentViewDate);
    // الشهر الثاني (يمين)
    const m2 = new Date(this.currentViewDate.getFullYear(), this.currentViewDate.getMonth() + 1, 1);

    this.month1Name = m1.toLocaleString('default', { month: 'long', year: 'numeric' });
    this.month2Name = m2.toLocaleString('default', { month: 'long', year: 'numeric' });

    this.month1 = this.getDaysArray(m1);
    this.month2 = this.getDaysArray(m2);
  }

  // 2. دالة توليد الأيام (المعدلة)
  getDaysArray(date: Date): CalendarDay[] {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: CalendarDay[] = [];
    // الأيام الفاضية
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({
        date: new Date(),
        dayNum: 0,
        isPast: false,
        isCheckIn: false,
        isCheckOut: false,
        isInRange: false,
        isEmpty: true
      });
    }
     // تجهيز تواريخ الحجز للمقارنة (بنحذف منهم الوقت تماماً)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let checkInDate: Date | null = null;
    let checkOutDate: Date | null = null;

    // هنا السر: بنستخدم الدالة المساعدة عشان نضمن التاريخ صح
    if (this.checkIn) {
      checkInDate = this.parseDateLocal(this.checkIn);
    }

    if (this.checkOut) {
      checkOutDate = this.parseDateLocal(this.checkOut);
    }

    // اللوب الأساسي
    for (let i = 1; i <= daysInMonth; i++) {
      // تاريخ اليوم اللي عليه الدور في الرسم
      const current = new Date(year, month, i);
      current.setHours(0, 0, 0, 0); // تصفير الوقت للمقارنة

      const isPast = current < today;

      let isCheckIn = false;
      let isCheckOut = false;
      let isInRange = false;

      // مقارنة الـ Check In
      if (checkInDate) {
        // بنقارن الملي ثانية عشان نكون دقيقين
        if (current.getTime() === checkInDate.getTime()) {
          isCheckIn = true;
        }
      }

      // مقارنة الـ Check Out
      if (checkOutDate) {
        if (current.getTime() === checkOutDate.getTime()) {
          isCheckOut = true;
        }
      }

      // مقارنة المدى (اللون الرمادي اللي بينهم)
      if (checkInDate && checkOutDate) {
        if (current > checkInDate && current < checkOutDate) {
          isInRange = true;
        }
      }

      days.push({
        date: current,
        dayNum: i,
        isPast: isPast,
        isCheckIn: isCheckIn,
        isCheckOut: isCheckOut,
        isInRange: isInRange,
        isEmpty: false
      });
    }
    return days;
  }


  calculateSummary() {
    if (this.checkIn && this.checkOut) {
      const start = new Date(this.checkIn);
      const end = new Date(this.checkOut);
      const diff = end.getTime() - start.getTime();
      this.nightsCount = Math.ceil(diff / (1000 * 3600 * 24));

      // تنسيق التاريخ (Dec 9, 2025 - Dec 12, 2025)
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
      this.dateRangeString = `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
    } else {
      this.nightsCount = 0;
      this.dateRangeString = 'Add your travel dates for exact pricing';
    }
  }
  // 1. دالة مساعدة عشان تحول النص "2025-12-09" لتاريخ محلي مظبوط
  // (ضيفيها جوه الكلاس)
  private parseDateLocal(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day); // الشهر بيبدأ من 0 في جافاسكريبت
  }


  clearDates() {
    // هنا يجب إرسال حدث للأب (ListingDetails) لمسح التواريخ
    // سأتركها فارغة الآن لتقومي بربطها لاحقاً بـ @Output
    console.log('Clear dates clicked');
  }
}



import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CalendarDay {
  date: Date;
  dayNum: number;
  isPast: boolean;
  isCheckIn: boolean;
  isCheckOut: boolean;
  isInRange: boolean;
  isEmpty: boolean;
  isBlocked: boolean; // ✅ إضافة خاصية الحظر هنا
}

@Component({
  selector: 'app-calendar-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar-section.html',
  styleUrls: ['./calendar-section.scss']
})
export class CalendarSection implements OnChanges {
  @Input() location: string = '';
  @Input() checkIn: string | null = null;
  @Input() checkOut: string | null = null;
  @Input() blockedDates: string[] = []; 
  
  @Output() datesSelected = new EventEmitter<{checkIn: string, checkOut: string}>();

  currentViewDate: Date = new Date();
  month1: CalendarDay[] = [];
  month2: CalendarDay[] = [];
  month1Name: string = '';
  month2Name: string = '';

  // المتغيرات المستخدمة في الرسم (سواء جاءت من الخارج أو من اختيار المستخدم الحالي)
  private activeCheckIn: Date | null = null;
  private activeCheckOut: Date | null = null;

  nightsCount: number = 0;
  dateRangeString: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    // عند تغيير المدخلات من الخارج، نحدث الحالة النشطة
    if (changes['checkIn'] || changes['checkOut']) {
      this.activeCheckIn = this.checkIn ? this.parseDateLocal(this.checkIn) : null;
      this.activeCheckOut = this.checkOut ? this.parseDateLocal(this.checkOut) : null;
      this.generateCalendar();
      this.calculateSummary();
    }
    
    if (changes['blockedDates']) {
        this.generateCalendar();
    }
  }

  // ✅ الدالة المسؤولة عن التفاعل عند الضغط
  onDayClick(day: CalendarDay) {
  if (day.isEmpty || day.isPast || day.isBlocked) return;

  if (!this.activeCheckIn || (this.activeCheckIn && this.activeCheckOut)) {
    // بداية اختيار جديد
    this.activeCheckIn = day.date;
    this.activeCheckOut = null;
    this.emitDates(); // ✅ إرسال التحديث فوراً (ليظهر تاريخ الدخول)
  } else {
    // اختيار تاريخ الخروج
    if (day.date > this.activeCheckIn) {
      this.activeCheckOut = day.date;
      this.emitDates(); // ✅ إرسال التحديث النهائي
    } else {
      // إعادة اختيار تاريخ الدخول
      this.activeCheckIn = day.date;
      this.activeCheckOut = null;
      this.emitDates(); // ✅ إرسال التحديث فوراً
    }
  }

  this.generateCalendar();
  this.calculateSummary();
}

  emitDates() {
    this.datesSelected.emit({
      checkIn: this.activeCheckIn ? this.formatDate(this.activeCheckIn) : '',
      checkOut: this.activeCheckOut ? this.formatDate(this.activeCheckOut) : ''
    });
  }

  generateCalendar() {
    const m1 = new Date(this.currentViewDate);
    const m2 = new Date(this.currentViewDate.getFullYear(), this.currentViewDate.getMonth() + 1, 1);

    this.month1Name = m1.toLocaleString('default', { month: 'long', year: 'numeric' });
    this.month2Name = m2.toLocaleString('default', { month: 'long', year: 'numeric' });

    this.month1 = this.getDaysArray(m1);
    this.month2 = this.getDaysArray(m2);
  }

  getDaysArray(date: Date): CalendarDay[] {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: CalendarDay[] = [];

    // أيام فارغة
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({
        date: new Date(), dayNum: 0, isPast: false, isCheckIn: false, isCheckOut: false, isInRange: false, isEmpty: true, isBlocked: false
      });
    }

    // الأيام الفعلية
    for (let i = 1; i <= daysInMonth; i++) {
      const current = new Date(year, month, i);
      current.setHours(0, 0, 0, 0);

      const isPast = current < today;
      // ✅ استخدام دالة isDateBlocked هنا
      const isBlocked = this.isDateBlocked(current);

      let isCheckIn = false;
      let isCheckOut = false;
      let isInRange = false;

      // ✅ استخدام activeCheckIn و activeCheckOut بدلاً من المدخلات المباشرة
      if (this.activeCheckIn && current.getTime() === this.activeCheckIn.getTime()) {
        isCheckIn = true;
      }
      if (this.activeCheckOut && current.getTime() === this.activeCheckOut.getTime()) {
        isCheckOut = true;
      }
      if (this.activeCheckIn && this.activeCheckOut) {
        if (current > this.activeCheckIn && current < this.activeCheckOut) {
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
        isEmpty: false,
        isBlocked: isBlocked // ✅ تمرير الحالة
      });
    }
    return days;
  }

  // ✅ التحقق من الحظر (مع توحيد التوقيت)
  isDateBlocked(date: Date): boolean {
    const dateString = this.formatDate(date);
    return this.blockedDates.includes(dateString);
  }

  // ✅ دالة مساعدة لتوحيد صيغة التاريخ (YYYY-MM-DD)
  formatDate(date: Date): string {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
  }

  private parseDateLocal(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    d.setHours(0,0,0,0);
    return d;
  }

  // ✅ التنقل بين الشهور
  nextMonth() {
    this.currentViewDate = new Date(this.currentViewDate.getFullYear(), this.currentViewDate.getMonth() + 1, 1);
    this.generateCalendar();
  }

  prevMonth() {
    this.currentViewDate = new Date(this.currentViewDate.getFullYear(), this.currentViewDate.getMonth() - 1, 1);
    this.generateCalendar();
  }

  clearDates() {
    this.activeCheckIn = null;
    this.activeCheckOut = null;
    this.datesSelected.emit({ checkIn: '', checkOut: '' });
    this.generateCalendar();
    this.calculateSummary();
  }
  
  calculateSummary() {
      // تحديث النصوص بناءً على activeCheckIn/Out
      if (this.activeCheckIn && this.activeCheckOut) {
          // ... (نفس المنطق السابق)
      }
  }
}
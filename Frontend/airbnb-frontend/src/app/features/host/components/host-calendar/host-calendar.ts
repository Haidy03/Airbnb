import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { CalendarService } from '../../services/calendar-service';
import { PropertyService } from '../../services/property';
import { forkJoin, Observable, of } from 'rxjs';

// Interfaces
interface CalendarProperty {
  id: string;
  title: string;
  coverImage: string;
  location: { city: string; country: string; };
}

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isAvailable: boolean;
  price: number;
  originalPrice?: number;
  hasBooking: boolean;
  bookingId?: number;
  bookingStatus?: string;
  guestName?: string;
  isCheckIn: boolean;
  isCheckOut: boolean;
  isBlocked: boolean;
  notes?: string;
  isSelected?: boolean;

  checkInTime?: string | null;
  checkOutTime?: string | null;
}

interface CalendarSettings {
  basePrice: number;
  cleaningFee?: number;
  minimumNights: number;
  maximumNights: number;
  advanceNotice: number;
  preparationTime: number;
  checkInTime?: string;
  checkOutTime?: string;
}

@Component({
  selector: 'app-host-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './host-calendar.html',
  styleUrls: ['./host-calendar.css'],
  animations: [
    // Slide in animation for sidebar
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('300ms ease-out', style({ transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(100%)' }))
      ])
    ]),
    // Fade in animation for overlay
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    // Expand/collapse animation
    trigger('expandCollapse', [
      transition(':enter', [
        style({ height: 0, opacity: 0 }),
        animate('200ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ height: 0, opacity: 0 }))
      ])
    ])
  ]
})
export class HostCalendar implements OnInit {
  private fb = inject(FormBuilder);
  private calendarService = inject(CalendarService);
  private propertyService = inject(PropertyService);

  // State
  currentDate = signal<Date>(new Date());
  selectedProperty = signal<CalendarProperty | null>(null);
  properties = signal<CalendarProperty[]>([]);
  calendarDays = signal<CalendarDay[]>([]);
  settings = signal<CalendarSettings>({
    basePrice: 0,
    minimumNights: 1,
    maximumNights: 365,
    advanceNotice: 0,
    preparationTime: 1
  });
  
  selectedDates = signal<Date[]>([]);
  
  // Sidebar & Modals Signals
  private selectedDaySignal = signal<CalendarDay | null>(null);
  readonly selectedDay = this.selectedDaySignal.asReadonly();
  private showCustomSettingsSignal = signal<boolean>(false);
  readonly showCustomSettings = this.showCustomSettingsSignal.asReadonly();
  private savingDaySignal = signal<boolean>(false);
  readonly savingDay = this.savingDaySignal.asReadonly();
  
  private showMonthPickerSignal = signal<boolean>(false);
  readonly showMonthPicker = this.showMonthPickerSignal.asReadonly();
  private selectedYearSignal = signal<number>(new Date().getFullYear());
  readonly selectedYear = this.selectedYearSignal.asReadonly();
  
  months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Loading & UI states
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);
  private showPriceModalSignal = signal<boolean>(false);
  private showAvailabilityModalSignal = signal<boolean>(false);
  private showSettingsModalSignal = signal<boolean>(false);
  
  readonly loading = this.loadingSignal.asReadonly();
  readonly errorMessage = this.errorSignal.asReadonly();
  readonly showPriceModal = this.showPriceModalSignal.asReadonly();
  readonly showAvailabilityModal = this.showAvailabilityModalSignal.asReadonly();
  readonly showSettingsModal = this.showSettingsModalSignal.asReadonly();
  
  // Forms
  priceForm!: FormGroup;
  availabilityForm!: FormGroup;
  settingsForm!: FormGroup;
  dayDetailsForm!: FormGroup;
  
  private originalDayDetails: any = null;
  
  currentMonthYear = computed(() => {
    return this.currentDate().toLocaleString('default', { month: 'long', year: 'numeric' });
  });
  
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  ngOnInit(): void {
    this.initializeForms();
    this.loadProperties();
    this.selectedYearSignal.set(new Date().getFullYear());
  }

  initializeForms(): void {
    this.priceForm = this.fb.group({
      price: [0, [Validators.required, Validators.min(1)]],
      applyToWeekends: [false]
    });

    this.availabilityForm = this.fb.group({
      isAvailable: [true],
      notes: ['']
    });

    this.settingsForm = this.fb.group({
      basePrice: [0, [Validators.required, Validators.min(1)]],
      cleaningFee: [0, [Validators.min(0)]], 
      minimumNights: [1, [Validators.required, Validators.min(1)]],
      maximumNights: [365, [Validators.required, Validators.min(1)]],
      advanceNotice: [0, [Validators.min(0)]],
      preparationTime: [1, [Validators.min(0)]]
    });
    
    this.dayDetailsForm = this.fb.group({
      isAvailable: [true],
      customPrice: [null],
      checkInTime: [null],
      checkOutTime: [null],
      notes: ['']
    });
  }

  loadProperties(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    this.propertyService.getAllProperties().subscribe({
      next: (properties) => {
        const approvedProperties = properties.filter(p => p.isApproved === true);
        const calendarProperties: CalendarProperty[] = approvedProperties.map(p => ({
          id: p.id,
          title: p.title,
          coverImage: p.coverImage || '/assets/images/placeholder-property.jpg',
          location: { 
            city: p.location?.city || '', 
            country: p.location?.country || '' 
          }
        }));
        
        this.properties.set(calendarProperties);
        
        if (calendarProperties.length > 0) {
          this.selectProperty(calendarProperties[0]);
        } else {
          this.loadingSignal.set(false);
        }
      },
      error: (err: any) => {
        console.error('❌ Error loading properties:', err);
        this.errorSignal.set('Failed to load properties. Please try again.');
        this.loadingSignal.set(false);
      }
    });
  }

  selectProperty(property: CalendarProperty): void {
    this.selectedProperty.set(property);
    this.loadCalendarData();
    this.loadSettings();
  }

  loadCalendarData(): void {
    const property = this.selectedProperty();
    if (!property) return;

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    const year = this.currentDate().getFullYear();
    const month = this.currentDate().getMonth();
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    this.calendarService.getAvailability(
      parseInt(property.id),
      startDate,
      endDate
    ).subscribe({
      next: (data) => {
        this.generateCalendar(data.days);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        console.error('❌ Error loading calendar:', err);
        this.errorSignal.set('Failed to load calendar. Generating empty calendar.');
        this.generateEmptyCalendar();
        this.loadingSignal.set(false);
      }
    });
  }

  loadSettings(): void {
    const property = this.selectedProperty();
    if (!property) return;

    this.calendarService.getSettings(parseInt(property.id)).subscribe({
      next: (settings) => {
        this.settings.set(settings);
        this.settingsForm.patchValue(settings);
      },
      error: (err) => {
        const defaultSettings: CalendarSettings = {
          basePrice: 50,
          minimumNights: 1,
          maximumNights: 365,
          advanceNotice: 0,
          preparationTime: 1
        };
        this.settings.set(defaultSettings);
        this.settingsForm.patchValue(defaultSettings);
      }
    });
  }

  // ✅ GENEREATE CALENDAR WITH DATA
  generateCalendar(apiDays: any[]): void {
    const year = this.currentDate().getFullYear();
    const month = this.currentDate().getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let currentDay = new Date(startDate);
    
    while (currentDay <= endDate) {
      const dayDate = new Date(currentDay);
      dayDate.setHours(0, 0, 0, 0);
      
      const apiDay = apiDays.find(d => {
        const apiDate = new Date(d.date);
        apiDate.setHours(0, 0, 0, 0);
        return apiDate.getTime() === dayDate.getTime();
      });

      days.push({
        date: new Date(dayDate),
        dayNumber: dayDate.getDate(),
        isCurrentMonth: dayDate.getMonth() === month,
        isToday: dayDate.getTime() === today.getTime(),
        isWeekend: dayDate.getDay() === 5 || dayDate.getDay() === 6,
        isAvailable: apiDay ? apiDay.isAvailable : true,
        price: apiDay?.price ?? this.settings().basePrice,
        originalPrice: apiDay?.originalPrice,
        hasBooking: apiDay?.hasBooking ?? false,
        bookingId: apiDay?.bookingId,
        bookingStatus: apiDay?.bookingStatus,
        guestName: apiDay?.guestName,
        isCheckIn: apiDay?.isCheckIn ?? false,
        isCheckOut: apiDay?.isCheckOut ?? false,
        isBlocked: apiDay ? apiDay.isBlocked : false,
        notes: apiDay?.notes,
        isSelected: false,
        // ✅ ربط التوقيتات القادمة من الـ API
        checkInTime: apiDay?.checkInTime || null,
        checkOutTime: apiDay?.checkOutTime || null
      });
      
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    this.calendarDays.set(days);
  }

  generateEmptyCalendar(): void {
    // (Fallback logic similar to generateCalendar but with defaults)
    // Simplified for brevity, similar logic to above without apiDay check
    this.generateCalendar([]);
  }

  // ============================================
  // ✅ DAY SIDEBAR LOGIC
  // ============================================
  
  onDayClick(day: CalendarDay, event: MouseEvent): void {
    if (!day.isCurrentMonth) return;
    this.openDaySidebar(day);
  }
  
  openDaySidebar(day: CalendarDay): void {
    this.selectedDaySignal.set(day);
    const isAvailableState = !day.isBlocked; 

    // ✅ ملء الفورم بالبيانات المخزنة لليوم أو الإعدادات العامة
    this.dayDetailsForm.patchValue({
      isAvailable: isAvailableState,
      customPrice: day.originalPrice ? day.price : (isAvailableState ? this.settings().basePrice : null),
      checkInTime: day.checkInTime || this.settings().checkInTime || null,
      checkOutTime: day.checkOutTime || this.settings().checkOutTime || null,
      notes: day.notes || ''
    }, { emitEvent: false });

    this.originalDayDetails = this.dayDetailsForm.value;
  }
  
  closeDaySidebar(): void {
    this.selectedDaySignal.set(null);
    this.showCustomSettingsSignal.set(false);
    this.originalDayDetails = null;
  }
  
  toggleCustomSettings(): void {
    this.showCustomSettingsSignal.update(v => !v);
  }
  
  onAvailabilityToggle(): void {
    // console.log('Availability changed');
    console.log('Toggle changed to:', this.dayDetailsForm.get('isAvailable')?.value);
  }
  
  isDayModified(): boolean {
    if (!this.originalDayDetails) return false;
    return JSON.stringify(this.dayDetailsForm.value) !== JSON.stringify(this.originalDayDetails);
  }
  
  resetDayDetails(): void {
    if (this.originalDayDetails) {
      this.dayDetailsForm.patchValue(this.originalDayDetails);
    }
  }
  
  saveDayDetails(): void {
    const day = this.selectedDay();
    const property = this.selectedProperty();
    
    if (!day || !property) return;
    
    this.savingDaySignal.set(true);
    const formValue = this.dayDetailsForm.value;
    const requests: Observable<any>[] = [];

    const isAvailableChanged = formValue.isAvailable !== day.isAvailable;
    const notesChanged = formValue.notes !== (day.notes || '');
    const checkInTimeChanged = formValue.checkInTime !== (day.checkInTime || null);
    const checkOutTimeChanged = formValue.checkOutTime !== (day.checkOutTime || null);

    // const hasAvailabilityChanges = 
    //     formValue.isAvailable !== day.isAvailable ||
    //     formValue.notes !== (day.notes || '') ||
    //     formValue.checkInTime !== (day.checkInTime || null) ||
    //     formValue.checkOutTime !== (day.checkOutTime || null);

    if (isAvailableChanged || notesChanged || checkInTimeChanged || checkOutTimeChanged) {
      const availabilityDto = {
        propertyId: parseInt(property.id),
        date: day.date,
        isAvailable: formValue.isAvailable,
        notes: formValue.notes,
        checkInTime: formValue.checkInTime, 
        checkOutTime: formValue.checkOutTime
      };
      requests.push(this.calendarService.updateAvailability(availabilityDto));
    }

    
    const newPrice = formValue.customPrice;
    const currentPrice = day.price;
    
    if (newPrice && newPrice !== currentPrice) {
      const pricingDto = {
        propertyId: parseInt(property.id),
        date: day.date,
        price: newPrice,
        notes: formValue.notes
      };
      requests.push(this.calendarService.updatePricing(pricingDto));
    }

    if (requests.length === 0) {
      this.savingDaySignal.set(false);
      this.closeDaySidebar();
      return;
    }

    forkJoin(requests).subscribe({
      next: () => {
        console.log('✅ Saved successfully');
        
       
        this.calendarDays.update(days => 
          days.map(d => {
            if (d.date.getTime() === day.date.getTime()) {
              const finalPrice = newPrice || d.price;
              const basePrice = this.settings().basePrice;
              const calculatedOriginalPrice = (finalPrice !== basePrice) ? basePrice : undefined;
              return { 
                ...d, 
                isAvailable: formValue.isAvailable,
                isBlocked: !formValue.isAvailable,
                price: finalPrice,
                originalPrice: calculatedOriginalPrice,
                notes: formValue.notes,
                checkInTime: formValue.checkInTime,  
                checkOutTime: formValue.checkOutTime  
              } as CalendarDay;
            }
            return d;
          })
        );

        this.savingDaySignal.set(false);
        this.closeDaySidebar();
      },
      error: (err) => {
        console.error('❌ Error saving details:', err);
        this.savingDaySignal.set(false);
        alert('Failed to save changes.');
      }
    });
  }

  // ... (Formatting & View Helpers)
  formatPrice(price: number | null | undefined): string {
  if (price == null) return '';
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0
  }).format(price);
}
  formatSelectedDate(): string {
    const day = this.selectedDay();
    if (!day) return '';
    return day.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
  
  getSelectedDayName(): string {
    const day = this.selectedDay();
    if (!day) return '';
    return day.date.toLocaleDateString('en-US', { weekday: 'long' });
  }
  
  getPriceDiscount(): number {
    const customPrice = this.dayDetailsForm.value.customPrice;
    const basePrice = this.settings().basePrice;
    if (!customPrice || !basePrice) return 0;
    return Math.round(((basePrice - customPrice) / basePrice) * 100);
  }

  viewBookingDetails(): void {
    const day = this.selectedDay();
    if (day?.bookingId) {
      console.log('Navigate to booking:', day.bookingId);
    }
  }

  // ============================================
  // Month Picker & Navigation
  // ============================================
  toggleMonthPicker(): void { this.showMonthPickerSignal.update(v => !v); }
  previousYear(): void { this.selectedYearSignal.update(y => y - 1); }
  nextYear(): void { this.selectedYearSignal.update(y => y + 1); }
  
  selectMonth(monthIndex: number): void {
    const newDate = new Date(this.selectedYear(), monthIndex, 1);
    this.currentDate.set(newDate);
    this.showMonthPickerSignal.set(false);
    this.loadCalendarData();
  }
  
  isSelectedMonth(monthIndex: number): boolean {
    const current = this.currentDate();
    return current.getMonth() === monthIndex && current.getFullYear() === this.selectedYear();
  }
  
  isCurrentMonth(monthIndex: number): boolean {
    const now = new Date();
    return now.getMonth() === monthIndex && now.getFullYear() === this.selectedYear();
  }
  
  isPastMonth(monthIndex: number): boolean {
    const now = new Date();
    const checkDate = new Date(this.selectedYear(), monthIndex, 1);
    return checkDate < new Date(now.getFullYear(), now.getMonth(), 1);
  }
  
  goToThisMonth(): void {
    const now = new Date();
    this.selectedYearSignal.set(now.getFullYear());
    this.selectMonth(now.getMonth());
  }
  
  goToNextMonth(): void {
    const next = new Date(this.currentDate());
    next.setMonth(next.getMonth() + 1);
    this.selectedYearSignal.set(next.getFullYear());
    this.selectMonth(next.getMonth());
  }

  previousMonth(): void {
    const newDate = new Date(this.currentDate());
    newDate.setMonth(newDate.getMonth() - 1);
    this.currentDate.set(newDate);
    this.selectedYearSignal.set(newDate.getFullYear());
    this.loadCalendarData();
  }

  nextMonth(): void {
    const newDate = new Date(this.currentDate());
    newDate.setMonth(newDate.getMonth() + 1);
    this.currentDate.set(newDate);
    this.selectedYearSignal.set(newDate.getFullYear());
    this.loadCalendarData();
  }

  goToToday(): void {
    const today = new Date();
    this.currentDate.set(today);
    this.selectedYearSignal.set(today.getFullYear());
    this.loadCalendarData();
  }

  // Helper methods for modals/selection (can be kept or removed if not used)
  isPastDate(day: CalendarDay): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return day.date < today;
  }
  
  toggleDateSelection(date: Date): void { /* ... */ }
  selectDateRange(endDate: Date): void { /* ... */ }
  updateDaysSelection(): void { /* ... */ }
  
  clearSelection(): void {
    this.selectedDates.set([]);
  }

  openPriceModal(): void { this.showPriceModalSignal.set(true); }
  closePriceModal(): void { this.showPriceModalSignal.set(false); }
  
  openAvailabilityModal(): void { this.showAvailabilityModalSignal.set(true); }
  closeAvailabilityModal(): void { this.showAvailabilityModalSignal.set(false); }
  
  openSettingsModal(): void { this.showSettingsModalSignal.set(true); }
  closeSettingsModal(): void { this.showSettingsModalSignal.set(false); }
  
  clearError(): void { this.errorSignal.set(null); }
  
  updatePricing(): void {

    this.closePriceModal();
  }
  
  updateAvailability(): void {

    this.closeAvailabilityModal();
  }
  
  saveSettings(): void {
    if (this.settingsForm.invalid) return;
    const property = this.selectedProperty();
    if (!property) return;

    this.calendarService.updateSettings({
      propertyId: parseInt(property.id),
      ...this.settingsForm.value
    }).subscribe({
      next: () => {
       // alert('Settings updated successfully');
        this.closeSettingsModal();
        this.loadSettings();
        this.loadCalendarData();
      },
      error: (err) => alert('Failed to update settings')
    });
  }

  getControl(name: string): FormControl {
    return this.dayDetailsForm.get(name) as FormControl;
  }

  getDayClasses(day: CalendarDay): string {
    const classes = ['calendar-day'];
    if (!day.isCurrentMonth) classes.push('other-month');
    if (day.isToday) classes.push('today');
    if (this.isPastDate(day) && day.isCurrentMonth) classes.push('past-date');
    if (day.isWeekend) classes.push('weekend');
    if (day.hasBooking) classes.push('booked');
    if (day.isBlocked) classes.push('blocked');
    if (day.isCheckIn) classes.push('check-in');
    if (day.isCheckOut) classes.push('check-out');
    if (day.isSelected) classes.push('selected');
    if (!day.isAvailable && !day.hasBooking) classes.push('unavailable');
    return classes.join(' ');
  }
}
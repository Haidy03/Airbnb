import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { CalendarService } from '../../services/calendar-service';
import { PropertyService } from '../../services/property';

// Interfaces (same as before)
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
}

interface CalendarSettings {
  basePrice: number;
  weekendPrice?: number;
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
  styleUrl: './host-calendar.css',
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
  
  // ✅ NEW: Day details sidebar
  private selectedDaySignal = signal<CalendarDay | null>(null);
  readonly selectedDay = this.selectedDaySignal.asReadonly();
  private showCustomSettingsSignal = signal<boolean>(false);
  readonly showCustomSettings = this.showCustomSettingsSignal.asReadonly();
  private savingDaySignal = signal<boolean>(false);
  readonly savingDay = this.savingDaySignal.asReadonly();
  
  // ✅ NEW: Month picker
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
  
  // ✅ NEW: Day details form
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
      weekendPrice: [0],
      minimumNights: [1, [Validators.required, Validators.min(1)]],
      maximumNights: [365, [Validators.required, Validators.min(1)]],
      advanceNotice: [0, [Validators.min(0)]],
      preparationTime: [1, [Validators.min(0)]]
    });
    
    // ✅ NEW: Day details form
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
    
    // ✅ استخدام getAllProperties التي ترجع Property[]
    this.propertyService.getAllProperties().subscribe({
      next: (properties) => {
        // ✅ Mapping صحيح باستخدام البيانات من الـ Model المحدث
        const calendarProperties: CalendarProperty[] = properties.map(p => ({
          id: p.id,
          title: p.title,
          // ✅ coverImage موجودة الآن في الـ Property Model
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

  generateEmptyCalendar(): void {
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
      
      days.push({
        date: new Date(dayDate),
        dayNumber: dayDate.getDate(),
        isCurrentMonth: dayDate.getMonth() === month,
        isToday: dayDate.getTime() === today.getTime(),
        isWeekend: dayDate.getDay() === 5 || dayDate.getDay() === 6,
        isAvailable: true,
        price: this.settings().basePrice || 0,
        hasBooking: false,
        isCheckIn: false,
        isCheckOut: false,
        isBlocked: false,
        isSelected: false
      });
      
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    this.calendarDays.set(days);
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
        isAvailable: apiDay?.isAvailable ?? true,
        price: apiDay?.price ?? this.settings().basePrice,
        originalPrice: apiDay?.originalPrice,
        hasBooking: apiDay?.hasBooking ?? false,
        bookingId: apiDay?.bookingId,
        bookingStatus: apiDay?.bookingStatus,
        guestName: apiDay?.guestName,
        isCheckIn: apiDay?.isCheckIn ?? false,
        isCheckOut: apiDay?.isCheckOut ?? false,
        isBlocked: apiDay?.isBlocked ?? false,
        notes: apiDay?.notes,
        isSelected: false
      });
      
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    this.calendarDays.set(days);
  }

  // ============================================
  // ✅ NEW: Day Details Sidebar Methods
  // ============================================
  
  onDayClick(day: CalendarDay, event: MouseEvent): void {
    if (!day.isCurrentMonth) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (day.date < today) return;

    // ✅ Open day details sidebar instead of selection
    this.openDaySidebar(day);
  }
  
  openDaySidebar(day: CalendarDay): void {
    this.selectedDaySignal.set(day);
    
    // Populate form with day data
    this.dayDetailsForm.patchValue({
      isAvailable: day.isAvailable,
      customPrice: day.originalPrice ? day.price : null,
      checkInTime: this.settings().checkInTime || null,
      checkOutTime: this.settings().checkOutTime || null,
      notes: day.notes || ''
    });
    
    // Store original values for comparison
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
    console.log('Availability changed:', this.dayDetailsForm.value.isAvailable);
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
    
    // Update availability if changed
    if (formValue.isAvailable !== day.isAvailable) {
      this.calendarService.updateAvailability({
        propertyId: parseInt(property.id),
        date: day.date,
        isAvailable: formValue.isAvailable,
        notes: formValue.notes
      }).subscribe({
        next: () => console.log('✅ Availability updated'),
        error: (err) => console.error('❌ Error:', err)
      });
    }
    
    // Update price if changed
    if (formValue.customPrice && formValue.customPrice !== day.price) {
      this.calendarService.updatePricing({
        propertyId: parseInt(property.id),
        date: day.date,
        price: formValue.customPrice,
        notes: formValue.notes
      }).subscribe({
        next: () => console.log('✅ Price updated'),
        error: (err) => console.error('❌ Error:', err)
      });
    }
    
    setTimeout(() => {
      this.savingDaySignal.set(false);
      this.closeDaySidebar();
      this.loadCalendarData();
    }, 500);
  }
  
  formatSelectedDate(): string {
    const day = this.selectedDay();
    if (!day) return '';
    return day.date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
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
      // Navigate to booking details
      console.log('Navigate to booking:', day.bookingId);
    }
  }

  // ============================================
  // ✅ NEW: Month Picker Methods
  // ============================================
  
  toggleMonthPicker(): void {
    this.showMonthPickerSignal.update(v => !v);
  }
  
  previousYear(): void {
    this.selectedYearSignal.update(y => y - 1);
  }
  
  nextYear(): void {
    this.selectedYearSignal.update(y => y + 1);
  }
  
  selectMonth(monthIndex: number): void {
    const newDate = new Date(this.selectedYear(), monthIndex, 1);
    this.currentDate.set(newDate);
    this.showMonthPickerSignal.set(false);
    this.loadCalendarData();
  }
  
  isSelectedMonth(monthIndex: number): boolean {
    const current = this.currentDate();
    return current.getMonth() === monthIndex && 
           current.getFullYear() === this.selectedYear();
  }
  
  isCurrentMonth(monthIndex: number): boolean {
    const now = new Date();
    return now.getMonth() === monthIndex && 
           now.getFullYear() === this.selectedYear();
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

  // ============================================
  // Existing Methods (Keep as before)
  // ============================================
  
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

  isPastDate(day: CalendarDay): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return day.date < today;
  }

  toggleDateSelection(date: Date): void {
    const selected = this.selectedDates();
    const dateTime = date.getTime();
    const index = selected.findIndex(d => d.getTime() === dateTime);

    if (index > -1) {
      selected.splice(index, 1);
    } else {
      selected.push(new Date(date));
    }

    this.selectedDates.set([...selected]);
    this.updateDaysSelection();
  }

  selectDateRange(endDate: Date): void {
    const selected = this.selectedDates();
    if (selected.length === 0) return;

    const startDate = selected[selected.length - 1];
    const start = Math.min(startDate.getTime(), endDate.getTime());
    const end = Math.max(startDate.getTime(), endDate.getTime());

    const rangeDates: Date[] = [];
    let current = new Date(start);

    while (current.getTime() <= end) {
      rangeDates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    this.selectedDates.set(rangeDates);
    this.updateDaysSelection();
  }

  updateDaysSelection(): void {
    const selected = this.selectedDates();
    const selectedTimes = new Set(selected.map(d => d.getTime()));

    const days = this.calendarDays().map(day => ({
      ...day,
      isSelected: selectedTimes.has(day.date.getTime())
    }));

    this.calendarDays.set(days);
  }

  clearSelection(): void {
    this.selectedDates.set([]);
    this.updateDaysSelection();
  }

  openPriceModal(): void {
    if (this.selectedDates().length === 0) {
      alert('Please select dates first');
      return;
    }
    this.showPriceModalSignal.set(true);
  }

  closePriceModal(): void {
    this.showPriceModalSignal.set(false);
  }

  openAvailabilityModal(): void {
    if (this.selectedDates().length === 0) {
      alert('Please select dates first');
      return;
    }
    this.showAvailabilityModalSignal.set(true);
  }

  closeAvailabilityModal(): void {
    this.showAvailabilityModalSignal.set(false);
  }

  openSettingsModal(): void {
    this.showSettingsModalSignal.set(true);
  }

  closeSettingsModal(): void {
    this.showSettingsModalSignal.set(false);
  }

  clearError(): void {
    this.errorSignal.set(null);
  }

  updatePricing(): void {
    if (this.priceForm.invalid) return;

    const property = this.selectedProperty();
    if (!property) return;

    const price = this.priceForm.value.price;
    const dates = this.selectedDates();

    dates.forEach(date => {
      this.calendarService.updatePricing({
        propertyId: parseInt(property.id),
        date: date,
        price: price,
        notes: null
      }).subscribe({
        next: () => console.log('✅ Price updated'),
        error: (err) => console.error('❌ Error:', err)
      });
    });

    this.closePriceModal();
    this.clearSelection();
    setTimeout(() => this.loadCalendarData(), 500);
  }

  updateAvailability(): void {
    if (this.availabilityForm.invalid) return;

    const property = this.selectedProperty();
    if (!property) return;

    const isAvailable = this.availabilityForm.value.isAvailable;
    const notes = this.availabilityForm.value.notes;
    const dates = this.selectedDates();

    dates.forEach(date => {
      this.calendarService.updateAvailability({
        propertyId: parseInt(property.id),
        date: date,
        isAvailable: isAvailable,
        notes: notes
      }).subscribe({
        next: () => console.log('✅ Availability updated'),
        error: (err) => console.error('❌ Error:', err)
      });
    });

    this.closeAvailabilityModal();
    this.clearSelection();
    setTimeout(() => this.loadCalendarData(), 500);
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
        alert('Settings updated successfully');
        this.closeSettingsModal();
        this.loadSettings();
      },
      error: (err) => {
        console.error('❌ Error:', err);
        alert('Failed to update settings');
      }
    });
  }


  getControl(name: string): FormControl {
    return this.dayDetailsForm.get(name) as FormControl;
  }

  formatPrice(price: number): string {
    return `$${Math.round(price)}`;
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
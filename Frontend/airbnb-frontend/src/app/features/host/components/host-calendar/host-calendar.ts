import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CalendarService } from '../../services/calendar-service';
import { PropertyService } from '../../services/property';
import { Property } from '../../models/property.model';

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
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './host-calendar.html',
  styleUrl: './host-calendar.css',
})
export class HostCalendar implements OnInit {
  private fb = inject(FormBuilder);
  private calendarService = inject(CalendarService);
  private propertyService = inject(PropertyService);

  // Current view state
  currentDate = signal<Date>(new Date());
  selectedProperty = signal<Property | null>(null);
  viewMode = signal<'month' | 'year'>('month');
  
  // Data
  properties = signal<Property[]>([]);
  calendarDays = signal<CalendarDay[]>([]);
  settings = signal<CalendarSettings>({
    basePrice: 0,
    minimumNights: 1,
    maximumNights: 365,
    advanceNotice: 0,
    preparationTime: 1
  });
  
  // Selection state
  selectedDates = signal<Date[]>([]);
  isSelectingRange = signal<boolean>(false);
  rangeStartDate = signal<Date | null>(null);
  
  // Loading & edit states
  loading = signal<boolean>(false);
  showPriceModal = signal<boolean>(false);
  showAvailabilityModal = signal<boolean>(false);
  showSettingsModal = signal<boolean>(false);
  
  // Forms
  priceForm!: FormGroup;
  availabilityForm!: FormGroup;
  settingsForm!: FormGroup;
  
  // Computed values
  currentMonthYear = computed(() => {
    return this.currentDate().toLocaleString('default', { month: 'long', year: 'numeric' });
  });
  
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  ngOnInit(): void {
    this.initializeForms();
    this.loadProperties();
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
  }

  loadProperties(): void {
    this.loading.set(true);
    
    this.propertyService.getAllProperties().subscribe({
      next: (properties) => {
        this.properties.set(properties);
        if (properties.length > 0) {
          this.selectProperty(properties[0]);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading properties:', err);
        this.loading.set(false);
      }
    });
  }

  selectProperty(property: Property): void {
    this.selectedProperty.set(property);
    this.loadCalendarData();
    this.loadSettings();
  }

  loadCalendarData(): void {
    const property = this.selectedProperty();
    if (!property) return;

    this.loading.set(true);
    
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
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading calendar:', err);
        this.loading.set(false);
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
      error: (err) => console.error('Error loading settings:', err)
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

  previousMonth(): void {
    const newDate = new Date(this.currentDate());
    newDate.setMonth(newDate.getMonth() - 1);
    this.currentDate.set(newDate);
    this.loadCalendarData();
  }

  nextMonth(): void {
    const newDate = new Date(this.currentDate());
    newDate.setMonth(newDate.getMonth() + 1);
    this.currentDate.set(newDate);
    this.loadCalendarData();
  }

  onDayClick(day: CalendarDay, event: MouseEvent): void {
    if (!day.isCurrentMonth) return;
    
    // Don't allow selection of past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (day.date < today) return;

    if (event.shiftKey && this.selectedDates().length > 0) {
      this.selectDateRange(day.date);
    } else {
      this.toggleDateSelection(day.date);
    }
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
    this.showPriceModal.set(true);
  }

  openAvailabilityModal(): void {
    if (this.selectedDates().length === 0) {
      alert('Please select dates first');
      return;
    }
    this.showAvailabilityModal.set(true);
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
        next: () => {},
        error: (err) => console.error('Error updating price:', err)
      });
    });

    this.showPriceModal.set(false);
    this.clearSelection();
    this.loadCalendarData();
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
        next: () => {},
        error: (err) => console.error('Error updating availability:', err)
      });
    });

    this.showAvailabilityModal.set(false);
    this.clearSelection();
    this.loadCalendarData();
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
        this.showSettingsModal.set(false);
        this.loadSettings();
      },
      error: (err) => {
        console.error('Error updating settings:', err);
        alert('Failed to update settings');
      }
    });
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


  goToToday() {
  this.currentDate.set(new Date());
  this.loadCalendarData();
}

}
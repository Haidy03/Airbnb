import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../services/booking';
import { PropertyService } from '../../services/property';
import { Property } from '../../models/property.model';
import { CalendarBooking, BookingStatus } from '../../models/booking.model';

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  bookings: CalendarBooking[];
  status: 'available' | 'booked' | 'blocked';
  price: number;
  weekendPrice?: number;
}


@Component({
  selector: 'app-host-calendar',
  imports: [CommonModule, FormsModule],
  templateUrl: './host-calendar.html',
  styleUrl: './host-calendar.css',
})
export class HostCalendar implements OnInit{
   // Current view state
  currentDate = signal<Date>(new Date());
  selectedProperty = signal<Property | null>(null);
  viewMode = signal<'month' | 'week'>('month');
  
  // Data
  properties = signal<Property[]>([]);
  bookings = signal<CalendarBooking[]>([]);
  calendarDays = signal<CalendarDay[]>([]);
  
  // Loading state
  loading = signal<boolean>(false);
  
  // Computed values
  currentMonthYear = computed(() => {
    return this.currentDate().toLocaleString('default', { month: 'long', year: 'numeric' });
  });
  
  // Week days
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Base pricing
  basePrice = 50;
  weekendPrice = 54;

  constructor(
    private bookingService: BookingService,
    private propertyService: PropertyService
  ) {}

  ngOnInit(): void {
    this.loadProperties();
    this.loadBookings();
  }

  /**
   * Load properties
   */
  loadProperties(): void {
    this.propertyService.getAllProperties().subscribe({
      next: (properties) => {
        this.properties.set(properties);
        if (properties.length > 0) {
          this.selectedProperty.set(properties[0]);
        }
      },
      error: (err) => console.error('Error loading properties:', err)
    });
  }

  /**
   * Load bookings for calendar
   */
  loadBookings(): void {
    const propertyId = this.selectedProperty()?.id;
    
    this.bookingService.getCalendarBookings(propertyId).subscribe({
      next: (bookings) => {
        this.bookings.set(bookings);
        this.generateCalendar();
      },
      error: (err) => {
        console.error('Error loading bookings:', err);
      }
    });
  }

  /**
   * Generate calendar days for current month
   */
  generateCalendar(): void {
    const year = this.currentDate().getFullYear();
    const month = this.currentDate().getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the first day of the week containing the first day of month
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // End at the last day of the week containing the last day of month
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentDay = new Date(startDate);
    
    while (currentDay <= endDate) {
      const dayDate = new Date(currentDay);
      dayDate.setHours(0, 0, 0, 0);
      
      const isWeekend = dayDate.getDay() === 5 || dayDate.getDay() === 6; // Fri & Sat
      
      // Find bookings for this day
      const dayBookings = this.bookings().filter(booking => {
        const checkIn = new Date(booking.checkInDate);
        const checkOut = new Date(booking.checkOutDate);
        checkIn.setHours(0, 0, 0, 0);
        checkOut.setHours(0, 0, 0, 0);
        
        return dayDate >= checkIn && dayDate < checkOut;
      });
      
      // Determine day status
      const status: CalendarDay['status'] = dayBookings.length > 0 ? 'booked' : 'available';
      
      days.push({
        date: new Date(dayDate),
        dayNumber: dayDate.getDate(),
        isCurrentMonth: dayDate.getMonth() === month,
        isToday: dayDate.getTime() === today.getTime(),
        isWeekend: isWeekend,
        bookings: dayBookings,
        status: status,
        price: isWeekend ? this.weekendPrice : this.basePrice,
        weekendPrice: isWeekend ? this.weekendPrice : undefined
      });
      
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    this.calendarDays.set(days);
  }

  /**
   * Navigate to previous month
   */
  previousMonth(): void {
    const newDate = new Date(this.currentDate());
    newDate.setMonth(newDate.getMonth() - 1);
    this.currentDate.set(newDate);
    this.generateCalendar();
  }

  /**
   * Navigate to next month
   */
  nextMonth(): void {
    const newDate = new Date(this.currentDate());
    newDate.setMonth(newDate.getMonth() + 1);
    this.currentDate.set(newDate);
    this.generateCalendar();
  }

  /**
   * Property selection changed
   */
  onPropertyChange(): void {
    this.loadBookings();
  }

  /**
   * Handle day click
   */
  onDayClick(day: CalendarDay): void {
    if (!day.isCurrentMonth) return;
    console.log('Day clicked:', day);
  }

  /**
   * Format price
   */
  formatPrice(price: number): string {
    return `$${price}`;
  }

  /**
   * Toggle view mode
   */
  toggleViewMode(): void {
    // Placeholder for view mode toggle
    console.log('Toggle view mode');
  }
}

import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

// 1. تحديث CalendarDay ليشمل أوقات الدخول والخروج المخصصة لليوم
export interface CalendarDay {
  date: Date;
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
  // ✅ إضافة الحقول الجديدة (قد تكون null)
  checkInTime?: string | null; 
  checkOutTime?: string | null;
}

export interface CalendarAvailability {
  propertyId: number;
  propertyTitle: string;
  startDate: Date;
  endDate: Date;
  days: CalendarDay[];
  settings: CalendarSettings;
}

// 2. تحديث CalendarSettings ليشمل CleaningFee
export interface CalendarSettings {
  propertyId: number;
  basePrice: number;
  weekendPrice?: number; 
  cleaningFee?: number; // ✅ إضافة Cleaning Fee
  minimumNights: number;
  maximumNights: number;
  advanceNotice: number;
  preparationTime: number;
  checkInTime?: string;
  checkOutTime?: string;
}

// 3. تحديث UpdateAvailabilityDto لإرسال الوقت
export interface UpdateAvailabilityDto {
  propertyId: number;
  date: Date;
  isAvailable: boolean;
  notes?: string | null;
  // ✅ إضافة الوقت
  checkInTime?: string | null; 
  checkOutTime?: string | null;
}

export interface UpdatePricingDto {
  propertyId: number;
  date: Date;
  price: number;
  notes?: string | null;
}

export interface BulkUpdateAvailabilityDto {
  propertyId: number;
  startDate: Date;
  endDate: Date;
  isAvailable: boolean;
  customPrice?: number | null;
  notes?: string | null;
}

// 4. تحديث UpdateCalendarSettingsDto
export interface UpdateCalendarSettingsDto {
  propertyId: number;
  basePrice?: number;
  cleaningFee?: number; // ✅ إضافة Cleaning Fee
  weekendPrice?: number;
  minimumNights?: number;
  maximumNights?: number;
  advanceNotice?: number;
  preparationTime?: number;
  checkInTime?: string;
  checkOutTime?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private apiUrl = `${environment.apiUrl}/host/calendar`;
  
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * Get availability for a property
   */
  getAvailability(
    propertyId: number,
    startDate: Date,
    endDate: Date
  ): Observable<CalendarAvailability> {
    this.loadingSignal.set(true);
    
    const params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString());

    return this.http.get<{ success: boolean; data: any }>(
      `${this.apiUrl}/availability/${propertyId}`,
      { headers: this.getHeaders(), params }
    ).pipe(
      map(response => {
        this.loadingSignal.set(false);
        return {
          ...response.data,
          days: response.data.days.map((day: any) => ({
            ...day,
            date: new Date(day.date),
            // ✅ قراءة التوقيتات المخصصة من الرد (تأكدي أن الاسم يطابق الباك إند: specificCheckInTime)
            checkInTime: day.specificCheckInTime, 
            checkOutTime: day.specificCheckOutTime
          }))
        };
      }),
      catchError(error => {
        this.loadingSignal.set(false);
        this.errorSignal.set(error.message);
        throw error;
      })
    );
  }

  /**
   * Update availability for specific dates
   */
  updateAvailability(dto: UpdateAvailabilityDto): Observable<boolean> {
    return this.http.post<{ success: boolean }>(
      `${this.apiUrl}/availability`,
      dto,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.success),
      catchError(error => {
        this.errorSignal.set(error.message);
        throw error;
      })
    );
  }

  /**
   * Update pricing for specific dates
   */
  updatePricing(dto: UpdatePricingDto): Observable<boolean> {
    return this.http.post<{ success: boolean }>(
      `${this.apiUrl}/pricing`,
      dto,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.success),
      catchError(error => {
        this.errorSignal.set(error.message);
        throw error;
      })
    );
  }

  /**
   * Bulk update availability for date range
   */
  bulkUpdateAvailability(dto: BulkUpdateAvailabilityDto): Observable<number> {
    return this.http.post<{ success: boolean; datesUpdated: number }>(
      `${this.apiUrl}/availability/bulk`,
      dto,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.datesUpdated),
      catchError(error => {
        this.errorSignal.set(error.message);
        throw error;
      })
    );
  }

  /**
   * Get calendar settings
   */
  getSettings(propertyId: number): Observable<CalendarSettings> {
    return this.http.get<{ success: boolean; data: CalendarSettings }>(
      `${this.apiUrl}/settings/${propertyId}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        this.errorSignal.set(error.message);
        throw error;
      })
    );
  }

  /**
   * Update calendar settings
   */
  updateSettings(dto: UpdateCalendarSettingsDto): Observable<boolean> {
    return this.http.put<{ success: boolean }>(
      `${this.apiUrl}/settings`,
      dto,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.success),
      catchError(error => {
        this.errorSignal.set(error.message);
        throw error;
      })
    );
  }
}
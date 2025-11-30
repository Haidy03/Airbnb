import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

// DTO للإرسال إلى الباك إند (مطابق للـ Backend)
export interface CreateBookingDto {
  propertyId: number;
  checkInDate: string; // ISO String
  checkOutDate: string; // ISO String
  numberOfGuests: number;
  specialRequests?: string;
}

// DTO للاستقبال من الباك إند
export interface BookingResponse {
  id: number;
  status: string;
  totalPrice: number;
  propertyTitle: string;
  propertyImage: string;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
  numberOfNights: number;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {

  private apiUrl = `${environment.apiUrl}/Booking`;

  constructor(private http: HttpClient) { }

  // ✅ إنشاء حجز جديد
  createBooking(bookingData: CreateBookingDto): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(this.apiUrl, bookingData).pipe(
      map(dto => ({
        ...dto,
        checkInDate: new Date(dto.checkInDate),
        checkOutDate: new Date(dto.checkOutDate),
        propertyImage: this.fixImageUrl(dto.propertyImage)
      }))
    );
  }

  // ✅ جلب جميع حجوزات المستخدم
  getMyTrips(): Observable<BookingResponse[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my-trips`).pipe(
      map(dtos => dtos.map(dto => ({
        ...dto,
        checkInDate: new Date(dto.checkInDate),
        checkOutDate: new Date(dto.checkOutDate),
        propertyImage: this.fixImageUrl(dto.propertyImage)
      })))
    );
  }

  // ✅ جلب تفاصيل حجز معين
  getBookingById(id: number): Observable<BookingResponse> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(dto => ({
        ...dto,
        checkInDate: new Date(dto.checkInDate),
        checkOutDate: new Date(dto.checkOutDate),
        propertyImage: this.fixImageUrl(dto.propertyImage)
      }))
    );
  }

  confirmBookingPayment(bookingId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${bookingId}/confirm-payment`, {});
  }


  // ✅ إلغاء حجز
  cancelTrip(bookingId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${bookingId}/cancel`, {});
  }

  // دالة مساعدة لإصلاح الصور
  private fixImageUrl(url: string): string {
    if (!url) return 'assets/images/placeholder.jpg';
    if (url.startsWith('http')) return url;
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    return `${environment.imageBaseUrl || 'http://localhost:5000'}/${cleanUrl}`;
  }
}
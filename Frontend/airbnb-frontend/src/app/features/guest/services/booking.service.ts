import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

// تعريف شكل البيانات زي ما الباك بيبعتها (BookingResponseDto)
export interface Booking {
  id: number;
  propertyId: number;
  propertyTitle: string;
  propertyImage: string;

  checkInDate: Date;
  checkOutDate: Date;

  totalPrice: number;
  status: string; // 'Pending', 'Confirmed', 'Cancelled', 'Completed'

  hostName: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {

  private apiUrl = `${environment.apiUrl}/Booking`;

  constructor(private http: HttpClient) { }

  // جلب جميع حجوزات المستخدم
  getMyTrips(): Observable<Booking[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my-trips`).pipe(
      map(dtos => dtos.map(dto => ({
        ...dto,
        checkInDate: new Date(dto.checkInDate),
        checkOutDate: new Date(dto.checkOutDate),
        // إصلاح رابط الصورة لو جاي نسبي
        propertyImage: this.fixImageUrl(dto.propertyImage)
      })))
    );
  }

  // إلغاء حجز
  cancelTrip(bookingId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${bookingId}/cancel`, {});
  }

  private fixImageUrl(url: string): string {
    if (!url) return 'assets/placeholder.jpg';
    if (url.startsWith('http')) return url;
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    return `${environment.imageBaseUrl}/${cleanUrl}`;
  }
}

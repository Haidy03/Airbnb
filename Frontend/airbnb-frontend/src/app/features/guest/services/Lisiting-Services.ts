// src/app/services/listing.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Listing ,TranslationResponse,TranslationRequest} from '../models/listing-model';
import { environment } from '../../../../environments/environment';
import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class ListingService {

  // هذا الرابط سيتم تفعيله عندما ينتهي زميلك من الباك إند
  private apiUrl = `${environment.apiUrl}/Search`;
  private translateApiUrl = `${environment.apiUrl}/Translation`;

  constructor(private http: HttpClient) { }

  getListingById(id: string): Observable<Listing> {
   return this.http.get<Listing>(`${this.apiUrl}/${id}`);
   // return of(this.MOCK_LISTING);

  }
    translateText(text: string): Observable<TranslationResponse> {
    const payload: TranslationRequest = { text: text };
    // الطلب: POST /api/translate
    return this.http.post<TranslationResponse>(this.translateApiUrl, payload);
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken'); // أو حسب طريقة التخزين عندك
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }
  toggleWishlist(propertyId: string): Observable<any> {
  // لاحظي: استخدمنا الرابط الجديد الذي يدعم البيوت
  return this.http.post<any>(`${environment.apiUrl}/wishlist/toggle-property/${propertyId}`, {}, {
    headers: this.getHeaders() // تأكدي من وجود دالة getHeaders
  });
}

// 2. التحقق من حالة المفضلة
checkIsWishlisted(propertyId: string): Observable<boolean> {
  return this.http.get<any>(`${environment.apiUrl}/wishlist/check-property/${propertyId}`, {
    headers: this.getHeaders()
  }).pipe(
    map((res: any) => res.isWishlisted) // يحتاج import { map } from 'rxjs/operators';
  );
}

}

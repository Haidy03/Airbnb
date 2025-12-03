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


  private apiUrl = `${environment.apiUrl}/Search`;
  private translateApiUrl = `${environment.apiUrl}/Translation`;

  constructor(private http: HttpClient) { }

  getListingById(id: string): Observable<Listing> {
   return this.http.get<Listing>(`${this.apiUrl}/${id}`);


  }
    translateText(text: string): Observable<TranslationResponse> {
    const payload: TranslationRequest = { text: text };
    
    return this.http.post<TranslationResponse>(this.translateApiUrl, payload);
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken'); 
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }
  toggleWishlist(propertyId: string): Observable<any> {
 
  return this.http.post<any>(`${environment.apiUrl}/wishlist/toggle-property/${propertyId}`, {}, {
    headers: this.getHeaders() 
  });
}


checkIsWishlisted(propertyId: string): Observable<boolean> {
  return this.http.get<any>(`${environment.apiUrl}/wishlist/check-property/${propertyId}`, {
    headers: this.getHeaders()
  }).pipe(
    map((res: any) => res.isWishlisted)
  );
}
getBlockedDates(propertyId: string): Observable<string[]> {
  return this.http.get<string[]>(`${environment.apiUrl}/host/calendar/availability/${propertyId}/blocked`);
}

}

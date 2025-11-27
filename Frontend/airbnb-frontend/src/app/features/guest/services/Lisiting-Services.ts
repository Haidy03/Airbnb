// src/app/services/listing.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Listing ,TranslationResponse,TranslationRequest} from '../models/listing-model';
import { environment } from '../../../../environments/environment';

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

}

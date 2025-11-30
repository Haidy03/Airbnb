import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createCheckoutSession(amount: number, propertyTitle: string): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(
      `${this.apiUrl}/Payment/create-checkout`,
      { amount, propertyTitle }
    );
  }
}
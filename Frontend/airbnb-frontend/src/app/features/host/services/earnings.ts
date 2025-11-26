import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EarningsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/host/earnings`;

  getEarnings(): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    return this.http.get<any>(this.apiUrl, { headers }).pipe(
      map(res => res.data)
    );
  }
}
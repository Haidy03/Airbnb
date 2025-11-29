import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, ServiceCard } from '../models/service.model';

@Injectable({
  providedIn: 'root'
})
export class ServicesService {

  // تأكدي من أن environment.apiUrl يشير للباك إند (مثلاً localhost:5000/api)
  private apiUrl = `${environment.apiUrl}/Services`; 

  constructor(private http: HttpClient) { }

  getFeaturedServices(): Observable<ApiResponse<ServiceCard[]>> {
    return this.http.get<ApiResponse<ServiceCard[]>>(`${this.apiUrl}/featured`);
  }

  getServicesByCategory(categoryName: string): Observable<ApiResponse<ServiceCard[]>> {
    return this.http.get<ApiResponse<ServiceCard[]>>(`${this.apiUrl}/category/${categoryName}`);
  }
}
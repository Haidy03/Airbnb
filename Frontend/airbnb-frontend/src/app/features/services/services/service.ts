import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, ServiceCard ,ServiceCategory} from '../models/service.model';


@Injectable({
  providedIn: 'root'
})
export class ServicesService {

  private apiUrl = `${environment.apiUrl}/Services`; 

  constructor(private http: HttpClient) { }

  getFeaturedServices(): Observable<ApiResponse<ServiceCard[]>> {
    return this.http.get<ApiResponse<ServiceCard[]>>(`${this.apiUrl}/featured`);
  }

  getServicesByCategory(categoryName: string): Observable<ApiResponse<ServiceCard[]>> {
    return this.http.get<ApiResponse<ServiceCard[]>>(`${this.apiUrl}/category/${categoryName}`);
  }

  getServiceDetails(id: number): Observable<ApiResponse<any>> { 
  return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}`);
}

  getAllCategories(): Observable<ApiResponse<ServiceCategory[]>> {
        return this.http.get<ApiResponse<ServiceCategory[]>>(`${this.apiUrl}/categories`);
      }
  createService(data: FormData): Observable<any> {
  return this.http.post(`${this.apiUrl}`, data);
  }
}
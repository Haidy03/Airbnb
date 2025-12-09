import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, ServiceCard ,ServiceCategory} from '../models/service.model';
import { HostService } from '../models/service.model'; 
import { map } from 'rxjs/operators';
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

  getHostServices(): Observable<ApiResponse<HostService[]>> {
    return this.http.get<ApiResponse<HostService[]>>(`${this.apiUrl}/my-services`);
  }

  // Get Details for Host (Edit View)
  getHostServiceDetails(id: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/host/${id}`);
  }

  deleteService(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  toggleServiceStatus(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/toggle-status`, {});
  }
  bookService(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/book`, data);
  }
  confirmPayment(bookingId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/booking/${bookingId}/confirm-payment`, {});
  }
  updateService(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }
   toggleWishlist(serviceId: number): Observable<any> {
    return this.http.post(`${this.apiUrl.replace('/Services', '')}/Wishlist/toggle-service/${serviceId}`, {});
  }

  checkIsWishlisted(serviceId: number): Observable<boolean> {
    return this.http.get<{ isWishlisted: boolean }>(
      `${this.apiUrl.replace('/Services', '')}/Wishlist/check-service/${serviceId}`
    ).pipe(map(res => res.isWishlisted));
  }

  // ✅ NEW: Reviews Methods
  // ==========================================


  addReview(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/reviews`, data);
  }

  
  getReviews(serviceId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${serviceId}/reviews`);
  }

  deleteReview(reviewId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/reviews/${reviewId}`);
  }

  getReviewById(reviewId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/reviews/${reviewId}`);
  }

 
  updateReview(reviewId: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/reviews/${reviewId}`, data);
  }
  cancelBooking(bookingId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/bookings/${bookingId}/cancel`, {});
  }

  uploadImage(serviceId: number, file: File): Observable<any> {
  const formData = new FormData();
  formData.append('file', file);
  return this.http.post(`${this.apiUrl}/${serviceId}/images`, formData);
}

deleteImage(imageId: number): Observable<any> {
  return this.http.delete(`${this.apiUrl}/images/${imageId}`);
}

setCoverImage(imageId: number): Observable<any> {
  return this.http.patch(`${this.apiUrl}/images/${imageId}/cover`, {});
}
}
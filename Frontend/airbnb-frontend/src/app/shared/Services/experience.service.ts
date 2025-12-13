import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'; // ✅ هام جداً عشان map تشتغل
import { environment } from '../../../environments/environment';
import {
  Experience,
  CreateExperienceDto,
  UpdateExperienceDto,
  ExperienceSearchDto,
  BookExperienceDto,
  CreateReviewDto,
  CreateAvailabilityDto
} from '../models/experience.model';

@Injectable({
  providedIn: 'root'
})
export class ExperienceService {
  // الرابط الأساسي للتجارب
  private apiUrl = `${environment.apiUrl}/experiences`;
  // الرابط الأساسي للمفضلة (بناءً على الكنترولر اللي عملناه)
  private wishlistUrl = `${environment.apiUrl}/wishlist`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // ==========================================
  // 1. PUBLIC ENDPOINTS
  // ==========================================

  searchExperiences(filters: any): Observable<any> {
    let params = new HttpParams();

    // ✅ إضافة كل الفلاتر الممكنة
    if (filters.searchTerm) params = params.set('searchTerm', filters.searchTerm);
    if (filters.location) params = params.set('location', filters.location);
    if (filters.category) params = params.set('categoryId', filters.category.toString()); // انتبهي للاسم في الباك إند (CategoryId)
    if (filters.categoryId) params = params.set('categoryId', filters.categoryId.toString()); // احتياطي لو الاسم مختلف
    if (filters.guests) params = params.set('guests', filters.guests.toString());
    if (filters.duration) params = params.set('duration', filters.duration.toString());
    
    if (filters.minPrice) params = params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params = params.set('maxPrice', filters.maxPrice.toString());
    if (filters.type) params = params.set('type', filters.type);
    if (filters.language) params = params.set('language', filters.language);
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    
    // Pagination
    if (filters.pageNumber) params = params.set('pageNumber', filters.pageNumber.toString());
    if (filters.pageSize) params = params.set('pageSize', filters.pageSize.toString());

    return this.http.get<any>(`${this.apiUrl}/search`, { params });
  }

  getFeaturedExperiences(count: number = 8): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/featured?count=${count}`);
  }

  getCategories(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/categories`);
  }

  getExperienceById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // ==========================================
  // 2. HOST ENDPOINTS
  // ==========================================

  getMyExperiences(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/host/my-experiences`, {
      headers: this.getHeaders()
    });
  }

  createExperience(dto: CreateExperienceDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto, {
      headers: this.getHeaders()
    });
  }

  updateExperience(id: number, dto: UpdateExperienceDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto, {
      headers: this.getHeaders()
    });
  }

  deleteExperience(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  submitForApproval(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/submit`, {}, {
      headers: this.getHeaders()
    });
  }

  activateExperience(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/activate`, {}, {
      headers: this.getHeaders()
    });
  }

  // ==========================================
  // 3. IMAGE MANAGEMENT
  // ==========================================

  uploadImage(experienceId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
    return this.http.post<any>(
      `${this.apiUrl}/${experienceId}/images`,
      formData,
      { headers }
    );
  }

  deleteImage(imageId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/images/${imageId}`, {
      headers: this.getHeaders()
    });
  }

  setPrimaryImage(imageId: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/images/${imageId}/primary`, {}, {
      headers: this.getHeaders()
    });
  }

  // ==========================================
  // 4. BOOKING & AVAILABILITY
  // ==========================================

  bookExperience(experienceId: number, dto: BookExperienceDto): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${experienceId}/book`, dto, {
      headers: this.getHeaders()
    });
  }

  getMyBookings(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/bookings/my-bookings`, {
      headers: this.getHeaders()
    });
  }

  getAvailability(experienceId: number, startDate: Date, endDate: Date): Observable<any> {
    const params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString());

    return this.http.get<any>(`${this.apiUrl}/${experienceId}/availability`, { params });
  }

  // ==========================================
  // 5. REVIEWS (التقييمات)
  // ==========================================

  addReview(dto: CreateReviewDto): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reviews`, dto, {
      headers: this.getHeaders()
    });
  }

  getReviews(experienceId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${experienceId}/reviews`);
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

  // ==========================================
  // 6. WISHLIST (المفضلة) ✅✅✅ (الجزء الناقص)
  // ==========================================

  // إضافة/حذف من المفضلة
  toggleWishlist(experienceId: number): Observable<any> {
    return this.http.post<any>(`${this.wishlistUrl}/toggle/${experienceId}`, {}, {
      headers: this.getHeaders()
    });
  }

  // التحقق هل العنصر في المفضلة
  checkIsWishlisted(experienceId: number): Observable<boolean> {
    return this.http.get<any>(`${this.wishlistUrl}/check/${experienceId}`, {
      headers: this.getHeaders()
    }).pipe(
      map((res: any) => res.isWishlisted)
    );
  }

  // ✅ جلب قائمة المفضلة بالكامل
  getWishlist(): Observable<any> {
    return this.http.get<any>(`${this.wishlistUrl}`, {
      headers: this.getHeaders()
    });
  }

  // ==========================================
  // 7. HELPER METHODS
  // ==========================================

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Active': return 'badge-success';
      case 'Draft': return 'badge-secondary';
      case 'PendingApproval': return 'badge-warning';
      case 'Approved': return 'badge-info';
      case 'Rejected': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  addAvailability(experienceId: number, dto: CreateAvailabilityDto): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/${experienceId}/availability`, dto, {
    headers: this.getHeaders()
  });
}

// 2. دالة جلب المواعيد
getAvailabilities(experienceId: number, startDate: Date, endDate: Date): Observable<any> {
  const params = new HttpParams()
    .set('startDate', startDate.toISOString())
    .set('endDate', endDate.toISOString());

  return this.http.get<any>(`${this.apiUrl}/${experienceId}/availability`, { 
    params,
    headers: this.getHeaders() 
  }).pipe(
    map((res: any) => res.data || [])
  );
}

// 3. دالة حذف موعد
deleteAvailability(availabilityId: number): Observable<any> {
  return this.http.delete<any>(`${this.apiUrl}/availability/${availabilityId}`, {
    headers: this.getHeaders()
  });
}
cancelBooking(bookingId: number): Observable<any> {
    // نفترض أن المسار في الباك إند هو: api/Experiences/bookings/{id}/cancel
    return this.http.post(`${this.apiUrl}/bookings/${bookingId}/cancel`, {});
  }
}
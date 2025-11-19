import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  CreateReviewDto, 
  UpdateReviewDto, 
  ReviewResponse, 
  PropertyReviewsSummary,
  GuestReviewsSummary,
  CanReviewResponse 
} from '../models/review.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = `${environment.apiUrl}/Reviews`;

  constructor(private http: HttpClient) { }

  createReview(review: CreateReviewDto): Observable<ReviewResponse> {
    return this.http.post<ReviewResponse>(this.apiUrl, review);
  }

  updateReview(reviewId: number, review: UpdateReviewDto): Observable<ReviewResponse> {
    return this.http.put<ReviewResponse>(`${this.apiUrl}/${reviewId}`, review);
  }

  deleteReview(reviewId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${reviewId}`);
  }

  getReviewById(reviewId: number): Observable<ReviewResponse> {
    return this.http.get<ReviewResponse>(`${this.apiUrl}/${reviewId}`);
  }

  getPropertyReviews(propertyId: number, page: number = 1, pageSize: number = 10): Observable<PropertyReviewsSummary> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    
    return this.http.get<PropertyReviewsSummary>(`${this.apiUrl}/property/${propertyId}`, { params });
  }

  getGuestReviews(guestId: string): Observable<GuestReviewsSummary> {
    return this.http.get<GuestReviewsSummary>(`${this.apiUrl}/guest/${guestId}`);
  }

  canReview(bookingId: number): Observable<CanReviewResponse> {
    return this.http.get<CanReviewResponse>(`${this.apiUrl}/can-review/${bookingId}`);
  }

  getMyReviews(): Observable<ReviewResponse[]> {
    return this.http.get<ReviewResponse[]>(`${this.apiUrl}/my-reviews`);
  }
}
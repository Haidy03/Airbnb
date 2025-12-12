import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ProfileDetails, Trip, Connection } from '../models/user.model';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  // ✅ Ensure this matches your Backend Port (check Swagger URL)
  private readonly API_BASE_URL = 'https://localhost:5202';
  private readonly apiUrl = `${this.API_BASE_URL}/api`;

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
  
  // ✅ Fixes 404 by prepending the backend URL
  private transformUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path; 
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    const timestamp = new Date().getTime();
    // ✅ Returns: https://localhost:5202/uploads/profiles/xxx.jpg?t=123
    return `${this.API_BASE_URL}/${cleanPath}?t=${timestamp}`;
  }

  getCurrentUser(): Observable<any> {
     return this.http.get<any>(`${this.apiUrl}/Auth/profile`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(user => {
        const rawPic = user.profileImageUrl || user.profileImage || user.profilePicture;
        return {
          ...user,
          profileImage: this.transformUrl(rawPic), 
          profilePicture: this.transformUrl(rawPic),
          initial: user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'
        };
      }),
      catchError(error => {
        console.error('Error fetching user profile:', error);
        return throwError(() => error);
      })
    );
  }

  getProfileDetails(): Observable<ProfileDetails> {
    return this.http.get<any>(`${this.apiUrl}/Auth/profile`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(data => {
        let imgUrl = data.profileImageUrl || data.profileImage;
        if (imgUrl) {
          imgUrl = this.transformUrl(imgUrl);
        }

        return {
          ...data,
          profileImage: imgUrl,
          firstName: data.firstName,
          lastName: data.lastName,
          aboutMe: data.aboutMe || data.bio, 
          whereILive: data.whereILive || data.city
        } as ProfileDetails;
      }),
      catchError(error => {
        console.error('Error fetching profile details:', error);
        return throwError(() => error);
      })
    );
  }

  updateProfileDetails(details: ProfileDetails): Observable<ProfileDetails> {
    return this.http.put<ProfileDetails>(
      `${this.apiUrl}/Auth/profile`, 
      details,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error updating profile:', error);
        return throwError(() => error);
      })
    );
  }

  uploadProfileImage(file: File): Observable<{url: string}> {
    const formData = new FormData();
    formData.append('file', file); 
    const headers = this.getAuthHeaders();

    return this.http.post<{url: string, message: string}>(
      `${this.apiUrl}/Auth/upload-photo`, 
      formData,
      { headers } // لا تضيفي Content-Type: multipart/form-data، المتصفح بيضيفه لوحده
    ).pipe(
       map(response => {
        // ✅ المهم هنا: بنرجع الرابط الكامل عشان الكومبوننت يبعته للـ AuthService صح
        return { 
          url: this.transformUrl(response.url) 
        };
       })
    );
  }

  getPastTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${this.apiUrl}/Booking/my-trips`, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(() => of([])));
  }

  getConnections(): Observable<Connection[]> {
    return of([]); 
  }
}
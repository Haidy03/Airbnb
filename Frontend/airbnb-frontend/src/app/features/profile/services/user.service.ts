import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs'; // Removed 'of' and 'delay'
import { catchError, map } from 'rxjs/operators';
import { ProfileDetails, Trip, Connection } from '../models/user.model';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'https://localhost:5202/api';
  private readonly API_BASE_URL = 'https://localhost:5202/';

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
  
  private transformUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${this.API_BASE_URL}${cleanPath}`;
  }

  getCurrentUser(): Observable<any> {
     return this.http.get<any>(`${this.apiUrl}/Auth/profile`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(user => {
        const rawPic = user.profileImage || user.profilePicture || user.avatar;
        return {
          ...user,
          profileImage: this.transformUrl(rawPic), 
          profilePicture: this.transformUrl(rawPic),
          // Calculate initial if not present
          initial: user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'
        };
      }),
      catchError(error => {
        console.error('Error fetching user profile:', error);
        return throwError(() => error);
      })
    );
  }

  // ✅ FIXED: Now actually calls the Backend API
  getProfileDetails(): Observable<ProfileDetails> {
    return this.http.get<ProfileDetails>(`${this.apiUrl}/Auth/profile`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(data => {
        // Optional: Transform image URL if it exists in the details
        if (data.profileImage) {
          data.profileImage = this.transformUrl(data.profileImage);
        }
        return data;
      }),
      catchError(error => {
        console.error('Error fetching profile details:', error);
        return throwError(() => error);
      })
    );
  }

  // ✅ FIXED: Now actually calls the Backend API
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
    formData.append('file', file); // Backend expects 'file'

    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<{url: string}>(
      `${this.apiUrl}/Auth/upload-photo`, 
      formData,
      { headers }
    ).pipe(
       map(response => {
        return { 
          url: this.transformUrl(response.url) 
        };
      }),
      catchError(error => {
        console.error('Error uploading image:', error);
        return throwError(() => error);
      })
    );
  }

  getPastTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${this.apiUrl}/Booking/my-trips`, {
      headers: this.getAuthHeaders()
    });
  }

  getConnections(): Observable<Connection[]> {
    // If you haven't implemented connections yet, return empty array
    return this.http.get<Connection[]>(`${this.apiUrl}/Auth/connections`, { // Update URL when ready
       headers: this.getAuthHeaders()
    }).pipe(
        catchError(() => []) // Return empty if failed or not implemented
    ) as any;
  }
}
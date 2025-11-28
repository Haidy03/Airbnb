import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ProfileDetails, Trip, Connection } from '../models/user.model';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  // Ensure this matches your running Backend Port (5202 or 7076)
  private readonly API_BASE_URL = 'https://localhost:5202';
  private readonly apiUrl = `${this.API_BASE_URL}/api`;

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
  
  private transformUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path; // Already absolute
    
    // Remove leading slash to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${this.API_BASE_URL}/${cleanPath}`;
  }

  // 1. Get Basic User Info (Header/Avatar)
  getCurrentUser(): Observable<any> {
    const currentAuthUser = this.authService.currentUser;
    if (!currentAuthUser) {
      return throwError(() => new Error('No authenticated user'));
    }

     return this.http.get<any>(`${this.apiUrl}/Auth/profile`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(user => {
        // Handle different naming conventions from backend
        const rawPic = user.profileImageUrl || user.profileImage || user.profilePicture || user.avatar;
        
        return {
          ...user,
          // Transform to full URL for display
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

  // 2. Get Extended Profile Details (About Me Page)
  getProfileDetails(): Observable<ProfileDetails> {
    return this.http.get<any>(`${this.apiUrl}/Auth/profile`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(data => {
        // 1. Transform Image URL
        let imgUrl = data.profileImageUrl || data.profileImage;
        if (imgUrl) {
          imgUrl = this.transformUrl(imgUrl);
        }

        // 2. Map Backend fields to Frontend Model
        return {
          ...data,
          profileImage: imgUrl,
          firstName: data.firstName,
          lastName: data.lastName,
          // Map fallbacks (Backend 'Bio' -> Frontend 'aboutMe')
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

  // 3. Update Profile Details
  updateProfileDetails(details: ProfileDetails): Observable<ProfileDetails> {
    // We send the details as-is. 
    // The backend DTO should handle 'AboutMe' and 'WhereILive' directly.
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

  // 4. Upload Profile Image
  uploadProfileImage(file: File): Observable<{url: string}> {
    const formData = new FormData();
    formData.append('file', file); // Backend expects 'file'

    const token = this.authService.getToken();
    // Do NOT set Content-Type header for FormData
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<{url: string, message: string}>(
      `${this.apiUrl}/Auth/upload-photo`, 
      formData,
      { headers }
    ).pipe(
       map(response => {
        // Return the TRANSFORMED URL so the UI can display it immediately
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

  // 5. Get My Trips
  getPastTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${this.apiUrl}/Booking/my-trips`, {
      headers: this.getAuthHeaders()
    });
  }

  // 6. Connections (Placeholder)
  getConnections(): Observable<Connection[]> {
    // Return empty array to prevent crashes if not implemented
    return throwError(() => new Error('Not implemented'));
  }
}
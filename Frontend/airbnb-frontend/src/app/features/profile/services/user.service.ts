import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, map, throwError } from 'rxjs';
import { delay, catchError } from 'rxjs/operators';
import { Profile, ProfileDetails, Trip, Connection } from '../models/user.model';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'https://localhost:5202/api';

  // Helper method to get auth headers
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getCurrentUser(): Observable<{success: boolean; data: any[]; initial: string}> {
    // Get authenticated user from AuthService
    const currentAuthUser = this.authService.currentUser;
    
    if (!currentAuthUser) {
      return throwError(() => new Error('No authenticated user'));
    }

    // OPTION 1: Use AuthService data directly (current implementation)
    const fullName = currentAuthUser.fullName || 
                     (currentAuthUser.firstName && currentAuthUser.lastName 
                       ? `${currentAuthUser.firstName} ${currentAuthUser.lastName}` 
                       : currentAuthUser.email?.split('@')[0] || 'User');
    
    const initial = currentAuthUser.firstName 
                    ? currentAuthUser.firstName.charAt(0).toUpperCase()
                    : fullName.charAt(0).toUpperCase();

    
    return this.http.get<{success:boolean ; data: any[]}>(
      `${this.apiUrl}/Auth/profile`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(user => ({
        ...user,
        initial: initial
      })),
      catchError(error => {
        console.error('Error fetching user profile:', error);
        return throwError(() => error);
      })
    );
    
  }

  getProfileDetails(): Observable<ProfileDetails> {
    // Real API call with authentication
    // return this.http.get<ProfileDetails>(`${this.apiUrl}/user/profile-details`, {
    //   headers: this.getAuthHeaders()
    // });

    return of({
      whereToGo: '',
      myWork: '',
      spendTime: '',
      pets: '',
      bornDecade: '',
      school: '',
      uselessSkill: '',
      funFact: '',
      favoriteSong: '',
      obsessedWith: '',
      biographyTitle: '',
      languages: '',
      whereILive: '',
      aboutMe: ''
    }).pipe(delay(300));
  }

  updateProfileDetails(details: ProfileDetails): Observable<ProfileDetails> {
    // Real API call with authentication
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

    // Mock implementation (comment out when using real API)
    // console.log('Saving profile details:', details);
    // return of(details).pipe(delay(500));
  }

  uploadProfileImage(file: File): Observable<{url: string}> {
    const formData = new FormData();
    formData.append('image', file);

    // Real API call with authentication
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // Don't set Content-Type for FormData, browser will set it automatically
    });

    return this.http.post<{url: string}>(
      `${this.apiUrl}/user/upload-image`, 
      formData,
      { headers }
    ).pipe(
      catchError(error => {
        console.error('Error uploading image:', error);
        return throwError(() => error);
      })
    );

    // Mock implementation (comment out when using real API)
    // console.log('Uploading image:', file.name);
    // return of({ url: URL.createObjectURL(file) }).pipe(delay(1000));
  }

  getPastTrips(): Observable<Trip[]> {
    // Real API call with authentication
    return this.http.get<Trip[]>(`${this.apiUrl}/Booking/my-trips`, {
      headers: this.getAuthHeaders()
    });

    return of([]).pipe(delay(500));
  }

  getConnections(): Observable<Connection[]> {
    // Real API call with authentication
    // return this.http.get<Connection[]>(`${this.apiUrl}/user/connections`, {
    //   headers: this.getAuthHeaders()
    // });

    return of([]).pipe(delay(500));
  }
}

  // getProfileDetails(): Observable<ProfileDetails> {
  //   // Real API: return this.http.get<ProfileDetails>(`${this.apiUrl}/user/profile-details`);
  //   return of({
  //     whereToGo: '',
  //     myWork: '',
  //     spendTime: '',
  //     pets: '',
  //     bornDecade: '',
  //     school: '',
  //     uselessSkill: '',
  //     funFact: '',
  //     favoriteSong: '',
  //     obsessedWith: '',
  //     biographyTitle: '',
  //     languages: '',
  //     whereILive: '',
  //     aboutMe: ''
  //   }).pipe(delay(300));
  // }

  // updateProfileDetails(details: ProfileDetails): Observable<ProfileDetails> {
  //   // Real API: return this.http.put<ProfileDetails>(`${this.apiUrl}/user/profile-details`, details);
  //   console.log('Saving profile details:', details);
  //   return of(details).pipe(delay(500));
  // }

  // uploadProfileImage(file: File): Observable<{url: string}> {
  //   // Real API implementation:
  //   // const formData = new FormData();
  //   // formData.append('image', file);
  //   // return this.http.post<{url: string}>(`${this.apiUrl}/user/upload-image`, formData);
    
  //   console.log('Uploading image:', file.name);
  //   return of({ url: URL.createObjectURL(file) }).pipe(delay(1000));
  // }

  // getPastTrips(): Observable<Trip[]> {
  //   // Real API: return this.http.get<Trip[]>(`${this.apiUrl}/user/trips`);
  //   return of([]).pipe(delay(500));
  // }

  // getConnections(): Observable<Connection[]> {
  //   // Real API: return this.http.get<Connection[]>(`${this.apiUrl}/user/connections`);
  //   return of([]).pipe(delay(500));
  // }

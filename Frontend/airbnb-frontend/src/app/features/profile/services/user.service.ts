import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Connection, Profile, ProfileDetails, Trip } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'https://api.example.com';

  constructor(private http: HttpClient) {}

  getCurrentUser(): Observable<Profile> { 
    return of({
      id: '1',
      name: 'Ayman Elzoghby',
      initial: 'A',
      email: 'ayman@example.com',
      role: 'Guest'
    }).pipe(delay(500));
  }

  getProfileDetails(): Observable<ProfileDetails> {
    // Real API: return this.http.get<ProfileDetails>(`${this.apiUrl}/user/profile-details`);
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
    // Real API: return this.http.put<ProfileDetails>(`${this.apiUrl}/user/profile-details`, details);
    console.log('Saving profile details:', details);
    return of(details).pipe(delay(500));
  }

  uploadProfileImage(file: File): Observable<{url: string}> {
    // Real API implementation:
    // const formData = new FormData();
    // formData.append('image', file);
    // return this.http.post<{url: string}>(`${this.apiUrl}/user/upload-image`, formData);
    
    console.log('Uploading image:', file.name);
    // Simulate upload and return a mock URL
    return of({ url: URL.createObjectURL(file) }).pipe(delay(1000));
  }

  getPastTrips(): Observable<Trip[]> {
    return of([]).pipe(delay(500));
  }

  getConnections(): Observable<Connection[]> {
    return of([]).pipe(delay(500));
  }
}
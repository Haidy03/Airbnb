import { inject, Injectable, Signal, signal } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { TokenService } from './token.service';
import { ErrorService } from './error.service';
import {
  AuthUser,
  PhoneLoginRequest,
  PhoneStartResponse,
  PhoneVerifyRequest,
  EmailLoginRequest,
  RegisterRequest,
  SocialLoginRequest,
  ResetPasswordRequest,
  ForgotPasswordRequest,
  VerifyResetTokenRequest,
  CountryCode,
  ChangePasswordResponse
} from '../models/auth-user.model';

interface LoginResponse {
  token: string;
  userId: string;
  email: string;
  role?: string;
}

interface RegisterResponse {
  message: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  country?: string;
  avatar?: string; // Sometimes API returns avatar
  profileImage?: string; // Sometimes profileImage
  profileImageUrl?: string; // Sometimes profileImageUrl
  isEmailVerified?: boolean;
}

// Custom Validator Function
export function countryPhoneValidator(countryCodeSignal: Signal<CountryCode>): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const valid = true; // Simplified validation
    return valid ? null : { invalidPhoneNumber: true };
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Dependencies
  private http = inject(HttpClient);
  private router = inject(Router);
  private tokenService = inject(TokenService);
  private errorService = inject(ErrorService);

  // API Config
  private readonly API_URL = 'https://localhost:5202/api/Auth';
  private readonly API_BASE_URL = 'https://localhost:5202/'; 

  // Storage Keys
  private readonly TOKEN_KEY = 'token';
  private readonly USER_ID_KEY = 'userId';
  private readonly EMAIL_KEY = 'email';
  private readonly ROLE_KEY = 'userRole';
  private readonly FirstName_KEY = 'firstName';
  private readonly LastName_KEY = 'lastName';
  private readonly PICTURE_KEY = 'profilePicture'; // ✅ Unified Key for Image

  // State Management
  private userSubject = new BehaviorSubject<AuthUser | null>(this.getUserFromStorage());
  public user$ = this.userSubject.asObservable();
  public user = signal<AuthUser | null>(this.getUserFromStorage());

  constructor() {
    // Sync Signal with BehaviorSubject
    this.userSubject.subscribe(u => this.user.set(u));
  }

  // ========================================================
  // 1. Helper: Fix Image URL (Add Base URL if missing)
  // ========================================================
  private getFullImageUrl(path: string | undefined | null): string | undefined {
    if (!path || path === 'null' || path === 'undefined') return undefined;
    
    // If it's already a full URL (e.g., Google auth or already processed), return it
    if (path.startsWith('http') || path.startsWith('https')) {
      return path;
    }

    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    
    // Return combined URL
    return `${this.API_BASE_URL}${cleanPath}`;
  }

  // ========================================================
  // 2. Helper: Get User From LocalStorage (REFRESH FIX)
  // ========================================================
  getUserFromStorage(): AuthUser | null {
    const userId = localStorage.getItem(this.USER_ID_KEY);
    if (!userId) return null;

    const email = localStorage.getItem(this.EMAIL_KEY);
    const role = localStorage.getItem(this.ROLE_KEY);
    const firstName = localStorage.getItem(this.FirstName_KEY);
    const lastName = localStorage.getItem(this.LastName_KEY);
    const phoneNumber = localStorage.getItem('phoneNumber');
    
    // ✅ FORCE READ PICTURE FROM STORAGE
    let storedPic = localStorage.getItem(this.PICTURE_KEY);
    if (storedPic === 'undefined' || storedPic === 'null') {
        storedPic = null;
    }

    console.log('🔄 Init: Reading Picture from Storage:', storedPic);

    const user: AuthUser = {
      id: userId,
      email: email || undefined,
      role: role || 'Guest',
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      fullName: firstName && lastName ? `${firstName} ${lastName}` : undefined,
      
      // ✅ Set the picture here from storage
      profilePicture: storedPic || undefined, 
      
      phoneNumber: phoneNumber || undefined, 
      isEmailVerified: true,
      isPhoneVerified: false
    } as AuthUser;

    // Refresh profile in background if token exists (to get latest updates)
    if (this.getToken()) {
      setTimeout(() => this.fetchAndSetFullProfile(), 500);
    }

    return user;
  }

  // ========================================================
  // 3. Core Set User Logic (Saves to Storage & State)
  // ========================================================
  private setUser(userPartial: Partial<AuthUser>): void {
    const current = this.userSubject.value || ({} as AuthUser);
    const merged: AuthUser = { ...current, ...userPartial } as AuthUser;

    // Save fields to LocalStorage
    if (merged.id) localStorage.setItem(this.USER_ID_KEY, merged.id);
    if (merged.email) localStorage.setItem(this.EMAIL_KEY, merged.email);
    if (merged.role) localStorage.setItem(this.ROLE_KEY, merged.role);
    if (merged.firstName) localStorage.setItem(this.FirstName_KEY, merged.firstName);
    if (merged.lastName) localStorage.setItem(this.LastName_KEY, merged.lastName);
    if (merged.phoneNumber) localStorage.setItem('phoneNumber', merged.phoneNumber);

    // ✅ Save Picture to Storage
    if (merged.profilePicture) {
        localStorage.setItem(this.PICTURE_KEY, merged.profilePicture);
    }

    // Update State
    this.userSubject.next(merged);
    this.user.set(merged); 
  }

  // ========================================================
  // 4. Fetch Full Profile (API -> Storage)
  // ========================================================
  fetchAndSetFullProfile(): void {
    this.getCurrentUser().subscribe({
      next: (profile) => {
        // Handle different API response fields for image
        const rawProfilePic = 
          (profile as any).profileImage || 
          (profile as any).profileImageUrl || 
          (profile as any).avatar;

        const fullImageUrl = this.getFullImageUrl(rawProfilePic);

        // ✅ Force Save to Storage immediately
        if (fullImageUrl) {
            localStorage.setItem(this.PICTURE_KEY, fullImageUrl);
        }

        const userPartial: Partial<AuthUser> = {
          id: profile.id,
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          fullName: profile.firstName && profile.lastName
            ? `${profile.firstName} ${profile.lastName}`
            : undefined,
          
          profilePicture: fullImageUrl, // ✅ Use full URL
          
          isEmailVerified: profile.isEmailVerified
        };
        
        this.setUser(userPartial);
      },
      error: (err) => {
        console.warn('Could not fetch full profile, token might be invalid.', err);
        if (err.status === 401 || err.status === 403 || err.status === 404) {
            console.log('Session expired or invalid. Logging out...');
            this.logout(); 
        }
      }
    });
  }

  // ========================================================
  // 5. Update User Image (Called after Upload)
  // ========================================================
  updateUserImage(imageUrl: string): void {
    const current = this.userSubject.value;
    if (!current) return;

    const fullUrl = this.getFullImageUrl(imageUrl);
    console.log('🖼️ Updating Service State:', fullUrl);

    // ✅ Force Save to Storage
    if (fullUrl) {
        localStorage.setItem(this.PICTURE_KEY, fullUrl);
    }

    const updatedUser: AuthUser = {
        ...current,
        profilePicture: fullUrl
    };

    this.userSubject.next(updatedUser);
    this.user.set(updatedUser); 
  }

  // ================= Getters =================
  get currentUser(): AuthUser | null { return this.userSubject.value; }
  get isAuthenticated(): boolean { return !!this.getToken(); }
  
  getToken(): string | null { return localStorage.getItem(this.TOKEN_KEY); }
  setToken(token: string): void { localStorage.setItem(this.TOKEN_KEY, token); }
  getCurrentUserId(): string | null { return localStorage.getItem(this.USER_ID_KEY); }

  // ================= Login / Register =================
  
  loginWithEmail(request: EmailLoginRequest): Observable<{ success: boolean }> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, request).pipe(
      tap(response => {
        if (response.token) {
          this.setToken(response.token);
          this.setUserFromToken(response.token);
          this.fetchAndSetFullProfile();
        }
      }),
      map(() => ({ success: true })),
      catchError(error => throwError(() => new Error(this.handleAuthError(error))))
    );
  }

  setUserFromToken(token: string): void {
    const userId = this.tokenService.getUserId(token);
    const userRole = this.tokenService.getUserRole(token);
    
    const userPartial: Partial<AuthUser> = {
      id: userId,
      role: userRole || 'Guest',
      isEmailVerified: true,
      isPhoneVerified: false
    };
    this.setUser(userPartial);
  }

  register(request: RegisterRequest): Observable<{ success: boolean }> {
    return this.http.post<RegisterResponse>(`${this.API_URL}/register`, request).pipe(
      tap(response => console.log('✅ Registration response:', response)),
      map(() => ({ success: true })),
      catchError(error => {
        console.error('❌ Registration error:', error);
        return throwError(() => new Error(this.handleAuthError(error)));
      })
    );
  }

  verifyPhoneCode(request: PhoneVerifyRequest): Observable<{ success: boolean }> {
    return this.http.post<any>(`${this.API_URL}/login`, request).pipe(
      tap(response => {
        if (response.token) {
          this.setToken(response.token);
          this.setUserFromToken(response.token);
          this.fetchAndSetFullProfile();
        } else if (response.user) {
          this.setUser(response.user);
        }
      }),
      map(() => ({ success: true })),
      catchError(error => throwError(() => error))
    );
  }

  startPhoneLogin(request: PhoneLoginRequest): Observable<PhoneStartResponse> {
    return this.http.post<PhoneStartResponse>(`${this.API_URL}/login`, request).pipe(
      catchError(error => {
        console.error('❌ Phone login error:', error);
        return throwError(() => error);
      })
    );
  }

  // ================= Logout & Refresh =================
  
  logout(): void {
    localStorage.clear(); // ✅ Clear EVERYTHING to be safe
    this.userSubject.next(null);
    this.user.set(null);
    this.router.navigate(['/']);
  }

  refreshToken(): Observable<{ success: boolean }> {
    return this.http.post<any>(`${this.API_URL}/refresh`, {}).pipe(
      tap(response => {
        if (response.token) {
          this.setToken(response.token);
          this.setUserFromToken(response.token);
          this.fetchAndSetFullProfile();
        }
      }),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      }),
      map(() => ({ success: true }))
    );
  }

  // ================= Profile & Password =================

  getCurrentUser(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.API_URL}/profile`);
  }

  updateUserProfile(data: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.API_URL}/profile`, data).pipe(
      tap(updated => {
        const fullImageUrl = this.getFullImageUrl(updated.avatar);
        
        const userPartial: Partial<AuthUser> = {
          email: updated.email,
          firstName: updated.firstName,
          lastName: updated.lastName,
          profilePicture: fullImageUrl,
          isEmailVerified: updated.isEmailVerified
        };
        
        this.setUser(userPartial);
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<ChangePasswordResponse> {
    const body = { currentPassword, newPassword };
    const token = this.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.post<ChangePasswordResponse>(`${this.API_URL}/change-password`, body, { headers });
  }

  forgotPassword(email: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/forgot-password`, { email }).pipe(
      map(response => ({ success: true, message: response.message || 'Reset instructions sent' })),
      catchError(error => throwError(() => new Error(this.handleAuthError(error))))
    );
  }

  resetPassword(request: any): Observable<any> {
    return this.http.post(`${this.API_URL}/reset-password`, request);
  }

  // ================= Host Methods =================

  becomeHost(): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    return this.http.post<LoginResponse>(`${this.API_URL}/become-host`, {}, { headers }).pipe(
      tap(response => {
        console.log('🎉 User is now a Host!', response);
        if (response.token) {
          this.setToken(response.token);
          this.setUserFromToken(response.token);
        }
      }),
      catchError(error => {
        console.error('❌ Failed to become host:', error);
        return throwError(() => error);
      })
    );
  }

  isHost(): boolean {
    const user = this.currentUser;
    if (!user || !user.role) return false;
    const role = user.role.toLowerCase();
    return role.includes('host') || role.includes('admin');
  }

  // ================= Error Handler =================
  private handleAuthError(error: any): string {
    if (!error) return 'An unknown error occurred';
    const errors = error?.error;
    if (Array.isArray(errors)) {
      return errors.map(e => e.description).join('\n');
    }
    if (error.error?.message) return error.error.message;
    if (error.message) return error.message;
    return 'Request failed. Please try again.';
  }
}
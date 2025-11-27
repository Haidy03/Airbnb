import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// import { Injectable, inject, signal } from '@angular/core';
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
  avatar?: string;
  isEmailVerified?: boolean;
}

export interface ChangePasswordResponse {
  message?: string;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user = signal<AuthUser | null>(this.getUserFromStorage());
  private http = inject(HttpClient);
  private router = inject(Router);
  private tokenService = inject(TokenService);
  private errorService = inject(ErrorService);

  private readonly API_URL = 'https://localhost:5202/api/Auth';
  private readonly TOKEN_KEY = 'token';
  private readonly USER_ID_KEY = 'userId';
  private readonly EMAIL_KEY = 'email';
  private readonly ROLE_KEY = 'userRole';
  private readonly FirstName_KEY = 'firstName';
  private readonly LastName_KEY = 'lastName';

  private userSubject = new BehaviorSubject<AuthUser | null>(this.getUserFromStorage());
  public user$ = this.userSubject.asObservable();

  constructor() {
    this.userSubject.subscribe(u => this.user.set(u));
  }

  // ================= helper getters =================
  get currentUser(): AuthUser | null {
    return this.userSubject.value;
  }
  get isAuthenticated(): boolean {
    return !!this.getToken();
  }
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  // ================= set/get user =================
  private setUser(userPartial: Partial<AuthUser>): void {
    const current = this.userSubject.value || ({} as AuthUser);
    const merged: AuthUser = { ...current, ...userPartial } as AuthUser;

    if (merged.id) localStorage.setItem(this.USER_ID_KEY, merged.id);
    if (merged.email) localStorage.setItem(this.EMAIL_KEY, merged.email);
    if (merged.role) localStorage.setItem(this.ROLE_KEY, merged.role);
    if (merged.firstName) localStorage.setItem(this.FirstName_KEY, merged.firstName);
    if (merged.lastName) localStorage.setItem(this.LastName_KEY, merged.lastName);

    this.userSubject.next(merged);
  }

   getUserFromStorage(): AuthUser | null {
    const userId = localStorage.getItem(this.USER_ID_KEY);
    const email = localStorage.getItem(this.EMAIL_KEY);
    const role = localStorage.getItem(this.ROLE_KEY);
    const firstName = localStorage.getItem(this.FirstName_KEY);
    const lastName = localStorage.getItem(this.LastName_KEY);

    if (!userId) return null;

    const user: AuthUser = {
      id: userId,
      email: email || undefined,
      role: role || 'Guest',
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      fullName: firstName && lastName ? `${firstName} ${lastName}` : undefined,
      isEmailVerified: true,
      isPhoneVerified: false
    } as AuthUser;

    if (this.getToken()) {
      setTimeout(() => this.fetchAndSetFullProfile(), 0);
    }

    return user;
  }

  // ================= fetch full profile and merge =================
  fetchAndSetFullProfile(): void {
    this.getCurrentUser().subscribe({
      next: (profile) => {
        const userPartial: Partial<AuthUser> = {
          id: profile.id,
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          fullName: profile.firstName && profile.lastName
            ? `${profile.firstName} ${profile.lastName}`
            : undefined,
          profilePicture: (profile as any).avatar || (profile as any).profilePicture,
          isEmailVerified: profile.isEmailVerified
        };
        this.setUser(userPartial as Partial<AuthUser>);
      },
      error: (err) => {
        console.warn('Could not fetch full profile after token set', err);
      }
    });
  }

  // ================= Change Password (LOGGED IN) =================
  // التعديل هنا: تغيير الرابط لـ /change-password بدلاً من /reset-password
  changePassword(currentPassword: string, newPassword: string): Observable<ChangePasswordResponse> {
    const body = { currentPassword, newPassword };
    // افترضنا أن الباك إند لديه هذا المسار لتغيير كلمة المرور للمستخدم المسجل
    return this.http.post<ChangePasswordResponse>(`${this.API_URL}/change-password`, body);
  }

  // ================= Login / Register flows =================
  loginWithEmail(request: EmailLoginRequest): Observable<{ success: boolean }> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, request)
      .pipe(
        tap(response => {
          if (response.token) {
            this.setToken(response.token);
            this.setUserFromToken(response.token);
            this.fetchAndSetFullProfile();
          }
        }),
        map(() => ({ success: true })),
        catchError(error => {
          const errorMessage = this.handleAuthError(error);
          return throwError(() => new Error(errorMessage));
        })
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

  verifyPhoneCode(request: PhoneVerifyRequest): Observable<{ success: boolean }> {
    return this.http.post<any>(`${this.API_URL}/phone/verify`, request)
      .pipe(
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
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  register(request: RegisterRequest): Observable<{ success: boolean }> {
    return this.http.post<RegisterResponse>(`${this.API_URL}/register`, request)
      .pipe(
        tap(response => console.log('✅ Registration response:', response)),
         map(() => ({ success: true })),
        catchError(error => {
          console.error('❌ Registration error:', error);
          const errorMessage = this.handleAuthError(error);
          return throwError(() => new Error(errorMessage));
        })
      ) as any;
  }

  startPhoneLogin(request: PhoneLoginRequest): Observable<PhoneStartResponse> {
    return this.http.post<PhoneStartResponse>(`${this.API_URL}/phone/start`, request)
      .pipe(
        catchError(error => {
          console.error('❌ Phone login error:', error);
          return throwError(() => error);
        })
      )
  }

  // ================= Forgot / Reset Password (LOGGED OUT) =================
  forgotPassword(email: string): Observable<{ success: boolean; message: string }> {
    const request: ForgotPasswordRequest = { email };
    return this.http.post<{ message: string }>(`${this.API_URL}/forgot-password`, request)
      .pipe(
        map(response => ({ success: true, message: response.message || 'Reset instructions sent' })),
        catchError(error => {
          const errorMessage = this.handleAuthError(error);
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  resetPassword(token: string, newPassword: string): Observable<{ success: boolean; message: string }> {
    const request: ResetPasswordRequest = { token, newPassword };
    return this.http.post<{ message: string }>(`${this.API_URL}/reset-password`, request)
      .pipe(
        map(response => ({ success: true, message: response.message || 'Password reset successfully' })),
        catchError(error => {
          const errorMessage = this.handleAuthError(error);
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // ================= logout / refresh =================
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_ID_KEY);
    localStorage.removeItem(this.EMAIL_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.FirstName_KEY);
    localStorage.removeItem(this.LastName_KEY);
    this.userSubject.next(null);
    this.router.navigate(['/']);
  }

  refreshToken(): Observable<{ success: boolean }> {
    return this.http.post<any>(`${this.API_URL}/refresh`, {})
      .pipe(
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

  // ================= Profile endpoints =================
  getCurrentUser(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.API_URL}/profile`);
  }

  updateUserProfile(data: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.API_URL}/profile`, data)
      .pipe(
        tap(updated => {
          const userPartial: Partial<AuthUser> = {
            email: updated.email,
            firstName: updated.firstName,
            lastName: updated.lastName,
            profilePicture: (updated as any).avatar || (updated as any).profilePicture,
            isEmailVerified: updated.isEmailVerified
          };
          this.setUser(userPartial);
        })
      );
  }

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


  //                Host Methodss         ////////////////////////

    becomeHost(): Observable<any> {
    // ✅ 1. الحصول على التوكن الحالي
    const token = this.getToken(); 
    
    // ✅ 2. إنشاء الـ Headers
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<LoginResponse>(
      `${this.API_URL}/become-host`, 
      {}, 
      { headers } // ✅ 3. تمرير الـ Headers هنا
    )
    .pipe(
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
}

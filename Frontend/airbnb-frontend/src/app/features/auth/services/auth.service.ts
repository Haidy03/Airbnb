
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import {
  AuthUser,
  PhoneLoginRequest,
  PhoneStartResponse,
  PhoneVerifyRequest,
  EmailLoginRequest,
  RegisterRequest,
  SocialLoginRequest,
  AuthProvider
} from '../models/auth-user.model';

// ✅ FIXED: Match backend response structure
interface LoginResponse {
  token: string;
  userId: string;
  email: string;
}

interface RegisterResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly API_URL = 'https://localhost:5202/api/Auth'; // ✅ Use your actual backend URL
  private readonly TOKEN_KEY = 'token';
  private readonly USER_ID_KEY = 'userId';
  private readonly EMAIL_KEY = 'email';

  private userSubject = new BehaviorSubject<AuthUser | null>(this.getUserFromStorage());
  public user$ = this.userSubject.asObservable();

  get currentUser(): AuthUser | null {
    return this.userSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // ✅ FIXED: Get token from correct key
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private setUser(user: AuthUser): void {
    localStorage.setItem(this.USER_ID_KEY, user.id);
    if (user.email) {
      localStorage.setItem(this.EMAIL_KEY, user.email);
    }
    this.userSubject.next(user);
  }

  private getUserFromStorage(): AuthUser | null {
    const userId = localStorage.getItem(this.USER_ID_KEY);
    const email = localStorage.getItem(this.EMAIL_KEY);
    
    if (!userId) return null;
    
    return {
      id: userId,
      email: email || undefined,
      isEmailVerified: true,
      isPhoneVerified: false
    };
  }

  // ✅ FIXED: Email Login to match backend response
  loginWithEmail(request: EmailLoginRequest): Observable<{ success: boolean }> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, request)
      .pipe(
        tap(response => {
          console.log('✅ Login response:', response);
          
          // Store token and user info
          this.setToken(response.token);
          
          const user: AuthUser = {
            id: response.userId,
            email: response.email,
            isEmailVerified: true,
            isPhoneVerified: false
          };
          
          this.setUser(user);
        }),
        catchError(error => {
          console.error('❌ Login error:', error);
          return throwError(() => error);
        }),
        tap(() => ({ success: true }))
      ) as any;
  }

  // ✅ FIXED: Register to match backend response
  register(request: RegisterRequest): Observable<{ success: boolean }> {
    return this.http.post<RegisterResponse>(`${this.API_URL}/register`, request)
      .pipe(
        tap(response => {
          console.log('✅ Registration response:', response);
        }),
        catchError(error => {
          console.error('❌ Registration error:', error);
          return throwError(() => error);
        }),
        tap(() => ({ success: true }))
      ) as any;
  }

  // Phone Authentication Flow
  startPhoneLogin(request: PhoneLoginRequest): Observable<PhoneStartResponse> {
    return this.http.post<PhoneStartResponse>(`${this.API_URL}/phone/start`, request)
      .pipe(
        catchError(error => {
          console.error('❌ Phone login error:', error);
          return throwError(() => error);
        })
      );
  }

  verifyPhoneCode(request: PhoneVerifyRequest): Observable<{ success: boolean }> {
    return this.http.post<any>(`${this.API_URL}/phone/verify`, request)
      .pipe(
        tap(response => {
          if (response.token) {
            this.setToken(response.token);
            if (response.user) {
              this.setUser(response.user);
            }
          }
        }),
        catchError(error => {
          console.error('❌ Phone verification error:', error);
          return throwError(() => error);
        }),
        tap(() => ({ success: true }))
      ) as any;
  }

  // Social Login
  loginWithGoogle(token: string): Observable<{ success: boolean }> {
    return this.loginWithSocial({
      provider: AuthProvider.GOOGLE,
      token
    });
  }

  loginWithFacebook(token: string): Observable<{ success: boolean }> {
    return this.loginWithSocial({
      provider: AuthProvider.FACEBOOK,
      token
    });
  }

  loginWithApple(token: string): Observable<{ success: boolean }> {
    return this.loginWithSocial({
      provider: AuthProvider.APPLE,
      token
    });
  }

  private loginWithSocial(request: SocialLoginRequest): Observable<{ success: boolean }> {
    const endpoint = `${this.API_URL}/${request.provider}`;
    return this.http.post<any>(endpoint, request)
      .pipe(
        tap(response => {
          if (response.token) {
            this.setToken(response.token);
            if (response.user) {
              this.setUser(response.user);
            }
          }
        }),
        catchError(error => {
          console.error('❌ Social login error:', error);
          return throwError(() => error);
        }),
        tap(() => ({ success: true }))
      ) as any;
  }

  // ✅ FIXED: Proper logout
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_ID_KEY);
    localStorage.removeItem(this.EMAIL_KEY);
    this.userSubject.next(null);
    this.router.navigate(['/']);
  }

  // Refresh Token (if implemented)
  refreshToken(): Observable<{ success: boolean }> {
    return this.http.post<any>(`${this.API_URL}/refresh`, {})
      .pipe(
        tap(response => {
          if (response.token) {
            this.setToken(response.token);
          }
        }),
        catchError(error => {
          this.logout();
          return throwError(() => error);
        }),
        tap(() => ({ success: true }))
      ) as any;
  }
}
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
import { PaginatedResponse } from '../models/login-response.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly API_URL = '/api/auth';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  private userSubject = new BehaviorSubject<AuthUser | null>(this.getUserFromStorage());
  public user$ = this.userSubject.asObservable();

  get currentUser(): AuthUser | null {
    return this.userSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.currentUser && !!this.getToken();
  }

  // Phone Authentication Flow
  startPhoneLogin(request: PhoneLoginRequest): Observable<PhoneStartResponse> {
    return this.http.post<PhoneStartResponse>(`${this.API_URL}/phone/start`, request)
      .pipe(
        catchError(this.handleError)
      );
  }

  verifyPhoneCode(request: PhoneVerifyRequest): Observable<PaginatedResponse<AuthUser>> {
    return this.http.post<PaginatedResponse<AuthUser>>(`${this.API_URL}/phone/verify`, request)
      .pipe(
        tap(response => this.handleSuccessfulAuth(response)),
        catchError(this.handleError)
      );
  }

  // Email Login
  // loginWithEmail(request: EmailLoginRequest): Observable<PaginatedResponse<AuthUser>> {
  //   return this.http.post<PaginatedResponse<AuthUser>>(`https://localhost:5202/api/auth/login`, request)
  //     .pipe(
  //       tap(response => this.handleSuccessfulAuth(response)),
  //       catchError(this.handleError)
  //     );
  // }
  loginWithEmail(request: { email: string; password: string }) {
  return this.http.post<PaginatedResponse<AuthUser>>('https://localhost:5202/api/auth/login', request).pipe(
    tap((response) => {
      if (response.success && response.token && response.user) {
        this.setToken(response.token);
        this.setUser(response.user);
      }
    })
  );
}

  // Register
  register(request: RegisterRequest): Observable<PaginatedResponse<AuthUser>> {
    return this.http.post<PaginatedResponse<AuthUser>>(`https://localhost:5202/api/auth/register`, request)
      .pipe(
        tap(response => this.handleSuccessfulAuth(response)),
        catchError(this.handleError)
      );
  }

  // Social Login
  loginWithGoogle(token: string): Observable<PaginatedResponse<AuthUser>> {
    return this.loginWithSocial({
      provider: AuthProvider.GOOGLE,
      token
    });
  }

  loginWithFacebook(token: string): Observable<PaginatedResponse<AuthUser>> {
    return this.loginWithSocial({
      provider: AuthProvider.FACEBOOK,
      token
    });
  }

  loginWithApple(token: string): Observable<PaginatedResponse<AuthUser>> {
    return this.loginWithSocial({
      provider: AuthProvider.APPLE,
      token
    });
  }

  private loginWithSocial(request: SocialLoginRequest): Observable<PaginatedResponse<AuthUser>> {
    const endpoint = `${this.API_URL}/${request.provider}`;
    return this.http.post<PaginatedResponse<AuthUser>>(endpoint, request)
      .pipe(
        tap(response => this.handleSuccessfulAuth(response)),
        catchError(this.handleError)
      );
  }

  // Logout
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.userSubject.next(null);
    this.router.navigate(['/']);
  }

  // Token Management
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setToken(token: string | boolean | null | undefined): void {
    if (token == null) return;
    localStorage.setItem(this.TOKEN_KEY, String(token));
  }

  private setUser(user: AuthUser): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.userSubject.next(user);
  }

  private getUserFromStorage(): AuthUser | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (!userJson) return null;
    
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }

  // Handle Successful Authentication
   handleSuccessfulAuth(response: PaginatedResponse<AuthUser>): void {
    if (response.success && response.token && response.user) {
      this.setToken(response.token);
      this.setUser(response.user);
    }
  }

  // Error Handler
  private handleError(error: any): Observable<never> {
    const errorMessage = error.error?.message || error.message || 'An error occurred';
    console.error('Auth Error:', error);
    return throwError(() => new Error(errorMessage));
  }

  // Refresh Token (if implemented)
  refreshToken(): Observable<PaginatedResponse<AuthUser>> {
    return this.http.post<PaginatedResponse<AuthUser>>(`${this.API_URL}/refresh`, {})
      .pipe(
        tap(response => {
          if (response.token) {
            this.setToken(response.token);
          }
        }),
        catchError(error => {
          this.logout();
          return throwError(() => error);
        })
      );
  }
}
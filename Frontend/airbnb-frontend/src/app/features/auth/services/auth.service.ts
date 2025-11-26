// import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  AuthProvider,
  ResetPasswordRequest,
  ForgotPasswordRequest,
  VerifyResetTokenRequest
} from '../models/auth-user.model';
import { inject, Injectable, signal } from '@angular/core';

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
  token?: string; // optional: if backend returns a new token
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
  // أي تحديث للـ BehaviorSubject يحدث في الـ Signal
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
  /**
   * Merge incoming partial user with current subject value,
   * persist essential fields to localStorage, then emit.
   */
  private setUser(userPartial: Partial<AuthUser>): void {
    const current = this.userSubject.value || ({} as AuthUser);
    const merged: AuthUser = { ...current, ...userPartial } as AuthUser;

    if (merged.id) {
      localStorage.setItem(this.USER_ID_KEY, merged.id);
    }
    if (merged.email) {
      localStorage.setItem(this.EMAIL_KEY, merged.email);
    }
    if (merged.role) {
      localStorage.setItem(this.ROLE_KEY, merged.role);
    }
    if (merged.firstName) {
      localStorage.setItem(this.FirstName_KEY, merged.firstName);
    }
    if (merged.lastName) {
      localStorage.setItem(this.LastName_KEY, merged.lastName);
    }
 
 

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

    // If we have a token, fetch full profile to get complete user data
    if (this.getToken()) {
      // Call fetchAndSetFullProfile asynchronously to avoid blocking initialization
      setTimeout(() => this.fetchAndSetFullProfile(), 0);
    }

    return user;
  }

  // ================= fetch full profile and merge =================
  fetchAndSetFullProfile(): void {
    // call API to get full profile and merge it into userSubject
    this.getCurrentUser().subscribe({
      next: (profile) => {
        // map UserProfile -> AuthUser partial
        const userPartial: Partial<AuthUser> = {
          id: profile.id,
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          fullName: profile.firstName && profile.lastName 
            ? `${profile.firstName} ${profile.lastName}` 
            : undefined,
          // if your AuthUser has avatar/profilePicture fields, map accordingly
          profilePicture: (profile as any).avatar || (profile as any).profilePicture,
          isEmailVerified: profile.isEmailVerified
        };
        this.setUser(userPartial as Partial<AuthUser>);
      },
      error: (err) => {
        console.warn('Could not fetch full profile after token set', err);
        // not fatal — keep minimal user data from token
      }
    });
  }
 changePassword(currentPassword: string, newPassword: string): Observable<ChangePasswordResponse> {
    const body = { currentPassword, newPassword };
    // Adjust path to match your backend
    return this.http.post<ChangePasswordResponse>(`http://localhost:5202/api/Auth/reset-password`, body);
  }
  // ================= Login / Register flows =================
  loginWithEmail(request: EmailLoginRequest): Observable<{ success: boolean }> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, request)
      .pipe(
        tap(response => {
          console.log('Login response:', response);
          if (response.token) {
          this.setToken(response.token);
          // set basic info from token (id/role) if available
          this.setUserFromToken(response.token);
          // then fetch full profile and merge
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
            // fallback: set full user object if backend returned it
            this.setUser(response.user);
          }
        }),
        map(() => ({ success: true })),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  private loginWithSocial(request: SocialLoginRequest): Observable<{ success: boolean }> {
    const endpoint = `${this.API_URL}/${request.provider}`;
    return this.http.post<any>(endpoint, request)
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

    // ✅ FIXED: Register to match backend response
  register(request: RegisterRequest): Observable<{ success: boolean }> {
    return this.http.post<RegisterResponse>(`${this.API_URL}/register`, request)
      .pipe(
        tap(response => {
          console.log('✅ Registration response:', response);
        }),
         map(() => ({ success: true })),
        catchError(error => {
          console.error('❌ Registration error:', error);
          //return throwError(() => error);
          const errorMessage = this.handleAuthError(error);
          return throwError(() => new Error(errorMessage));
        }),
        //tap(() => ({ success: true }))
      ) as any;
  }
  
  // Phone Authentication Flow
  startPhoneLogin(request: PhoneLoginRequest): Observable<PhoneStartResponse> {
    return this.http.post<PhoneStartResponse>(`${this.API_URL}/phone/start`, request)
      .pipe(
        catchError(error => {
          console.error('❌ Phone login error:', error);
          return throwError(() => new Error(error));
          return throwError(() => error);
        })
      )
  }

     // ✅ طلب إعادة تعيين كلمة المرور
  forgotPassword(email: string): Observable<{ success: boolean; message: string }> {
    const request: ForgotPasswordRequest = { email };
    
    return this.http.post<{ message: string }>(`${this.API_URL}/forgot-password`, request)
      .pipe(
        map(response => {
          console.log('✅ Forgot password request sent:', response);
          return { 
            success: true, 
            message: response.message || 'Reset instructions sent to your email' 
          };
        }),
        catchError(error => {
          console.error('❌ Forgot password error:', error);
          const errorMessage = this.handleAuthError(error);
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // ✅ إعادة تعيين كلمة المرور
  resetPassword(token: string, newPassword: string): Observable<{ success: boolean; message: string }> {
    const request: ResetPasswordRequest = { 
      token, 
      newPassword 
    };

    return this.http.post<{ message: string }>(`${this.API_URL}/reset-password`, request)
      .pipe(
        map(response => {
          console.log('✅ Password reset successful:', response);
          return { 
            success: true, 
            message: response.message || 'Password reset successfully' 
          };
        }),
        catchError(error => {
          console.error('❌ Reset password error:', error);
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
            // update token-derived user and refresh profile
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
          // update local subject with any changed fields (email, name, avatar...)
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

  // ... باقي الدوال (register, forgot/reset password, deleteAccount, etc.) تظل كما هي مع catchError
  // keep your existing implementations for those...

  private handleAuthError(error: any): string {
    if (!error) return 'An unknown error occurred';
    const errors = error?.error;
    if (Array.isArray(errors)) {
      const messages = errors.map(e => e.description);
      return messages.join('\n');
    } else {
      return'Registration failed. Please try again.';
    }

    // if (error.status === 0) return 'Unable to connect to server. Please check your internet connection.';
    // if (error.status === 401) return 'Invalid email or password.';
    // if (error.status === 403) return 'Access denied. Please contact administrator.';
    // if (error.status === 429) return 'Too many attempts. Please try again later.';
    // if (error.status === 400) return 'Password must contain an uppercase letter, a lowercase letter, a number, and a special character';
    // if (error.status === 404) return 'Requested resource not found.';
    // if (error.status >= 500) return 'Server error. Please try again later.';
    // if (error.error?.message) return error.error.message;
    // if (error.error?.errors) {
    //   const validationErrors = error.error.errors;
    //   return Object.values(validationErrors).flat().join(', ');
    // }
    // if (error.message) return error.message;
    // return 'An unexpected error occurred. Please try again.';
  }


  //                Host Methodss         ////////////////////////

    becomeHost(): Observable<any> {
    return this.http.post<LoginResponse>(`${this.API_URL}/become-host`, {})
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
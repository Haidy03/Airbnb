import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError, map } from 'rxjs';
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

// ✅ FIXED: Match backend response structure (From Colleague)
interface LoginResponse {
  token: string;
  userId: string;
  email: string;
  role?: string;
}

interface RegisterResponse {
  message: string;
}

// ✅ NEW: Interface for User Profile (For Settings Page)
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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private tokenService = inject(TokenService);
  private errorService = inject(ErrorService);

  // ✅ Using Colleague's API URL configuration
  private readonly API_URL = 'https://localhost:5202/api/Auth';
  private readonly TOKEN_KEY = 'token';
  private readonly USER_ID_KEY = 'userId';
  private readonly EMAIL_KEY = 'email';
  private readonly ROLE_KEY = 'userRole';
  private userSubject = new BehaviorSubject<AuthUser | null>(this.getUserFromStorage());
  public user$ = this.userSubject.asObservable();

  get currentUser(): AuthUser | null {
    return this.userSubject.value;
  }

  get isAuthenticated(): boolean {   //IsloggedIn
    return !!this.getToken();
  }

  // ✅ FIXED: Get token from correct key
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

   setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private setUser(user: AuthUser): void {
    localStorage.setItem(this.USER_ID_KEY, user.id);
    if (user.email) {
      localStorage.setItem(this.EMAIL_KEY, user.email);
    }
     if (user.role) {
    localStorage.setItem(this.ROLE_KEY, user.role); 
  }
    this.userSubject.next(user);
  }

  private getUserFromStorage(): AuthUser | null {
    const userId = localStorage.getItem(this.USER_ID_KEY);
    const email = localStorage.getItem(this.EMAIL_KEY);
    const role = localStorage.getItem(this.ROLE_KEY);

    if (!userId) return null;

    return {
      id: userId,
      email: email || undefined,
      role: role || 'Guest',
      isEmailVerified: true,
      isPhoneVerified: false
    };
  }

  // =================================================================
  //  COLLEAGUE'S AUTH METHODS (Login, Register, Social, etc.)
  // =================================================================

  // ✅ FIXED: Email Login to match backend response
  // loginWithEmail(request: EmailLoginRequest): Observable<{ success: boolean }> {
  //   return this.http.post<LoginResponse>(`${this.API_URL}/login`, request)
  //     .pipe(
  //       tap(response => {
  //         console.log('✅ Login response:', response);

  //         // Store token and user info
  //         this.setToken(response.token);

  //         const user: AuthUser = {
  //           id: response.userId,
  //           email: response.email,
  //           role: response.role || 'Guest', 
  //           isEmailVerified: true,
  //           isPhoneVerified: false
  //         };

  //         this.setUser(user);
  //       }),
  //        map(() => ({ success: true })),
  //       catchError(error => {
  //         console.error('❌ Login error:', error);
  //         return throwError(() => error);
  //       }),
  //       // tap(() => ({ success: true }))
  //     ) as any;
  // }
    private setUserFromToken(token: string): void {
    const userId = this.tokenService.getUserId(token);
    const userRole = this.tokenService.getUserRole(token);
      const user: AuthUser = {
      id: userId,
      role: userRole || 'Guest',
      isEmailVerified: true, 
      isPhoneVerified: false
    };
    this.setUser(user);
  }
   loginWithEmail(request: EmailLoginRequest): Observable<{ success: boolean }> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, request)
      .pipe(
        tap(response => {
          console.log('✅ Login response:', response);
          this.setToken(response.token);
          this.setUserFromToken(response.token);
        }),
        map(() => ({ success: true })),
        catchError(error => {
          console.error('❌ Login error:', error);
          const errorMessage = this.handleAuthError(error);
          return throwError(() => new Error(errorMessage));
          
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
         map(() => ({ success: true })),
        catchError(error => {
          console.error('❌ Phone verification error:', error);
          return throwError(() => error);
        }),
        //tap(() => ({ success: true }))
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
         map(() => ({ success: true })),
        catchError(error => {
          console.error('❌ Social login error:', error);
          return throwError(() => error);
        }),
        //tap(() => ({ success: true }))
      ) as any;
  }

  
  // ✅ FIXED: Proper logout
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_ID_KEY);
    localStorage.removeItem(this.EMAIL_KEY);
    localStorage.removeItem(this.ROLE_KEY);
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

  // =================================================================
  //  NEW METHODS FOR ACCOUNT SETTINGS (Merged seamlessly)
  // =================================================================

  // 1. Get Current User Profile
  // Note: Adjusted endpoint to match your API structure potentially
  getCurrentUser(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.API_URL}/profile`);
  }

  // 2. Update User Profile
  updateUserProfile(data: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.API_URL}/profile`, data)
      .pipe(
        tap(updatedUser => {
          // We update the local behavior subject if email changed,
          // to keep the app state consistent
          const currentUser = this.userSubject.value;
          if (currentUser && updatedUser.email) {
             // Only updating fields that AuthUser tracks
             const newAuthUser: AuthUser = {
               ...currentUser,
               email: updatedUser.email
             };
             this.setUser(newAuthUser);
          }
        })
      );
  }

  // 3. Change Password
  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.put(`${this.API_URL}/reset-password`, {
      currentPassword,
      newPassword
    });
  }

  // 4. Upload Avatar
  uploadAvatar(file: File): Observable<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);

    return this.http.post<{ avatarUrl: string }>(`${this.API_URL}/user/avatar`, formData);
  }

  // 5. Delete Account
  deleteAccount(password: string): Observable<void> {
    // Using HTTP Delete with body option
    return this.http.delete<void>(`${this.API_URL}/account`, {
      body: { password }
    }).pipe(
      tap(() => {
        // Logout the user immediately after deletion
        this.logout();
      })
    );
  }

  // 6. Request Email Verification
  requestEmailVerification(): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/verify-email/request`, {});
  }

  // 7. Verify Email with Code
  confirmEmailVerification(code: string): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/verify-email/confirm`, { code })
      .pipe(
        tap(() => {
          const currentUser = this.userSubject.value;
          if (currentUser) {
            // Update local state to show email is verified
            const updatedUser: AuthUser = { ...currentUser, isEmailVerified: true };
            this.setUser(updatedUser);
          }
        })
      );
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

  // ✅ التحقق من صحة توكن إعادة التعيين (اختياري)
  verifyResetToken(token: string): Observable<{ valid: boolean; email?: string }> {
    const request: VerifyResetTokenRequest = { token };

    return this.http.post<{ valid: boolean; email?: string }>(`${this.API_URL}/verify-reset-token`, request)
      .pipe(
        catchError(error => {
          console.error('❌ Verify token error:', error);
          return throwError(() => new Error('Invalid or expired reset token'));
        })
      );
  }


   private handleAuthError(error: any): string {
    if (!error) return 'An unknown error occurred';

    // ✅ معالجة أخطاء HTTP
    if (error.status === 0) {
      return 'Unable to connect to server. Please check your internet connection.';
    }

    if (error.status === 401) {
      return 'Invalid email or password.';
    }
  
    if (error.status === 403) {
      return 'Access denied. Please contact administrator.';
    }

    if (error.status === 429) {
      return 'Too many attempts. Please try again later.';
    }

    if (error.status === 400) {
      return 'Password must contain an uppercase letter, a lowercase letter, a number, and a special character';
    }

    if (error.status === 404) {
      return 'Requested resource not found.';
    }

    if (error.status >= 500) {
      return 'Server error. Please try again later.';
    }

    // ✅ معالجة أخطاء الـ API المخصصة
    if (error.error?.message) {
      return error.error.message;
    }

    if (error.error?.errors) {
      // معالجة أخطاء الـ Validation
      const validationErrors = error.error.errors;
      return Object.values(validationErrors).flat().join(', ');
    }

    if (error.message) {
      return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
  }
}


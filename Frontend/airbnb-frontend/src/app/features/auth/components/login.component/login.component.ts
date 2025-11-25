
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ModalService } from '../../services/modal.service';
import { SocialButtonsComponent } from '../social-buttons.component/social-buttons.component';
import { COUNTRY_CODES, CountryCode } from '../../models/auth-user.model';
import { TokenService } from '../../services/token.service';
import { ErrorService } from '../../services/error.service'; 
type LoginMode = 'phone' | 'email' | 'register';
type PhoneStep = 'input' | 'verify';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SocialButtonsComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private tokenService = inject(TokenService);
  private errorService = inject(ErrorService);
  private modalService = inject(ModalService);
  private router = inject(Router);

  // State Management
  mode = signal<LoginMode>('phone');
  phoneStep = signal<PhoneStep>('input');
  isLoading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);
  
  // Country Selection
  countries = COUNTRY_CODES;
  selectedCountry = signal<CountryCode>(COUNTRY_CODES[0]);
  isCountryDropdownOpen = signal(false);
  
  // Session
  sessionId = signal('');

  // Forms
  phoneForm = this.fb.nonNullable.group({
    phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{8,15}$/)]]
  });

  verificationForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(6)]]
  });

  emailLoginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  registerForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  // Mode Switching
  switchMode(newMode: LoginMode) {
    this.mode.set(newMode);
    this.errorMessage.set('');
    this.phoneStep.set('input');
    this.resetForms();
  }

  private resetForms() {
    this.phoneForm.reset();
    this.verificationForm.reset();
    this.emailLoginForm.reset();
    this.registerForm.reset();
  }

  // Country Selection
  toggleCountryDropdown() {
    this.isCountryDropdownOpen.update(v => !v);
  }

  selectCountry(country: CountryCode) {
    this.selectedCountry.set(country);
    this.isCountryDropdownOpen.set(false);
  }

  // Phone Authentication Flow
  onPhoneContinue() {
    if (this.phoneForm.invalid || this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const request = {
      countryCode: this.selectedCountry().dialCode,
      phoneNumber: this.phoneForm.value.phoneNumber!
    };

    this.authService.startPhoneLogin(request).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.sessionId.set(response.sessionId);
        this.phoneStep.set('verify');
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'Failed to send verification code');
      }
    });
  }

  onVerifyCode() {
    if (this.verificationForm.invalid || this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const request = {
      sessionId: this.sessionId(),
      code: this.verificationForm.value.code!
    };

    this.authService.verifyPhoneCode(request).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success) {
          console.log('✅ Phone verification successful, navigating to host dashboard');
          this.closeModal();
          this.router.navigate(['/host/dashboard']);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'Invalid verification code');
      }
    });
  }

  backToPhone() {
    this.phoneStep.set('input');
    this.verificationForm.reset();
    this.errorMessage.set('');
  }
  private redirectBasedOnRole(role: string): void {
    this.closeModal();
    
    switch (role) {
      case 'admin':
        console.log('🚀 Navigating to /admin/dashboard');
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'host':
        console.log('🚀 Navigating to /host/dashboard');
        this.router.navigate(['/host/dashboard']);
        break;
      default:
        console.log('🚀 Navigating to /');
        this.router.navigate(['/']);
        break;
    }
  }


  private getErrorMessage(error: any): string {
    if (error?.error?.message) return error.error.message;
    if (error?.message) return error.message;
    if (error?.status === 0) return 'Unable to connect to server';
    return 'Invalid email or password';
  }

  // ✅ FIXED: Email Login Flow with proper navigation
  onEmailLogin() {
     if (this.emailLoginForm.invalid || this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const request = {
      email: this.emailLoginForm.value.email!,
      password: this.emailLoginForm.value.password!
    };

    this.authService.loginWithEmail(request).subscribe({
      next: (response) => {
        this.isLoading.set(true);
        console.log('✅ Login successful!');
        
        
        const token = this.authService.getToken();
        if (token) {
          const userRole = this.tokenService.getUserRole(token);
          const userId = this.tokenService.getUserId(token);
          
          console.log('👤 User Role:', userRole);
          console.log('🆔 User ID:', userId);
          
          
          this.redirectBasedOnRole(userRole);
        } else {
          this.errorMessage.set('Login failed - no token received');
        }
      },
      error: (error) => {
        this.isLoading.set(false);

        console.error('❌ Login failed:', error);
        this.errorMessage.set(this.getErrorMessage(error));
         this.errorService.handleError(error); 
      }
    });
  }

  // ✅ FIXED: Register Flow with proper navigation
  onRegister() {
    if (this.registerForm.invalid || this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const request = {
      firstName: this.registerForm.value.firstName!,
      lastName: this.registerForm.value.lastName!,
      email: this.registerForm.value.email!,
      password: this.registerForm.value.password!
    };

    console.log('📝 Attempting registration:', { email: request.email });

    this.authService.register(request).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        console.log('✅ Registration successful!');
        
        // After successful registration, automatically log in
        const loginRequest = {
          email: request.email,
          password: request.password
        };
        
        this.authService.loginWithEmail(loginRequest).subscribe({
          next: (response:any) => {
            console.log('✅ Auto-login successful after registration');
            this.authService.setToken(response.token);
            this.closeModal();
            this.router.navigate(['/host/dashboard']);
          },
          error: (loginError) => {
            console.error('❌ Auto-login failed:', loginError);
            // If auto-login fails, switch to login mode
            this.switchMode('email');
            this.errorMessage.set('Registration successful! Please log in.');
            this.errorService.handleError(loginError); 
          }
        });
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('❌ Registration failed:', error);
        
        const errorMsg = error?.error?.message || 
                        error?.message || 
                        'Registration failed';
        this.errorMessage.set(errorMsg);
        this.errorService.handleError(error);
      }
    });
  }

  // Social Login
  onSocialLogin(provider: string) {
    console.log('Social login with:', provider);
    
    if (provider === 'email') {
      this.switchMode('email');
      return;
    }
    
    this.errorMessage.set(`${provider} login will be implemented`);
    
  }

  // Password Visibility
  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  // Modal Control
  closeModal() {
    this.modalService.close();
  }

  // Getters for form validation
  get phoneNumber() {
    return this.phoneForm.get('phoneNumber');
  }

  get code() {
    return this.verificationForm.get('code');
  }

  get email() {
    return this.emailLoginForm.get('email');
  }

  get emailPassword() {
    return this.emailLoginForm.get('password');
  }

  get firstName() {
    return this.registerForm.get('firstName');
  }

  get lastName() {
    return this.registerForm.get('lastName');
  }

  get registerEmail() {
    return this.registerForm.get('email');
  }

  get registerPassword() {
    return this.registerForm.get('password');
  }

  // Helper methods
  get isPhoneMode(): boolean {
    return this.mode() === 'phone';
  }

  get isEmailMode(): boolean {
    return this.mode() === 'email';
  }

  get isRegisterMode(): boolean {
    return this.mode() === 'register';
  }

  get isPhoneInput(): boolean {
    return this.phoneStep() === 'input';
  }

  get isPhoneVerify(): boolean {
    return this.phoneStep() === 'verify';
  }

  get modalTitle(): string {
    if (this.isPhoneMode && this.isPhoneVerify) {
      return 'Confirm your number';
    }
    if (this.isEmailMode) {
      return 'Log in';
    }
    if (this.isRegisterMode) {
      return 'Finish signing up';
    }
    return 'Log in or sign up';
  }

  get showBackButton(): boolean {
    return (this.isPhoneMode && this.isPhoneVerify) || this.isEmailMode || this.isRegisterMode;
  }

  onBack() {
    if (this.isPhoneMode && this.isPhoneVerify) {
      this.backToPhone();
    } else {
      this.switchMode('phone');
    }
  }

  // ✅ فتح نافذة نسيت كلمة المرور
  openForgotPassword(event: Event) {
    event.preventDefault();
    this.closeModal();
    
    // استيراد المكون ديناميكياً لتجنب circular dependencies
    import('../forogt-password.component/forogt-password.component').then(module => {
      this.modalService.open(module.ForgotPasswordComponent);
    });
  }
}
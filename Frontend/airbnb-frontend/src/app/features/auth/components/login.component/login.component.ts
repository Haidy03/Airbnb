import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ModalService } from '../../services/modal.service';
import { SocialButtonsComponent } from '../social-buttons.component/social-buttons.component';
import { COUNTRY_CODES, CountryCode } from '../../models/auth-user.model';

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

  // Phone Form
  phoneForm = this.fb.nonNullable.group({
    phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{8,15}$/)]]
  });

  // Verification Form
  verificationForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(6)]]
  });

  // Email Login Form
  emailLoginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  // Register Form
  registerForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
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
          this.closeModal();
          this.router.navigate(['/']);
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

  // Email Login Flow
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
        this.isLoading.set(false);
        if (response.success) {
         // this.authService.handleSuccessfulAuth(response);
          this.closeModal();
          this.router.navigate(['/']);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'Invalid email or password');
      }
    });
  }

  // Register Flow
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

    this.authService.register(request).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success) {
          this.closeModal();
          this.router.navigate(['/']);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'Registration failed');
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
    
    // Implement actual social login logic here
    // For now, just show a message
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
}
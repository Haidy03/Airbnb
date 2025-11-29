import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  // ... (نفس الـ Injections القديمة)
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isLoading = signal(false);
  message = signal('');
  isSuccess = signal(false);
  token = signal('');
  email = signal('');

  // ✅ التعديل هنا: عملنا متغيرين منفصلين للعين
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  resetForm = this.fb.nonNullable.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  });

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token.set(params['token'] || '');
      this.email.set(params['email'] || '');
    });
  }

  // ✅ دوال التبديل
  toggleNewPassword() {
    this.showNewPassword.update(v => !v);
  }

  toggleConfirmPassword() {
    this.showConfirmPassword.update(v => !v);
  }

  // ... (باقي كود onSubmit و backToLogin زي ما هو)
  onSubmit() {
    if (this.resetForm.invalid || !this.token() || !this.email()) return;

    if (this.resetForm.value.newPassword !== this.resetForm.value.confirmPassword) {
      this.message.set('Passwords do not match');
      return;
    }

    this.isLoading.set(true);
    this.message.set('');

    const request = {
      email: this.email(),
      token: this.token(),
      newPassword: this.resetForm.value.newPassword!
    };

    this.authService.resetPassword(request).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isSuccess.set(true);
        this.message.set('Password reset successfully! Redirecting to login...');
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.message.set(err.error?.description || 'Failed to reset password.');
      }
    });
  }

  backToLogin() {
    this.router.navigate(['/login']);
  }
}
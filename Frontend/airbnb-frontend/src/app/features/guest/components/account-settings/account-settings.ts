import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService, UserProfile } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent],
  templateUrl: './account-settings.html',
  styleUrls: ['./account-settings.css']
})
export class AccountSettingsComponent implements OnInit {
  activeSection: 'personal' | 'security' = 'personal';

  isEditingPersonal = false;
  isEditingSecurity = false;

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  personalInfoForm!: FormGroup;
  securityForm!: FormGroup;

  // ✅ دلوقتي مش هيعترض لأننا عملنا import لـ UserProfile فوق
  currentUser: UserProfile | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toastService: ToastService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadUserData();
  }

  private initForms() {
    this.personalInfoForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      dateOfBirth: [''],
      address: [''],
      city: [''],
      country: ['']
    });

    this.securityForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    });
  }

  private loadUserData() {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.personalInfoForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
          address: user.address,
          city: user.city,
          country: user.country
        });
      },
      // ✅ 2. التعديل الثاني: ضفت :any عشان يحل مشكلة TS7006
      error: (err: any) => {
        console.error('Error loading profile', err);
        this.toastService.showError('Failed to load user data');
      }
    });
  }

  selectSection(section: 'personal' | 'security') {
    this.activeSection = section;
    this.cancelEditPersonal();
    this.cancelEditSecurity();
  }

  goBack() {
    this.router.navigate(['/']);
  }

  togglePasswordVisibility(field: 'current' | 'new' | 'confirm') {
    if (field === 'current') this.showCurrentPassword = !this.showCurrentPassword;
    if (field === 'new') this.showNewPassword = !this.showNewPassword;
    if (field === 'confirm') this.showConfirmPassword = !this.showConfirmPassword;
  }

  get passwordsMatch(): boolean {
    return this.securityForm.get('newPassword')?.value === this.securityForm.get('confirmPassword')?.value;
  }

  enableEditPersonal() {
    if (this.currentUser) {
      this.personalInfoForm.patchValue(this.currentUser);
    }
    this.isEditingPersonal = true;
  }

  cancelEditPersonal() {
    this.isEditingPersonal = false;
    if (this.currentUser) {
      this.personalInfoForm.patchValue(this.currentUser);
    }
  }

  savePersonalInfo() {
    if (this.personalInfoForm.invalid) return;

    const updatedData = this.personalInfoForm.value;

    this.authService.updateUserProfile(updatedData).subscribe({
      next: (updatedUser) => {
        this.currentUser = updatedUser;
        this.isEditingPersonal = false;
        this.toastService.showSuccess('Personal information updated successfully');
      },
      // ✅ نفس التعديل هنا
      error: (err: any) => {
        console.error(err);
        this.toastService.showError('Failed to update profile');
      }
    });
  }

  enableEditSecurity() {
    this.securityForm.reset();
    this.isEditingSecurity = true;
  }

  cancelEditSecurity() {
    this.isEditingSecurity = false;
    this.securityForm.reset();
  }

  saveSecurityInfo() {
    if (this.securityForm.invalid) return;

    if (!this.passwordsMatch) {
      this.toastService.showError('Passwords do not match');
      return;
    }

    const { currentPassword, newPassword } = this.securityForm.value;

    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.isEditingSecurity = false;
        this.securityForm.reset();
        this.toastService.showSuccess('Password updated successfully');
      },
      // ✅ وهنا كمان
      error: (err: any) => {
        console.error(err);
        const msg = err.error?.message || 'Failed to change password. Check current password.';
        this.toastService.showError(msg);
      }
    });
  }
}

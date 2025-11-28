import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

// Services & Models
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService, UserProfile } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
        // تحديث الفورم بالبيانات
        this.personalInfoForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
          address: user.address,
          city: user.city,
          country: user.country
        });
      },
      error: (err: any) => {
        console.error('Error loading profile', err);
        this.toastService.showError('Failed to load user data');
      }
    });
  }

  selectSection(section: 'personal' | 'security') {
    this.activeSection = section;
    // إلغاء أي تعديل مفتوح عند تغيير التاب
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

  // --- Personal Info Logic ---

  enableEditPersonal() {
    if (this.currentUser) {
      this.personalInfoForm.patchValue(this.currentUser);
    }
    this.isEditingPersonal = true;
  }

  cancelEditPersonal() {
    this.isEditingPersonal = false;
    // إعادة البيانات للأصل
    if (this.currentUser) {
      this.loadUserData(); // إعادة تحميل البيانات للتأكد
    }
  }

savePersonalInfo() {
    if (this.personalInfoForm.invalid) {
      this.personalInfoForm.markAllAsTouched();
      return;
    }

    const updatedData = this.personalInfoForm.value;

    this.authService.updateUserProfile(updatedData).subscribe({
      next: (responseUser) => {
        this.currentUser = {
          ...this.currentUser!, // بناخد البيانات القديمة (زي الـ ID)
          ...updatedData        // وبنحط عليها البيانات الجديدة (الاسم، العنوان..)
        };

        // بنقفل وضع التعديل
        this.isEditingPersonal = false;

        // رسالة النجاح
        this.toastService.showSuccess('Personal information updated successfully');
      },
      error: (err: any) => {
        console.error(err);
        this.toastService.showError('Failed to update profile');
      }
    });
  }

  // --- Security Logic ---

  enableEditSecurity() {
    this.securityForm.reset();
    this.isEditingSecurity = true;
  }

  cancelEditSecurity() {
    this.isEditingSecurity = false;
    this.securityForm.reset();
  }

  saveSecurityInfo() {
    if (this.securityForm.invalid) {
      this.securityForm.markAllAsTouched(); // إظهار الأخطاء
      return;
    }

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
      error: (err: any) => {
        console.error(err);
        const msg = err.error?.message || 'Failed to change password. Check current password.';
        this.toastService.showError(msg);
      }
    });
  }
}

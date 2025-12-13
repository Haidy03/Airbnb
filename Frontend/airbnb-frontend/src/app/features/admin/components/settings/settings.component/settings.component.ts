import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../serevices/admin.service';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class AdminSettingsComponent implements OnInit {
  loading = signal(false);
  saving = signal(false);
  
  settings = signal<any>({
    platformName: '',
    platformFeePercentage: 0,
    currency: ''
  });
  // Admin Profile
  adminProfile = signal({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  // Password Change
  passwordForm = signal({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  activeTab = signal<string>('general');

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    
    // تحميل الإعدادات
    this.adminService.getSettings().subscribe({
      next: (res) => this.settings.set(res),
      error: (err) => {
        console.error(err);
        this.notificationService.showToast('error', 'Failed to load settings');
      }
    });

    // تحميل البروفايل
    this.adminService.getProfile().subscribe({
      next: (res) => {
        this.adminProfile.set({
          firstName: res.firstName,
          lastName: res.lastName,
          email: res.email,
          phone: res.phoneNumber
        });
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
        this.notificationService.showToast('error', 'Failed to load profile');
      }
    });
  }

  saveSettings(): void {
    this.saving.set(true);
    this.adminService.updateSettings(this.settings()).subscribe({
      next: () => {
        this.saving.set(false);
        this.notificationService.showSuccess('Saved', 'Settings saved successfully');
      },
      error: () => {
        this.saving.set(false);
        this.notificationService.showToast('error', 'Failed to save settings');
      }
    });
  }

  updateProfile(): void {
    this.saving.set(true);
    this.adminService.updateProfile(this.adminProfile()).subscribe({
      next: () => {
        this.saving.set(false);
        this.notificationService.showSuccess('Updated', 'Profile updated successfully');
      },
      error: () => {
        this.saving.set(false);
        this.notificationService.showToast('error', 'Failed to update profile');
      }
    });
  }

  changePassword(): void {
    const form = this.passwordForm();
    
    if (!form.currentPassword || !form.newPassword) {
      this.notificationService.showToast('warning', 'Please fill required fields');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      this.notificationService.showToast('warning', 'Passwords do not match');
      return;
    }

    this.saving.set(true);
    this.adminService.changePassword({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.passwordForm.set({ currentPassword: '', newPassword: '', confirmPassword: '' });
        this.notificationService.showSuccess('Success', 'Password changed successfully');
      },
      error: (err) => {
        this.saving.set(false);
        this.notificationService.showToast('error', err.error?.message || 'Failed to change password');
      }
    });
  }

  selectTab(tab: string): void {
    this.activeTab.set(tab);
  }

  clearCache(): void {
    this.notificationService.showSuccess('Success', 'Cache cleared successfully');
  }

  exportData(): void {
    this.notificationService.showToast('info', 'Data export initiated');
  }
}
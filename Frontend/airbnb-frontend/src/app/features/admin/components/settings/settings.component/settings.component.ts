import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../serevices/admin.service';

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

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    
    // تحميل الإعدادات
    this.adminService.getSettings().subscribe({
      next: (res) => this.settings.set(res),
      error: (err) => console.error(err)
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
      }
    });
  }

  saveSettings(): void {
    this.saving.set(true);
    this.adminService.updateSettings(this.settings()).subscribe({
      next: () => {
        this.saving.set(false);
        alert('Settings saved successfully');
      },
      error: () => {
        this.saving.set(false);
        alert('Failed to save settings');
      }
    });
  }


  updateProfile(): void {
    this.saving.set(true);
    this.adminService.updateProfile(this.adminProfile()).subscribe({
      next: () => {
        this.saving.set(false);
        alert('Profile updated successfully');
      },
      error: () => {
        this.saving.set(false);
        alert('Failed to update profile');
      }
    });
  }

  changePassword(): void {
    const form = this.passwordForm();
    
    if (!form.currentPassword || !form.newPassword) {
      alert('Please fill required fields');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      alert('Passwords do not match');
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
        alert('Password changed successfully');
      },
      error: (err) => {
        this.saving.set(false);
        alert(err.error?.message || 'Failed to change password');
      }
    });
  }

  selectTab(tab: string): void {
    this.activeTab.set(tab);
  }

  clearCache(): void {
    this.showNotification('Cache cleared successfully');
  }

  exportData(): void {
    this.showNotification('Data export initiated');
  }

  private showNotification(message: string, type: 'success' | 'error' = 'success'): void {
    console.log(`${type}: ${message}`);
  }
}
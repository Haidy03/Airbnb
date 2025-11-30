import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface PlatformSettings {
  platformName: string;
  platformFeePercentage: number;
  currency: string;
  allowGuestBooking: boolean;
  requireVerification: boolean;
  autoApproveProperties: boolean;
  maintenanceMode: boolean;
}

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
  
  settings = signal<PlatformSettings>({
    platformName: 'Airbnb Clone',
    platformFeePercentage: 15,
    currency: 'EGP',
    allowGuestBooking: true,
    requireVerification: true,
    autoApproveProperties: false,
    maintenanceMode: false
  });

  // Admin Profile
  adminProfile = signal({
    email: 'admin@airbnb.com',
    firstName: 'Admin',
    lastName: 'User',
    phone: '+1234567890'
  });

  // Password Change
  passwordForm = signal({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  activeTab = signal<string>('general');

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.loading.set(true);
    // Simulate API call
    setTimeout(() => {
      this.loading.set(false);
    }, 500);
  }

  saveSettings(): void {
    this.saving.set(true);
    // Simulate API call
    setTimeout(() => {
      this.saving.set(false);
      this.showNotification('Settings saved successfully');
    }, 1000);
  }

  updateProfile(): void {
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.showNotification('Profile updated successfully');
    }, 1000);
  }

  changePassword(): void {
    const form = this.passwordForm();
    
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      this.showNotification('Please fill all password fields', 'error');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      this.showNotification('Passwords do not match', 'error');
      return;
    }

    if (form.newPassword.length < 8) {
      this.showNotification('Password must be at least 8 characters', 'error');
      return;
    }

    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.passwordForm.set({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      this.showNotification('Password changed successfully');
    }, 1000);
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
/* import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ProfileDetails, Profile } from '../../models/user.model';
import { AuthService } from '../../../auth/services/auth.service';

interface ProfileQuestion {
  id: string;
  icon: string;
  label: string;
  field: keyof ProfileDetails;
  placeholder: string;
  maxLength: number;
}

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-edit.component.html',
  styleUrls: ['./profile-edit.component.css']
})
export class ProfileEditComponent implements OnInit {
  user: Profile | null = null;
  profileDetails: ProfileDetails = {} as ProfileDetails;
  profileImage: string = '';
  showTravelStamps = false;
  isSaving = false;
  activeModal: ProfileQuestion | null = null;
  modalValue = '';

  private userService = inject(UserService);
  private router = inject(Router);
  private authService = inject(AuthService);

  questions: ProfileQuestion[] = [
    { id: '1', icon: '🎯', label: "Where I've always wanted to go", field: 'whereToGo', placeholder: "Where I've always wanted to go:", maxLength: 40 },
    { id: '2', icon: '💼', label: 'My work', field: 'myWork', placeholder: 'My work:', maxLength: 40 },
    { id: '3', icon: '⏰', label: 'I spend too much time', field: 'spendTime', placeholder: 'I spend too much time:', maxLength: 40 },
    { id: '4', icon: '🐾', label: 'Pets', field: 'pets', placeholder: 'Pets:', maxLength: 40 },
    { id: '5', icon: '📍', label: 'Decade I was born', field: 'bornDecade', placeholder: 'Decade I was born:', maxLength: 40 },
    { id: '6', icon: '🎓', label: 'Where I went to school', field: 'school', placeholder: 'Where I went to school:', maxLength: 40 },
    { id: '7', icon: '✏️', label: 'My most useless skill', field: 'uselessSkill', placeholder: 'My most useless skill:', maxLength: 40 },
    { id: '8', icon: '💡', label: 'My fun fact', field: 'funFact', placeholder: 'My fun fact:', maxLength: 40 },
    { id: '9', icon: '🎵', label: 'My favorite song in high school', field: 'favoriteSong', placeholder: 'My favorite song in high school:', maxLength: 40 },
    { id: '10', icon: '❤️', label: "I'm obsessed with", field: 'obsessedWith', placeholder: "I'm obsessed with:", maxLength: 40 },
    { id: '11', icon: '📖', label: 'My biography title would be', field: 'biographyTitle', placeholder: 'My biography title would be:', maxLength: 40 },
    { id: '12', icon: '🌐', label: 'Languages I speak', field: 'languages', placeholder: 'Languages I speak:', maxLength: 40 },
    { id: '13', icon: '🏠', label: 'Where I live', field: 'whereILive', placeholder: 'Where I live:', maxLength: 40 }
  ];

  ngOnInit() {
    this.loadData();
    window.scrollTo(0, 0);
  }

  loadData() {
    this.userService.getProfileDetails().subscribe({
      next: (details) => {
        console.log('📥 Loaded Profile Details:', details);
        this.profileDetails = details;
        if (details.profileImage) {
          this.profileImage = details.profileImage;
        }
      },
      error: (err) => console.error('Error loading profile:', err)
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      this.userService.uploadProfileImage(file).subscribe({
        next: (response) => {
          const newImageUrl = response.url;
          console.log('1. Image uploaded:', newImageUrl);

          // Update UI
          this.profileImage = newImageUrl;
          this.profileDetails.profileImage = newImageUrl;
          
          // Update Header
          this.authService.updateUserImage(newImageUrl);
        },
        error: (error) => {
          console.error('Error uploading image file:', error);
          alert('Failed to upload image file.');
        }
      });
    }}
  } */


import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ProfileDetails, Profile } from '../../models/user.model';
import { AuthService } from '../../../auth/services/auth.service';

interface ProfileQuestion {
  id: string;
  icon: string;
  label: string;
  field: keyof ProfileDetails;
  placeholder: string;
  maxLength: number;
}

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-edit.component.html',
  styleUrls: ['./profile-edit.component.css']
})
export class ProfileEditComponent implements OnInit {
  // المتغيرات
  user: Profile | null = null;
  profileDetails: ProfileDetails = {} as ProfileDetails;
  profileImage: string = '';
  showTravelStamps = false;
  isSaving = false;
  
  // متغيرات المودال (النافذة المنبثقة)
  activeModal: ProfileQuestion | null = null;
  modalValue = '';

  // الخدمات
  private userService = inject(UserService);
  private router = inject(Router);
  private authService = inject(AuthService);

  // الأسئلة
  questions: ProfileQuestion[] = [
    { id: '1', icon: '🎯', label: "Where I've always wanted to go", field: 'whereToGo', placeholder: "Where I've always wanted to go:", maxLength: 40 },
    { id: '2', icon: '💼', label: 'My work', field: 'myWork', placeholder: 'My work:', maxLength: 40 },
    { id: '3', icon: '⏰', label: 'I spend too much time', field: 'spendTime', placeholder: 'I spend too much time:', maxLength: 40 },
    { id: '4', icon: '🐾', label: 'Pets', field: 'pets', placeholder: 'Pets:', maxLength: 40 },
    { id: '5', icon: '📍', label: 'Decade I was born', field: 'bornDecade', placeholder: 'Decade I was born:', maxLength: 40 },
    { id: '6', icon: '🎓', label: 'Where I went to school', field: 'school', placeholder: 'Where I went to school:', maxLength: 40 },
    { id: '7', icon: '✏️', label: 'My most useless skill', field: 'uselessSkill', placeholder: 'My most useless skill:', maxLength: 40 },
    { id: '8', icon: '💡', label: 'My fun fact', field: 'funFact', placeholder: 'My fun fact:', maxLength: 40 },
    { id: '9', icon: '🎵', label: 'My favorite song in high school', field: 'favoriteSong', placeholder: 'My favorite song in high school:', maxLength: 40 },
    { id: '10', icon: '❤️', label: "I'm obsessed with", field: 'obsessedWith', placeholder: "I'm obsessed with:", maxLength: 40 },
    { id: '11', icon: '📖', label: 'My biography title would be', field: 'biographyTitle', placeholder: 'My biography title would be:', maxLength: 40 },
    { id: '12', icon: '🌐', label: 'Languages I speak', field: 'languages', placeholder: 'Languages I speak:', maxLength: 40 },
    { id: '13', icon: '🏠', label: 'Where I live', field: 'whereILive', placeholder: 'Where I live:', maxLength: 40 }
  ];

  ngOnInit() {
    this.loadData();
    window.scrollTo(0, 0);
  }

  loadData() {
    this.userService.getProfileDetails().subscribe({
      next: (details) => {
        console.log('📥 Loaded Profile Details:', details);
        this.profileDetails = details;
        if (details.profileImage) {
          this.profileImage = details.profileImage;
        }
      },
      error: (err) => console.error('Error loading profile:', err)
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      this.userService.uploadProfileImage(file).subscribe({
        next: (response) => {
          const newImageUrl = response.url;
          console.log('1. Image uploaded:', newImageUrl);

          // Update UI
          this.profileImage = newImageUrl;
          this.profileDetails.profileImage = newImageUrl;
          
          // Update Header
          this.authService.updateUserImage(newImageUrl);
        },
        error: (error) => {
          console.error('Error uploading image file:', error);
          alert('Failed to upload image file.');
        }
      });
    }
  }

  // --- الدوال التي كانت ناقصة (The Missing Functions) ---

  // فتح المودال عند الضغط على السؤال
  openModal(question: ProfileQuestion) {
    this.activeModal = question;
    // جلب القيمة الحالية للسؤال أو تركها فارغة
    this.modalValue = this.profileDetails[question.field] || '';
  }

  // إغلاق المودال
  closeModal() {
    this.activeModal = null;
    this.modalValue = '';
  }

  // الحصول على عنوان المودال
  getModalTitle(): string {
    return this.activeModal ? this.activeModal.label : '';
  }

  // الحصول على وصف المودال
  getModalDescription(): string {
    return this.activeModal ? this.activeModal.placeholder : '';
  }

  // حفظ القيمة من المودال إلى المتغير المحلي (بدون إرسال للسيرفر حالياً)
  saveModal() {
    if (this.activeModal) {
      this.profileDetails[this.activeModal.field] = this.modalValue;
      this.closeModal();
    }
  }

  // الضغط على زر Done لحفظ البيانات النهائية في السيرفر
  onDone() {
    this.isSaving = true;
    
    // ملاحظة: تأكد أن دالة updateProfile موجودة في UserService
    // إذا كانت الدالة اسمها مختلف (مثل updateProfileDetails) قم بتغييرها هنا
    this.userService.updateProfileDetails(this.profileDetails).subscribe({
      next: () => {
        console.log('✅ Profile updated successfully');
        this.isSaving = false;
        // التوجيه لصفحة البروفايل بعد الحفظ
        this.router.navigate(['/profile']); 
      },
      error: (err) => {
        console.error('❌ Error updating profile:', err);
        this.isSaving = false;
        alert('Failed to save profile changes.');
      }
    });
  }
}
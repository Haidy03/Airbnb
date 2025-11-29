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
    // 1. Load Initial State from Auth (Fast)
    const currentUser = this.authService.currentUser;
    if (currentUser && currentUser.profilePicture) {
       this.profileImage = currentUser.profilePicture;
    }

    // 2. Load Fresh Data from Server (Slower but accurate)
    this.userService.getProfileDetails().subscribe({
      next: (details) => {
        console.log('📥 Loaded Profile Details:', details);
        this.profileDetails = details;
        
        // ✅ CRITICAL: If backend returns an image, use it. 
        // The service has already transformed it to https://localhost...
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
          // response.url is already transformed by the Service
          const newImageUrl = response.url;
          console.log('1. Image uploaded:', newImageUrl);

          // Update UI immediately
          this.profileImage = newImageUrl;
          this.profileDetails.profileImage = newImageUrl;
          
          // Update Global State
          this.authService.updateUserImage(newImageUrl);
        },
        error: (error) => {
          console.error('Error uploading image file:', error);
          alert('Failed to upload image file.');
        }
      });
    }
  }

  openModal(question: ProfileQuestion) {
    this.activeModal = question;
    this.modalValue = this.profileDetails[question.field] || '';
  }

  closeModal() {
    this.activeModal = null;
    this.modalValue = '';
  }

  getModalTitle(): string { return this.activeModal ? this.activeModal.label : ''; }
  getModalDescription(): string { return this.activeModal ? this.activeModal.placeholder : ''; }

  saveModal() {
    if (this.activeModal) {
      this.profileDetails[this.activeModal.field] = this.modalValue;
      this.closeModal();
    }
  }

  onDone() {
    this.isSaving = true;
    const currentUser = this.authService.currentUser;

    // 1. Create a shallow copy so we don't mess up the UI
    const formData: any = { ...this.profileDetails };

    // 2. AGGRESSIVELY remove all image fields to prevent overwriting the DB
    delete formData.profileImage;
    delete formData.profileImageUrl; 
    delete formData.profilePicture;
    delete formData.avatar;

    // 3. Construct the final payload
    const payload: ProfileDetails = {
      ...formData,
      firstName: this.profileDetails.firstName || currentUser?.firstName || 'User',
      lastName: this.profileDetails.lastName || currentUser?.lastName || 'Name'
    };

    console.log('🚀 Saving CLEAN Payload (No Images):', payload);

    this.userService.updateProfileDetails(payload).subscribe({
      next: (response) => {
        console.log('✅ Saved successfully');
        this.authService.fetchAndSetFullProfile();
        this.isSaving = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.router.navigate(['/profile/about-me']); 
      },
      error: (error) => {
        console.error('❌ Error saving:', error);
        this.isSaving = false;
        alert('Failed to save profile.');
      }
    });
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ProfileDetails, Profile } from '../../models/user.model';

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

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.userService.getCurrentUser().subscribe(user => {
      //this.user = user;
    });

    this.userService.getProfileDetails().subscribe(details => {
      this.profileDetails = details;
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      this.userService.uploadProfileImage(file).subscribe({
        next: (response) => {
          this.profileImage = response.url;
          this.profileDetails.profileImage = response.url;
          console.log('Image uploaded successfully');
        },
        error: (error) => {
          console.error('Error uploading image:', error);
          alert('Failed to upload image. Please try again.');
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

  getModalTitle(): string {
    if (!this.activeModal) return '';
    const titles: Record<string, string> = {
      whereToGo: 'Where have you always wanted to travel?',
      myWork: 'What do you do for work?',
      spendTime: 'What do you spend too much time doing?',
      pets: 'Do you have any pets?',
      bornDecade: 'What decade were you born in?',
      school: 'Where did you go to school?',
      uselessSkill: 'What is your most useless skill?',
      funFact: 'What is a fun fact about you?',
      favoriteSong: 'What was your favorite song in high school?',
      obsessedWith: 'What are you obsessed with?',
      biographyTitle: 'What would your biography title be?',
      languages: 'What languages do you speak?',
      whereILive: 'Where do you live?'
    };
    return titles[this.activeModal.field] || '';
  }

  getModalDescription(): string {
    if (!this.activeModal) return '';
    const descriptions: Record<string, string> = {
      whereToGo: "Whether it's on your bucket list or your short list, tell us a place you can't wait to visit.",
      myWork: 'Tell us what you do for a living.',
      spendTime: 'Share what hobby or activity takes up most of your time.',
      pets: 'Tell us about your furry, feathered, or scaly friends.',
      bornDecade: 'Share what decade you were born in.',
      school: 'Tell us where you studied.',
      uselessSkill: 'What skill do you have that serves no practical purpose?',
      funFact: 'Share something interesting or unique about yourself.',
      favoriteSong: 'What song takes you back to high school?',
      obsessedWith: 'What are you currently obsessed with?',
      biographyTitle: 'If someone wrote your life story, what would it be called?',
      languages: 'What languages can you speak?',
      whereILive: 'Tell us where you currently live.'
    };
    return descriptions[this.activeModal.field] || '';
  }

  saveModal() {
    if (this.activeModal) {
      this.profileDetails[this.activeModal.field] = this.modalValue;
      this.closeModal();
    }
  }

  onDone() {
    this.isSaving = true;
    
    this.userService.updateProfileDetails(this.profileDetails).subscribe({
      next: (response) => {
        console.log('Profile saved successfully:', response);
        this.isSaving = false;
        this.router.navigate(['/profile/about']);
      },
      error: (error) => {
        console.error('Error saving profile:', error);
        this.isSaving = false;
        alert('Failed to save profile. Please try again.');
      }
    });
  }
}
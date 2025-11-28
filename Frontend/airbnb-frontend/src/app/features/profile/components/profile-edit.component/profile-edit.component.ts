import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ProfileDetails, Profile } from '../../models/user.model';
import{AuthService} from '../../../auth/services/auth.service';
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

  // Services
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

  // constructor(
  //   private userService: UserService,
  //   private router: Router
  // ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    // 1. Get auth user data (for initial avatar)
    const currentUser = this.authService.currentUser;
    if (currentUser) {
       this.profileImage = currentUser.profilePicture || '';
    }

    // 2. Get detailed profile data
    this.userService.getProfileDetails().subscribe(details => {
      this.profileDetails = details;
      // Ensure local image matches details if available
      if (details.profileImage) {
        this.profileImage = details.profileImage;
      }
    });
    this.userService.getCurrentUser().subscribe(user => {
      //this.user = user;
    });

    this.userService.getProfileDetails().subscribe(details => {
      this.profileDetails = details;
    });
  }


 private saveImageToBackendProfile(imageUrl: string) {
    const currentUser = this.authService.currentUser;
    const payload = {
        ...this.profileDetails,
        firstName: currentUser?.firstName,
        lastName: currentUser?.lastName,
        profileImage: imageUrl
    };
    this.userService.updateProfileDetails(payload).subscribe({
        next: () => console.log('Profile record updated with new image'),
        error: (e) => console.error(e)
    });
  }
 // ✅ MODIFIED: Uploads AND Saves immediately
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Step 1: Upload Image to Server Storage
      this.userService.uploadProfileImage(file).subscribe({
        next: (response) => {
          const newImageUrl = response.url;
          console.log('1. Image uploaded to storage:', newImageUrl);

          // Step 2: Prepare Payload to Save URL to Database
          // We MUST include FirstName/LastName to satisfy backend validation
          const currentUser = this.authService.currentUser;
          const payload: ProfileDetails = {
            ...this.profileDetails,
            firstName: currentUser?.firstName,
            lastName: currentUser?.lastName,
            profileImage: newImageUrl // The new URL
          };

          // Step 3: Immediately Update User Profile in Database
          // this.userService.updateProfileDetails(payload).subscribe({
          //   next: (updateResponse) => {
          //     console.log('2. Profile updated with new image');

          //     // A. Update Local View
          //     this.profileImage = newImageUrl;
          //     this.profileDetails.profileImage = newImageUrl;

          //     // B. Update Global Header/Sidebar (Host Layout)
          //     this.authService.fetchAndSetFullProfile(); 
          //   },
          //   error: (err) => {
          //     console.error('Failed to link image to profile:', err);
          //     // Handle 400 Bad Request specifically if needed
          //     if (err.status === 400 && err.error?.errors) {
          //        alert('Error: ' + JSON.stringify(err.error.errors));
          //     }
          //   }
          // });
           // 3. ✅ CRITICAL: Force update to AuthService & LocalStorage immediately
          this.authService.updateUserImage(newImageUrl);

          // 4. (Optional) Auto-save to DB to persist if page reloads
          // If you want to strictly wait for "Done", skip this step.
          // But to be safe, we usually trigger the API update here too.
          this.saveImageToBackendProfile(newImageUrl); 
        },
        error: (error) => {
          console.error('Error uploading image file:', error);
          alert('Failed to upload image file. Please try again.');
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
    //return titles[this.activeModal.field] || '';
     return this.activeModal.label;
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
    //return descriptions[this.activeModal.field] || '';
    return this.activeModal.placeholder;
  }

  saveModal() {
    if (this.activeModal) {
      this.profileDetails[this.activeModal.field] = this.modalValue;
      this.closeModal();
    }
  }

  // onDone() {
  //   this.isSaving = true;
  //   // 1. Get the current user to retrieve FirstName and LastName
  //   const currentUser = this.authService.currentUser;

  //   if (!currentUser) {
  //     this.isSaving = false;
  //     return;
  //   }

  //   // 2. Merge existing ProfileDetails with the required Name fields
  //   // We send the EXISTING names back to the server to satisfy validation
  //   const payload: ProfileDetails = {
  //     ...this.profileDetails,
  //     firstName: currentUser.firstName, // Required by Backend
  //     lastName: currentUser.lastName    // Required by Backend
  //   };

  //   console.log('Sending Payload:', payload);
  //   this.userService.updateProfileDetails(this.profileDetails).subscribe({
  //     next: (response) => {
  //       console.log('Profile saved successfully:', response);
  //       // 2. CRITICAL: Refresh the Global Auth State
  //       // This makes the Host Layout (Header) and About Me page fetch the new image
  //       this.authService.fetchAndSetFullProfile();

  //       this.isSaving = false;
        
  //       // 3. Navigate back to About Me page
  //       this.router.navigate(['/profile/about-me']);
  //       // this.isSaving = false;
  //       // this.router.navigate(['/profile/about']);
  //     },
  //     error: (error) => {
  //       console.error('Error saving profile:', error);
  //       this.isSaving = false;
  //       //alert('Failed to save profile. Please try again.');
  //     // Optional: Show specific error if validation fails
  //       if(error.status === 400) {
  //          alert('Please ensure your account has a valid First and Last Name.');
  //       } else {
  //          alert('Failed to save profile. Please try again.');
  //       }
  //     }
  //   });
  // }
  onDone() {
    this.isSaving = true;
    
    // We also need to send names here just in case the user edited text fields
    const currentUser = this.authService.currentUser;
    const payload: ProfileDetails = {
      ...this.profileDetails,
      firstName: currentUser?.firstName,
      lastName: currentUser?.lastName
    };

    this.userService.updateProfileDetails(payload).subscribe({
      next: (response) => {
        console.log('Profile details saved:', response);
        this.authService.fetchAndSetFullProfile();
        this.isSaving = false;
        this.router.navigate(['/profile/about-me']);
      },
      error: (error) => {
        console.error('Error saving profile:', error);
        this.isSaving = false;
        alert('Failed to save profile.');
      }
    });
  }
}
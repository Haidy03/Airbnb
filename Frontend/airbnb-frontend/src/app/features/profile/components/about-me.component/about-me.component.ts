import { Component, inject, OnInit, ChangeDetectionStrategy, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router'; // Added ActivatedRoute from Haidy
import { AuthService } from '../../../auth/services/auth.service';
import { AuthUser } from '../../../auth/models/auth-user.model';
import { UserService } from '../../services/user.service';
import { ProfileDetails } from '../../models/user.model';

@Component({
  selector: 'app-about-me',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about-me.component.html',
  styleUrls: ['./about-me.component.css'],
  changeDetection: ChangeDetectionStrategy.Default 
})
export class AboutMeComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);
  private route = inject(ActivatedRoute); // From Haidy's code

  // Use the signal from AuthService for the left-side card
  user: Signal<AuthUser | null> = this.authService.user;
  
  // Local state for the details (Keep as object to work with your HTML loop)
  profileDetails: ProfileDetails | null = null;
  isLoadingDetails = true;

  // ✅ CRITICAL: We Keep this array so the icons show up!
  displayItems = [
    { field: 'school', icon: '🎓', label: 'Where I went to school' },
    { field: 'myWork', icon: '💼', label: 'My work' },
    { field: 'whereToGo', icon: '🎯', label: 'Where I want to go' },
    { field: 'spendTime', icon: '⏰', label: 'I spend too much time' },
    { field: 'pets', icon: '🐾', label: 'Pets' },
    { field: 'bornDecade', icon: '📍', label: 'Born in the' },
    { field: 'uselessSkill', icon: '✏️', label: 'Most useless skill' },
    { field: 'funFact', icon: '💡', label: 'Fun fact' },
    { field: 'favoriteSong', icon: '🎵', label: 'Favorite song in high school' },
    { field: 'obsessedWith', icon: '❤️', label: 'Obsessed with' },
    { field: 'biographyTitle', icon: '📖', label: 'Biography title' },
    { field: 'languages', icon: '🌐', label: 'Languages' },
    { field: 'whereILive', icon: '🏠', label: 'Lives in' },
  ];

  ngOnInit() {
    this.loadProfileDetails();
  }

  loadProfileDetails() {
    this.isLoadingDetails = true;
    this.userService.getProfileDetails().subscribe({
      next: (data) => {
        // ✅ Adopt Haidy's Image Fix (Cache Busting)
        if (data.profileImage) {
          const cleanUrl = data.profileImage.split('?')[0];
          data.profileImage = `${cleanUrl}?t=${new Date().getTime()}`;
        }
        
        console.log('✅ About Me Data Loaded:', data);
        this.profileDetails = data;
        this.isLoadingDetails = false;
      },
      error: (err) => {
        console.error('❌ Failed to load about me details', err);
        this.isLoadingDetails = false;
      }
    });
  }

  // Helper needed for your HTML loop
  getValue(fieldName: string): string | undefined {
    return (this.profileDetails as any)?.[fieldName];
  }

  onEdit() {
    // ✅ Adopt Haidy's Navigation (Relative path is safer)
    this.router.navigate(['../edit-profile'], { relativeTo: this.route });
  }

  onGetStarted() {
    this.onEdit();
  }
}
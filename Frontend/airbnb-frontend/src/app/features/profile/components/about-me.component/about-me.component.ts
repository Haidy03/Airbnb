// import { Component, OnInit , Inject} from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Router } from '@angular/router';
// import { UserService } from '../../services/user.service';
// import { Profile } from '../../models/user.model';
// import { Observable } from 'rxjs/internal/Observable';
// import { AuthService, UserProfile } from '../../../auth/services/auth.service';
// import { map, tap } from 'rxjs/operators';
// import {AuthUser} from '../../../auth/models/auth-user.model'; 
// @Component({
//   selector: 'app-about-me',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './about-me.component.html',
//   styleUrls: ['./about-me.component.css']
// })
// export class AboutMeComponent implements OnInit {
//    user:  UserProfile | null = null;
//    //user$: Observable<Profile | null>;

//   isLoading = true;

//   constructor(
//     public userprofile : UserProfile,
//     public auth: AuthService,
//     private userService: UserService,
//     private router: Router
//   ) {
//     this.user = this.auth.UserProfile.pipe(
//       tap(() => this.isLoading = false),
//       map((u: Profile | null) => {
//         if (!u) return null;
//         const name = u.fullName?.trim()
//           || `${u.firstName || ''} ${u.lastName || ''}`.trim()
//           || u.email
//           || 'User';
//         const initial = name ? name.charAt(0).toUpperCase() : (u.email ? u.email.charAt(0).toUpperCase() : 'U');
//         return {
//           profileImage: u.profilePicture || null,
//           name,
//           initial,
//           role: u.role || '',
//           email: u.email || ''
//         } as Profile;
//       })
//     );

//   }

//   ngOnInit() {
//     this.loadUserData();
//   }

//   loadUserData() {
//     this.isLoading = true;
//     this.userService.getCurrentUser().subscribe({
//       next: (userData) => {
//         this.user = userData;
//         this.isLoading = false;
//       },
//       error: (error) => {
//         console.error('Error loading user:', error);
//         this.isLoading = false;
//       }
//     });
//   }

//   onEdit() {
//     this.router.navigate(['/profile/edit-profile']);
//   }

//   onGetStarted() {
//     this.router.navigate(['/profile/edit-profile']);
//   }
// }
import { Component, inject, OnInit , ChangeDetectionStrategy ,Signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { AuthUser } from '../../../auth/models/auth-user.model';
import { UserService } from '../../services/user.service';
import { Profile } from '../../models/user.model';

@Component({
  selector: 'app-about-me',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about-me.component.html',
  styleUrls: ['./about-me.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutMeComponent  {
private authService = inject(AuthService);
  private router = inject(Router);

  user: Signal<AuthUser | null> = this.authService.user;


 constructor(
   // private userService: UserService,
    private auth: AuthService,
    //private router: Router
  ) {}
  

  // user$!: Observable<AuthUser | null>;
  // isLoading = true;

 

  // ngOnInit() {
  //   this.user$ = this.auth.user$;
  //   // بسيطة: نرفع isLoading false بعد أول قيمة أو خطأ
  //   this.user$.subscribe({
  //     next: () => this.isLoading = false,
  //     error: () => this.isLoading = false
  //   });
  // }

  onEdit() {
    this.router.navigate(['/profile/edit-profile']);
  }

  onGetStarted() {
    this.router.navigate(['/profile/edit-profile']);
  }
}

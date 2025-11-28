// import { Component, Signal,inject,signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Router, RouterLink, RouterOutlet,RouterLinkActive  } from '@angular/router';
// import { trigger, transition, style, animate } from '@angular/animations';
// import { HostStatsService } from '../../features/host/services/host-stats';
// import { MessageService } from '../../features/messages/Services/message';
// import { AuthService } from '../../features/auth/services/auth.service';
// import { ModalService } from '../../features/auth/services/modal.service';
// import { AuthUser } from '../../features/auth/models/auth-user.model';
// interface NavItem {
//   label: string;
//   route: string;
//   icon: string;
//   badge?: number;
// }

// @Component({
//   selector: 'app-host-layout',
//   standalone: true,
//   imports: [CommonModule, RouterLink, RouterOutlet,RouterLinkActive],
//   templateUrl: './host-layout.html',
//   styleUrls: ['./host-layout.css']
// })
// export class HostLayoutComponent {
//   private authService = inject(AuthService);
//   user: Signal<AuthUser | null> = this.authService.user;
  
//   // Sidebar state
//   sidebarOpen = signal<boolean>(true);
//   mobileMenuOpen = signal<boolean>(false);
//   public messageService = inject(MessageService);
  
//   // User notifications
//   unreadNotifications = signal<number>(0);

//   // Navigation items
//   navItems: NavItem[] = [
//     { label: 'Dashboard', route: '/host/dashboard', icon: '📊' },
//     { label: 'Calendar', route: '/host/calendar', icon: '📅' },
//     { label: 'My Listings', route: '/host/properties', icon: '🏠' },
//     { label: 'Bookings', route: '/host/bookings', icon: '📝' },
//     { label: 'Messages', route: '/host/messages', icon: '💬', badge: 2 },
//     { label: 'Earnings', route: '/host/earnings', icon: '💰' },
//     { label: 'Reviews', route: '/host/reviews', icon: '⭐' },
//     { label: 'Performance', route: '/host/performance', icon: '📈' },
//   ];

//   // Mock user data (replace with actual auth service)
//   // user = {
//   //   name: 'Host Name',
//   //   email: 'host@example.com',
//   //   avatar: 'https://i.pravatar.cc/150?img=33',
//   //   isSuperhost: true
//   // };

//   constructor(
//     private router: Router,
//     private hostStatsService: HostStatsService
//   ) {
//     this.loadNotificationCount();
//   }

//   /**
//    * Load unread notification count
//    */
//   loadNotificationCount(): void {
//     this.hostStatsService.getUnreadCount().subscribe(count => {
//       this.unreadNotifications.set(count);
//     });
//   }

//   /**
//    * Toggle sidebar
//    */
//   toggleSidebar(): void {
//     this.sidebarOpen.set(!this.sidebarOpen());
//   }

// viewProfileClick(){
//     this.toggleMobileMenu();
//     if (!this.authService.isAuthenticated) {
//       // بنبعت returnUrl عشان لما يخلص لوجن يرجع يكمل خطوات الهوست
//       this.router.navigate(['/login']);
//       return;
//     }
    
//       this.router.navigate(['/profile/about-me'] );
    
//   }


//   /**
//    * Toggle mobile menu
//    */
//   toggleMobileMenu(): void {
//     this.mobileMenuOpen.set(!this.mobileMenuOpen());
//   }

//   /**
//    * Check if route is active
//    */
//   isActiveRoute(route: string): boolean {
//     return this.router.url.includes(route);
//   }

//   /**
//    * Navigate to route and close mobile menu
//    */
//   navigateAndClose(route: string): void {
//     this.router.navigate([route]);
//     this.mobileMenuOpen.set(false);
//   }

//   /**
//    * Logout (implement with your auth service)
//    */
//   logout(): void {
//     // Implement logout logic
//     console.log('Logging out...');
//     this.router.navigate(['/']);
//   }
// }
import { Component, Signal, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { HostStatsService } from '../../features/host/services/host-stats';
import { MessageService } from '../../features/messages/Services/message';
import { AuthService } from '../../features/auth/services/auth.service';
import { AuthUser } from '../../features/auth/models/auth-user.model';

@Component({
  selector: 'app-host-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, RouterLinkActive],
  templateUrl: './host-layout.html',
  styleUrls: ['./host-layout.css'],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class HostLayoutComponent {
  private authService = inject(AuthService);
  public messageService = inject(MessageService);
  private router = inject(Router);
  private hostStatsService = inject(HostStatsService);

  // This signal automatically updates when AuthService updates
  user: Signal<AuthUser | null> = this.authService.user;
  
  // Sidebar and Menu state
  mobileMenuOpen = signal<boolean>(false);
  unreadNotifications = signal<number>(0);

  constructor() {
    this.loadNotificationCount();
  }

  loadNotificationCount(): void {
    this.hostStatsService.getUnreadCount().subscribe(count => {
      this.unreadNotifications.set(count);
    });
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
  }

  /**
   * DIRECT NAVIGATION TO PROFILE
   * usage: (click)="viewProfileClick($event)"
   */
  viewProfileClick(event?: Event) {
    // 1. Stop the menu button from triggering (because the avatar is inside the button)
    if (event) {
      event.stopPropagation();
    }

    // 2. Close menu if it's open
    this.mobileMenuOpen.set(false);

    // 3. Check auth and navigate
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Navigate to the specific tab you showed in your screenshot (About me)
    // Adjust the path to match your routing: /profile/about-me or just /profile
    this.router.navigate(['/profile']); 
  }

  logout(): void {
    this.authService.logout(); // Assuming you have this method
    this.router.navigate(['/']);
  }
}
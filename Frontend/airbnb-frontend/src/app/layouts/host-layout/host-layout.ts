import { Component, Signal, inject, signal, OnInit, ChangeDetectorRef } from '@angular/core'; // 1. Add ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { HostStatsService } from '../../features/host/services/host-stats';
import { MessageService } from '../../features/messages/Services/message';
import { AuthService } from '../../features/auth/services/auth.service';
import { AuthUser } from '../../features/auth/models/auth-user.model';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  badge?: number;
}

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
export class HostLayoutComponent implements OnInit {
  // Services
  private authService = inject(AuthService);
  public messageService = inject(MessageService);
  private router = inject(Router);
  private hostStatsService = inject(HostStatsService);
  private cdr = inject(ChangeDetectorRef); // 2. Inject ChangeDetectorRef

  // User Data (Reactive Signal from Auth Service)
  user: Signal<AuthUser | null> = this.authService.user;

  // State Signals
  sidebarOpen = signal<boolean>(true);
  mobileMenuOpen = signal<boolean>(false);
  unreadNotifications = signal<number>(0);

  // Navigation Items
  navItems: NavItem[] = [
    { label: 'Dashboard', route: '/host/dashboard', icon: '📊' },
    { label: 'Calendar', route: '/host/calendar', icon: '📅' },
    { label: 'My Listings', route: '/host/properties', icon: '🏠' },
    { label: 'Bookings', route: '/host/bookings', icon: '📝' },
    { label: 'Messages', route: '/host/messages', icon: '💬', badge: 2 },
    { label: 'Earnings', route: '/host/earnings', icon: '💰' },
    { label: 'Reviews', route: '/host/reviews', icon: '⭐' },
    { label: 'Performance', route: '/host/performance', icon: '📈' },
  ];

  constructor() {
    this.loadNotificationCount();
  }

  ngOnInit() {
    // تحديث العداد عند تحميل الصفحة لأول مرة
    this.messageService.refreshUnreadCount();
  }

  loadNotificationCount(): void {
    this.hostStatsService.getUnreadCount().subscribe(count => {
      this.unreadNotifications.set(count);
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
    
    // 3. Force change detection to ensure User info renders immediately
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
  }

  /**
   * DIRECT NAVIGATION TO PROFILE
   */
  viewProfileClick(event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    this.mobileMenuOpen.set(false);

    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.router.navigate(['/profile']); 
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
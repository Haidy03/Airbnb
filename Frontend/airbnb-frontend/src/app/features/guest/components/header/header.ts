import { Component, HostListener, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { SearchBarComponent } from '../search/components/search-bar/search-bar';
import { LoginComponent } from '../../../auth/components/login.component/login.component';
import { SearchFilters } from '../search/models/property.model';
import { AuthService } from '../../../auth/services/auth.service';
import { ModalService } from '../../../auth/services/modal.service';
import { SearchService } from '../search/services/search-service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SearchBarComponent],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent implements OnInit, OnDestroy {

  private authService = inject(AuthService);
  private modalService = inject(ModalService);
  private searchService = inject(SearchService);
  public router: Router = inject(Router);
  private modalSub?: Subscription;

  isUserMenuOpen = false;

  // UI State Variables
  isScrolled = false;
  showBigSearch = true;
  showFiltersButton = false;
  isSearchEnabled = true;

  constructor() {}//public router: Router

  ngOnInit() {
    this.checkCurrentRoute();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.checkCurrentRoute();
    });
  }

  ngOnDestroy(): void {
    this.modalSub?.unsubscribe();
    if (this.modalService.isOpen()) this.modalService.close();
  }

  private checkCurrentRoute() {
    const url = this.router.url;

    // 1. صفحة البحث (Search Page)
    if (url.includes('/search')) {
      // التعديل هنا: خلينا showBigSearch = true عشان يقبل التوسيع
      this.showBigSearch = true;
      this.showFiltersButton = true;
      this.isSearchEnabled = true;

      // بنبدأ بـ scrolled = true عشان يظهر الصغير افتراضياً
      this.isScrolled = true;
    }
    // 2. صفحة الهوم (Home)
    else if (url === '/' || url.startsWith('/?')) {
      this.showFiltersButton = false;
      this.showBigSearch = true;
      this.isSearchEnabled = true;
      // بيعتمد على السكرول
      this.isScrolled = window.scrollY > 20;
    }
    // 3. باقي الصفحات
    else {
      this.isScrolled = true;
      this.showBigSearch = false;
      this.showFiltersButton = false;
      this.isSearchEnabled = false;
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollY = window.scrollY || window.pageYOffset;

    // لو في الهوم أو السكرول زاد عن 20، صغر الهيدر
    // ده عشان لو فتحت الكبير في صفحة السيرش ونزلت، يرجع يلم نفسه تاني
    if (scrollY > 20) {
      this.isScrolled = true;
      this.isUserMenuOpen = false;
    } else {
      // لو في الهوم ورجعنا لأول الصفحة، نكبره
      if (this.router.url === '/' || this.router.url.startsWith('/?')) {
        this.isScrolled = false;
      }
    }
  }

  // التعديل هنا: شلنا الشرط، فبقى يوسع في أي صفحة فيها بحث (Home or Search)
  expandHeader() {
    if (this.isSearchEnabled) {
      this.isScrolled = false;
    }
  }

  // --- باقي الدوال (زي ما هي) ---

  openFiltersModal() {
    this.searchService.triggerOpenFilters();
  }

  navigateToHome() {
    this.router.navigate(['/']);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleUserMenu(event: Event) { event.stopPropagation(); this.isUserMenuOpen = !this.isUserMenuOpen; }
  @HostListener('document:click') closeUserMenu() { this.isUserMenuOpen = false; }
  onLogout() { this.isUserMenuOpen = false; this.authService.logout(); this.router.navigate(['/']); }
  isLoggedIn() { return this.authService.isAuthenticated; }

  handleSearch(filters: SearchFilters) {
    this.isScrolled = true; // نرجعه صغير بعد البحث
    this.router.navigate(['/search'], {
      queryParams: {
        location: filters.location,
        checkIn: filters.checkIn ? new Date(filters.checkIn).toISOString() : undefined,
        checkOut: filters.checkOut ? new Date(filters.checkOut).toISOString() : undefined,
        guests: filters.guests
      }
    });
  }

  onBecomeHostClick() {
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/host/properties/intro' } });
    } else if (this.authService.isHost()) {
      this.router.navigate(['/host/dashboard']);
    } else {
      this.upgradeToHost();
    }
  }

  upgradeToHost() {
    this.authService.becomeHost().subscribe({
      next: () => this.router.navigate(['/host/properties/intro']),
      error: () => alert('Error upgrading host.')
    });
  }

  openLoginModal(): void {
    if (this.modalService.isOpen()) return;
    const compRef = this.modalService.open(LoginComponent);
    const instanceAny = compRef.instance as any;
    if (instanceAny?.closed) {
      this.modalSub = instanceAny.closed.subscribe((success: boolean) => {
        this.modalSub?.unsubscribe();
        this.modalService.close();
        if (success) window.location.reload();
      });
    }
  }
}

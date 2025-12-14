import { Component, HostListener, OnInit, inject, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthUser } from '../../../auth/models/auth-user.model';
import { SearchBarComponent } from '../search/components/search-bar/search-bar';
import { SearchFilters } from '../search/models/property.model';
import { AuthService } from '../../../auth/services/auth.service';
import { ModalService } from '../../../auth/services/modal.service';
import { LoginComponent } from '../../../auth/components/login.component/login.component';
import { SearchService } from '../search/services/search-service';
import { ListingTypeModalComponent } from '../../../host/components/listing-type-modal/listing-type-modal'; 
import { PropertyService } from '../../../host/services/property';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SearchBarComponent,ListingTypeModalComponent],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  
  public authService = inject(AuthService);
  private modalService = inject(ModalService);
  private searchService = inject(SearchService);
  private propertyService = inject(PropertyService);
  public router = inject(Router);
  user = this.authService.user; 
  
  private modalSub?: Subscription;
  
  // UI State Variables
  isUserMenuOpen = false;
  isScrolled = false;
  showExpandedSearch = false;
  isSearchEnabled = true;
  showFiltersButton = false; // ✅ Added missing property
  isCreationModalOpen = signal(false);

  
  ngOnInit() {
    this.checkCurrentRoute();
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkCurrentRoute();
    });
  }

  ngOnDestroy(): void {
    this.modalSub?.unsubscribe();
    if (this.modalService.isOpen()) {
      this.modalService.close();
    }
  }

  private checkCurrentRoute() {
    const url = this.router.url;
    
    // Enable search on Home, Experiences, Services, and Search pages
    const searchEnabledRoutes = ['/', '/experiences', '/services', '/search'];
    this.isSearchEnabled = searchEnabledRoutes.some(route => 
      url === route || url.startsWith(route + '?')
    );
    
    // Show filters button only on search results page
    this.showFiltersButton = url.startsWith('/search');
    
    // Start with small search bar on search results page
    if (url.startsWith('/search')) {
      this.isScrolled = true;
      this.showExpandedSearch = false;
    } else if (this.isSearchEnabled) {
      // Reset scroll state when navigating to enabled pages
      if (window.scrollY < 50) {
        this.isScrolled = false;
      }
    } else {
      // Hide search bar on other pages
      this.isScrolled = true;
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (this.isSearchEnabled) {
      const scrollY = window.scrollY || window.pageYOffset;
      this.isScrolled = scrollY > 20;
      
      if (this.isScrolled) {
        this.showExpandedSearch = false;
        this.isUserMenuOpen = false;
      }
    }
  }

  @HostListener('document:click')
  closeUserMenu() {
    this.isUserMenuOpen = false;
  }

  navigateToHome() {
    this.showExpandedSearch = false;
    this.isScrolled = false;
    this.router.navigate(['/']);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  expandHeader() {
    if (this.isSearchEnabled) {
      this.isScrolled = false;
      this.showExpandedSearch = true;
    }
  }
  handleImageError(event: any) {
    event.target.style.display = 'none';
  }

  toggleUserMenu(event: Event) {
    event.stopPropagation();
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  handleSearch(filters: SearchFilters) {
    this.showExpandedSearch = false;
    this.isScrolled = true;
    this.router.navigate(['/search'], {
      queryParams: {
        location: filters.location,
        checkIn: filters.checkIn ? new Date(filters.checkIn).toISOString() : undefined,
        checkOut: filters.checkOut ? new Date(filters.checkOut).toISOString() : undefined,
        guests: filters.guests
      }
    });
  }

  // ✅ Added missing method
  openFiltersModal() {
    // ✅ Correct method name matching your SearchService
    this.searchService.triggerOpenFilters();
  }

  onBecomeHostClick() {
    if (!this.authService.isAuthenticated) {
      this.openLoginModal();
      return;
    }

    if (this.authService.isHost()) {
      this.router.navigate(['/host/dashboard']);
    } else {
      this.upgradeToHost();
    }
  }

  upgradeToHost() {
    this.authService.becomeHost().subscribe({
      next: () => {
        this.isCreationModalOpen.set(true);
      },
      error: () => {
        alert('Something went wrong while setting up your host account.');
      }
    });
  }

  isLoggedIn(): boolean {
    return this.authService.isAuthenticated;
  }

  onLogout() {
    this.isUserMenuOpen = false;
    this.authService.logout();
    this.router.navigate(['/']);
  }

  openLoginModal(): void {
    if (this.modalService.isOpen()) {
      return;
    }

    const compRef = this.modalService.open(LoginComponent);
    const instanceAny = compRef.instance as any;

    if (instanceAny?.closed && typeof instanceAny.closed.subscribe === 'function') {
      this.modalSub = instanceAny.closed.subscribe((success: boolean) => {
        this.modalSub?.unsubscribe();
        this.modalSub = undefined;
        this.modalService.close();

        if (success) {
          window.location.reload();
        }
      });
    } else {
      console.warn('LoginComponent does not expose a closed EventEmitter.');
    }
  }

  closeCreationModal(): void {
    this.isCreationModalOpen.set(false);
  }

  handleCreationType(type: 'home' | 'experience' | 'service'): void {
    this.closeCreationModal(); 

    if (type === 'home') {
      this.createNewHomeListing();
    } else if (type === 'experience') {
      this.router.navigate(['/host/experiences/create']);
    } else if (type === 'service') {
      this.router.navigate(['/host/services/create']); 
    }
  }

  private createNewHomeListing(): void {
    // ✅ نستخدم PropertyService لإنشاء المسودة والتوجيه
    this.propertyService.createPropertyDraft().subscribe({
      next: (draft) => {
        if (draft.id) {
          localStorage.setItem('currentDraftId', draft.id);
          this.router.navigate(['/host/properties/intro']);
        }
      }
    });
  }
}
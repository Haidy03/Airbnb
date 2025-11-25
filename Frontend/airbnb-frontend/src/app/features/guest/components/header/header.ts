import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { SearchBarComponent } from '../search/components/search-bar/search-bar';
import { SearchFilters } from '../search/models/property.model';

export interface SearchData {
  where: string;
  checkIn: string;
  checkOut: string;
  who: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SearchBarComponent],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent implements OnInit {

  isUserMenuOpen = false;
  isScrolled = false;
  showExpandedSearch = false;
  isSearchEnabled = true;

  constructor(private router: Router) {}

  ngOnInit() {
    this.checkCurrentRoute();
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      this.checkCurrentRoute();
    });
  }

  private checkCurrentRoute() {
    const url = this.router.url;
    if (url === '/' || url.startsWith('/search') || url.startsWith('/?')) {
      this.isSearchEnabled = true;
      if (url.startsWith('/search')) {
        this.isScrolled = true; // صفحة السيرش تبدأ بالبار الصغير
        this.showExpandedSearch = false;
      } else {
        if (window.scrollY < 50) this.isScrolled = false;
      }
    } else {
      this.isSearchEnabled = false;
      this.isScrolled = true;
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollY = window.scrollY || window.pageYOffset;
    this.isScrolled = scrollY > 20;
    if (this.isScrolled) {
      this.showExpandedSearch = false;
      this.isUserMenuOpen = false;
    }
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

  toggleUserMenu(event: Event) {
    event.stopPropagation();
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  @HostListener('document:click')
  closeUserMenu() {
    this.isUserMenuOpen = false;
  }

  logout() {
    this.isUserMenuOpen = false;
    this.router.navigate(['/']);
  }

  handleSearch(filters: SearchFilters) {
    this.showExpandedSearch = false;
    this.router.navigate(['/search'], {
      queryParams: {
        location: filters.location,
        checkIn: filters.checkIn ? new Date(filters.checkIn).toISOString() : undefined,
        checkOut: filters.checkOut ? new Date(filters.checkOut).toISOString() : undefined,
        guests: filters.guests
      }
    });
  }
}

import { Component, HostListener, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';

export interface SearchData {
  where: string;
  checkIn: string;
  checkOut: string;
  who: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent {
  @Input() currentPage: 'home' | 'search' = 'home';
  @Output() searchEvent = new EventEmitter<SearchData>();

  isUserMenuOpen = false;
  isSearchModalOpen = false;
  isScrolled = false;

  showExpandedSearch = false;

  searchData: SearchData = {
    where: '',
    checkIn: '',
    checkOut: '',
    who: ''
  };

  constructor(
    private router: Router,
   private authService: AuthService
  ) {}

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollY = window.scrollY || window.pageYOffset;

    this.isScrolled = scrollY > 50;

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
    this.isScrolled = false;
    this.showExpandedSearch = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  openSearchModal(type: string) {
    this.isSearchModalOpen = true;
    this.isUserMenuOpen = false;
    this.expandHeader();
  }

  closeSearchModal() {
    this.isSearchModalOpen = false;
    this.showExpandedSearch = false;
  }

  handleSearch() {
    this.closeSearchModal();

    this.searchEvent.emit(this.searchData);

    this.router.navigate(['/search'], {
      queryParams: this.searchData
    });
  }
}

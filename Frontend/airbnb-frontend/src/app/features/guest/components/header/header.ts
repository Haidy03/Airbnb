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
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SearchBarComponent
  ],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent implements OnInit {

  isUserMenuOpen = false;
  isScrolled = false;
  showExpandedSearch = false;

  // متغير جديد للتحكم في ظهور البحث بالكامل
  isSearchEnabled = true;

  constructor(private router: Router) {}

  ngOnInit() {
    this.checkCurrentRoute();

    // مراقبة تغيير الصفحات لتحديث حالة البحث
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkCurrentRoute();
    });
  }

  // دالة لتحديد هل نظهر البحث أم لا بناءً على الصفحة الحالية
  private checkCurrentRoute() {
    const url = this.router.url;

    // يظهر فقط في الصفحة الرئيسية وصفحة البحث
    if (url === '/' || url.startsWith('/search') || url.startsWith('/?')) {
      this.isSearchEnabled = true;

      // لو إحنا في صفحة السيرش، نصغر الهيدر تلقائياً
      if (url.startsWith('/search')) {
        this.isScrolled = true;
        this.showExpandedSearch = false;
      } else {
        // لو في الهوم، نرجعه لحالته الطبيعية (كبير في الأول)
        // إلا لو المستخدم كان عامل سكرول، دي ههتظبط من الـ HostListener
        if (window.scrollY < 50) {
          this.isScrolled = false;
        }
      }
    } else {
      // أي صفحة تانية (Wishlist, Trips, etc) نخفي السيرش الكبير
      this.isSearchEnabled = false;
      this.isScrolled = true; // نخليه في وضع "صغير" عشان ياخد مساحة أقل
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollY = window.scrollY || window.pageYOffset;
    this.isScrolled = scrollY > 20; // قللت الرقم شوية عشان الاستجابة تكون أسرع

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
    // التوسيع مسموح فقط لو إحنا في صفحة تدعم البحث
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

  openSearchModal(type: string) {
    // التأكد إننا بنفتح المودال فقط لو البحث مسموح
    if (this.isSearchEnabled) {
      this.isUserMenuOpen = false;
      this.expandHeader();
    }
  }

  handleSearch(filters: SearchFilters) {
    this.showExpandedSearch = false; // لم الكومبوننت بعد البحث

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

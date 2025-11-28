import { Component, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { Property, SearchQuery, SearchFilters, SortOption, PropertyType } from '../../models/property.model';
import { SearchMapComponent } from '../search-map/search-map';
import { FiltersComponent } from '../filters/filters';
import { SearchBarComponent } from '../search-bar/search-bar';
import { PropertyCardComponent } from '../property-card/property-card';
import { SearchService } from '../../services/search-service';
import { WishlistService } from '../../../../services/wishlist.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { AuthService } from '../../../../../auth/services/auth.service';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [
    CommonModule,
    PropertyCardComponent,
    SearchMapComponent,
    FiltersComponent,
    SearchBarComponent
  ],
  templateUrl: './search-results.html',
  styleUrls: ['./search-results.css']
})
export class SearchResultsComponent implements OnInit, OnDestroy {

  @ViewChild(SearchMapComponent) searchMap!: SearchMapComponent;

  showFilters = false;
  showMap = false;
  isDesktop = true;
  isLoading = false;

  properties: Property[] = [];
  totalResults = 0;
  selectedProperty: Property | null = null;
  hoveredPropertyId: string | null = null;

  currentQuery: SearchQuery = {
    filters: {},
    page: 1,
    pageSize: 12,
    sortBy: SortOption.POPULAR
  };

  private filtersSub: Subscription | null = null;

  constructor(
    private searchService: SearchService,
    private route: ActivatedRoute,
    private router: Router,
    private wishlistService: WishlistService,
    private toastService: ToastService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkScreenSize();

    this.filtersSub = this.searchService.openFilters$.subscribe(() => {
      this.showFilters = true;
    });

    // === قراءة الفلاتر من الرابط (عشان الريفريش) ===
    this.route.queryParams.subscribe(params => {

      // 1. الأساسيات
      this.currentQuery.filters.location = params['location'];
      this.currentQuery.filters.guests = params['guests'] ? +params['guests'] : undefined;
      if (params['checkIn']) this.currentQuery.filters.checkIn = new Date(params['checkIn']);
      if (params['checkOut']) this.currentQuery.filters.checkOut = new Date(params['checkOut']);

      // 2. السعر
      if (params['minPrice']) this.currentQuery.filters.priceMin = +params['minPrice'];
      if (params['maxPrice']) this.currentQuery.filters.priceMax = +params['maxPrice'];

      // 3. نوع العقار (مهم جداً)
      if (params['propertyType']) {
        this.currentQuery.filters.propertyTypes = [params['propertyType'] as PropertyType];
      }

      // 4. المرافق (Amenities)
      if (params['amenities']) {
        const amParams = params['amenities'];
        this.currentQuery.filters.amenities = Array.isArray(amParams) ? amParams : (amParams as string).split(',');
      }

      // 5. الغرف والأسرّة
      if (params['bedrooms']) this.currentQuery.filters.bedrooms = +params['bedrooms'];
      if (params['beds']) this.currentQuery.filters.beds = +params['beds'];
      if (params['bathrooms']) this.currentQuery.filters.bathrooms = +params['bathrooms'];

      // 6. خيارات الحجز
      if (params['instantBook']) this.currentQuery.filters.instantBook = params['instantBook'] === 'true';

      // 7. التقييم
      if (params['rating']) this.currentQuery.filters.rating = +params['rating'];

      // تنفيذ البحث
      this.executeSearch();
    });

    if (this.authService.isAuthenticated) {
      this.wishlistService.loadWishlist();
    }
  }

  ngOnDestroy(): void {
    if (this.filtersSub) this.filtersSub.unsubscribe();
  }

  private executeSearch() {
    this.isLoading = true;
    this.searchService.searchProperties(this.currentQuery).subscribe({
      next: (response) => {
        this.properties = response.properties;
        this.totalResults = response.total;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Search Error:', err);
        this.isLoading = false;
      }
    });
  }

  // === تحديث الرابط عند تطبيق الفلاتر ===
  onFiltersApply(newFilters: SearchFilters) {
    const queryParams: any = {
      minPrice: newFilters.priceMin,
      maxPrice: newFilters.priceMax,
      propertyType: newFilters.propertyTypes && newFilters.propertyTypes.length > 0 ? newFilters.propertyTypes[0] : null,
      amenities: newFilters.amenities && newFilters.amenities.length > 0 ? newFilters.amenities.join(',') : null,
      bedrooms: newFilters.bedrooms,
      beds: newFilters.beds,
      bathrooms: newFilters.bathrooms,
      instantBook: newFilters.instantBook ? 'true' : null,
      rating: newFilters.rating
    };

    // إزالة القيم الـ null/undefined من الرابط لتنظيفه
    Object.keys(queryParams).forEach(key => queryParams[key] == null && delete queryParams[key]);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge' // دمج مع الموقع والتاريخ
    });

    this.showFilters = false;
  }

  // ... (باقي الكود: Wishlist, Map, UI كما هو) ...
  // --- Wishlist Logic ---
  isPropertyInWishlist(propertyId: string): boolean {
    return this.wishlistService.isInWishlist(Number(propertyId));
  }

  onToggleWishlist(property: Property): void {
    if (!this.authService.isAuthenticated) {
      this.toastService.show('Please login to save properties', 'info');
      this.router.navigate(['/login']);
      return;
    }

    const imageUrl = (property.images && property.images.length > 0)
                     ? property.images[0].url
                     : 'assets/images/placeholder-property.jpg';

    const wasFavorite = this.isPropertyInWishlist(property.id);

    this.wishlistService.toggleWishlist(Number(property.id)).subscribe({
      next: () => {
        if (wasFavorite) {
            this.toastService.show('Removed from wishlist', 'success', imageUrl);
        } else {
            this.toastService.show('Saved to wishlist', 'success', imageUrl);
        }
      },
      error: () => {
        this.toastService.show('Failed to update wishlist', 'error');
      }
    });
  }

  onPropertySelect(id: string) { this.router.navigate(['/listing', id]); }
  onFiltersOpen() { this.showFilters = true; }
  onFiltersClose() { this.showFilters = false; }
  @HostListener('window:resize', ['$event'])  onResize(event: Event) {
    this.checkScreenSize();
  }
  checkScreenSize() { this.isDesktop = window.innerWidth >= 1024; if (this.isDesktop) this.showMap = true; }
  toggleMap() { this.showMap = !this.showMap; }
  onPropertyHover(id: string | null) {
    this.hoveredPropertyId = id;
    if (this.searchMap && id) this.searchMap.highlightMarker(id);
  }
  onMapPropertySelect(p: Property) { this.selectedProperty = p; }
  onMapBoundsChange(b: any) {}
}









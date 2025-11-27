import { Component, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

// Models
import { Property, SearchQuery, SearchFilters, SortOption } from '../../models/property.model';

// Components
import { SearchMapComponent } from '../search-map/search-map';
import { PropertyListComponent } from '../property-list/property-list';
import { FiltersComponent } from '../filters/filters';
import { SearchBarComponent } from '../search-bar/search-bar';
import { PropertyCardComponent } from '../property-card/property-card';

// Services
import { SearchService } from '../../services/search-service';
// إضافة خدمات الـ Wishlist والـ Toast
import { WishlistService } from '../../../../services/wishlist.service';
import { ToastService } from '../../../../../../core/services/toast.service';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [
    CommonModule,
    PropertyListComponent, // لو مستخدم
    PropertyCardComponent, // عشان بنعرض الكروت مباشرة
    SearchMapComponent,
    FiltersComponent,
    SearchBarComponent
  ],
  templateUrl: './search-results.html',
  styleUrls: ['./search-results.css']
})
export class SearchResultsComponent implements OnInit, OnDestroy {

  @ViewChild(SearchMapComponent) searchMap!: SearchMapComponent;

  // UI Flags
  showFilters = false;
  showMap = false;
  isDesktop = true;
  isLoading = false;

  // Data
  properties: Property[] = [];
  totalResults = 0;
  selectedProperty: Property | null = null;
  hoveredPropertyId: string | null = null;

  // Search State
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
    // حقن الخدمات الجديدة
    private wishlistService: WishlistService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.checkScreenSize();

    this.filtersSub = this.searchService.openFilters$.subscribe(() => {
      this.showFilters = true;
    });

    this.route.queryParams.subscribe(params => {
      this.currentQuery.filters.location = params['location'];
      this.currentQuery.filters.guests = params['guests'] ? +params['guests'] : undefined;

      if (params['checkIn']) this.currentQuery.filters.checkIn = new Date(params['checkIn']);
      if (params['checkOut']) this.currentQuery.filters.checkOut = new Date(params['checkOut']);

      this.executeSearch();
    });
  }

  ngOnDestroy(): void {
    if (this.filtersSub) this.filtersSub.unsubscribe();
  }

  // --- Core Search Logic ---
  private executeSearch() {
    this.isLoading = true;
    this.searchService.searchProperties(this.currentQuery).subscribe({
      next: (response) => {
        this.properties = response.properties;
        this.totalResults = response.total;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Search API Error:', err);
        this.isLoading = false;
      }
    });
  }

  // --- Wishlist Logic (المزامنة) ---

  // 1. التأكد هل العنصر موجود في المفضلة (عشان القلب يظهر أحمر لو كان مضاف من الهوم)
  isPropertyInWishlist(propertyId: string): boolean {
    // تحويل الـ id لرقم لأن السيرفس بتخزنه كرقم (حسب الموديل بتاعك)
    return this.wishlistService.isInWishlist(Number(propertyId));
  }

  // 2. إضافة/حذف مع الإشعار
  onToggleWishlist(property: Property): void {
    const imageUrl = (property.images && property.images.length > 0)
                     ? property.images[0].url
                     : 'assets/placeholder.jpg';

    if (this.isPropertyInWishlist(property.id)) {
      this.wishlistService.removeFromWishlist(Number(property.id));
      this.toastService.show('Removed from wishlist', 'success', imageUrl);
    } else {
      this.wishlistService.addToWishlist(property as any);
      this.toastService.show('Saved to wishlist', 'success', imageUrl);
    }
  }

  // --- Navigation Logic ---
  onPropertySelect(propertyId: string): void {
    this.router.navigate(['/listing', propertyId]);
  }

  // --- Filters & Map Logic (كما هي) ---
  onFiltersOpen() { this.showFilters = true; }
  onFiltersClose() { this.showFilters = false; }
  onFiltersApply(newFilters: SearchFilters) {
    this.currentQuery.filters = { ...this.currentQuery.filters, ...newFilters };
    this.currentQuery.page = 1;
    this.executeSearch();
    this.showFilters = false;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) { this.checkScreenSize(); }

  checkScreenSize() {
    this.isDesktop = window.innerWidth >= 1024;
    if (this.isDesktop) this.showMap = true;
  }

  toggleMap() { this.showMap = !this.showMap; }
  onPropertyHover(propertyId: string | null) {
    this.hoveredPropertyId = propertyId;
    if (this.searchMap && propertyId) this.searchMap.highlightMarker(propertyId);
  }
  onMapPropertySelect(property: Property) {
    // ممكن نعمل سكرول للكارت
    this.selectedProperty = property;
  }
  onMapBoundsChange(bounds: any) {}
}

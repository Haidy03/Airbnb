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
import { PaginationComponent } from '../pagination/pagination';
@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [
    CommonModule,
    PropertyCardComponent,
    SearchMapComponent,
    FiltersComponent,
    SearchBarComponent,
    PaginationComponent 
  ],
  templateUrl: './search-results.html',
  styleUrls: ['./search-results.css']
})
export class SearchResultsComponent implements OnInit, OnDestroy {

  @ViewChild(SearchMapComponent) searchMap!: SearchMapComponent;

  currentPage = 1;
  pageSize = 6; 
  totalItems = 0;


  showFilters = false;
  showMap = false;
  isDesktop = true;
  isLoading = false;
  allProperties: Property[] = []; 

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

   
    this.route.queryParams.subscribe(params => {

      this.currentQuery.filters = {}; 
       if (params['location']) this.currentQuery.filters.location = params['location'];
      if (params['guests']) this.currentQuery.filters.guests = +params['guests'];
      if (params['checkIn']) this.currentQuery.filters.checkIn = new Date(params['checkIn']);
      if (params['checkOut']) this.currentQuery.filters.checkOut = new Date(params['checkOut']);

      if (params['minPrice']) this.currentQuery.filters.priceMin = +params['minPrice'];
      if (params['maxPrice']) this.currentQuery.filters.priceMax = +params['maxPrice'];

      if (params['propertyType']) {
        this.currentQuery.filters.propertyTypes = [params['propertyType'] as PropertyType];
      }

      if (params['amenities']) {
        const amParams = params['amenities'];
        this.currentQuery.filters.amenities = Array.isArray(amParams) ? amParams : (amParams as string).split(',');
      }

      if (params['bedrooms']) this.currentQuery.filters.bedrooms = +params['bedrooms'];
      if (params['beds']) this.currentQuery.filters.beds = +params['beds'];
      if (params['bathrooms']) this.currentQuery.filters.bathrooms = +params['bathrooms'];

       if (params['instantBook'] !== undefined) {
        const val = params['instantBook'];
        if (val === 'true') {
            this.currentQuery.filters.instantBook = true;
        } else if (val === 'false') {
            this.currentQuery.filters.instantBook = false;
        }
      }

      if (params['rating']) this.currentQuery.filters.rating = +params['rating'];

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
    this.currentQuery.page = this.currentPage;
    this.currentQuery.pageSize = this.pageSize;

    this.searchService.searchProperties(this.currentQuery).subscribe({
      next: (response) => {
        this.allProperties = response.properties;
        this.totalItems = response.total;
        this.currentPage = response.page; 
        this.properties = response.properties;
        this.totalResults = response.total;
        this.isLoading = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => {
        console.error('Search Error:', err);
        this.isLoading = false;
      }
    });
  }

  get hasActiveFilters(): boolean {
    const f = this.currentQuery.filters;
    return !!(
      f.priceMin || 
      f.priceMax || 
      (f.propertyTypes && f.propertyTypes.length > 0) || 
      (f.amenities && f.amenities.length > 0) || 
      f.bedrooms || 
      f.beds || 
      f.bathrooms || 
      f.instantBook || 
      f.rating
    );
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.executeSearch();
  }

  onFiltersApply(newFilters: SearchFilters) {
   
    const queryParams: any = {
      location: this.route.snapshot.queryParams['location'],
      checkIn: this.route.snapshot.queryParams['checkIn'],
      checkOut: this.route.snapshot.queryParams['checkOut'],
      guests: this.route.snapshot.queryParams['guests'],

      minPrice: newFilters.priceMin,
      maxPrice: newFilters.priceMax,
      propertyType: newFilters.propertyTypes && newFilters.propertyTypes.length > 0 ? newFilters.propertyTypes[0] : null,
      amenities: newFilters.amenities && newFilters.amenities.length > 0 ? newFilters.amenities.join(',') : null,
      bedrooms: newFilters.bedrooms,
      beds: newFilters.beds,
      bathrooms: newFilters.bathrooms,
      instantBook: newFilters.instantBook,
      rating: newFilters.rating
    };

   
     Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === null || queryParams[key] === undefined) {
            delete queryParams[key];
        }
    });

    this.router.navigate(['/search'], {
      queryParams: queryParams
    });

    this.showFilters = false;
  }

  isPropertyInWishlist(propertyId: string): boolean {
    return this.wishlistService.isInWishlist(Number(propertyId));
  }

  clearFilters() {
    const baseParams: any = {
      location: this.route.snapshot.queryParams['location'],
      checkIn: this.route.snapshot.queryParams['checkIn'],
      checkOut: this.route.snapshot.queryParams['checkOut'],
      guests: this.route.snapshot.queryParams['guests']
    };

    this.router.navigate(['/search'], {
      queryParams: baseParams
    });
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
  onMapPropertySelect(p: Property) { 
    this.selectedProperty = p; 
    this.properties = [p];
  }
    onMapBackgroundClick() {
    this.selectedProperty = null;
    this.properties = [...this.allProperties];
  }
  onMapBoundsChange(b: any) {}
  onSearchBarSearch(filters: SearchFilters) {
    console.log('Search from bar:', filters);
    
    // Update current query filters
    this.currentQuery.filters = { ...this.currentQuery.filters, ...filters };
    
    // Update URL (This will trigger route subscription and execute search)
    this.onFiltersApply(this.currentQuery.filters);
  }
}









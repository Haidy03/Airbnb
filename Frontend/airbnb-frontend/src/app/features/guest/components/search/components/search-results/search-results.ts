import { Component, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
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

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [
    CommonModule,
    PropertyListComponent,
    SearchMapComponent,
    FiltersComponent,
    SearchBarComponent,
   PropertyCardComponent,
  ],
  templateUrl: './search-results.html',
  styleUrls: ['./search-results.css']
})
export class SearchResultsComponent implements OnInit, OnDestroy {

  @ViewChild(PropertyListComponent) propertyListComp!: PropertyListComponent;
  @ViewChild(SearchMapComponent) searchMap!: SearchMapComponent;

  // UI Flags
  showFilters = false;
  showMap = false;
  isDesktop = true;
  isLoading = false;

  // Data from Backend
  properties: Property[] = [];
  totalResults = 0;

  // Selection State
  selectedProperty: Property | null = null;
  hoveredPropertyId: string | null = null;

  // Search State (Maintains current filters, page, and sort)
  currentQuery: SearchQuery = {
    filters: {},
    page: 1,
    pageSize: 12, // نفس الرقم اللي في PropertyListComponent
    sortBy: SortOption.POPULAR
  };

  private filtersSub: Subscription | null = null;

  constructor(
    private searchService: SearchService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.checkScreenSize();

    // 1. Listen to "Filters" button in Header
    this.filtersSub = this.searchService.openFilters$.subscribe(() => {
      this.showFilters = true;
    });

    // 2. Listen to URL changes (Initial load & subsequent searches)
    this.route.queryParams.subscribe(params => {
      // Update filters from URL parameters
      this.currentQuery.filters.location = params['location'];
      this.currentQuery.filters.guests = params['guests'] ? +params['guests'] : undefined;

      // Parse Dates properly
      if (params['checkIn']) {
        this.currentQuery.filters.checkIn = new Date(params['checkIn']);
      }
      if (params['checkOut']) {
        this.currentQuery.filters.checkOut = new Date(params['checkOut']);
      }

      // Execute search whenever URL changes
      this.executeSearch();
    });
  }

  ngOnDestroy(): void {
    if (this.filtersSub) {
      this.filtersSub.unsubscribe();
    }
  }

  // --- Core Search Logic ---

  private executeSearch() {
    this.isLoading = true;
    // console.log('Executing Search API with:', this.currentQuery);

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

  // --- Pagination & Sorting (Called by PropertyListComponent) ---

  onPageChange(page: number) {
    this.currentQuery.page = page;
    this.executeSearch();
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onSortChange(sort: SortOption) {
    this.currentQuery.sortBy = sort;
    this.currentQuery.page = 1; // Reset to first page on sort change
    this.executeSearch();
  }

  // --- Filters Modal Handling ---

  onFiltersOpen(): void {
    this.showFilters = true;
  }

  onFiltersClose(): void {
    this.showFilters = false;
  }

  onFiltersApply(newFilters: SearchFilters): void {
    // Merge new filters (price, amenities) with existing ones (location, dates)
    this.currentQuery.filters = {
      ...this.currentQuery.filters,
      ...newFilters
    };

    // Reset to page 1 when filters change
    this.currentQuery.page = 1;

    this.executeSearch();
    this.showFilters = false;
  }

  // --- Map & Layout Logic ---

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.checkScreenSize();
  }

  checkScreenSize(): void {
    this.isDesktop = window.innerWidth >= 1024;
    if (this.isDesktop) {
      this.showMap = true;
    }
  }

  toggleMap(): void {
    this.showMap = !this.showMap;
  }

  onPropertyHover(propertyId: string | null): void {
    this.hoveredPropertyId = propertyId;
    if (this.searchMap && propertyId) {
      this.searchMap.highlightMarker(propertyId);
    }
  }

  onPropertySelect(id: string): void {
    // البحث عن العقار باستخدام الـ id
    this.selectedProperty = this.properties.find(p => p.id === id) || null;

    if (this.searchMap && this.selectedProperty) {
      this.searchMap.centerOnProperty(this.selectedProperty);
    }
  }

  onMapPropertySelect(property: Property): void {
    this.selectedProperty = property;
    // Optional: Scroll list to selected property
  }

  onMapBoundsChange(bounds: any): void {
    // Future feature: "Search as I move the map"
    console.log('Map bounds changed:', bounds);
  }

  // Legacy method just in case
  onSearchSubmit(filters: SearchFilters): void {
    this.onFiltersApply(filters);
  }
}

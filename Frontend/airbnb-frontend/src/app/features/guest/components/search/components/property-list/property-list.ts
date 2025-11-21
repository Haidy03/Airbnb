import { Component, OnInit, OnDestroy, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { Property, SearchQuery, SearchFilters, SortOption } from '../../models/property.model';
import { SearchService } from '../../services/search-service';
import { FormsModule } from '@angular/forms';
import { PropertyCardComponent } from '../property-card/property-card';

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PropertyCardComponent
  ],
  templateUrl: './property-list.html',
  styleUrls: ['./property-list.css'],
  providers: [SearchService]
})
export class PropertyListComponent implements OnInit, OnDestroy {
  @Output() propertyHover = new EventEmitter<string | null>();
  @Output() propertySelect = new EventEmitter<Property>();

  public Math = Math;
  properties: Property[] = [];
  isLoading = false;
  currentPage = 1;
  pageSize = 12;
  totalProperties = 0;
  totalPages = 0;
  sortOption: SortOption = SortOption.POPULAR;
  favorites = new Set<string>();

  private destroy$ = new Subject<void>();
  private currentFilters: SearchFilters = {};

  constructor(private searchService: SearchService) {}

  ngOnInit(): void {
    this.loadProperties();

    this.searchService.favorites$
      .pipe(takeUntil(this.destroy$))
      .subscribe(favorites => {
        this.favorites = favorites;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProperties(): void {
    this.isLoading = true;

    const query: SearchQuery = {
      filters: this.currentFilters,
      page: this.currentPage,
      pageSize: this.pageSize,
      sortBy: this.sortOption
    };

    this.searchService.searchProperties(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.properties = response.properties;
          this.totalProperties = response.total;
          this.totalPages = response.totalPages;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading properties:', error);
          this.isLoading = false;
        }
      });
  }

  applyFilters(filters: SearchFilters): void {
    this.currentFilters = filters;
    this.currentPage = 1;
    this.loadProperties();
  }

  onSortChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.sortOption = target.value as SortOption;
    this.loadProperties();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadProperties();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onFavoriteToggle(propertyId: string): void {
    this.searchService.toggleFavorite(propertyId);
  }

  onPropertyClick(property: Property): void {
    console.log('Property clicked:', property);
  }

  isFavorite(propertyId: string): boolean {
    return this.favorites.has(propertyId);
  }

  get paginationRange(): number[] {
    const range: number[] = [];
    const maxPages = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let end = Math.min(this.totalPages, start + maxPages - 1);

    if (end - start < maxPages - 1) {
      start = Math.max(1, end - maxPages + 1);
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    return range;
  }
}

import { Component, Output, EventEmitter, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SearchFilters } from '../../models/property.model';
import { SearchService } from '../../services/search-service';
import { ServicesService } from '../../../../../services/services/service'; 
import { ServiceCategory } from '../../../../../services/models/service.model'; 

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar.html',
  styleUrls: ['./search-bar.css']
})
export class SearchBarComponent implements OnInit {
  @Input() withFilterButton: boolean = false;

  @Output() search = new EventEmitter<SearchFilters>();
  @Output() filtersOpen = new EventEmitter<void>();

  private router = inject(Router);
  private servicesService = inject(ServicesService);

  // ✅ Search Mode State
  searchType: 'stays' | 'services' = 'stays';

  // === Stays Data ===
  location: string = '';
  checkIn: string = '';
  checkOut: string = '';
  guests: number = 0;
  minDate: string = '';
  
  // === Services Data ===
  serviceQuery: string = '';
  selectedCategory: string = '';
  serviceCategories: ServiceCategory[] = [];

  // === UI State ===
  activeInput: 'location' | 'checkIn' | 'checkOut' | 'guests' | 'serviceQuery' | 'serviceCategory' | null = null;
  
  // Dropdowns
  showGuestsDropdown = false;
  showLocationsDropdown = false;
  showCategoriesDropdown = false; // New for services

  // Data
  availableLocations: string[] = [];

  // Guest Counts
  adultsCount = 0;
  childrenCount = 0;
  infantsCount = 0;
  petsCount = 0;

  constructor(private searchService: SearchService) {}

  ngOnInit() {
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];

    // Load Locations
    this.searchService.locations$.subscribe(locations => {
      this.availableLocations = locations;
    });

    // Load Service Categories
    this.servicesService.getAllCategories().subscribe(res => {
      if (res.success) {
        this.serviceCategories = res.data;
      }
    });
  }

  // ✅ Switch Search Type
  setSearchType(type: 'stays' | 'services') {
    this.searchType = type;
    this.activeInput = null; // Close any open dropdowns
  }

  // ✅ Modified Focus Handler
  onInputFocus(input: any): void {
    this.activeInput = input;
    
    this.showGuestsDropdown = input === 'guests';
    this.showLocationsDropdown = input === 'location';
    this.showCategoriesDropdown = input === 'serviceCategory';
  }

  onInputBlur(): void {
    setTimeout(() => {
      this.activeInput = null;
      this.showGuestsDropdown = false;
      this.showLocationsDropdown = false;
      this.showCategoriesDropdown = false;
    }, 200);
  }

  // === Stays Logic ===
  selectLocation(city: string) {
    this.location = city;
    this.showLocationsDropdown = false;
  }

  clearLocation(): void { this.location = ''; }
  
  clearDate(type: 'checkIn' | 'checkOut', event: Event): void {
    event.stopPropagation();
    if (type === 'checkIn') this.checkIn = '';
    if (type === 'checkOut') this.checkOut = '';
  }

  incrementGuests(type: 'adults' | 'children' | 'infants' | 'pets'): void {
    if (this.adultsCount === 0 && type === 'adults') { this.adultsCount = 1; this.updateGuestsCount(); return; }
    switch (type) {
      case 'adults': if (this.adultsCount < 16) this.adultsCount++; break;
      case 'children': if (this.childrenCount < 15) this.childrenCount++; break;
      case 'infants': if (this.infantsCount < 5) this.infantsCount++; break;
      case 'pets': if (this.petsCount < 5) this.petsCount++; break;
    }
    this.updateGuestsCount();
  }

  decrementGuests(type: 'adults' | 'children' | 'infants' | 'pets'): void {
    switch (type) {
      case 'adults': if (this.adultsCount > 0) this.adultsCount--; break;
      case 'children': if (this.childrenCount > 0) this.childrenCount--; break;
      case 'infants': if (this.infantsCount > 0) this.infantsCount--; break;
      case 'pets': if (this.petsCount > 0) this.petsCount--; break;
    }
    this.updateGuestsCount();
  }

  updateGuestsCount(): void {
    this.guests = this.adultsCount + this.childrenCount;
  }

  get guestsText(): string {
    const parts: string[] = [];
    const totalGuests = this.adultsCount + this.childrenCount;
    if (totalGuests > 0) parts.push(`${totalGuests} guest${totalGuests > 1 ? 's' : ''}`);
    if (this.infantsCount > 0) parts.push(`${this.infantsCount} infant${this.infantsCount > 1 ? 's' : ''}`);
    if (this.petsCount > 0) parts.push(`${this.petsCount} pet${this.petsCount > 1 ? 's' : ''}`);
    return parts.length > 0 ? parts.join(', ') : 'Add guests';
  }

  // === Services Logic ===
  selectCategory(catName: string) {
    this.selectedCategory = catName;
    this.showCategoriesDropdown = false;
  }
  
  clearCategory(event: Event) {
    event.stopPropagation();
    this.selectedCategory = '';
  }

  // ✅ Unified Search Handler
  onSearch(): void {
    if (this.searchType === 'stays') {
      const filters: SearchFilters = {
        location: this.location || undefined,
        checkIn: this.checkIn ? new Date(this.checkIn) : undefined,
        checkOut: this.checkOut ? new Date(this.checkOut) : undefined,
        guests: this.guests > 0 ? this.guests : undefined
      };
      this.search.emit(filters);
    } else {
      // Services Search
      const queryParams: any = {};
      if (this.serviceQuery) queryParams.q = this.serviceQuery;
      if (this.selectedCategory) queryParams.category = this.selectedCategory;
      
      this.router.navigate(['/services'], { queryParams: queryParams });
    }
  }

  onFiltersClick(): void {
    this.filtersOpen.emit();
  }
}
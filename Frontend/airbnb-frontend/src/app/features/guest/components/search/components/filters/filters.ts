
import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common'; // Standalone: Add CommonModule
import { FormsModule } from '@angular/forms'; // Standalone: Add Forms module for ngModel
import { SearchFilters, Property, AmenityCategory, PropertyType  } from '../../models/property.model'; // Import models

// Interface for local amenity state
interface Amenity {
  id: string;
  name: string;
  icon: string;
  selected: boolean;
}

@Component({
  selector: 'app-filters',
  standalone: true, // IMPORTANT: Converted to Standalone
  imports: [
    CommonModule, // For Angular structural directives (*ngIf, *ngFor)
    FormsModule   // For two-way data binding ([(ngModel)]) used in forms
  ],
  templateUrl: './filters.html',
  styleUrls: ['./filters.css']
})
export class FiltersComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() applyFilters = new EventEmitter<SearchFilters>();

  // Price Range (filter state)
  minPrice = 0;
  maxPrice = 50000;
  priceMin = 0;
  priceMax = 50000;

  // Property Types (filter state)
propertyTypes = [
  { type: PropertyType.APARTMENT, icon: 'bi-building', label: 'Apartment', selected: false },
  { type: PropertyType.HOUSE, icon: 'bi-house-door', label: 'House', selected: false },
  { type: PropertyType.ROOM, icon: 'bi-door-open', label: 'Room', selected: false },
  { type: PropertyType.VILLA, icon: 'bi-house', label: 'Villa', selected: false },
  { type: PropertyType.STUDIO, icon: 'bi-square', label: 'Studio', selected: false },
  { type: PropertyType.CHALET, icon: 'bi-tree', label: 'Chalet', selected: false }
];

  // Rooms & Beds (filter state)
  bedrooms: number | null = null;
  beds: number | null = null;
  bathrooms: number | null = null;

  // Amenities (filter state)
  amenities: Amenity[] = [
    { id: 'wifi', name: 'WiFi', icon: 'bi-wifi', selected: false },
    { id: 'kitchen', name: 'Kitchen', icon: 'bi-house', selected: false },
    { id: 'washer', name: 'Washer', icon: 'bi-circle', selected: false },
    { id: 'dryer', name: 'Dryer', icon: 'bi-circle', selected: false },
    { id: 'ac', name: 'Air conditioning', icon: 'bi-snow', selected: false },
    { id: 'heating', name: 'Heating', icon: 'bi-thermometer-sun', selected: false },
    { id: 'tv', name: 'TV', icon: 'bi-tv', selected: false },
    { id: 'pool', name: 'Pool', icon: 'bi-water', selected: false },
    { id: 'hot-tub', name: 'Hot tub', icon: 'bi-circle', selected: false },
    { id: 'parking', name: 'Free parking', icon: 'bi-car-front', selected: false },
    { id: 'gym', name: 'Gym', icon: 'bi-heart-pulse', selected: false },
    { id: 'workspace', name: 'Dedicated workspace', icon: 'bi-laptop', selected: false }
  ];

  // Booking Options (filter state)
  instantBook = false;
  selfCheckIn = false;
  allowsPets = false;

  // Rating (filter state)
  minRating: number | null = null;

  onClose(): void {
    this.close.emit(); // Emit close event
  }

  togglePropertyType(type: PropertyType): void {
    const typeObj = this.propertyTypes.find(t => t.type === type);
    if (typeObj) {
      typeObj.selected = !typeObj.selected; // Toggle selection
    }
  }

  toggleAmenity(amenityId: string): void {
    const amenity = this.amenities.find(a => a.id === amenityId);
    if (amenity) {
      amenity.selected = !amenity.selected; // Toggle amenity selection
    }
  }

  incrementRooms(type: 'bedrooms' | 'beds' | 'bathrooms'): void {
    // Increment room count
    if (this[type] === null) {
      this[type] = 1;
    } else {
      this[type]!++;
    }
  }

  decrementRooms(type: 'bedrooms' | 'beds' | 'bathrooms'): void {
    // Decrement room count
    if (this[type] !== null && this[type]! > 0) {
      this[type]!--;
      if (this[type] === 0) {
        this[type] = null;
      }
    }
  }

  setMinRating(rating: number): void {
    // Set or unset minimum rating
    this.minRating = this.minRating === rating ? null : rating;
  }

  onPriceMinChange(event: Event): void {
    // Handle minimum price change
    const value = +(event.target as HTMLInputElement).value;
    this.priceMin = Math.min(value, this.priceMax);
  }

  onPriceMaxChange(event: Event): void {
    // Handle maximum price change
    const value = +(event.target as HTMLInputElement).value;
    this.priceMax = Math.max(value, this.priceMin);
  }

  clearAll(): void {
    // Reset all filter fields to default state
    this.priceMin = 0;
    this.priceMax = 50000;
    this.propertyTypes.forEach(t => t.selected = false);
    this.bedrooms = null;
    this.beds = null;
    this.bathrooms = null;
    this.amenities.forEach(a => a.selected = false);
    this.instantBook = false;
    this.selfCheckIn = false;
    this.allowsPets = false;
    this.minRating = null;
  }

  apply(): void {
    const filters: SearchFilters = {}; // Initialize filter object

    // Build SearchFilters object based on selected fields

    // Price range
    if (this.priceMin > 0) { filters.priceMin = this.priceMin; }
    if (this.priceMax < 50000) { filters.priceMax = this.priceMax; }

    // Property types
    const selectedTypes = this.propertyTypes.filter(t => t.selected).map(t => t.type);
    if (selectedTypes.length > 0) { filters.propertyTypes = selectedTypes; }

    // Rooms & beds
    if (this.bedrooms !== null && this.bedrooms > 0) { filters.bedrooms = this.bedrooms; }
    if (this.beds !== null && this.beds > 0) { filters.beds = this.beds; }
    if (this.bathrooms !== null && this.bathrooms > 0) { filters.bathrooms = this.bathrooms; }

    // Amenities
    const selectedAmenities = this.amenities.filter(a => a.selected).map(a => a.id);
    if (selectedAmenities.length > 0) { filters.amenities = selectedAmenities; }

    // Booking options & Rating
    if (this.instantBook) { filters.instantBook = true; }
    if (this.minRating !== null) { filters.rating = this.minRating; }

    this.applyFilters.emit(filters); // Emit final filters
    this.close.emit();
  }

  get activeFiltersCount(): number {
    // Calculate the number of active filters for display
    let count = 0;

    if (this.priceMin > 0 || this.priceMax < 50000) count++;
    if (this.propertyTypes.some(t => t.selected)) count++;
    if (this.bedrooms !== null || this.beds !== null || this.bathrooms !== null) count++;
    if (this.amenities.some(a => a.selected)) count++;
    if (this.instantBook || this.selfCheckIn || this.allowsPets) count++;
    if (this.minRating !== null) count++;

    return count;
  }
}

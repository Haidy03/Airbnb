import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// تأكد من مسار الموديل ( AmenityCategory)
import { SearchFilters, PropertyType } from '../../models/property.model';

// Interface for local amenity state
interface Amenity {
  id: string;
  name: string;
  icon: string;
  selected: boolean;
}

@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filters.html',
  styleUrls: ['./filters.css']
})
export class FiltersComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() applyFilters = new EventEmitter<SearchFilters>();

  // Price Range
  minPrice = 0;
  maxPrice = 50000;
  priceMin: number | null = null; // Changed to nullable to match logic
  priceMax: number | null = null; // Changed to nullable

  // Property Types
  propertyTypes = [
    { type: PropertyType.APARTMENT, icon: 'bi-building', label: 'Apartment', selected: false },
    { type: PropertyType.HOUSE, icon: 'bi-house-door', label: 'House', selected: false },
    { type: PropertyType.ROOM, icon: 'bi-door-open', label: 'Room', selected: false },
    { type: PropertyType.VILLA, icon: 'bi-house', label: 'Villa', selected: false },
    { type: PropertyType.STUDIO, icon: 'bi-square', label: 'Studio', selected: false },
    { type: PropertyType.CHALET, icon: 'bi-tree', label: 'Chalet', selected: false }
  ];

  // Rooms & Beds
  bedrooms: number | null = null;
  beds: number | null = null;
  bathrooms: number | null = null;

  // Amenities
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

  // Booking Options
  instantBook = false;
  selfCheckIn = false;
  allowsPets = false;

  // Rating
  minRating: number | null = null;

  onClose(): void {
    this.close.emit();
  }

  togglePropertyType(type: PropertyType): void {
    const typeObj = this.propertyTypes.find(t => t.type === type);
    if (typeObj) {
      typeObj.selected = !typeObj.selected;
    }
  }

  toggleAmenity(amenityId: string): void {
    const amenity = this.amenities.find(a => a.id === amenityId);
    if (amenity) {
      amenity.selected = !amenity.selected;
    }
  }

  incrementRooms(type: 'bedrooms' | 'beds' | 'bathrooms'): void {
    if (this[type] === null) {
      this[type] = 1;
    } else {
      this[type]!++;
    }
  }

  decrementRooms(type: 'bedrooms' | 'beds' | 'bathrooms'): void {
    if (this[type] !== null && this[type]! > 0) {
      this[type]!--;
      if (this[type] === 0) {
        this[type] = null;
      }
    }
  }

  setMinRating(rating: number): void {
    this.minRating = this.minRating === rating ? null : rating;
  }

  onPriceMinChange(event: Event): void {
    const value = +(event.target as HTMLInputElement).value;
    this.priceMin = Math.min(value, this.priceMax ?? this.maxPrice);
  }

  onPriceMaxChange(event: Event): void {
    const value = +(event.target as HTMLInputElement).value;
    this.priceMax = Math.max(value, this.priceMin ?? 0);
  }

  clearAll(): void {
    this.priceMin = null;
    this.priceMax = null;
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
    // 1. تجميع البيانات
    const selectedTypes = this.propertyTypes.filter(t => t.selected).map(t => t.type);
    const selectedAmenities = this.amenities.filter(a => a.selected).map(a => a.id); // أو a.name حسب الباك إند

    // 2. بناء الأوبجيكت النهائي (نرسل فقط القيم الموجودة)
    const filters: SearchFilters = {
      priceMin: this.priceMin || undefined,
      priceMax: this.priceMax || undefined,
      propertyTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
      amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
      bedrooms: this.bedrooms || undefined,
      beds: this.beds || undefined,
      bathrooms: this.bathrooms || undefined,
      instantBook: this.instantBook || undefined,
      rating: this.minRating || undefined
    };

    // 3. إرسال الفلاتر للأب (Search Results)
    this.applyFilters.emit(filters);
    this.onClose();
  }

  get activeFiltersCount(): number {
    let count = 0;
    if (this.priceMin !== null || (this.priceMax !== null && this.priceMax < 50000)) count++;
    if (this.propertyTypes.some(t => t.selected)) count++;
    if (this.bedrooms !== null || this.beds !== null || this.bathrooms !== null) count++;
    if (this.amenities.some(a => a.selected)) count++;
    if (this.instantBook || this.selfCheckIn || this.allowsPets) count++;
    if (this.minRating !== null) count++;
    return count;
  }
}

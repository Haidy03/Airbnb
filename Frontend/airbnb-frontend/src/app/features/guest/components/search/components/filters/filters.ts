import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchFilters, PropertyType } from '../../models/property.model';

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
export class FiltersComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() currentFilters: SearchFilters = {};
  @Output() close = new EventEmitter<void>();
  @Output() applyFilters = new EventEmitter<SearchFilters>();

  // Price
  minPrice = 0;
  maxPrice = 50000;
  priceMin: number | null = null;
  priceMax: number | null = null;

  // Types
  propertyTypes = [
    { type: PropertyType.HOUSE, icon: 'bi-house-door', label: 'House', selected: false },
    { type: PropertyType.APARTMENT, icon: 'bi-building', label: 'Apartment', selected: false },
    { type: PropertyType.BARN, icon: 'bi-house-heart', label: 'Barn', selected: false }, // شكل ريفي
    { type: PropertyType.BED_BREAKFAST, icon: 'bi-cup-hot', label: 'Bed & breakfast', selected: false },
    { type: PropertyType.BOAT, icon: 'bi-water', label: 'Boat', selected: false },
    { type: PropertyType.CABIN, icon: 'bi-tree', label: 'Cabin', selected: false },
    { type: PropertyType.CAMPER, icon: 'bi-truck', label: 'Camper/RV', selected: false },
    { type: PropertyType.CASA_PARTICULAR, icon: 'bi-house-fill', label: 'Casa particular', selected: false },
    { type: PropertyType.CASTLE, icon: 'bi-bricks', label: 'Castle', selected: false },
    { type: PropertyType.CAVE, icon: 'bi-moon', label: 'Cave', selected: false }, // رمز يعبر عن الطبيعة/الظلام
    { type: PropertyType.CONTAINER, icon: 'bi-box-seam', label: 'Container', selected: false },
    { type: PropertyType.CYCLADIC_HOME, icon: 'bi-sun', label: 'Cycladic home', selected: false } // رمز يعبر عن الجزر اليونانية
  ];

  // Rooms
  bedrooms: number | null = null;
  beds: number | null = null;
  bathrooms: number | null = null;

  // Amenities
  amenities: Amenity[] = [
    { id: '1', name: 'WiFi', icon: 'bi-wifi', selected: false },
    { id: '2', name: 'TV', icon: 'bi-tv', selected: false },
    { id: '3', name: 'Kitchen', icon: 'bi-house', selected: false },
    { id: '4', name: 'Washer', icon: 'bi-circle', selected: false },
    { id: '5', name: 'Dryer', icon: 'bi-wind', selected: false },
    { id: '6', name: 'Air conditioning', icon: 'bi-snow', selected: false },
    { id: '7', name: 'Heating', icon: 'bi-thermometer-sun', selected: false },
    { id: '8', name: 'Dedicated workspace', icon: 'bi-briefcase', selected: false },
    { id: '9', name: 'Pool', icon: 'bi-water', selected: false },
    { id: '10', name: 'Hot tub', icon: 'bi-droplet', selected: false },
    { id: '11', name: 'Free parking', icon: 'bi-car-front', selected: false },
    { id: '12', name: 'EV charger', icon: 'bi-lightning-charge', selected: false },
    { id: '13', name: 'Smoke alarm', icon: 'bi-exclamation-triangle', selected: false },
    { id: '14', name: 'Carbon monoxide alarm', icon: 'bi-exclamation-circle', selected: false }
  ];

 
  instantBook = false;
  requestToBook = false; 

  selfCheckIn = false; 
  allowsPets = false;  

  // Rating
  minRating: number | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.mapFiltersToUI();
    }
  }

  private mapFiltersToUI() {
    if (!this.currentFilters) return;

    this.priceMin = this.currentFilters.priceMin || null;
    this.priceMax = this.currentFilters.priceMax || null;
    this.bedrooms = this.currentFilters.bedrooms || null;
    this.beds = this.currentFilters.beds || null;
    this.bathrooms = this.currentFilters.bathrooms || null;
    this.instantBook = this.currentFilters.instantBook === true;
    this.requestToBook = this.currentFilters.instantBook === false;
    this.minRating = this.currentFilters.rating || null;

  
    this.propertyTypes.forEach(t => t.selected = false);
    if (this.currentFilters.propertyTypes && this.currentFilters.propertyTypes.length > 0) {
      const selectedType = this.currentFilters.propertyTypes[0];
      const target = this.propertyTypes.find(t => t.type === selectedType);
      if (target) target.selected = true;
    }

    this.amenities.forEach(a => a.selected = false);
    if (this.currentFilters.amenities) {
      this.currentFilters.amenities.forEach(id => {
        const target = this.amenities.find(a => a.id === id.toString());
        if (target) target.selected = true;
      });
    }
  }

  onClose() { this.close.emit(); }

  togglePropertyType(type: PropertyType) {
    this.propertyTypes.forEach(t => t.selected = false);
    const target = this.propertyTypes.find(t => t.type === type);
    if (target) target.selected = true;
  }

  toggleAmenity(id: string) {
    const amenity = this.amenities.find(a => a.id === id);
    if (amenity) amenity.selected = !amenity.selected;
  }

  incrementRooms(type: 'bedrooms' | 'beds' | 'bathrooms') { if (this[type] === null) this[type] = 1; else this[type]!++; }
  decrementRooms(type: 'bedrooms' | 'beds' | 'bathrooms') { if (this[type] !== null && this[type]! > 0) { this[type]!--; if (this[type] === 0) this[type] = null; } }
  setMinRating(r: number) { 
    this.minRating = this.minRating === r ? null : r; 
  }
  onPriceMinChange(e: Event) { const v = +(e.target as HTMLInputElement).value; this.priceMin = Math.min(v, this.priceMax ?? 50000); }
  onPriceMaxChange(e: Event) { const v = +(e.target as HTMLInputElement).value; this.priceMax = Math.max(v, this.priceMin ?? 0); }

  clearAll() {
    this.priceMin = null; 
    this.priceMax = null;
    this.propertyTypes.forEach(t => t.selected = false);
    this.amenities.forEach(a => a.selected = false);
    this.bedrooms = null; 
    this.beds = null; 
    this.bathrooms = null;
    this.instantBook = false;
    this.requestToBook = false;
    this.selfCheckIn = false;
    this.allowsPets = false;
    this.minRating = null;
  }

  apply() {
    const selectedTypes = this.propertyTypes.filter(t => t.selected).map(t => t.type);
    const selectedAmenities = this.amenities.filter(a => a.selected).map(a => a.id);
    let isInstantValue: boolean | undefined = undefined;

    if (this.instantBook && !this.requestToBook) {
      isInstantValue = true; 
    } else if (!this.instantBook && this.requestToBook) {
      isInstantValue = false;
    }

    const filters: SearchFilters = {
      priceMin: this.priceMin || undefined,
      priceMax: this.priceMax || undefined,
      propertyTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
      amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
      bedrooms: this.bedrooms || undefined,
      beds: this.beds || undefined,
      bathrooms: this.bathrooms || undefined,
      instantBook: isInstantValue,
      rating: this.minRating || undefined
     
    };

    console.log('Filters emitting:', filters); // Debugging line
    this.applyFilters.emit(filters);
    this.onClose();
  }

  get activeFiltersCount(): number {
    let count = 0;
    if (this.priceMin || (this.priceMax && this.priceMax < 50000)) count++;
    if (this.propertyTypes.some(t => t.selected)) count++;
    if (this.amenities.some(a => a.selected)) count++;
    if (this.bedrooms || this.beds || this.bathrooms) count++;
    if (this.instantBook || this.requestToBook) count++;
    if (this.minRating) count++;
    return count;
  }
}

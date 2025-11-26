import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchFilters } from '../../models/property.model';
import { SearchService } from '../../services/search-service'; // استيراد السيرفس

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

  location: string = '';
  checkIn: string = '';
  checkOut: string = '';
  guests: number = 0;
  minDate: string = '';

  activeInput: 'location' | 'checkIn' | 'checkOut' | 'guests' | null = null;

  // Dropdowns control
  showGuestsDropdown = false;
  showLocationsDropdown = false;

  // Data from Service
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

    // الاشتراك في قائمة المدن المتاحة
    this.searchService.locations$.subscribe(locations => {
      this.availableLocations = locations;
    });
  }

  onInputFocus(input: 'location' | 'checkIn' | 'checkOut' | 'guests'): void {
    this.activeInput = input;

    if (input === 'guests') this.showGuestsDropdown = true;
    else this.showGuestsDropdown = false;

    if (input === 'location') this.showLocationsDropdown = true;
    else this.showLocationsDropdown = false;
  }

  onInputBlur(): void {
    // تأخير بسيط عشان يسمح بالضغط على العناصر قبل ما القائمة تختفي
    setTimeout(() => {
      this.activeInput = null;
      this.showGuestsDropdown = false;
      this.showLocationsDropdown = false;
    }, 200);
  }

  // اختيار مكان من القائمة
  selectLocation(city: string) {
    this.location = city;
    this.showLocationsDropdown = false;
    // نقل التركيز للخانة التالية تلقائياً (اختياري بس حركة شيك)
    // document.getElementById('checkInInput')?.focus();
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

  onSearch(): void {
    const filters: SearchFilters = {
      location: this.location || undefined,
      checkIn: this.checkIn ? new Date(this.checkIn) : undefined,
      checkOut: this.checkOut ? new Date(this.checkOut) : undefined,
      guests: this.guests > 0 ? this.guests : undefined
    };
    this.search.emit(filters);
  }

  onFiltersClick(): void {
    this.filtersOpen.emit();
  }

  clearLocation(): void { this.location = ''; }

  clearDate(type: 'checkIn' | 'checkOut', event: Event): void {
    event.stopPropagation(); // منع فتح التقويم عند مسح التاريخ
    if (type === 'checkIn') this.checkIn = '';
    if (type === 'checkOut') this.checkOut = '';
  }
}

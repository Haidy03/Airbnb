import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchFilters } from '../../models/property.model'; // تأكد أن المسار للموديل صحيح

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './search-bar.html',
  styleUrls: ['./search-bar.css']
})
export class SearchBarComponent {
  // New Input to control Filters visibility
  @Input() showFilters: boolean = true;

  @Output() search = new EventEmitter<SearchFilters>();
  @Output() filtersOpen = new EventEmitter<void>();

  location: string = '';
  checkIn: string = ''; // Changed to string to work easily with input[type="date"]
  checkOut: string = ''; // Changed to string
  guests: number = 0; // Initialize as 0 to show "Add guests" initially

  activeInput: 'location' | 'checkIn' | 'checkOut' | 'guests' | null = null;
  showGuestsDropdown = false;

  adultsCount = 0; // Start at 0
  childrenCount = 0;
  infantsCount = 0;
  petsCount = 0;

  onInputFocus(input: 'location' | 'checkIn' | 'checkOut' | 'guests'): void {
    this.activeInput = input;
    if (input === 'guests') {
      this.showGuestsDropdown = true;
    }
  }

  onInputBlur(): void {
    setTimeout(() => {
      this.activeInput = null;
      this.showGuestsDropdown = false;
    }, 200);
  }

  incrementGuests(type: 'adults' | 'children' | 'infants' | 'pets'): void {
    // If it's the first adult, increment main guests count
    if (this.adultsCount === 0 && type === 'adults') {
        this.adultsCount = 1;
        this.updateGuestsCount();
        return;
    }

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

    if (totalGuests > 0) {
      parts.push(`${totalGuests} guest${totalGuests > 1 ? 's' : ''}`);
    }
    if (this.infantsCount > 0) {
      parts.push(`${this.infantsCount} infant${this.infantsCount > 1 ? 's' : ''}`);
    }
    if (this.petsCount > 0) {
      parts.push(`${this.petsCount} pet${this.petsCount > 1 ? 's' : ''}`);
    }

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

  clearDates(): void {
    this.checkIn = '';
    this.checkOut = '';
  }
}

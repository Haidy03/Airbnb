
import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common'; // Standalone: Add CommonModule
import { FormsModule } from '@angular/forms'; // Standalone: Add FormsModule for two-way binding
import { SearchFilters } from '../../models/property.model'; // Import models

@Component({
  selector: 'app-search-bar',
  standalone: true, // IMPORTANT: Converted to Standalone
  imports: [
    CommonModule, // For structural directives
    FormsModule   // For input binding ([ngModel], (ngModelChange))
  ],
  templateUrl: './search-bar.html',
  styleUrls: ['./search-bar.css']
})
export class SearchBarComponent {
  @Output() search = new EventEmitter<SearchFilters>(); // Emit search request
  @Output() filtersOpen = new EventEmitter<void>();   // Emit filters open request

  location: string = '';
  checkIn: Date | null = null;
  checkOut: Date | null = null;
  guests: number = 1;

  activeInput: 'location' | 'checkIn' | 'checkOut' | 'guests' | null = null;
  showGuestsDropdown = false;

  adultsCount = 1;
  childrenCount = 0;
  infantsCount = 0;
  petsCount = 0;

  onInputFocus(input: 'location' | 'checkIn' | 'checkOut' | 'guests'): void {
    // Set active input state
    this.activeInput = input;
    if (input === 'guests') {
      this.showGuestsDropdown = true; // Show guests dropdown on focus
    }
  }

  onInputBlur(): void {
    // Delay blur action to allow click events inside the dropdown
    setTimeout(() => {
      this.activeInput = null;
      this.showGuestsDropdown = false; // Hide dropdown
    }, 200);
  }

  incrementGuests(type: 'adults' | 'children' | 'infants' | 'pets'): void {
    // Logic to increment guest counts with limits
    switch (type) {
      case 'adults':
        if (this.adultsCount < 16) this.adultsCount++;
        break;
      case 'children':
        if (this.childrenCount < 15) this.childrenCount++;
        break;
      case 'infants':
        if (this.infantsCount < 5) this.infantsCount++;
        break;
      case 'pets':
        if (this.petsCount < 5) this.petsCount++;
        break;
    }
    this.updateGuestsCount();
  }

  decrementGuests(type: 'adults' | 'children' | 'infants' | 'pets'): void {
    // Logic to decrement guest counts with minimum values
    switch (type) {
      case 'adults':
        if (this.adultsCount > 1) this.adultsCount--;
        break;
      case 'children':
        if (this.childrenCount > 0) this.childrenCount--;
        break;
      case 'infants':
        if (this.infantsCount > 0) this.infantsCount--;
        break;
      case 'pets':
        if (this.petsCount > 0) this.petsCount--;
        break;
    }
    this.updateGuestsCount();
  }

  updateGuestsCount(): void {
    // Update total guests (Adults + Children)
    this.guests = this.adultsCount + this.childrenCount;
  }

  get guestsText(): string {
    // Generate human-readable text for guests summary
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
    // Assemble filters object and emit search event
    const filters: SearchFilters = {
      location: this.location || undefined,
      checkIn: this.checkIn || undefined,
      checkOut: this.checkOut || undefined,
      guests: this.guests > 0 ? this.guests : undefined
    };

    this.search.emit(filters);
  }

  onFiltersClick(): void {
    this.filtersOpen.emit(); // Open advanced filters
  }

  clearLocation(): void {
    this.location = '';
  }

  clearDates(): void {
    this.checkIn = null;
    this.checkOut = null;
  }

  clearGuests(): void {
    // Reset guest counts to default
    this.adultsCount = 1;
    this.childrenCount = 0;
    this.infantsCount = 0;
    this.petsCount = 0;
    this.updateGuestsCount();
  }
}

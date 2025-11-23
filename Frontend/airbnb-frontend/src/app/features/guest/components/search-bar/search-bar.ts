import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar.html',
  styleUrls: ['./search-bar.css']
})
export class SearchBarComponent {
  isSearchModalOpen = false;
  activeSearchSection: 'where' | 'when' | 'who' | null = null;

  searchData = {
    where: '',
    when: '',
    who: '',
    checkIn: '',
    checkOut: ''
  };

  guestCounts = {
    adults: 0,
    children: 0,
    infants: 0
  };

  popularDestinations = [
    'Cairo',
    'Alexandria',
    'Sharm El Sheikh',
    'Hurghada',
    'Luxor',
    'Aswan'
  ];

  openSearchModal(section: 'where' | 'when' | 'who') {
    this.activeSearchSection = section;
    this.isSearchModalOpen = true;
  }

  closeSearchModal() {
    this.isSearchModalOpen = false;
    this.activeSearchSection = null;
  }

  selectDestination(destination: string) {
    this.searchData.where = destination;
  }

  incrementGuests(type: 'adults' | 'children' | 'infants') {
    this.guestCounts[type]++;
    this.updateWhoText();
  }

  decrementGuests(type: 'adults' | 'children' | 'infants') {
    if (this.guestCounts[type] > 0) {
      this.guestCounts[type]--;
      this.updateWhoText();
    }
  }

  updateWhoText() {
    const total = this.guestCounts.adults + this.guestCounts.children + this.guestCounts.infants;
    if (total === 0) {
      this.searchData.who = '';
    } else if (total === 1) {
      this.searchData.who = '1 guest';
    } else {
      this.searchData.who = `${total} guests`;
    }
  }

  clearSearch() {
    this.searchData = {
      where: '',
      when: '',
      who: '',
      checkIn: '',
      checkOut: ''
    };
    this.guestCounts = {
      adults: 0,
      children: 0,
      infants: 0
    };
  }

  applySearch() {
    // Update when text from dates
    if (this.searchData.checkIn && this.searchData.checkOut) {
      const checkIn = new Date(this.searchData.checkIn);
      const checkOut = new Date(this.searchData.checkOut);
      const checkInFormatted = checkIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const checkOutFormatted = checkOut.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      this.searchData.when = `${checkInFormatted} - ${checkOutFormatted}`;
    }

    this.closeSearchModal();
    // TODO: Emit search event or navigate to search results
    console.log('Search data:', this.searchData, this.guestCounts);
  }

  handleSearch() {
    // TODO: Navigate to search results page
    console.log('Quick search:', this.searchData);
  }
}

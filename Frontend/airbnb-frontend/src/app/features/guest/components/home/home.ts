import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '..//header/header';

// Define the Property interface here to avoid errors
export interface Property {
  id: number;
  title: string;
  price: number;
  rating: number;
  nights?: number;
  image: string;
  location?: string; // Added optional location field
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './home.html',
  // styleUrls: ['./home.css'] // Uncomment if you have a CSS file
})
export class HomeComponent implements OnInit {
  // Properties Arrays
  sheikhZayedProperties: Property[] = [];
  dahabProperties: Property[] = [];
  parisProperties: Property[] = [];

  // Combined array if you want to show all in one list
  allProperties: Property[] = [];

  // Wishlist Logic
  wishlist: Set<number> = new Set();

  constructor() {}

  ngOnInit(): void {
    this.loadProperties();
  }

  private loadProperties(): void {
    // 1. Sheikh Zayed City Properties
    this.sheikhZayedProperties = [
      { id: 1, title: 'Apartment in Sheikh Zayed', price: 6742, rating: 5.0, nights: 2, image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400' },
      { id: 2, title: 'Modern Studio in Zayed', price: 4847, rating: 5.0, nights: 2, image: 'https://images.unsplash.com/photo-1502672260066-6bc35f0a1fb1?w=400' },
      { id: 3, title: 'Luxury Villa', price: 5398, rating: 4.93, nights: 2, image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400' },
      { id: 4, title: 'Cozy Apartment', price: 9394, rating: 5.0, nights: 2, image: 'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=400' },
      { id: 6, title: 'Sunny Room', price: 7160, rating: 5.0, nights: 2, image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400' },
      { id: 7, title: 'Family Home', price: 22030, rating: 4.92, nights: 2, image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400' }
    ];

    // 2. Dahab Properties
    this.dahabProperties = [
      { id: 8, title: 'Guesthouse in Dahab', price: 3470, rating: 5.0, nights: 2, image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400' },
      { id: 9, title: 'Beachfront Cabin', price: 2812, rating: 5.0, nights: 2, image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400' },
      { id: 10, title: 'Sea View Apartment', price: 4792, rating: 4.97, nights: 2, image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400' },
      { id: 11, title: 'Blue Hole House', price: 7710, rating: 4.93, nights: 2, image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400' },
      { id: 13, title: 'Lagoon Villa', price: 6609, rating: 4.84, nights: 2, image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400' }
    ];

    // 3. Paris Properties
    this.parisProperties = [
      { id: 15, title: 'Apartment with Eiffel View', price: 8500, rating: 4.95, nights: 2, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400' },
      { id: 16, title: 'Artistic Loft', price: 12000, rating: 4.88, nights: 2, image: 'https://images.unsplash.com/photo-1549638441-b787d2e11f14?w=400' },
      { id: 18, title: 'Champs-Élysées Suite', price: 9200, rating: 4.89, nights: 2, image: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=400' }
    ];

    // Combine all for "All" view if needed
    this.allProperties = [...this.sheikhZayedProperties, ...this.dahabProperties, ...this.parisProperties];
  }

  // --- Wishlist Logic ---
  isPropertyInWishlist(propertyId: number): boolean {
    return this.wishlist.has(propertyId);
  }

  onToggleWishlist(property: Property): void {
    if (this.wishlist.has(property.id)) {
      this.wishlist.delete(property.id);
    } else {
      this.wishlist.add(property.id);
    }
  }

  onPropertyClick(property: Property): void {
    console.log('Property clicked:', property);
    // Future: Navigate to details page
    // this.router.navigate(['/property', property.id]);
  }
}

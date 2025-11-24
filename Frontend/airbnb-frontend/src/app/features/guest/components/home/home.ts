import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header';
// 1. استدعاء السيرفس
import { WishlistService } from '../../services/wishlist.service';

export interface Property {
  id: number;
  title: string;
  price: number;
  rating: number;
  nights?: number;
  image: string;
  location?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './home.html',
})
export class HomeComponent implements OnInit {
  // Properties Arrays (زي ما هي بالظبط)
  sheikhZayedProperties: Property[] = [];
  dahabProperties: Property[] = [];
  parisProperties: Property[] = [];

  // 2. حقن السيرفس في الكونسركتور
  constructor(private wishlistService: WishlistService) {}

  ngOnInit(): void {
    this.loadProperties();
  }

  // 3. التعديل هنا: بنسأل السيرفس هل العنصر ده موجود ولا لأ
  isPropertyInWishlist(propertyId: number): boolean {
    return this.wishlistService.isInWishlist(propertyId);
  }

  // 4. التعديل هنا: بنضيف أو نحذف عن طريق السيرفس
  onToggleWishlist(property: Property): void {
    if (this.isPropertyInWishlist(property.id)) {
      this.wishlistService.removeFromWishlist(property.id);
    } else {
      this.wishlistService.addToWishlist(property);
    }
  }

  onPropertyClick(property: Property): void {
    console.log('Property clicked:', property);
    // this.router.navigate(['/property', property.id]);
  }

  private loadProperties(): void {
    // 1. Sheikh Zayed City Properties (زي ما هي)
    this.sheikhZayedProperties = [
      { id: 1, title: 'Apartment in Sheikh Zayed', location: 'Sheikh Zayed, Egypt', price: 6742, rating: 5.0, nights: 2, image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400' },
      { id: 2, title: 'Modern Studio in Zayed', location: 'Sheikh Zayed, Egypt', price: 4847, rating: 5.0, nights: 2, image: 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/571927309.jpg?k=4304d3c2fe48bb194addec003d58b9c24177fdcc3171c1c3ddb9987598916c84&o=' },
      { id: 3, title: 'Luxury Villa', location: 'Sheikh Zayed, Egypt', price: 5398, rating: 4.93, nights: 2, image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400' },
      { id: 4, title: 'Cozy Apartment', location: 'Sheikh Zayed, Egypt', price: 9394, rating: 5.0, nights: 2, image: 'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=400' },
      { id: 6, title: 'Sunny Room', location: 'Sheikh Zayed, Egypt', price: 7160, rating: 5.0, nights: 2, image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400' },
      { id: 7, title: 'Family Home', location: 'Sheikh Zayed, Egypt', price: 22030, rating: 4.92, nights: 2, image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400' }
    ];

    // 2. Dahab Properties (زي ما هي)
    this.dahabProperties = [
      { id: 8, title: 'Guesthouse in Dahab', location: 'Dahab, Egypt', price: 3470, rating: 5.0, nights: 2, image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400' },
      { id: 9, title: 'Beachfront Cabin', location: 'Dahab, Egypt', price: 2812, rating: 5.0, nights: 2, image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400' },
      { id: 10, title: 'Sea View Apartment', location: 'Dahab, Egypt', price: 4792, rating: 4.97, nights: 2, image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400' },
      { id: 11, title: 'Blue Hole House', location: 'Dahab, Egypt', price: 7710, rating: 4.93, nights: 2, image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400' },
      { id: 13, title: 'Lagoon Villa', location: 'Dahab, Egypt', price: 6609, rating: 4.84, nights: 2, image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400' }
    ];

    // 3. Paris Properties (زي ما هي)
    this.parisProperties = [
      { id: 15, title: 'Apartment with Eiffel View', location: 'Paris, France', price: 8500, rating: 4.95, nights: 2, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400' },
      { id: 16, title: 'Artistic Loft', location: 'Paris, France', price: 12000, rating: 4.88, nights: 2, image: 'https://images.unsplash.com/photo-1549638441-b787d2e11f14?w=400' },
      { id: 18, title: 'Champs-Élysées Suite', location: 'Paris, France', price: 9200, rating: 4.89, nights: 2, image: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=400' }
    ];
  }
}

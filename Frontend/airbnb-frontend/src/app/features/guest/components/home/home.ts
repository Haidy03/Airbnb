import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header';
import { SearchService } from '../search/services/search-service';
import { Property } from '../search/models/property.model';
import { WishlistService } from '../../services/wishlist.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './home.html',
})
export class HomeComponent implements OnInit {

  properties: Property[] = []; // مصفوفة واحدة لكل الداتا
  isLoading = true;

  constructor(
    private searchService: SearchService,
    private wishlistService: WishlistService
  ) {}

  ngOnInit(): void {
    this.loadProperties();
  }

  private loadProperties(): void {
    this.isLoading = true;

    this.searchService.getFeaturedProperties().subscribe({
      next: (data) => {
        this.properties = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Connection Error:', err);
        this.isLoading = false;
      }
    });
  }

  isPropertyInWishlist(propertyId: string): boolean {
    return this.wishlistService.isInWishlist(Number(propertyId));
  }

  onToggleWishlist(property: Property): void {
    if (this.isPropertyInWishlist(property.id)) {
      this.wishlistService.removeFromWishlist(Number(property.id));
    } else {
      this.wishlistService.addToWishlist(property as any);
    }
  }

  onPropertyClick(property: Property): void {
    console.log('Go to details:', property.id);
    // this.router.navigate(['/property', property.id]);
  }
}

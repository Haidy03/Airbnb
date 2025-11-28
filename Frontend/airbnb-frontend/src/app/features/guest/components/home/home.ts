import { Component, OnInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header';
import { SearchService } from '../search/services/search-service';
import { Property } from '../search/models/property.model';
import { WishlistService } from '../../services/wishlist.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../auth/services/auth.service';

interface CityGroup {
  city: string;
  properties: Property[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {

  // ماسك عناصر السلايدر عشان نحركها
  @ViewChildren('scrollContainer') scrollContainers!: QueryList<ElementRef>;

  cityGroups: CityGroup[] = [];
  isLoading = true;

  constructor(
    private searchService: SearchService,
    private wishlistService: WishlistService,
    private toastService: ToastService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProperties();
    if (this.authService.isAuthenticated) {
      this.wishlistService.loadWishlist();
    }
  }

  private loadProperties(): void {
    this.isLoading = true;
    this.searchService.getFeaturedProperties().subscribe({
      next: (data) => {
        this.groupPropertiesByCity(data);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Connection Error:', err);
        this.isLoading = false;
      }
    });
  }

  private groupPropertiesByCity(allProperties: Property[]) {
    const groups: { [key: string]: Property[] } = {};
    allProperties.forEach(property => {
      const city = property.location.city || 'Other Locations';
      if (!groups[city]) groups[city] = [];
      groups[city].push(property);
    });
    this.cityGroups = Object.keys(groups).map(city => ({
      city: city,
      properties: groups[city]
    }));
  }

  // --- Slider Navigation Logic ---

  scrollLeft(index: number) {
    const container = this.scrollContainers.toArray()[index].nativeElement;
    // التحريك بمقدار عرض الشاشة تقريباً عشان يجيب المجموعة اللي قبلها
    container.scrollBy({ left: -container.offsetWidth, behavior: 'smooth' });
  }

  scrollRight(index: number) {
    const container = this.scrollContainers.toArray()[index].nativeElement;
    // التحريك لليمين
    container.scrollBy({ left: container.offsetWidth, behavior: 'smooth' });
  }

  // --- Wishlist & Navigation ---

  isPropertyInWishlist(propertyId: string): boolean {
    return this.wishlistService.isInWishlist(Number(propertyId));
  }

  onToggleWishlist(property: Property): void {
    if (!this.authService.isAuthenticated) {
      this.toastService.show('Please login to save properties', 'info');
      this.router.navigate(['/login']);
      return;
    }

    const imageUrl = (property.images && property.images.length > 0) ? property.images[0].url : '';
    const isCurrentlyFavorite = this.isPropertyInWishlist(property.id);

    this.wishlistService.toggleWishlist(Number(property.id)).subscribe({
      next: () => {
        if (isCurrentlyFavorite) {
            this.toastService.show('Removed from wishlist', 'success', imageUrl);
        } else {
            this.toastService.show('Saved to wishlist', 'success', imageUrl);
        }
      },
      error: () => {
        this.toastService.show('Failed to update wishlist', 'error');
      }
    });
  }

  onPropertyClick(property: Property): void {
    this.router.navigate(['/listing', property.id]);
  }
}

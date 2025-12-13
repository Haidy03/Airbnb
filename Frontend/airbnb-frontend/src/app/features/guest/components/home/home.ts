import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header';
import { SearchService } from '../search/services/search-service';
import { Property, SearchQuery, SearchResponse } from '../search/models/property.model';
import { WishlistService } from '../../services/wishlist.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Router } from '@angular/router';
import { ListingService } from '../../services/Lisiting-Services'; 

interface CityGroup {
  city: string;
  properties: Property[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeaderComponent], 
  templateUrl: './home.html',
})
export class HomeComponent implements OnInit {

  cityGroups: CityGroup[] = [];
  isLoading = true;
  wishlistIds: Set<string> = new Set();

  constructor(
    private searchService: SearchService,
    private wishlistService: WishlistService,
    private listingService: ListingService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProperties();
  }

  private loadProperties(): void {
    this.isLoading = true;

    const searchQuery: SearchQuery = {
      page: 1,
      pageSize: 50,
      sortBy: 'latest',
      filters: {
        location: undefined,
        checkIn: undefined,
        checkOut: undefined,
        guests: undefined,
        priceMin: undefined,
        priceMax: undefined,
        propertyTypes: [],
        amenities: [],
        bedrooms: undefined,
        beds: undefined,
        bathrooms: undefined,
        instantBook: undefined
      }
    }as any;
  
    this.searchService.searchProperties(searchQuery).subscribe({ 
      next: (response: SearchResponse) => { 
        const properties = response.properties || [];

        this.groupPropertiesByCity(properties);
        
        properties.forEach((p: Property) => {
            this.listingService.checkIsWishlisted(p.id).subscribe(isListed => {
                if(isListed) this.wishlistIds.add(p.id);
            });
        });
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
      const city = property.location?.city || 'Other Locations';
      
      if (!groups[city]) groups[city] = [];
      groups[city].push(property);
    });

    this.cityGroups = Object.keys(groups).map(city => ({
      city: city,
      properties: groups[city]
    }));
  }

  
  isPropertyInWishlist(propertyId: string): boolean {
    return this.wishlistIds.has(propertyId);
  }

  onToggleWishlist(property: Property, event: Event): void {
    event.stopPropagation();
    
    if (this.wishlistIds.has(property.id)) {
      this.wishlistIds.delete(property.id);
    } else {
      this.wishlistIds.add(property.id);
    }

    this.listingService.toggleWishlist(property.id).subscribe({
      next: (res: any) => console.log(res.message),
      error: (err) => {
        console.error(err);
        if (this.wishlistIds.has(property.id)) {
            this.wishlistIds.delete(property.id);
        } else {
            this.wishlistIds.add(property.id);
        }
      }
    });
  }
  
  onPropertyClick(property: Property): void {
    this.router.navigate(['/listing', property.id]);
  }

  scroll(container: HTMLElement, direction: 'left' | 'right') {
  const scrollAmount = container.clientWidth * 0.8;
  
  if (direction === 'left') {
    container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  } else {
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }
}
}
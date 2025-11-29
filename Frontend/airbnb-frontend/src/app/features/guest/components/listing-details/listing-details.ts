import { Component, OnInit } from '@angular/core';
import { ListingService } from '../../services/Lisiting-Services';
import { Listing } from '../../models/listing-model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImageGallery } from "../image-gallery/image-gallery";
import { BookingCard } from '../booking-card/booking-card';
import { CalendarSection } from '../calendar-section/calendar-section';
import { Router, ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { HeaderComponent } from '../header/header';
import { AuthService } from '../../../auth/services/auth.service';
import { environment } from '../../../../../environments/environment.development';

@Component({
  selector: 'app-listing-details',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageGallery, BookingCard, CalendarSection, HeaderComponent],
  templateUrl: './listing-details.html',
  styleUrl: './listing-details.scss',
})
export class ListingDetails implements OnInit {
  listing: Listing | null = null;
  propertyId!: string;
  isLoading: boolean = true;
  error: string | null = null;

  isLiked: boolean = false;
  isTranslated: boolean = true;
  isDescriptionExpanded: boolean = false;
  showAmenitiesModal: boolean = false;
  showFullGallery: boolean = false;
  
  originalDescription: string = '';
  translatedDescription: string = '';
  showTranslated: boolean = false;
  isTranslating: boolean = false;
  showMessageModal: boolean = false;
  isModalOpen: boolean = false;

  selectedCheckIn: string = '';
  selectedCheckOut: string = '';
  selectedGuests: number = 1;

  constructor(
    private listingService: ListingService,
    private route: ActivatedRoute,
    private router: Router,
    public AuthService: AuthService // Made public for HTML access
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.propertyId = id;
        this.fetchListingDetails(this.propertyId);
        if (this.AuthService.isAuthenticated) {
          this.checkWishlistStatus(id);
        }
      } else {
        this.error = "Property ID is missing from the URL.";
        this.isLoading = false;
      }
    });
  }

  fetchListingDetails(id: string): void {
    this.isLoading = true;
    this.listingService.getListingById(id)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (data) => {
          this.originalDescription = data.description;
          this.listing = {
            ...data,
            ratingBreakdown: data.ratingBreakdown ?? undefined,
            reviewsCount: data.reviews?.length || 0,
            rating: data.rating || 0,
          };
        },
        error: (err) => {
          this.error = "Failed to load listing details.";
          console.error(err);
        }
      });
  }

  onDatesUpdated(dates: {checkIn: string, checkOut: string}) {
    this.selectedCheckIn = dates.checkIn;
    this.selectedCheckOut = dates.checkOut;
  }

  onGuestsUpdated(guests: number) {
    this.selectedGuests = guests;
    console.log('Guests count updated:', this.selectedGuests);
  }

  // ✅ الدالة المعدلة للتوجيه لصفحة الدفع
   goToCheckout() {
    if (!this.selectedCheckIn || !this.selectedCheckOut) {
      alert('Please select dates first!');
      return;
    }

    if (!this.AuthService.isAuthenticated) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url }});
      return;
    }

    const bookingType = this.listing?.isInstantBook ? 'instant' : 'request';

    this.router.navigate(['/checkout', this.listing?.id], {
      queryParams: {
        checkIn: this.selectedCheckIn,
        checkOut: this.selectedCheckOut,
        guests: this.selectedGuests, // ✅ هنا التعديل: استخدام المتغير الديناميكي
        type: bookingType
      }
    });
  }


  // ... (باقي الدوال Helper functions, Translation, Wishlist كما هي) ...
  
  checkWishlistStatus(propertyId: string): void {
    this.listingService.checkIsWishlisted(propertyId).subscribe({
      next: (isListed) => this.isLiked = isListed,
      error: () => this.isLiked = false
    });
  }

  toggleLike() {
    if (!this.AuthService.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }
    this.isLiked = !this.isLiked;
    this.listingService.toggleWishlist(this.propertyId).subscribe({
      next: (res) => { if (res) this.isLiked = res.isWishlisted; },
      error: () => this.isLiked = !this.isLiked
    });
  }

  translateDescription() { /* ... نفس الكود القديم ... */ }
  showOriginal() { this.showTranslated = false; }
  toggleDescription() { this.isDescriptionExpanded = !this.isDescriptionExpanded; }
  onModalStateChange(isOpen: boolean) { this.isModalOpen = isOpen; }
  getImageUrl(url?: string) { /* ... نفس الكود القديم ... */ return url || ''; }
  showAllAmenities() { this.showAmenitiesModal = true; }
  closeAmenitiesModal() { this.showAmenitiesModal = false; }
  shareListing() { navigator.clipboard.writeText(window.location.href); alert('Copied!'); }
  
  contactHost() {
    if (!this.AuthService.isAuthenticated) { this.router.navigate(['/login']); return; }
    if (this.listing) {
      const hostId = (this.listing as any).hostId || (this.listing as any).host?.id;
      this.router.navigate(['/messages'], { queryParams: { hostId, contextId: this.listing.id, type: 'property' } });
    }
  }
  openMessageModal() { this.contactHost(); }
}
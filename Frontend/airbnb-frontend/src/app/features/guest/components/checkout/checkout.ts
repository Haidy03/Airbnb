import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { ListingService } from '../../services/Lisiting-Services';
import { GuestBookingService, CreateBookingDto } from '../../services/booking.service';
import { Listing } from '../../models/listing-model';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxPayPalModule, IPayPalConfig, ICreateOrderRequest } from 'ngx-paypal';
import { environment } from '../../../../../environments/environment'; 
import { StripeService } from '../../../../core/services/stripe.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxPayPalModule, FormsModule],
  templateUrl: './checkout.html', 
  styleUrls: ['./checkout.scss'],
})
export class Checkout implements OnInit {
  listing: Listing | null = null;
  checkIn: string = '';
  checkOut: string = '';
  guests: number = 1;
  nights: number = 0;
  totalPrice: number = 0;
  serviceFee: number = 150;
  guestMessage: string = ''; 
 
  bookingType: 'instant' | 'request' = 'request'; 
  isLoading: boolean = false;
  paymentMethod: 'stripe' | 'paypal' = 'stripe'; 

  paymentForm: FormGroup;
  public payPalConfig?: IPayPalConfig;
  public showSuccess: boolean = false;

  // Modal Variables
  isEditDateOpen: boolean = false;
  isEditGuestOpen: boolean = false;
  tempCheckIn: string = '';
  tempCheckOut: string = '';
  tempGuests: number = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private listingService: ListingService,
    private guestBookingService: GuestBookingService,
    private stripeService: StripeService,
    private location: Location,
    private fb: FormBuilder
  ) {
    this.paymentForm = this.fb.group({
      street: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zip: ['', Validators.required],
      country: ['Egypt', Validators.required]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    this.route.queryParams.subscribe(params => {
      this.checkIn = params['checkIn'];
      this.checkOut = params['checkOut'];
      this.guests = +params['guests'] || 1;
      this.bookingType = params['type'] || 'request';

      this.tempCheckIn = this.checkIn;
      this.tempCheckOut = this.checkOut;
      this.tempGuests = this.guests;
    });

    if (id) {
      this.listingService.getListingById(id).subscribe(data => {
        this.listing = data;
        this.calculateSummary();
      });
    }
  }

  calculateSummary() {
    if (this.checkIn && this.checkOut && this.listing) {
      const start = new Date(this.checkIn);
      const end = new Date(this.checkOut);
      const diff = end.getTime() - start.getTime();
      this.nights = Math.ceil(diff / (1000 * 3600 * 24));
      
      const baseTotal = (this.listing.pricePerNight || 0) * this.nights;
      const cleaning = this.listing.cleaningFee || 0;
      const service = this.serviceFee || 0;
      this.totalPrice = baseTotal + cleaning + service; 

      // تهيئة PayPal فقط إذا كان الحجز فوري
      if (this.bookingType === 'instant') {
        this.initConfig();
      }
    }
  }

  payWithStripe() {
    if (!this.listing) {
      alert('Listing data not loaded');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to complete your booking.');
      this.router.navigate(['/login'], { 
        queryParams: { 
          returnUrl: `/checkout/${this.listing.id}`,
          checkIn: this.checkIn,
          checkOut: this.checkOut,
          guests: this.guests,
          type: this.bookingType
        } 
      });
      return;
    }

    this.isLoading = true;

    // إرسال المبلغ بالجنيه المصري (الباك إند يعالجه كـ EGP)
    const amountEGP = this.totalPrice;

    this.stripeService.createCheckoutSession(amountEGP , this.listing.title).subscribe({
      next: (response) => {
        console.log('✅ Stripe Checkout URL:', response.url);
        
        sessionStorage.setItem('pendingBooking', JSON.stringify({
          propertyId: this.listing!.id,
          checkIn: this.checkIn,
          checkOut: this.checkOut,
          guests: this.guests
        }));

        window.location.href = response.url;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('❌ Stripe Error:', err);
        alert('Failed to create payment session: ' + (err.error?.error || err.message));
      }
    });
  }

  finalizeBooking() {
    if (!this.listing) return;
    
    this.isLoading = true;

    const bookingPayload: CreateBookingDto = {
      propertyId: Number(this.listing.id),
      checkInDate: new Date(this.checkIn).toISOString(),
      checkOutDate: new Date(this.checkOut).toISOString(),
      numberOfGuests: this.guests,
      specialRequests: this.guestMessage 
    };

    this.guestBookingService.createBooking(bookingPayload).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (this.bookingType === 'instant') {
          alert('🎉 Payment Successful! Your reservation is confirmed.');
        } else {
          alert('📩 Request Sent! Waiting for host approval.');
        }
        this.router.navigate(['/trips']);
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
        alert('Booking failed: ' + (err.error?.message || err.message));
      }
    });
  }

  // ✅ تصحيح إعدادات PayPal
  private initConfig(): void {
    // تحويل السعر للدولار (للـ Sandbox)
    const amountUSD = (this.totalPrice / 50).toFixed(2); 

    this.payPalConfig = {
      currency: 'USD', // ✅ يجب أن تكون USD لتتطابق مع purchase_units
      clientId: 'sb', // ⚠️ استبدلي sb بالـ Client ID الحقيقي من PayPal Developer Dashboard
      
      createOrderOnClient: (data) => <ICreateOrderRequest>{
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD', // ✅ موحدة
            value: amountUSD,
            breakdown: {
              item_total: { currency_code: 'USD', value: amountUSD }
            }
          }
        }]
      },
      advanced: { commit: 'true' },
      style: { label: 'paypal', layout: 'vertical' },
      onApprove: (data, actions) => {
        console.log('onApprove', data, actions);
      },
      onClientAuthorization: (data) => {
        console.log('Payment Success', data);
        this.showSuccess = true;
     
        this.finalizeBooking();
      },
      onCancel: (data, actions) => console.log('OnCancel', data, actions),
      onError: err => console.log('OnError', err),
    };
  }

  getPrimaryImage(): string {
    if (!this.listing || !this.listing.images || this.listing.images.length === 0) {
      return 'assets/images/placeholder.jpg';
    }

    let rawUrl = '';
    
    if (typeof this.listing.images[0] === 'string') {
       rawUrl = this.listing.images[0];
    } else {
       const imagesList = this.listing.images as any[];
       const primary = imagesList.find(img => img.isPrimary);
       const target = primary || imagesList[0];
       rawUrl = target.url || target.imageUrl || '';
    }

    if (!rawUrl) return 'assets/images/placeholder.jpg';
    
    if (rawUrl.startsWith('http') || rawUrl.includes('assets/')) {
      return rawUrl;
    }
    const baseUrl = environment.apiUrl.replace('/api', '').replace(/\/$/, '');
    
    const cleanPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;

    return `${baseUrl}${cleanPath}`;
  }

  // --- Modal Helpers ---
  openDateModal() { this.isEditDateOpen = true; this.tempCheckIn = this.checkIn; this.tempCheckOut = this.checkOut; }
  closeDateModal() { this.isEditDateOpen = false; }
  saveDates() { this.checkIn = this.tempCheckIn; this.checkOut = this.tempCheckOut; this.calculateSummary(); this.isEditDateOpen = false; }
  openGuestModal() { this.isEditGuestOpen = true; this.tempGuests = this.guests; }
  closeGuestModal() { this.isEditGuestOpen = false; }
  saveGuests() { this.guests = this.tempGuests; this.isEditGuestOpen = false; }
  goBack() { this.location.back(); }
}
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { ListingService } from '../../services/Lisiting-Services';
import { BookingService, CreateBookingDto } from '../../services/booking.service'; // ✅ تأكدي من المسار الصحيح
import { Listing } from '../../models/listing-model';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxPayPalModule, IPayPalConfig, ICreateOrderRequest } from 'ngx-paypal';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxPayPalModule, FormsModule],
  templateUrl: './checkout.html', // تأكدي من تعديل الـ HTML كما سأوضح بالأسفل
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
  
  // ✅ متغير لتحديد نوع الحجز
  bookingType: 'instant' | 'request' = 'request'; 
  isLoading: boolean = false;

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
    private bookingService: BookingService, // ✅ حقن BookingService
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
      this.bookingType = params['type'] || 'request'; // ✅ استقبال النوع

      this.tempCheckIn = this.checkIn;
      this.tempCheckOut = this.checkOut;
      this.tempGuests = this.guests;

      // حساب السعر (سيتم إعادة الحساب عند تحميل العقار)
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
      
      // معادلة السعر
      const baseTotal = this.listing.pricePerNight * this.nights;
      this.totalPrice = baseTotal + this.serviceFee + this.listing.cleaningFee; // إضافة رسوم التنظيف إذا وجدت

      // تهيئة PayPal فقط إذا كان الحجز فوري
      if (this.bookingType === 'instant') {
        this.initConfig();
      }
    }
  }

  // ✅ الدالة الأساسية لإنشاء الحجز (تستدعى من PayPal أو زر الطلب)
  finalizeBooking() {
    if (!this.listing) return;
    
    this.isLoading = true;

    const bookingPayload: CreateBookingDto = {
      propertyId: Number(this.listing.id),
      checkInDate: new Date(this.checkIn).toISOString(),
      checkOutDate: new Date(this.checkOut).toISOString(),
      numberOfGuests: this.guests,
      specialRequests: '' // يمكن ربطه بحقل input
    };

    this.bookingService.createBooking(bookingPayload).subscribe({
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

  // إعدادات PayPal
  private initConfig(): void {
    // PayPal expects string for value
    // converting EGP to USD roughly for sandbox (or keep same value if account supports it)
    const amountUSD = (this.totalPrice / 50).toFixed(2); // مثال: التحويل للدولار تقريباً

    this.payPalConfig = {
      currency: 'USD',
      clientId: 'sb', // استبدلي بـ Client ID الخاص بك
      createOrderOnClient: (data) => <ICreateOrderRequest>{
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
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
        // ✅ الدفع نجح -> ننشئ الحجز في الباك إند
        this.finalizeBooking();
      },
      onCancel: (data, actions) => console.log('OnCancel', data, actions),
      onError: err => console.log('OnError', err),
    };
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
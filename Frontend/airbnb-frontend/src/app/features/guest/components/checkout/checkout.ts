import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { ListingService } from '../../services/Lisiting-Services';
import { Listing } from '../../models/listing-model';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';


// 1. استيراد مكتبة باي بال
import { NgxPayPalModule, IPayPalConfig, ICreateOrderRequest } from 'ngx-paypal';


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

  paymentForm: FormGroup;

  // إعدادات باي بال
  public payPalConfig?: IPayPalConfig;
  public showSuccess: boolean = false;

  // ==========================================
  // متغيرات المودال (اللي كانت ناقصة)
  // ==========================================
  isEditDateOpen: boolean = false;
  isEditGuestOpen: boolean = false;

  tempCheckIn: string = '';
  tempCheckOut: string = '';
  tempGuests: number = 1;

  constructor(
    private route: ActivatedRoute,
    private listingService: ListingService,
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

      // حفظ نسخ مؤقتة للتعديل
      this.tempCheckIn = this.checkIn;
      this.tempCheckOut = this.checkOut;
      this.tempGuests = this.guests;

      this.calculateSummary();
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
      this.totalPrice = (this.listing.pricePerNight * this.nights) + this.serviceFee;

      this.initConfig();
    }
  }

  // ==========================================
  // دوال المودال (الحل للمشكلة الحالية)
  // ==========================================

  // 1. دوال التاريخ
  openDateModal() {
    this.isEditDateOpen = true;
    this.tempCheckIn = this.checkIn;
    this.tempCheckOut = this.checkOut;
  }

  closeDateModal() {
    this.isEditDateOpen = false;
  }

  saveDates() {
    this.checkIn = this.tempCheckIn;
    this.checkOut = this.tempCheckOut;
    this.calculateSummary(); // إعادة حساب السعر
    this.isEditDateOpen = false;
  }

  // 2. دوال الضيوف (اللي كانت مسببة الخطأ)
  openGuestModal() {
    this.isEditGuestOpen = true;
    this.tempGuests = this.guests;
  }

  closeGuestModal() {
    this.isEditGuestOpen = false;
  }

  saveGuests() {
    this.guests = this.tempGuests;
    this.isEditGuestOpen = false;
  }

  goBack() {
    this.location.back();
  }

  // ==========================================
  // إعدادات PayPal
  // ==========================================
  private initConfig(): void {
    const amountStr = this.totalPrice.toString();

    this.payPalConfig = {
      currency: 'USD',
      clientId: 'sb',
      createOrderOnClient: (data) => <ICreateOrderRequest>{
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: amountStr,
              breakdown: {
                item_total: {
                  currency_code: 'USD',
                  value: amountStr
                }
              }
            },
            items: [
              {
                name: this.listing?.title || 'Reservation',
                quantity: '1',
                category: 'DIGITAL_GOODS',
                unit_amount: {
                  currency_code: 'USD',
                  value: amountStr,
                },
              }
            ]
          }
        ]
      },
      advanced: { commit: 'true' },
      style: { label: 'paypal', layout: 'vertical' },
      onApprove: (data, actions) => {
        console.log('onApprove', data, actions);
      },
      onClientAuthorization: (data) => {
        this.showSuccess = true;
        alert('Payment Successful! 🎉');
      },
      onCancel: (data, actions) => {
        console.log('OnCancel', data, actions);
      },
      onError: err => {
        console.log('OnError', err);
      },
    };
  }
}

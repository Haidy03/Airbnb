import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { ListingService } from '../../services/Lisiting-Services';
import { Listing } from '../../models/listing-model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout implements OnInit {
  listing: Listing | null = null;
  checkIn: string = '';
  checkOut: string = '';
  guests: number = 1;

  // الحسابات
  nights: number = 0;
  totalPrice: number = 0;
  serviceFee: number = 150; // ثابت مؤقتاً

  constructor(
    private route: ActivatedRoute,
    private listingService: ListingService,
     private location: Location
  ) {}

  ngOnInit(): void {
    // 1. جلب الـ ID من الرابط
    const id = this.route.snapshot.paramMap.get('id');

    // 2. جلب التواريخ والضيوف من الـ Query Params
    this.route.queryParams.subscribe(params => {
      this.checkIn = params['checkIn'];
      this.checkOut = params['checkOut'];
      this.guests = params['guests'] || 1;

      this.calculateSummary();
    });

    // 3. جلب بيانات الغرفة
    if (id) {
      this.listingService.getListingById(id).subscribe(data => {
        this.listing = data;
        this.calculateSummary(); // إعادة الحساب بعد وصول السعر
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
    }
  }
  goBack() {
    this.location.back();
  }
}



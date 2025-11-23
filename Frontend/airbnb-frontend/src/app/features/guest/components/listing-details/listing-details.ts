import { Component, OnInit } from '@angular/core';
import { ListingService } from '../../services/Lisiting-Services';
import { Listing } from '../../models/listing-model';
import { CommonModule } from '@angular/common'; // مهم لـ *ngIf
import { FormsModule } from '@angular/forms';
import { ImageGallery } from "../image-gallery/image-gallery";
import { BookingCard } from '../booking-card/booking-card';
import { CalendarSection } from '../calendar-section/calendar-section';
import { Router } from '@angular/router';


@Component({
  selector: 'app-listing-details',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageGallery, BookingCard,CalendarSection],
  templateUrl: './listing-details.html',
  styleUrl: './listing-details.scss',
})


export class ListingDetails implements OnInit {
  listing: Listing | null = null;

  // متغيرات التحكم في الشكل (UI Flags)
  isLiked: boolean = false;           // هل القلب أحمر؟
  isTranslated: boolean = true;       // هل النص مترجم؟
  isDescriptionExpanded: boolean = false; // هل الوصف مفتوح بالكامل؟
 // متغيرات التواريخ اللي هتتبعت للاتنين
  selectedCheckIn: string = '';
  selectedCheckOut: string = '';
    constructor(
    private listingService: ListingService,
    private router :Router // استيراد الـ Router
  ) {}
  // دالة بتستقبل التغيير من كارت الحجز (هنحتاج نعدل كارت الحجز عشان يبعتها)
  onDatesUpdated(dates: {checkIn: string, checkOut: string}) {
    this.selectedCheckIn = dates.checkIn;
    this.selectedCheckOut = dates.checkOut;
      console.log('Dates Updated:', this.selectedCheckIn, this.selectedCheckOut); // للتأكد
  }
  goToCheckout() {
    if (!this.selectedCheckIn || !this.selectedCheckOut) {
      alert('Please select dates first!');
      return;
    }
    this.router.navigate(['/checkout', this.listing?.id], {
      queryParams: {
        checkIn: this.selectedCheckIn,
        checkOut: this.selectedCheckOut,
        guests: 2 // أو المتغير الحقيقي لعدد الضيوف
      }
    });

  }
  // 1. هذه هي قائمة المزايا التي كانت ناقصة
  amenities = [
    { icon: 'fa-solid fa-wifi', name: 'Fast Wifi' },
    { icon: 'fa-solid fa-tv', name: '55" HDTV with Netflix' },
    { icon: 'fa-solid fa-snowflake', name: 'Central air conditioning' },
    { icon: 'fa-solid fa-kitchen-set', name: 'Fully equipped kitchen' },
    { icon: 'fa-solid fa-elevator', name: 'Elevator' },
    { icon: 'fa-solid fa-washer', name: 'Washing machine' },
    { icon: 'fa-solid fa-video', name: 'Security cameras' }
  ];



  ngOnInit(): void {
    // جلب البيانات (استخدمنا ID 1 للتجربة)
    this.listingService.getListingById('1').subscribe(data => {
      this.listing = data;
    });
  }

  // 2. دوال الأزرار التي كانت فارغة

  // زر المشاركة: ينسخ رابط الصفحة
  shareListing() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('Link copied to clipboard! 🔗');
    });
  }

  // زر الحفظ (القلب): يغير اللون
  toggleLike() {
    this.isLiked = !this.isLiked;
  }

  // زر الترجمة: يبدل الحالة فقط (للعرض)
  toggleTranslation() {
    this.isTranslated = !this.isTranslated;
  }

  // زر إظهار المزيد في الوصف
  toggleDescription() {
    this.isDescriptionExpanded = !this.isDescriptionExpanded;
  }

  // زر عرض كل المزايا (مبدئياً يطبع في الكونسول)
  showAllAmenities() {
    console.log('Open Amenities Modal Triggered');
  }

}

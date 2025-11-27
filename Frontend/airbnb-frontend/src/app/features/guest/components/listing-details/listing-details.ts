import { Component, OnInit } from '@angular/core';
import { ListingService } from '../../services/Lisiting-Services';
import { Listing } from '../../models/listing-model';
import { CommonModule } from '@angular/common'; // مهم لـ *ngIf
import { FormsModule } from '@angular/forms';
import { ImageGallery } from "../image-gallery/image-gallery";
import { BookingCard } from '../booking-card/booking-card';
import { CalendarSection } from '../calendar-section/calendar-section';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { HeaderComponent } from '../header/header';



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
 
  // متغيرات التحكم في الشكل (UI Flags)
  isLiked: boolean = false;           // هل القلب أحمر؟
  isTranslated: boolean = true;       // هل النص مترجم؟
  isDescriptionExpanded: boolean = false; // هل الوصف مفتوح بالكامل؟
  showAmenitiesModal: boolean = false; 
  showFullGallery: boolean = false;
 // متغيرات التواريخ اللي هتتبعت للاتنين
  selectedCheckIn: string = '';
  selectedCheckOut: string = '';
    constructor(
    private listingService: ListingService,
    private route: ActivatedRoute,
    private router :Router 
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
    
    
  // isInstantBook
    
    
    if (!this.listing?.isInstantBook) {
    
      this.router.navigate(['/checkout', this.listing?.id], {
        queryParams: {
          checkIn: this.selectedCheckIn,
          checkOut: this.selectedCheckOut,
          guests: 2  
        }
      });
    } else {
       this.router.navigate(['/request-book', this.listing?.id], {
        queryParams: {
          checkIn: this.selectedCheckIn,
          checkOut: this.selectedCheckOut,
          guests: 2
        }
      });
      // alert('This listing requires a "Request to Book" approval from the host.');
    }
    // ******************************************************
  }

   showAllAmenities(): void {
    this.showAmenitiesModal = true;
    // يمكن إضافة منطق لمنع التمرير (Scroll lock) هنا إذا لزم الأمر
  }

  /**
   * دالة لإغلاق الـ Modal عند الضغط على زر الغلق
   */
  closeAmenitiesModal(): void {
    this.showAmenitiesModal = false;
  }


  


  


  ngOnInit(): void {
      // 1. الاشتراك في paramMap لجلب الـ ID من المسار
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.propertyId = id;
        this.fetchListingDetails(this.propertyId);
      } else {
        this.error = "Property ID is missing from the URL.";
        this.isLoading = false;
      }
    });
  }
    fetchListingDetails(id: string): void {
    this.isLoading = true;
    this.error = null;

    this.listingService.getListingById(id)
      .pipe(
        // استخدام finalize لإيقاف مؤشر التحميل بغض النظر عن النجاح/الفشل
        finalize(() => this.isLoading = false)
      )
       .subscribe({
    next: (data) => {
      // **الإصلاح الرئيسي هنا:**
      // إذا كان ratingBreakdown مفقوداً، قم بتعيينه كـ undefined بدلاً من null.
      // وإلا، سيفشل كود الـ HTML.
      this.listing = {
        ...data,
        ratingBreakdown: data.ratingBreakdown ?? undefined, // تعيين قيمة افتراضية
        reviewsCount: data.reviews?.length || 0, // حساب عدد المراجعات من المصفوفة
        rating: data.rating || 0 // تعيين تقييم افتراضي
      };
    },
        error: (err) => {
          this.error = "Failed to load listing details. Please try again later.";
          console.error('API Error:', err);
        }
      });
    }

  // 2. دوال الأزرار show all photos 
   isModalOpen: boolean = false;
       onModalStateChange(isOpen: boolean): void {
        this.isModalOpen = isOpen; // تحديث الحالة عند فتح/إغلاق الـ Modal
    }


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
 

}

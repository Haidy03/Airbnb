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
import { AuthService } from '../../../auth/services/auth.service';



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
  // translation variables
  // 1. خصائص إدارة الترجمة
  originalDescription: string = '';
  translatedDescription: string = '';
  showTranslated: boolean = false;
  isTranslating: boolean = false;
  // message host
  showMessageModal: boolean = false;

 // متغيرات التواريخ اللي هتتبعت للاتنين
  selectedCheckIn: string = '';
  selectedCheckOut: string = '';
    constructor(
    private listingService: ListingService,
    private route: ActivatedRoute,
    private router :Router
    ,private AuthService:AuthService
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
    this.error = null;

    this.listingService.getListingById(id)
      .pipe(
        // استخدام finalize لإيقاف مؤشر التحميل بغض النظر عن النجاح/الفشل
        finalize(() => this.isLoading = false)
      )
       .subscribe({
    next: (data) => {
        this.originalDescription = data.description;
      this.listing = {
        ...data,
        ratingBreakdown: data.ratingBreakdown ?? undefined, // تعيين قيمة افتراضية
        reviewsCount: data.reviews?.length || 0, // حساب عدد المراجعات من المصفوفة
        rating: data.rating || 0 ,// تعيين تقييم افتراضي

      };
    },
        error: (err) => {
          this.error = "Failed to load listing details. Please try again later.";
          console.error('API Error:', err);
        }
      });
    }
    checkWishlistStatus(propertyId: string): void {
    this.listingService.checkIsWishlisted(propertyId).subscribe({
      next: (isListed: boolean) => {
        this.isLiked = isListed;
      },
      error: () => this.isLiked = false
    });
  }

    // translation function
    translateDescription(): void {
    if (this.isTranslating || this.showTranslated) {
        return; // تجنب الترجمة المتكررة
    }

    // إذا كان لدينا بالفعل النص المترجم، اعرضه مباشرة
    if (this.translatedDescription) {
        this.showTranslated = true;
        return;
    }

    if (!this.originalDescription) {
        return; // لا يوجد وصف للترجمة
    }

    this.isTranslating = true;

    this.listingService.translateText(this.originalDescription)
      .pipe(finalize(() => this.isTranslating = false))
      .subscribe({
        next: (response) => {
          this.translatedDescription = response.translatedText;
          this.showTranslated = true; // عرض النص المترجم
        },
        error: (err) => {
          console.error('Translation failed:', err);
          // يمكن هنا عرض رسالة خطأ للمستخدم
        }
      });
  }

  /**
   * 3. الرجوع إلى النص الأصلي (Show less)
   */
  showOriginal(): void {
    this.showTranslated = false;
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
    if (!this.AuthService.isAuthenticated) { // تأكد أن الاسم يطابق المحقون في الكونستركتور
      this.router.navigate(['/login']);
      return;
    }

    // التغيير الفوري (Optimistic UI)
    this.isLiked = !this.isLiked;

    // إرسال الطلب للسيرفر
    this.listingService.toggleWishlist(this.propertyId).subscribe({
      next: (res: any) => {
        // التأكد من الحالة الحقيقية من السيرفر
        if (res && typeof res.isWishlisted !== 'undefined') {
          this.isLiked = res.isWishlisted;
        }
      },
      error: (err) => {
        // في حالة الخطأ، نعيد القلب لحالته السابقة
        this.isLiked = !this.isLiked;
        console.error('Wishlist toggle error:', err);
      }
    });
  }

  // زر الترجمة: يبدل الحالة فقط (للعرض)
  toggleTranslation() {
    this.isTranslated = !this.isTranslated;
  }

  // زر إظهار المزيد في الوصف
  toggleDescription() {
    this.isDescriptionExpanded = !this.isDescriptionExpanded;
  }

// send message to host function
/* openMessageModal(): void {
  // هنا يجب التأكد من أن المستخدم قام بتسجيل الدخول قبل الفتح
 if (!this.AuthService.isAuthenticated) {
      this.router.navigate(['/login']); // أو فتح Modal تسجيل الدخول
      return;
 }

  this.showMessageModal = true;
  // use a proper array of route segments (no stray $)
  this.router.navigate([`/send-message/${this.listing?.id}`  ]);
}

  closeMessageModal(): void {
    this.showMessageModal = false;
  } */

  contactHost(): void {
    if (!this.AuthService.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.listing) {
      const hostId = (this.listing as any).hostId || (this.listing as any).host?.id;
      this.router.navigate(['/messages'], {
        queryParams: { 
            hostId: hostId,  // تأكدي أن المودل يحتوي على hostId
            contextId: this.listing.id,   // معرف العقار
            type: 'property'              // نوع السياق
        }
      });
    }
  }

  // تم استبدال openMessageModal بـ contactHost لتوحيد النظام
  // ولكن تركتها هنا لعدم كسر الكود إذا كانت مربوطة بالـ HTML، لكن يفضل استخدام contactHost
  openMessageModal(): void {
    this.contactHost();
  }

  closeMessageModal(): void {
    this.showMessageModal = false;
  }
}



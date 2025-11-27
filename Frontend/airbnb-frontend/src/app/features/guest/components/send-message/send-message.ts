import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute  } from '@angular/router';
import { MessageService, SendMessagePayload } from '../../services/message.service'; // تأكد من المسار
import { AuthService } from '../../../../core/services/auth.service'; // للوصول لـ ID المستخدم
import { ListingService } from '../../services/Lisiting-Services'; // لجلب بيانات العقار
import { BookingCard } from '../booking-card/booking-card'; // <--- استيراد الـ Booking Card
import { Listing, HostDetails } from '../../models/listing-model'; // الـ Models
import { finalize } from 'rxjs/operators';
import{ListingDetails} from '../listing-details/listing-details';

@Component({
  selector: 'app-send-message',
 standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BookingCard],
  templateUrl: './send-message.html',
  styleUrl: './send-message.scss',
})
export class SendMessage implements OnInit {
  // Inputs من صفحة ListingDetailsComponent
   propertyId!: string;
    error: string | null = null;


  // Output لإغلاق الـ Modal
  @Output() closeModal = new EventEmitter<void>();

  // حالة المكون
  messageForm!: FormGroup;
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  selectedCheckIn: string = '';
  selectedCheckOut: string = '';

  // بيانات لعرضها في الـ Booking Card (يجب جلبها من API)
   listing: Listing | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService,
    private authService: AuthService,
    private listingService: ListingService // لجلب تفاصيل العقار
  ) { }

  ngOnInit(): void {
    this.initializeForm();
     this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.propertyId =id;
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

  initializeForm(): void {
    this.messageForm = this.fb.group({
      initialMessage: ['', [Validators.required, Validators.maxLength(500)]],
    });
  }



  /**
   * إرسال الرسالة إلى الباك إند
   */
   sendMessage(): void {
    if (this.messageForm.invalid) {
      this.errorMessage = 'Please write a message before sending.';
      this.messageForm.markAllAsTouched();
      return;
    }

   // افترضي أن authService.getUserId() ترجع الـ ID (كـ string)
    // إذا كنتِ تستخدمين Token، يجب قراءة الـ ID منه.
    const guestId = this.authService.getUserId();

    if (!guestId) {
        this.errorMessage = 'Authentication error. Please log in again.';
        this.router.navigate(['/login']);
        return;
    }

    this.isLoading = true;
    this.errorMessage = '';

      // 2. بناء الـ Payload المطلوب (مطابق للـ JSON المطلوب)
    // *******************************************************
    const payload: SendMessagePayload = {
      propertyId: this.propertyId, // من الـ @Input
      guestId: guestId,
      initialMessage: this.messageForm.get('initialMessage')?.value, // من النموذج
    };

   // 3. استدعاء الـ MessageService
    // *******************************************************
    this.messageService.createConversation(payload)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
           this.messageForm.reset({
             initialMessage: '' // إفراغ حقل النص المحدد
          });
          this.successMessage = 'Message sent successfully! Redirecting to chat...';

          // 4. بعد النجاح: التنقل إلى صفحة المحادثات (افترض أن API يعيد ID المحادثة)
          this.router.navigate(['/messages', response.conversationId]);
        },
        error: (err) => {
          this.errorMessage = 'Failed to send message. Please try again.';
          console.error('Send Message Error:', err);
        }
      });
  }

  // booking card handlers
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
}

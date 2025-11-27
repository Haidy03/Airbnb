import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService, SendMessagePayload } from '../../services/message.service'; // تأكد من المسار
import { AuthService } from '../../../../core/services/auth.service'; // للوصول لـ ID المستخدم
import { ListingService } from '../../services/Lisiting-Services'; // لجلب بيانات العقار
import { BookingCard } from '../booking-card/booking-card'; // <--- استيراد الـ Booking Card
import { Listing, HostDetails } from '../../models/listing-model'; // الـ Models
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-send-message',
 standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BookingCard],
  templateUrl: './send-message.html',
  styleUrl: './send-message.scss',
})
export class SendMessage implements OnInit {
  // Inputs من صفحة ListingDetailsComponent
  @Input() propertyId!: number;
  @Input() hostDetails!: HostDetails;

  // Output لإغلاق الـ Modal
  @Output() closeModal = new EventEmitter<void>();

  // حالة المكون
  messageForm!: FormGroup;
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // بيانات لعرضها في الـ Booking Card (يجب جلبها من API)
   listing: Listing | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private messageService: MessageService,
    private authService: AuthService,
    private listingService: ListingService // لجلب تفاصيل العقار
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.fetchPropertyForCard(); // جلب البيانات لكارد الحجز
  }

  initializeForm(): void {
    this.messageForm = this.fb.group({
      initialMessage: ['', [Validators.required, Validators.maxLength(500)]],
    });
  }

  fetchPropertyForCard(): void {
      this.listingService.getListingById(String(this.propertyId)).subscribe({
        next: (data) => {
            // حفظ البيانات اللازمة للعرض في كارد الحجز
            this.listing = data;
        },
        error: (err) => {
            console.error('Failed to load property data for card:', err);
        }
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

    const guestId = this.authService.getUserId(); // افترض وجود دالة للحصول على ID المستخدم

    if (!guestId) {
        this.router.navigate(['/login']); // أو فتح Modal تسجيل الدخول
        return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const payload: SendMessagePayload = {
      propertyId: this.propertyId,
      guestId: guestId,
      initialMessage: this.messageForm.get('initialMessage')?.value,
    };

    this.messageService.createConversation(payload)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.successMessage = 'Message sent successfully! You will be redirected to the chat.';
          // التنقل إلى صفحة المحادثات الجديدة (افترض وجود صفحة محادثات /messages)
          this.router.navigate(['/messages', response.conversationId]);
        },
        error: (err) => {
          this.errorMessage = 'Failed to send message. Please try again.';
          console.error('Send Message Error:', err);
        }
      });
  }

  // دوال العرض الثابتة
  getHostNames(): string {
    if (!this.hostDetails) return 'The hosts';
    return `${this.hostDetails.firstName} and Heba`; // افتراض وجود مضيف ثاني
  }
}

import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  CreateBookingDto,
  BookingGuest,
  PriceBreakdown,
  PaymentMethod
} from '../../models/booking_model';

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking-form.html',
  styleUrls: ['./booking-form.css'],
})
export class BookingForm implements OnInit {

   // معلومات العقار من الـ parent component
  @Input() propertyId!: string;
  @Input() pricePerNight: number = 300;
  @Input() cleaningFee: number = 20;
  @Input() serviceFeePercent: number = 14; // 14%
  @Input() taxPercent: number = 5; // 5%
  @Input() currency: string = 'USD';
  @Input() minNights: number = 1;
  @Input() maxGuests: number = 6;

  bookingForm!: FormGroup;

  // حالة الفورم
  isLoading: boolean = false;
  showGuestPicker: boolean = false;

  // تفاصيل السعر
  priceBreakdown: PriceBreakdown | null = null;

  // التواريخ المحظورة (mock data - هتيجي من الـ API)
  bookedDates: Date[] = [];
  // التاريخ الحالي (لمنع اختيار تواريخ ماضية)
  today: string = new Date().toISOString().split('T')[0];

  // الأخطاء
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setupValueChanges();
  }

  /**
   * تهيئة الفورم
   */
  initializeForm(): void {
    this.bookingForm = this.fb.group({
      checkIn: ['', [Validators.required]],
      checkOut: ['', [Validators.required]],
      adults: [1, [Validators.required, Validators.min(1)]],
      children: [0, [Validators.min(0)]],
      infants: [0, [Validators.min(0)]],
      pets: [0, [Validators.min(0)]],
      messageToHost: [''],
      specialRequests: ['']
    });
  }

  /**
   * مراقبة التغييرات في الفورم
   */
  setupValueChanges(): void {
    // حساب السعر عند تغيير التواريخ أو عدد الضيوف
    this.bookingForm.valueChanges.subscribe(() => {
      this.calculatePrice();
      this.errorMessage = '';
    });
  }

  /**
   * حساب السعر
   */
  calculatePrice(): void {
    const checkIn = this.bookingForm.get('checkIn')?.value;
    const checkOut = this.bookingForm.get('checkOut')?.value;

    if (!checkIn || !checkOut) {
      this.priceBreakdown = null;
      return;
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // حساب عدد الليالي
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    const numberOfNights = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (numberOfNights < this.minNights) {
      this.priceBreakdown = null;
      return;
    }

    // حساب السعر الأساسي
    const basePrice = this.pricePerNight * numberOfNights;

    // رسوم الخدمة (نسبة من السعر الأساسي)
    const serviceFee = basePrice * (this.serviceFeePercent / 100);

    // الضريبة (نسبة من السعر الأساسي + رسوم الخدمة)
    const tax = (basePrice + serviceFee) * (this.taxPercent / 100);

    // السعر الإجمالي
    const totalPrice = basePrice + this.cleaningFee + serviceFee + tax;

    this.priceBreakdown = {
      pricePerNight: this.pricePerNight,
      numberOfNights,
      basePrice,
      cleaningFee: this.cleaningFee,
      serviceFee,
      tax,
      totalPrice,
      currency: this.currency
    };
  }

  /**
   * زيادة عدد الضيوف
   */
  incrementGuest(type: 'adults' | 'children' | 'infants' | 'pets'): void {
    const currentValue = this.bookingForm.get(type)?.value || 0;
    const totalGuests = this.getTotalGuests();

    // التحقق من الحد الأقصى للضيوف (ما عدا الرضع)
    if (type !== 'infants' && type !== 'pets') {
      if (totalGuests >= this.maxGuests) {
        return;
      }
    }

    this.bookingForm.patchValue({ [type]: currentValue + 1 });
  }
   /**
   * تقليل عدد الضيوف
   */
  decrementGuest(type: 'adults' | 'children' | 'infants' | 'pets'): void {
    const currentValue = this.bookingForm.get(type)?.value || 0;

    // لا يمكن تقليل البالغين عن 1
    if (type === 'adults' && currentValue <= 1) {
      return;
    }

    // لا يمكن تقليل الباقي عن 0
    if (currentValue <= 0) {
      return;
    }

    this.bookingForm.patchValue({ [type]: currentValue - 1 });
  }

  /**
   * الحصول على إجمالي عدد الضيوف (البالغين والأطفال فقط)
   */
  getTotalGuests(): number {
    const adults = this.bookingForm.get('adults')?.value || 0;
    const children = this.bookingForm.get('children')?.value || 0;
    return adults + children;
  }

  /**
   * نص عدد الضيوف
   */
  getGuestsText(): string {
    const total = this.getTotalGuests();
    const infants = this.bookingForm.get('infants')?.value || 0;
    const pets = this.bookingForm.get('pets')?.value || 0;

    let text = `${total} ${total === 1 ? 'guest' : 'guests'}`;

    if (infants > 0) {
      text += `, ${infants} ${infants === 1 ? 'infant' : 'infants'}`;
    }

    if (pets > 0) {
      text += `, ${pets} ${pets === 1 ? 'pet' : 'pets'}`;
    }

    return text;
  }

  /**
   * التحقق من صحة التواريخ
   */
  validateDates(): boolean {
    const checkIn = this.bookingForm.get('checkIn')?.value;
    const checkOut = this.bookingForm.get('checkOut')?.value;

    if (!checkIn || !checkOut) {
      this.errorMessage = 'Please select check-in and check-out dates';
      return false;
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // التحقق من أن التواريخ ليست في الماضي
    if (checkInDate < today) {
      this.errorMessage = 'Check-in date cannot be in the past';
      return false;
    }

    // التحقق من أن تاريخ المغادرة بعد تاريخ الوصول
    if (checkOutDate <= checkInDate) {
      this.errorMessage = 'Check-out date must be after check-in date';
      return false;
    }

    // حساب عدد الليالي
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    const numberOfNights = Math.ceil(timeDiff / (1000 * 3600 * 24));

    // التحقق من الحد الأدنى للليالي
    if (numberOfNights < this.minNights) {
      this.errorMessage = `Minimum stay is ${this.minNights} ${this.minNights === 1 ? 'night' : 'nights'}`;
      return false;
    }

    return true;
  }

  /**
   * التحقق من عدد الضيوف
   */
  validateGuests(): boolean {
    const totalGuests = this.getTotalGuests();

    if (totalGuests < 1) {
      this.errorMessage = 'At least 1 guest is required';
      return false;
    }

    if (totalGuests > this.maxGuests) {
      this.errorMessage = `Maximum ${this.maxGuests} guests allowed`;
      return false;
    }

    return true;
  }

  /**
   * إظهار/إخفاء اختيار الضيوف
   */
  toggleGuestPicker(): void {
    this.showGuestPicker = !this.showGuestPicker;
  }

  /**
   * إغلاق اختيار الضيوف
   */
  closeGuestPicker(): void {
    this.showGuestPicker = false;
  }

  /**
   * إرسال الحجز
   */
  onSubmit(): void {
    // التحقق من صحة الفورم
    if (!this.bookingForm.valid) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    // التحقق من التواريخ
    if (!this.validateDates()) {
      return;
    }

    // التحقق من عدد الضيوف
    if (!this.validateGuests()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // تجهيز البيانات
    const formValue = this.bookingForm.value;

    const guests: BookingGuest = {
      adults: formValue.adults,
      children: formValue.children,
      infants: formValue.infants,
      pets: formValue.pets
    };

    const bookingData: CreateBookingDto = {
      propertyId: this.propertyId,
      checkIn: formValue.checkIn,
      checkOut: formValue.checkOut,
      guests,
      messageToHost: formValue.messageToHost,
      specialRequests: formValue.specialRequests,
      paymentMethod: PaymentMethod.CREDIT_CARD // افتراضي
    };

    // محاكاة الإرسال (لأنه مفيش backend)
    setTimeout(() => {
      console.log('Booking Data:', bookingData);
      console.log('Price Breakdown:', this.priceBreakdown);

      this.isLoading = false;

      // التوجه إلى صفحة الدفع أو التأكيد
      // this.router.navigate(['/checkout'], {
      //   state: { booking: bookingData, pricing: this.priceBreakdown }
      // });

      alert('Booking submitted successfully! (Mock)');
    }, 1500);
  }

  /**
   * مسح الفورم
   */
  resetForm(): void {
    this.bookingForm.reset({
      adults: 1,
      children: 0,
      infants: 0,
      pets: 0
    });
    this.priceBreakdown = null;
    this.errorMessage = '';
  }


}

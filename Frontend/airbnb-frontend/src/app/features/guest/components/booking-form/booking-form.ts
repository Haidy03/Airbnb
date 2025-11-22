import { Component, OnInit, Input, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
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
  styleUrl: './booking-form.css',
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-8px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-8px)' }))
      ])
    ])
  ]
})
export class BookingFormComponent implements OnInit {

  // Property inputs from parent component
  @Input() propertyId!: string;
  @Input() pricePerNight: number = 100;
  @Input() cleaningFee: number = 20;
  @Input() serviceFeePercent: number = 14; // Airbnb usually charges ~14%
  @Input() taxPercent: number = 5; // Tax percentage
  @Input() currency: string = 'USD';
  @Input() minNights: number = 1;
  @Input() maxGuests: number = 6;
  @Input() propertyRating?: number;
  @Input() reviewsCount?: number;

  bookingForm!: FormGroup;

  // State
  isLoading: boolean = false;
  showGuestPicker: boolean = false;

  // Price calculation
  priceBreakdown: PriceBreakdown | null = null;

  // Blocked dates (will come from API in production)
  bookedDates: Date[] = [];

  // Current date for validation
  today: string = new Date().toISOString().split('T')[0];

  // Error handling
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
   * Initialize the booking form
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
   * Setup form value changes listeners
   */
  setupValueChanges(): void {
    // Recalculate price when dates or guests change
    this.bookingForm.valueChanges.subscribe(() => {
      this.calculatePrice();
      this.clearError();
    });
  }

  /**
   * Calculate total price with breakdown
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

    // Calculate number of nights
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    const numberOfNights = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (numberOfNights < this.minNights) {
      this.priceBreakdown = null;
      return;
    }

    // Calculate base price
    const basePrice = this.pricePerNight * numberOfNights;

    // Calculate service fee (percentage of base price)
    const serviceFee = basePrice * (this.serviceFeePercent / 100);

    // Calculate tax (percentage of base + service fee)
    const taxableAmount = basePrice + serviceFee;
    const tax = taxableAmount * (this.taxPercent / 100);

    // Long stay discount (if >= 7 nights, 10% discount)
    let discount = 0;
    if (numberOfNights >= 7) {
      discount = basePrice * 0.1; // 10% discount
    }

    // Calculate total
    const totalPrice = basePrice + this.cleaningFee + serviceFee + tax - discount;

    this.priceBreakdown = {
      pricePerNight: this.pricePerNight,
      numberOfNights,
      basePrice,
      cleaningFee: this.cleaningFee,
      serviceFee,
      tax,
      discount: discount > 0 ? discount : undefined,
      totalPrice,
      currency: this.currency
    };
  }

  /**
   * Increment guest count
   */
  incrementGuest(type: 'adults' | 'children' | 'infants' | 'pets'): void {
    const currentValue = this.bookingForm.get(type)?.value || 0;
    const totalGuests = this.getTotalGuests();

    // Check max guests limit (excluding infants and pets)
    if (type !== 'infants' && type !== 'pets') {
      if (totalGuests >= this.maxGuests) {
        return;
      }
    }

    this.bookingForm.patchValue({ [type]: currentValue + 1 });
  }

  /**
   * Decrement guest count
   */
  decrementGuest(type: 'adults' | 'children' | 'infants' | 'pets'): void {
    const currentValue = this.bookingForm.get(type)?.value || 0;

    // Adults must be at least 1
    if (type === 'adults' && currentValue <= 1) {
      return;
    }

    // Others can't go below 0
    if (currentValue <= 0) {
      return;
    }

    this.bookingForm.patchValue({ [type]: currentValue - 1 });
  }

  /**
   * Get total guest count (adults + children only)
   */
  getTotalGuests(): number {
    const adults = this.bookingForm.get('adults')?.value || 0;
    const children = this.bookingForm.get('children')?.value || 0;
    return adults + children;
  }

  /**
   * Get formatted guests text for display
   */
  getGuestsText(): string {
    const adults = this.bookingForm.get('adults')?.value || 0;
    const children = this.bookingForm.get('children')?.value || 0;
    const infants = this.bookingForm.get('infants')?.value || 0;
    const pets = this.bookingForm.get('pets')?.value || 0;

    const total = adults + children;
    let text = `${total} guest${total !== 1 ? 's' : ''}`;

    if (infants > 0) {
      text += `, ${infants} infant${infants !== 1 ? 's' : ''}`;
    }

    if (pets > 0) {
      text += `, ${pets} pet${pets !== 1 ? 's' : ''}`;
    }

    return text;
  }

  /**
   * Validate dates
   */
  validateDates(): boolean {
    const checkIn = this.bookingForm.get('checkIn')?.value;
    const checkOut = this.bookingForm.get('checkOut')?.value;

    if (!checkIn || !checkOut) {
      this.setError('Please select check-in and check-out dates');
      return false;
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if dates are in the past
    if (checkInDate < today) {
      this.setError('Check-in date cannot be in the past');
      return false;
    }

    // Check if checkout is after checkin
    if (checkOutDate <= checkInDate) {
      this.setError('Check-out date must be after check-in date');
      return false;
    }

    // Calculate nights
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    const numberOfNights = Math.ceil(timeDiff / (1000 * 3600 * 24));

    // Check minimum nights
    if (numberOfNights < this.minNights) {
      this.setError(`This property has a ${this.minNights} night minimum`);
      return false;
    }

    return true;
  }

  /**
   * Validate guest count
   */
  validateGuests(): boolean {
    const totalGuests = this.getTotalGuests();

    if (totalGuests < 1) {
      this.setError('At least 1 guest is required');
      return false;
    }

    if (totalGuests > this.maxGuests) {
      this.setError(`This property can accommodate a maximum of ${this.maxGuests} guests`);
      return false;
    }

    return true;
  }

  /**
   * Toggle guest picker dropdown
   */
  toggleGuestPicker(): void {
    this.showGuestPicker = !this.showGuestPicker;
  }

  /**
   * Close guest picker
   */
  closeGuestPicker(): void {
    this.showGuestPicker = false;
  }

  /**
   * Close dropdown when clicking outside
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const guestSection = target.closest('.guests-row');
    const guestDropdown = target.closest('.guest-dropdown');

    if (!guestSection && !guestDropdown && this.showGuestPicker) {
      this.closeGuestPicker();
    }
  }

  /**
   * Set error message
   */
  setError(message: string): void {
    this.errorMessage = message;
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.errorMessage = '';
  }

  /**
   * Submit booking form
   */
  onSubmit(): void {
    // Validate form
    if (!this.bookingForm.valid) {
      this.setError('Please fill in all required fields');
      return;
    }

    // Validate dates
    if (!this.validateDates()) {
      return;
    }

    // Validate guests
    if (!this.validateGuests()) {
      return;
    }

    this.isLoading = true;
    this.clearError();

    // Prepare booking data
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
      paymentMethod: PaymentMethod.CREDIT_CARD
    };

    // Simulate API call (replace with actual service call in production)
    setTimeout(() => {
      console.log('Booking Data:', bookingData);
      console.log('Price Breakdown:', this.priceBreakdown);

      this.isLoading = false;

      // Navigate to checkout/payment page
     this.router.navigate(['/checkout'], {
         state: {
           booking: bookingData,
           pricing: this.priceBreakdown
        }
     });

      alert('Booking request submitted! (Demo mode)');
    }, 1500);
  }

  /**
   * Reset form to initial state
   */
  resetForm(): void {
    this.bookingForm.reset({
      checkIn: '',
      checkOut: '',
      adults: 1,
      children: 0,
      infants: 0,
      pets: 0,
      messageToHost: '',
      specialRequests: ''
    });
    this.priceBreakdown = null;
    this.clearError();
    this.closeGuestPicker();
  }
}

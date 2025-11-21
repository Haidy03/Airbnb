import { Component,OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BookingService } from '../../services/booking_service';
import { Booking, PaymentMethod } from '../../models/booking_model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class CheckoutComponent implements OnInit {

  booking: Booking | null = null;
  paymentForm!: FormGroup;

  // Payment options
  paymentOptions = [
    {
      id: PaymentMethod.CREDIT_CARD,
      label: 'Credit or debit card',
      icon: 'card'
    },
    {
      id: PaymentMethod.PAYPAL,
      label: 'PayPal',
      icon: 'paypal'
    },
    {
      id: PaymentMethod.APPLE_PAY,
      label: 'Apple Pay',
      icon: 'apple'
    },
    {
      id: PaymentMethod.GOOGLE_PAY,
      label: 'Google Pay',
      icon: 'google'
    }
  ];

  selectedPaymentMethod: PaymentMethod = PaymentMethod.CREDIT_CARD;

  // State
  isProcessing: boolean = false;
  errorMessage: string = '';
  currentStep: number = 1; // 1: Payment Method, 2: Payment Details, 3: Review

  // Countries list (simplified)
  countries = [
    'Egypt', 'United States', 'United Kingdom', 'Saudi Arabia',
    'United Arab Emirates', 'Kuwait', 'Qatar', 'Bahrain', 'Oman'
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private bookingService: BookingService
  ) {}

  ngOnInit(): void {
    // Get booking from service
    this.booking = this.bookingService.getCurrentBooking();

    if (!this.booking) {
      // Redirect back if no booking found
      this.router.navigate(['/']);
      return;
    }

    this.initializePaymentForm();
  }

  /**
   * Initialize payment form
   */
  initializePaymentForm(): void {
    this.paymentForm = this.fb.group({
      // Payment method
      paymentMethod: [this.selectedPaymentMethod, Validators.required],

      // Card details
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      expirationMonth: ['', [Validators.required, Validators.min(1), Validators.max(12)]],
      expirationYear: ['', [Validators.required, Validators.min(2024)]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],

      // Billing address
      billingAddress: ['', Validators.required],
      apt: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', Validators.required],
      country: ['Egypt', Validators.required],

      // Contact
      phoneNumber: ['', Validators.required],

      // Terms
      agreeToTerms: [false, Validators.requiredTrue],
      agreeToPolicy: [false, Validators.requiredTrue]
    });
  }

  /**
   * Select payment method
   */
  selectPaymentMethod(method: PaymentMethod): void {
    this.selectedPaymentMethod = method;
    this.paymentForm.patchValue({ paymentMethod: method });
  }

  /**
   * Go to next step
   */
  nextStep(): void {
    if (this.currentStep === 1) {
      // Validate payment method selection
      if (!this.selectedPaymentMethod) {
        this.errorMessage = 'Please select a payment method';
        return;
      }
      this.currentStep = 2;
    } else if (this.currentStep === 2) {
      // Validate payment details
      if (!this.validatePaymentDetails()) {
        return;
      }
      this.currentStep = 3;
    }

    this.errorMessage = '';
  }

  /**
   * Go to previous step
   */
  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.errorMessage = '';
    }
  }

  /**
   * Validate payment details
   */
  validatePaymentDetails(): boolean {
    const cardNumber = this.paymentForm.get('cardNumber')?.value;
    const expirationMonth = this.paymentForm.get('expirationMonth')?.value;
    const expirationYear = this.paymentForm.get('expirationYear')?.value;
    const cvv = this.paymentForm.get('cvv')?.value;
    const billingAddress = this.paymentForm.get('billingAddress')?.value;
    const city = this.paymentForm.get('city')?.value;
    const state = this.paymentForm.get('state')?.value;
    const zipCode = this.paymentForm.get('zipCode')?.value;

    if (!cardNumber || !/^\d{16}$/.test(cardNumber)) {
      this.errorMessage = 'Please enter a valid 16-digit card number';
      return false;
    }

    if (!expirationMonth || expirationMonth < 1 || expirationMonth > 12) {
      this.errorMessage = 'Please enter a valid expiration month';
      return false;
    }

    if (!expirationYear || expirationYear < new Date().getFullYear()) {
      this.errorMessage = 'Please enter a valid expiration year';
      return false;
    }

    if (!cvv || !/^\d{3,4}$/.test(cvv)) {
      this.errorMessage = 'Please enter a valid CVV';
      return false;
    }

    if (!billingAddress || !city || !state || !zipCode) {
      this.errorMessage = 'Please complete your billing address';
      return false;
    }

    return true;
  }

  /**
   * Format card number for display
   */
  formatCardNumber(cardNumber: string): string {
    return cardNumber.replace(/(\d{4})/g, '$1 ').trim();
  }

  /**
   * Get formatted expiration date
   */
  getFormattedExpiration(): string {
    const month = this.paymentForm.get('expirationMonth')?.value;
    const year = this.paymentForm.get('expirationYear')?.value;

    if (month && year) {
      return `${String(month).padStart(2, '0')}/${year}`;
    }
    return '';
  }

  /**
   * Confirm and pay
   */
  confirmAndPay(): void {
    if (!this.paymentForm.valid) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    if (!this.booking) {
      this.errorMessage = 'Booking information not found';
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';

    // Process payment
    this.bookingService.completePayment(this.booking.id, this.selectedPaymentMethod)
      .subscribe({
        next: (response) => {
          this.isProcessing = false;

          if (response.success) {
            // Clear current booking
            this.bookingService.clearCurrentBooking();

            // Navigate to success page
            this.router.navigate(['/booking-success'], {
              state: { booking: response.booking }
            });
          } else {
            this.errorMessage = response.error || 'Payment failed. Please try again.';
          }
        },
        error: (error) => {
          this.isProcessing = false;
          this.errorMessage = 'Payment failed. Please try again.';
          console.error('Payment error:', error);
        }
      });
  }

  /**
   * Cancel checkout
   */
  cancelCheckout(): void {
    if (confirm('Are you sure you want to cancel? Your booking will not be saved.')) {
      this.bookingService.clearCurrentBooking();
      this.router.navigate(['/']);
    }
  }

  /**
   * Get payment method label
   */
  getPaymentMethodLabel(): string {
    const option = this.paymentOptions.find(opt => opt.id === this.selectedPaymentMethod);
    return option?.label || 'Payment Method';
  }
}

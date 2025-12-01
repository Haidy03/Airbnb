import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ServicesService } from '../../services/service';
import { ServiceDetails, ServicePackage } from '../../models/service.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-service-checkout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './service-checkout.html',
  styleUrls: ['./service-checkout.css']
})
export class ServiceCheckoutComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private servicesService = inject(ServicesService);
  private http = inject(HttpClient);
  private location = inject(Location);

  // Data
  serviceId!: number;
  service: ServiceDetails | null = null;
  selectedPackage: ServicePackage | null = null;
  
  // Query Params
  date: string = '';
  time: string = ''; // e.g. "10:30 AM"
  guests: number = 1;
  packageId: number | null = null;

  isLoading = true;
  isProcessing = false;
  totalPrice = 0;

  // Base URL for images
  private baseUrl = environment.apiUrl.replace('/api', '').replace(/\/$/, '');

  ngOnInit() {
    // 1. قراءة البيانات من الرابط
    this.route.queryParams.subscribe(params => {
      this.serviceId = Number(this.route.snapshot.paramMap.get('id'));
      this.date = params['date'];
      this.time = params['time']; // الوقت كنص (10:30 AM)
      this.guests = Number(params['guests'] || 1);
      this.packageId = params['packageId'] ? Number(params['packageId']) : null;

      if (this.serviceId) {
        this.loadServiceData();
      }
    });
  }

  loadServiceData() {
    this.servicesService.getServiceDetails(this.serviceId).subscribe({
      next: (res) => {
        if (res.success) {
          this.service = res.data;
          
          // تحديد الباقة لو موجودة
          if (this.packageId && this.service?.packages) {
            this.selectedPackage = this.service.packages.find(p => p.id === this.packageId) || null;
          }

          this.calculateTotal();
        }
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  calculateTotal() {
    if (!this.service) return;

    // السعر الأساسي (إما سعر الباقة أو سعر الوحدة للخدمة)
    let unitPrice = this.selectedPackage ? this.selectedPackage.price : this.service.pricePerUnit;

    // الحساب حسب نوع التسعير
    if (this.service.pricingUnit === 'PerPerson') {
      this.totalPrice = unitPrice * this.guests;
    } else {
      // PerHour, PerSession, FlatFee
      this.totalPrice = unitPrice; 
    }
  }

  confirmAndPay() {
    if (!this.service) return;
    this.isProcessing = true;

    // 1. تجميع تاريخ ووقت الحجز بتنسيق ISO للباك إند
    const bookingDateIso = this.getCombinedDateTime();

    const bookingPayload = {
      serviceId: this.service.id,
      packageId: this.packageId,
      date: bookingDateIso,
      numberOfGuests: this.guests
    };

    // 2. إنشاء الحجز في الباك إند
    this.servicesService.bookService(bookingPayload).subscribe({
      next: (res: any) => {
        // 3. الحجز تم بنجاح، الآن نذهب للدفع
        this.initiatePayment(res.bookingId);
      },
      error: (err) => {
        console.error(err);
        alert('Booking failed.');
        this.isProcessing = false;
      }
    });
  }

  initiatePayment(bookingId: number) {
    const paymentPayload = {
      serviceName: this.service?.title,
      totalPrice: this.totalPrice,
      serviceId: this.serviceId
    };

    this.http.post<{ url: string }>(`${environment.apiUrl}/Payment/create-service-checkout`, paymentPayload).subscribe({
      next: (res) => {
        // حفظ ID الحجز (اختياري للرجوع)
        sessionStorage.setItem('pendingServiceBookingId', bookingId.toString());
        // التوجيه لـ Stripe
        window.location.href = res.url;
      },
      error: (err) => {
        console.error('Payment Error', err);
        alert('Payment initiation failed.');
        this.isProcessing = false;
      }
    });
  }

  private getCombinedDateTime(): string {
    // دمج التاريخ والوقت المختارين
    // Date string from query: "2025-12-02"
    // Time string: "10:30 AM"
    
    if (!this.time) return new Date(this.date).toISOString();

    const [timeStr, modifier] = this.time.split(' ');
    let [hours, minutes] = timeStr.split(':');

    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = (parseInt(hours, 10) + 12).toString();

    const dateObj = new Date(this.date);
    dateObj.setHours(parseInt(hours, 10), parseInt(minutes, 10));

    return dateObj.toISOString();
  }

  getImageUrl(url: string | undefined): string {
    if (!url) return 'assets/images/placeholder.jpg';
    if (url.startsWith('http')) return url;
    const cleanPath = url.startsWith('/') ? url.substring(1) : url;
    return `${this.baseUrl}/${cleanPath}`;
  }

  goBack() {
    this.location.back();
  }
}
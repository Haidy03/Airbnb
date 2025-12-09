import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ServicesService } from '../../services/service';
import { ServiceDetails, ServicePackage } from '../../models/service.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { NotificationService } from '../../../../core/services/notification.service';

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
  private notificationService = inject(NotificationService);
 
  serviceId!: number;
  service: ServiceDetails | null = null;
  selectedPackage: ServicePackage | null = null;
  
 
  date: string = '';
  time: string = '';
  guests: number = 1;
  packageId: number | null = null;

  isLoading = true;
  isProcessing = false;
  totalPrice = 0;

 
  private baseUrl = environment.apiUrl.replace('/api', '').replace(/\/$/, '');

  ngOnInit() {
   
    this.route.queryParams.subscribe(params => {
      this.serviceId = Number(this.route.snapshot.paramMap.get('id'));
      this.date = params['date'];
      this.time = params['time']; 
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

   
    let unitPrice = this.selectedPackage ? this.selectedPackage.price : this.service.pricePerUnit;

 
    if (this.service.pricingUnit === 'PerPerson') {
      this.totalPrice = unitPrice * this.guests;
    } else {
     
      this.totalPrice = unitPrice; 
    }
  }

  confirmAndPay() {
    if (!this.service) return;
    this.isProcessing = true;

  
    const bookingDateIso = this.getCombinedDateTime();

    const bookingPayload = {
      serviceId: this.service.id,
      packageId: this.packageId,
      date: bookingDateIso,
      numberOfGuests: this.guests
    };

 
    this.servicesService.bookService(bookingPayload).subscribe({
      next: (res: any) => {
        this.initiatePayment(res.bookingId);
      },
      error: (err) => {
        console.error(err);
        this.isProcessing = false;
        const errorMessage = err.error?.message || 'Something went wrong. Please try again.';
        this.notificationService.showError(errorMessage);
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
        sessionStorage.setItem('pendingServiceBookingId', bookingId.toString());
        window.location.href = res.url;
      },
      error: (err) => {
        console.error('Payment Error', err);
        this.isProcessing = false;
        this.notificationService.showError('Could not initiate payment gateway.');
      }
    });
  }

  private getCombinedDateTime(): string {
  
    if (!this.time || !this.date) return new Date().toISOString();

  
    const [timeStr, modifier] = this.time.split(' ');
    let [hours, minutes] = timeStr.split(':');

    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = (parseInt(hours, 10) + 12).toString();

    
    const hh = hours.toString().padStart(2, '0');
    const mm = minutes.toString().padStart(2, '0');

    return `${this.date}T${hh}:${mm}:00`;
  }

  getImageUrl(image: any): string { 
  if (!image) return 'assets/images/placeholder.jpg';
  const url = image.url || image;

  if (url.startsWith('http')) return url;
  
  const cleanPath = url.startsWith('/') ? url.substring(1) : url;
  return `${this.baseUrl}/${cleanPath}`;
}

  goBack() {
    this.location.back();
  }
}
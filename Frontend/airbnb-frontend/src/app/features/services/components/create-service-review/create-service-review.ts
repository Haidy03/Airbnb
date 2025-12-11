import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ServicesService } from '../../services/service';
import { ServiceCreationStore } from '../../models/service-creation.store';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-create-service-review',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './create-service-review.html',
  styleUrls: ['./create-service-review.css']
})
export class CreateServiceReviewComponent implements OnInit {
  isSubmitting = signal(false);
  
  title = '';
  description = '';
  price = 0;
  duration = 0;
  locationType = ''; 
  coverPhotoUrl = ''; 

  private unitLabels: any = { '0': 'hour', '1': 'guest', '2': 'session', '3': 'flat fee' };

  constructor(
    private servicesService: ServicesService,
    private store: ServiceCreationStore,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadPreviewData();
  }

  loadPreviewData() {
    this.title = localStorage.getItem('draftServiceTitle') || 'Untitled';
    this.description = localStorage.getItem('draftServiceDescription') || '';
    this.price = Number(localStorage.getItem('draftServicePrice'));
    
    this.duration = Number(localStorage.getItem('draftServiceDuration') || '60');

    const type = localStorage.getItem('draftServiceLocationType');
    this.locationType = type === '0' ? 'Mobile (You travel)' : 'On-Site (Guests come)';

    const photos = this.store.getPhotos();
    if (photos.length > 0) {
      this.coverPhotoUrl = URL.createObjectURL(photos[0]);
    }
  }

  get pricingUnitLabel() {
    const unit = localStorage.getItem('draftServiceUnit') || '1';
    return this.unitLabels[unit];
  }

  goBack() {
    this.router.navigate(['/host/services/photos']);
  }

  onSubmit() {
    this.isSubmitting.set(true);

    const formData = new FormData();
    
    // 1. Basic Info
    formData.append('Title', this.title);
    formData.append('Description', this.description);
    formData.append('CategoryId', localStorage.getItem('draftServiceCategory') || '1');
    formData.append('PricePerUnit', this.price.toString());
    formData.append('PricingUnit', localStorage.getItem('draftServiceUnit') || '1');
    formData.append('LocationType', localStorage.getItem('draftServiceLocationType') || '1');
    formData.append('City', localStorage.getItem('draftServiceCity') || '');
    formData.append('MinimumCost', '0'); 
    formData.append('MaxGuests', localStorage.getItem('draftServiceMaxGuests') || '1');

    // 2. New Availability Logic (Duration + JSON)
    const duration = localStorage.getItem('draftServiceDuration');
    const availabilityJson = localStorage.getItem('draftServiceAvailabilityJson');

    if (duration) formData.append('DurationMinutes', duration);
    if (availabilityJson) formData.append('AvailabilityJson', availabilityJson);

    // 3. Append Photos
    const photos = this.store.getPhotos();
    photos.forEach((file) => {
      formData.append('Images', file); 
    });

    // 4. Send to Backend
    this.servicesService.createService(formData).subscribe({
      next: (res) => {
        this.notificationService.showSuccess(
          'Service Submitted!',
          'Your service has been created successfully and is pending admin approval.'
        );
        
        this.clearDraft();
        this.router.navigate(['/host/services']); 
      },
      error: (err) => {
        console.error(err);
        
        const errorMsg = err.error?.message || 'Error creating service. Please try again.';
        this.notificationService.showError(errorMsg);
        
        this.isSubmitting.set(false);
      }
    });
  }

  clearDraft() {
    localStorage.removeItem('draftServiceTitle');
    localStorage.removeItem('draftServiceDescription');
    localStorage.removeItem('draftServicePrice');
    localStorage.removeItem('draftServiceUnit');
    localStorage.removeItem('draftServiceCategory');
    localStorage.removeItem('draftServiceLocationType');
    localStorage.removeItem('draftServiceCity');
    
    localStorage.removeItem('draftServiceMaxGuests');
    localStorage.removeItem('draftServiceDuration');
    localStorage.removeItem('draftServiceAvailabilityJson');
    localStorage.removeItem('draftServiceTimeSlots'); 
  }
}
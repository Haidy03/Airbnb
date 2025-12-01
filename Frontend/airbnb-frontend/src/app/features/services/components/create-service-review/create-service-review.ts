import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ServicesService } from '../../services/service';
import { ServiceCreationStore } from '../../models/service-creation.store';

@Component({
  selector: 'app-create-service-review',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './create-service-review.html',
  styleUrls: ['./create-service-review.css']
})
export class CreateServiceReviewComponent implements OnInit {
  isSubmitting = signal(false);
  
  // Data Holders for Preview
  title = '';
  description = '';
  price = 0;
  category = '';
  locationType = ''; // Text representation
  coverPhotoUrl = ''; // Preview URL

  // Helper Maps
  private unitLabels: any = { '0': 'hour', '1': 'guest', '2': 'session', '3': 'flat fee' };

  constructor(
    private servicesService: ServicesService,
    private store: ServiceCreationStore,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadPreviewData();
  }

  loadPreviewData() {
    this.title = localStorage.getItem('draftServiceTitle') || 'Untitled';
    this.description = localStorage.getItem('draftServiceDescription') || '';
    this.price = Number(localStorage.getItem('draftServicePrice'));
    
    const type = localStorage.getItem('draftServiceLocationType');
    this.locationType = type === '0' ? 'Mobile (You travel)' : 'On-Site (Guests come)';

    // Get Cover Photo for preview
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

    
    formData.append('Title', this.title);
    formData.append('Description', this.description);
    formData.append('CategoryId', localStorage.getItem('draftServiceCategory') || '1');
    formData.append('PricePerUnit', this.price.toString());
    formData.append('PricingUnit', localStorage.getItem('draftServiceUnit') || '1');
    formData.append('LocationType', localStorage.getItem('draftServiceLocationType') || '1');
    formData.append('City', localStorage.getItem('draftServiceCity') || '');
    formData.append('MinimumCost', '0'); // Optional
    formData.append('MaxGuests', localStorage.getItem('draftServiceMaxGuests') || '1');


     const timeSlots = JSON.parse(localStorage.getItem('draftServiceTimeSlots') || '[]');
    timeSlots.forEach((slot: string) => {
      formData.append('TimeSlots', slot); 
    });
    // 2. Append Photos
    const photos = this.store.getPhotos();
    photos.forEach((file) => {
      formData.append('Images', file); // 'Images' must match backend property
    });

    // 3. Send to Backend
    this.servicesService.createService(formData).subscribe({
      next: (res) => {
        alert('Service created successfully! Waiting for admin approval.');
        this.clearDraft();
        this.router.navigate(['/host/services']); // Or 'my-services'
      },
      error: (err) => {
        console.error(err);
        alert('Error creating service. Please try again.');
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
  }
}
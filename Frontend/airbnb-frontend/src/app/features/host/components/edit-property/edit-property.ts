import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PropertyService } from '../../services/property';
import { FileUploadService } from '../../services/file-upload';
import { AMENITIES_LIST } from '../../models/amenity.model';
import { PropertyType, Property } from '../../models/property.model';

interface AmenityDisplay {
  id: number;
  name: string;
  category: string;
  icon: string;
}

@Component({
  selector: 'app-edit-property',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,RouterLink],
  templateUrl: './edit-property.html',
  styleUrls: ['./edit-property.css']
})
export class EditProperty implements OnInit {
  private fb = inject(FormBuilder);
  private propertyService = inject(PropertyService);
  private fileUploadService = inject(FileUploadService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  propertyForm!: FormGroup;
  propertyId: string = '';
  property: Property | null = null;
  
  currentStep = 1;
  totalSteps = 5;
  isSubmitting = false;
  isLoading = true;
  
  selectedFiles: File[] = [];
  imagesPreviews: string[] = [];
  existingImages: any[] = [];
  imagesToDelete: string[] = [];

  availableAmenities: AmenityDisplay[] = AMENITIES_LIST.map((amenity, index) => ({
    id: index + 1,
    name: amenity.name,
    category: amenity.category,
    icon: amenity.icon
  }));

  propertyTypes = Object.values(PropertyType);
  Math: any;

  ngOnInit(): void {
    // Get property ID from route
    this.propertyId = this.route.snapshot.paramMap.get('id') || '';
    
    if (!this.propertyId) {
      this.router.navigate(['/host/properties']);
      return;
    }

    this.initializeForm();
    this.loadProperty();
  }

  initializeForm(): void {
    this.propertyForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(2000)]],
      propertyType: ['', Validators.required],
      address: ['', [Validators.required, Validators.maxLength(200)]],
      city: ['', [Validators.required, Validators.maxLength(100)]],
      country: ['', [Validators.required, Validators.maxLength(100)]],
      postalCode: [''],
      latitude: [0, [Validators.required]],
      longitude: [0, [Validators.required]],
      numberOfBedrooms: [1, [Validators.required, Validators.min(1)]],
      numberOfBathrooms: [1, [Validators.required, Validators.min(1)]],
      maxGuests: [1, [Validators.required, Validators.min(1)]],
      pricePerNight: [0, [Validators.required, Validators.min(1)]],
      cleaningFee: [0, [Validators.min(0)]],
      houseRules: [''],
      checkInTime: ['15:00'],
      checkOutTime: ['11:00'],
      minimumStay: [1, [Validators.required, Validators.min(1)]],
      amenityIds: [[]]
    });
  }

  /**
   * Load property data
   */
  loadProperty(): void {
    this.isLoading = true;
    
    this.propertyService.getPropertyById(this.propertyId).subscribe({
      next: (property) => {
        if (!property) {
          alert('Property not found');
          this.router.navigate(['/host/properties']);
          return;
        }

        this.property = property;
        this.populateForm(property);
        this.existingImages = property.images.map(img => ({
          id: img.id,
          url: img.url,
          isPrimary: img.isMain,
          order: img.order
        }));
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading property:', error);
        alert('Failed to load property');
        this.router.navigate(['/host/properties']);
      }
    });
  }

  /**
   * Populate form with property data
   */
  populateForm(property: Property): void {
    this.propertyForm.patchValue({
      title: property.title,
      description: property.description,
      propertyType: property.propertyType,
      address: property.location.address,
      city: property.location.city,
      country: property.location.country,
      postalCode: property.location.zipCode,
      latitude: property.location.coordinates.lat,
      longitude: property.location.coordinates.lng,
      numberOfBedrooms: property.capacity.bedrooms,
      numberOfBathrooms: property.capacity.bathrooms,
      maxGuests: property.capacity.guests,
      pricePerNight: property.pricing.basePrice,
      cleaningFee: property.pricing.cleaningFee || 0,
      houseRules: property.houseRules.additionalRules?.join('\n') || '',
      checkInTime: property.houseRules.checkInTime,
      checkOutTime: property.houseRules.checkOutTime,
      minimumStay: property.availability.minNights,
      amenityIds: property.amenities.map(a => parseInt(a))
    });
  }

  formatPropertyType(type: string): string {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  nextStep(): void {
    if (this.validateCurrentStep()) {
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    if (step <= this.currentStep || this.validateStepsUpTo(step - 1)) {
      this.currentStep = step;
    }
  }

  validateCurrentStep(): boolean {
    let fieldsToValidate: string[] = [];

    switch (this.currentStep) {
      case 1:
        fieldsToValidate = ['title', 'description', 'propertyType'];
        break;
      case 2:
        fieldsToValidate = ['address', 'city', 'country', 'latitude', 'longitude'];
        break;
      case 3:
        fieldsToValidate = ['numberOfBedrooms', 'numberOfBathrooms', 'maxGuests'];
        break;
      case 4:
        fieldsToValidate = ['pricePerNight', 'checkInTime', 'checkOutTime', 'minimumStay'];
        break;
    }

    let isValid = true;
    fieldsToValidate.forEach(field => {
      const control = this.propertyForm.get(field);
      if (control) {
        control.markAsTouched();
        if (control.invalid) {
          isValid = false;
        }
      }
    });

    if (!isValid) {
      alert('Please fill all required fields correctly');
    }

    return isValid;
  }

  validateStepsUpTo(step: number): boolean {
    return true;
  }

  toggleAmenity(amenityId: number): void {
    const amenityIds = this.propertyForm.get('amenityIds')?.value as number[];
    const index = amenityIds.indexOf(amenityId);

    if (index > -1) {
      amenityIds.splice(index, 1);
    } else {
      amenityIds.push(amenityId);
    }

    this.propertyForm.patchValue({ amenityIds });
  }

  isAmenitySelected(amenityId: number): boolean {
    const amenityIds = this.propertyForm.get('amenityIds')?.value as number[];
    return amenityIds.includes(amenityId);
  }

  getAmenitiesByCategory(category: string): AmenityDisplay[] {
    return this.availableAmenities.filter(a => a.category === category);
  }

  getUniqueCategories(): string[] {
    return [...new Set(this.availableAmenities.map(a => a.category))];
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      
      const validFiles = files.filter(file => {
        const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);
        const isValidSize = file.size <= 5 * 1024 * 1024;
        
        if (!isValidType) {
          alert(`${file.name} has invalid type`);
          return false;
        }
        if (!isValidSize) {
          alert(`${file.name} exceeds 5MB`);
          return false;
        }
        return true;
      });

      this.selectedFiles.push(...validFiles);
      
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagesPreviews.push(e.target.result);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeNewImage(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.imagesPreviews.splice(index, 1);
  }

  removeExistingImage(imageId: string): void {
    this.imagesToDelete.push(imageId);
    this.existingImages = this.existingImages.filter(img => img.id !== imageId);
  }

  getCurrentLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.propertyForm.patchValue({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          alert('Location captured successfully');
        },
        (error) => {
          alert('Unable to get location');
          console.error('Geolocation error:', error);
        }
      );
    } else {
      alert('Geolocation is not supported');
    }
  }

  async onSubmit(): Promise<void> {
    if (this.propertyForm.invalid) {
      alert('Please fill all required fields');
      Object.keys(this.propertyForm.controls).forEach(key => {
        this.propertyForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;

    try {
      const formValue = this.propertyForm.value;
      
      const updatePropertyDto = {
        id: this.propertyId,
        title: formValue.title,
        description: formValue.description,
        propertyType: formValue.propertyType,
        address: formValue.address,
        city: formValue.city,
        country: formValue.country,
        postalCode: formValue.postalCode || null,
        latitude: formValue.latitude,
        longitude: formValue.longitude,
        numberOfBedrooms: formValue.numberOfBedrooms,
        numberOfBathrooms: formValue.numberOfBathrooms,
        maxGuests: formValue.maxGuests,
        pricePerNight: formValue.pricePerNight,
        cleaningFee: formValue.cleaningFee || null,
        houseRules: formValue.houseRules || null,
        checkInTime: formValue.checkInTime ? `${formValue.checkInTime}` : null,
        checkOutTime: formValue.checkOutTime ? `${formValue.checkOutTime}` : null,
        minimumStay: formValue.minimumStay,
        amenityIds: []
      };

      console.log('Updating property:', updatePropertyDto);

      this.propertyService.updateProperty(updatePropertyDto as any).subscribe({
        next: async (response) => {
          console.log('Property updated:', response);

          // Delete removed images
          for (const imageId of this.imagesToDelete) {
            try {
              await this.propertyService.deletePropertyImage(parseInt(imageId)).toPromise();
            } catch (error) {
              console.error('Error deleting image:', error);
            }
          }

          // Upload new images
          if (this.selectedFiles.length > 0) {
            for (const file of this.selectedFiles) {
              try {
                await this.propertyService.uploadPropertyImages(
                  (this.propertyId), 
                  [file]
                ).toPromise();
              } catch (error) {
                console.error('Error uploading image:', error);
              }
            }
          }

          alert('Property updated successfully!');
          this.router.navigate(['/host/properties']);
        },
        error: (error) => {
          console.error('Error updating property:', error);
          const errorMessage = error?.error?.message || error?.message || 'Failed to update property';
          alert(errorMessage);
          this.isSubmitting = false;
        }
      });
    } catch (error: any) {
      console.error('Error updating property:', error);
      alert(error?.message || 'Failed to update property');
      this.isSubmitting = false;
    }
  }

  deleteProperty(): void {
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return;
    }

    this.propertyService.deleteProperty(this.propertyId).subscribe({
      next: () => {
        alert('Property deleted successfully');
        this.router.navigate(['/host/properties']);
      },
      error: (error) => {
        console.error('Error deleting property:', error);
        alert('Failed to delete property');
      }
    });
  }

  getProgressPercentage(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.propertyForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.propertyForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'This field is required';
      if (field.errors['minlength']) return `Minimum length is ${field.errors['minlength'].requiredLength}`;
      if (field.errors['maxlength']) return `Maximum length is ${field.errors['maxlength'].requiredLength}`;
      if (field.errors['min']) return `Minimum value is ${field.errors['min'].min}`;
    }
    return '';
  }
}
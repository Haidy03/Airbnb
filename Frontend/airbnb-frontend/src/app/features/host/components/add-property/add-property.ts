import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PropertyService } from '../../services/property';
import { FileUploadService } from '../../services/file-upload';
import { AMENITIES_LIST, AmenityCategory } from '../../models/amenity.model';
import { PropertyType } from '../../models/property.model';

interface AmenityDisplay {
  id: number;
  name: string;
  category: string;
  icon: string;
}

@Component({
  selector: 'app-add-property',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-property.html',
  styleUrls: ['./add-property.css']
})
export class AddProperty implements OnInit {
  private fb = inject(FormBuilder);
  private propertyService = inject(PropertyService);
  private fileUploadService = inject(FileUploadService);
  private router = inject(Router);

  propertyForm!: FormGroup;
  currentStep = 1;
  totalSteps = 5;
  isSubmitting = false;
  selectedFiles: File[] = [];
  imagesPreviews: string[] = [];

  // Amenities with numeric IDs for backend
  availableAmenities: AmenityDisplay[] = AMENITIES_LIST.map((amenity, index) => ({
    id: index + 1, // Convert to numeric ID
    name: amenity.name,
    category: amenity.category,
    icon: amenity.icon
  }));

  propertyTypes = Object.values(PropertyType);
Math: any;

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.propertyForm = this.fb.group({
      // Step 1: Basic Info
      title: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(2000)]],
      propertyType: ['', Validators.required],

      // Step 2: Location
      address: ['', [Validators.required, Validators.maxLength(200)]],
      city: ['', [Validators.required, Validators.maxLength(100)]],
      country: ['', [Validators.required, Validators.maxLength(100)]],
      postalCode: [''],
      latitude: [0, [Validators.required]],
      longitude: [0, [Validators.required]],

      // Step 3: Property Details
      numberOfBedrooms: [1, [Validators.required, Validators.min(1)]],
      numberOfBathrooms: [1, [Validators.required, Validators.min(1)]],
      maxGuests: [1, [Validators.required, Validators.min(1)]],

      // Step 4: Pricing & Rules
      pricePerNight: [0, [Validators.required, Validators.min(1)]],
      cleaningFee: [0, [Validators.min(0)]],
      houseRules: [''],
      checkInTime: ['15:00'],
      checkOutTime: ['11:00'],
      minimumStay: [1, [Validators.required, Validators.min(1)]],

      // Step 5: Amenities
      amenityIds: [[], Validators.required]
    });
  }

  // Format property type for display
  formatPropertyType(type: string): string {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  // Navigation Methods
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
      case 5:
        fieldsToValidate = ['amenityIds'];
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

  // Amenity Methods
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

  // Image Upload Methods
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

  removeImage(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.imagesPreviews.splice(index, 1);
  }

  // Location Methods
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

  // Submit Methods
  async onSubmit(): Promise<void> {
    if (this.propertyForm.invalid) {
      alert('Please fill all required fields');
      Object.keys(this.propertyForm.controls).forEach(key => {
        this.propertyForm.get(key)?.markAsTouched();
      });
      return;
    }

    if (this.selectedFiles.length === 0) {
      alert('Please upload at least one image');
      return;
    }

    this.isSubmitting = true;

    try {
      // Prepare DTO matching backend CreatePropertyDto
      const formValue = this.propertyForm.value;
      
      const createPropertyDto = {
        title: formValue.title,
        description: formValue.description,
        propertyType: formValue.propertyType, // Now sends just the string value
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
        checkInTime: formValue.checkInTime ? `${formValue.checkInTime}:00` : null,
        checkOutTime: formValue.checkOutTime ? `${formValue.checkOutTime}:00` : null,
        minimumStay: formValue.minimumStay,
        amenityIds: [] // Temporarily send empty array for testing
      };

      console.log('Submitting property:', createPropertyDto);

      // Create property
      this.propertyService.createProperty(createPropertyDto as any).subscribe({
        next: async (response) => {
          console.log('Property created:', response);
          const propertyId = response.id;

          // Upload images one by one
          if (this.selectedFiles.length > 0) {
            for (const file of this.selectedFiles) {
              try {
                await this.propertyService.uploadPropertyImages(propertyId, [file]).toPromise();
              } catch (error) {
                console.error('Error uploading image:', error);
              }
            }
          }

          alert('Property created successfully!');
          this.router.navigate(['/host/properties']);
        },
        error: (error) => {
          console.error('Error creating property:', error);
          
          if (error.status === 401) {
            alert('Authentication required. Please login first.');
            // You can redirect to login page here if needed
            // this.router.navigate(['/auth/login']);
          } else {
            const errorMessage = error?.error?.message || error?.message || 'Failed to create property';
            alert(errorMessage);
          }
          
          this.isSubmitting = false;
        }
      });
    } catch (error: any) {
      console.error('Error creating property:', error);
      alert(error?.message || 'Failed to create property');
      this.isSubmitting = false;
    }
  }

  // Helper Methods
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
      if (field.errors['max']) return `Maximum value is ${field.errors['max'].max}`;
    }
    return '';
  }

  // Increment/Decrement helpers
  incrementValue(fieldName: string): void {
    const control = this.propertyForm.get(fieldName);
    if (control) {
      control.setValue(control.value + 1);
    }
  }

  decrementValue(fieldName: string, min: number = 1): void {
    const control = this.propertyForm.get(fieldName);
    if (control && control.value > min) {
      control.setValue(control.value - 1);
    }
  }
}
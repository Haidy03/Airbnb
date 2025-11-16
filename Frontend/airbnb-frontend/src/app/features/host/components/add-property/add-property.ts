import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PropertyService } from '../../services/property';
import { CreatePropertyRequest, PropertyType, PROPERTY_TYPES } from '../../models/property.model';
import { AMENITIES_LIST, Amenity } from '../../models/amenity.model';

@Component({
  selector: 'app-add-property',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-property.html',
  styleUrl: './add-property.css',
})
export class AddProperty implements OnInit{
  propertyForm!: FormGroup;
  propertyTypes = PROPERTY_TYPES;
  amenitiesList = AMENITIES_LIST;
  selectedAmenities: string[] = [];
  
  currentStep = 1;
  totalSteps = 4;
  
  // Image Upload
  selectedImages: File[] = [];
  imagePreviewUrls: string[] = [];
  
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private propertyService: PropertyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.propertyForm = this.fb.group({
      // Step 1: Basic Info
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.maxLength(2000)]],
      propertyType: [PropertyType.Apartment, Validators.required],
      
      // Step 2: Details
      pricePerNight: ['', [Validators.required, Validators.min(1)]],
      maxGuests: ['', [Validators.required, Validators.min(1), Validators.max(50)]],
      bedrooms: ['', [Validators.required, Validators.min(0)]],
      bathrooms: ['', [Validators.required, Validators.min(0)]],
      
      // Step 3: Location
      address: ['', Validators.required],
      city: ['', Validators.required],
      country: ['', Validators.required],
      latitude: [''],
      longitude: ['']
    });
  }

  // Step Navigation
  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      if (this.isCurrentStepValid()) {
        this.currentStep++;
      } else {
        this.markStepAsTouched();
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  isCurrentStepValid(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.propertyForm.get('title')?.valid && 
               this.propertyForm.get('description')?.valid &&
               this.propertyForm.get('propertyType')?.valid || false;
      case 2:
        return this.propertyForm.get('pricePerNight')?.valid &&
               this.propertyForm.get('maxGuests')?.valid &&
               this.propertyForm.get('bedrooms')?.valid &&
               this.propertyForm.get('bathrooms')?.valid || false;
      case 3:
        return this.propertyForm.get('address')?.valid &&
               this.propertyForm.get('city')?.valid &&
               this.propertyForm.get('country')?.valid || false;
      case 4:
        return true; // Amenities and images are optional
      default:
        return false;
    }
  }

  markStepAsTouched(): void {
    switch (this.currentStep) {
      case 1:
        this.propertyForm.get('title')?.markAsTouched();
        this.propertyForm.get('description')?.markAsTouched();
        this.propertyForm.get('propertyType')?.markAsTouched();
        break;
      case 2:
        this.propertyForm.get('pricePerNight')?.markAsTouched();
        this.propertyForm.get('maxGuests')?.markAsTouched();
        this.propertyForm.get('bedrooms')?.markAsTouched();
        this.propertyForm.get('bathrooms')?.markAsTouched();
        break;
      case 3:
        this.propertyForm.get('address')?.markAsTouched();
        this.propertyForm.get('city')?.markAsTouched();
        this.propertyForm.get('country')?.markAsTouched();
        break;
    }
  }

  // Amenities
  toggleAmenity(amenityId: string): void {
    const index = this.selectedAmenities.indexOf(amenityId);
    if (index > -1) {
      this.selectedAmenities.splice(index, 1);
    } else {
      this.selectedAmenities.push(amenityId);
    }
  }

  isAmenitySelected(amenityId: string): boolean {
    return this.selectedAmenities.includes(amenityId);
  }

  // Image Upload
  onImageSelect(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.match(/image\/(jpg|jpeg|png)/)) {
          alert('Please upload only JPG, JPEG or PNG images');
          continue;
        }
        
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          alert('Image size should not exceed 5MB');
          continue;
        }
        
        this.selectedImages.push(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagePreviewUrls.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeImage(index: number): void {
    this.selectedImages.splice(index, 1);
    this.imagePreviewUrls.splice(index, 1);
  }

  // Form Submission
  onSubmit(): void {
    if (this.propertyForm.invalid) {
      Object.keys(this.propertyForm.controls).forEach(key => {
        this.propertyForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;

    const formValue = this.propertyForm.value;
    const request: CreatePropertyRequest = {
      title: formValue.title,
      description: formValue.description,
      propertyType: formValue.propertyType,
      pricePerNight: formValue.pricePerNight,
      maxGuests: formValue.maxGuests,
      bedrooms: formValue.bedrooms,
      bathrooms: formValue.bathrooms,
      address: formValue.address,
      city: formValue.city,
      country: formValue.country,
      latitude: formValue.latitude || undefined,
      longitude: formValue.longitude || undefined,
      amenityIds: this.selectedAmenities
    };

    this.propertyService.createProperty(request).subscribe({
      next: (property) => {
        console.log('Property created:', property);
        
        // Upload images if any
        if (this.selectedImages.length > 0) {
          this.propertyService.uploadPropertyImages(property.id, this.selectedImages).subscribe({
            next: (images) => {
              console.log('Images uploaded:', images);
              this.navigateToMyProperties();
            },
            error: (error) => {
              console.error('Error uploading images:', error);
              alert('Property created but failed to upload images');
              this.navigateToMyProperties();
            }
          });
        } else {
          this.navigateToMyProperties();
        }
      },
      error: (error) => {
        console.error('Error creating property:', error);
        alert('Failed to create property. Please try again.');
        this.isSubmitting = false;
      }
    });
  }

  navigateToMyProperties(): void {
    alert('Property created successfully!');
    this.router.navigate(['/host/my-properties']);
  }

  // Helper Methods
  getErrorMessage(fieldName: string): string {
    const control = this.propertyForm.get(fieldName);
    if (control?.hasError('required')) {
      return 'This field is required';
    }
    if (control?.hasError('maxLength')) {
      return `Maximum ${control.errors?.['maxLength'].requiredLength} characters allowed`;
    }
    if (control?.hasError('min')) {
      return `Minimum value is ${control.errors?.['min'].min}`;
    }
    if (control?.hasError('max')) {
      return `Maximum value is ${control.errors?.['max'].max}`;
    }
    return '';
  }

  getProgressPercentage(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }
}

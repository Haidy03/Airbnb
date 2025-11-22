import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PropertyService } from '../../services/property';
import { FileUploadService } from '../../services/file-upload';
import { AMENITIES_LIST, AmenityCategory } from '../../models/amenity.model';
import { environment } from '../../../../../environments/environment';

interface AmenityDisplay {
  id: number;
  name: string;
  category: string;
  icon: string;
}

interface PropertyTypeOption {
  id: number;
  code: string;
  name: string;
  description?: string;
  iconType: string;
  category?: string;
  displayOrder: number;
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
  private http = inject(HttpClient);

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

  // ✅ Property types loaded from backend
  propertyTypes: PropertyTypeOption[] = [];
  loadingPropertyTypes = false;
  
  Math: any;

  ngOnInit(): void {
    this.initializeForm();
    this.loadPropertyTypes(); // ✅ Load property types from backend
  }

  /**
   * ✅ Load property types from backend
   */
  loadPropertyTypes(): void {
    this.loadingPropertyTypes = true;
    
    this.http.get<PropertyTypeOption[]>(`${environment.apiUrl}/PropertyTypes`)
      .subscribe({
        next: (types) => {
          console.log('✅ Property types loaded:', types);
          this.propertyTypes = types;
          this.loadingPropertyTypes = false;
        },
        error: (error) => {
          console.error('❌ Error loading property types:', error);
          this.loadingPropertyTypes = false;
          
          // Fallback to hardcoded types if API fails
          this.propertyTypes = [
            { id: 1, code: 'HOUSE', name: 'House', iconType: 'house', displayOrder: 1 },
            { id: 2, code: 'APARTMENT', name: 'Apartment', iconType: 'apartment', displayOrder: 2 },
            { id: 3, code: 'BARN', name: 'Barn', iconType: 'barn', displayOrder: 3 },
            { id: 4, code: 'BED_BREAKFAST', name: 'Bed & breakfast', iconType: 'bed-breakfast', displayOrder: 4 },
            { id: 5, code: 'BOAT', name: 'Boat', iconType: 'boat', displayOrder: 5 },
            { id: 6, code: 'CABIN', name: 'Cabin', iconType: 'cabin', displayOrder: 6 },
            { id: 7, code: 'CAMPER', name: 'Camper/RV', iconType: 'camper', displayOrder: 7 },
            { id: 8, code: 'CASA_PARTICULAR', name: 'Casa particular', iconType: 'casa', displayOrder: 8 },
            { id: 9, code: 'CASTLE', name: 'Castle', iconType: 'castle', displayOrder: 9 },
            { id: 10, code: 'CAVE', name: 'Cave', iconType: 'cave', displayOrder: 10 },
            { id: 11, code: 'CONTAINER', name: 'Container', iconType: 'container', displayOrder: 11 },
            { id: 12, code: 'CYCLADIC_HOME', name: 'Cycladic home', iconType: 'cycladic', displayOrder: 12 }
          ];
        }
      });
  }

  initializeForm(): void {
    this.propertyForm = this.fb.group({
      // Step 1: Basic Info
      title: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(2000)]],
      propertyType: ['', Validators.required], // ✅ This will store propertyTypeId (number)

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

  // Format property type for display (no longer needed but kept for compatibility)
  formatPropertyType(type: PropertyTypeOption): string {
    return type.name;
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
          alert(`${file.name} has invalid type. Only JPEG, PNG, and WebP are allowed.`);
          return false;
        }
        if (!isValidSize) {
          alert(`${file.name} exceeds 5MB limit`);
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
          alert('Location captured successfully!');
        },
        (error) => {
          alert('Unable to get location. Please enter coordinates manually.');
          console.error('Geolocation error:', error);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  }

  // ✅ FIXED Submit Method
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
      const formValue = this.propertyForm.value;
      
      // ✅ FIXED: Match backend CreatePropertyDto exactly with correct types
      const createPropertyDto = {
        // Basic Info
        title: formValue.title,
        description: formValue.description,
        
        // ✅ FIX: Send propertyTypeId as integer (not string)
        propertyTypeId: parseInt(formValue.propertyType), 
        
        // Location
        address: formValue.address,
        city: formValue.city,
        country: formValue.country,
        postalCode: formValue.postalCode || null,
        latitude: parseFloat(formValue.latitude),
        longitude: parseFloat(formValue.longitude),
        
        // Capacity
        numberOfBedrooms: parseInt(formValue.numberOfBedrooms),
        numberOfBathrooms: parseInt(formValue.numberOfBathrooms),
        maxGuests: parseInt(formValue.maxGuests),
        
        // Pricing
        pricePerNight: parseFloat(formValue.pricePerNight),
        cleaningFee: formValue.cleaningFee ? parseFloat(formValue.cleaningFee) : null,
        
        // Rules
        houseRules: formValue.houseRules || null,
        checkInTime: formValue.checkInTime || null,
        checkOutTime: formValue.checkOutTime || null,
        minimumStay: parseInt(formValue.minimumStay),
        
        // Amenities
        amenityIds: formValue.amenityIds.map((id: number) => parseInt(id.toString()))
      };

      console.log('✅ Submitting property with correct types:', createPropertyDto);

      // Create property
      this.propertyService.createProperty(createPropertyDto as any).subscribe({
        next: async (response) => {
          console.log('✅ Property created successfully:', response);
          const propertyId = response.id;

          // Upload images one by one
          if (this.selectedFiles.length > 0) {
            try {
              console.log(`📤 Uploading ${this.selectedFiles.length} images...`);
              await this.propertyService.uploadPropertyImages(propertyId, this.selectedFiles).toPromise();
              console.log('✅ All images uploaded successfully');
            } catch (error) {
              console.error('❌ Error uploading images:', error);
              alert('Property created but some images failed to upload. You can add them later from the edit page.');
            }
          }

          alert('Property created successfully!');
          this.router.navigate(['/host/properties']);
        },
        error: (error) => {
          console.error('❌ Error creating property:', error);
          console.error('Error details:', error.error);
          
          if (error.status === 401) {
            alert('Authentication required. Please login first.');
            this.router.navigate(['/login']);
          } else if (error.status === 400) {
            const errorMessage = error?.error?.errors 
              ? 'Validation errors:\n' + JSON.stringify(error.error.errors, null, 2)
              : error?.error?.message || 'Invalid data. Please check your input.';
            alert(errorMessage);
          } else {
            const errorMessage = error?.error?.message 
              || error?.message 
              || 'Failed to create property. Please try again.';
            alert(errorMessage);
          }
          
          this.isSubmitting = false;
        }
      });
    } catch (error: any) {
      console.error('❌ Unexpected error creating property:', error);
      alert(error?.message || 'An unexpected error occurred');
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
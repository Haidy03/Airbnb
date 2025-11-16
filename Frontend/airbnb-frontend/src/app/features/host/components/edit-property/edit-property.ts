// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// import { ActivatedRoute, Router } from '@angular/router';
// import { PropertyService } from '../../services/property';
// import { Property, UpdatePropertyRequest, PropertyType, PROPERTY_TYPES } from '../../models/property.model';
// import { AMENITIES_LIST, Amenity } from '../../models/amenity.model';
// import { PropertyImage } from '../../models/image.model';

// @Component({
//   selector: 'app-edit-property',
//   imports: [CommonModule, ReactiveFormsModule],
//   templateUrl: './edit-property.html',
//   styleUrl: './edit-property.css',
// })
// export class EditProperty implements OnInit{
//   propertyForm!: FormGroup;
//   propertyTypes = PROPERTY_TYPES;
//   amenitiesList = AMENITIES_LIST;
//   selectedAmenities: string[] = [];
  
//   currentStep = 1;
//   totalSteps = 4;
  
//   // Property Data
//   propertyId!: string;
//   property!: Property;
//   existingImages: PropertyImage[] = [];
  
//   // New Image Upload
//   newImages: File[] = [];
//   newImagePreviewUrls: string[] = [];
  
//   isLoading = true;
//   isSubmitting = false;
//   deletedImageIds: string[] = [];

//   constructor(
//     private fb: FormBuilder,
//     private propertyService: PropertyService,
//     private router: Router,
//     private route: ActivatedRoute
//   ) {}

//   ngOnInit(): void {
//     this.propertyId = this.route.snapshot.params['id'];
//     this.initializeForm();
//     this.loadPropertyData();
//   }

//   initializeForm(): void {
//     this.propertyForm = this.fb.group({
//       // Step 1: Basic Info
//       title: ['', [Validators.required, Validators.maxLength(200)]],
//       description: ['', [Validators.required, Validators.maxLength(2000)]],
//       propertyType: [PropertyType.Apartment, Validators.required],
      
//       // Step 2: Details
//       pricePerNight: ['', [Validators.required, Validators.min(1)]],
//       maxGuests: ['', [Validators.required, Validators.min(1), Validators.max(50)]],
//       bedrooms: ['', [Validators.required, Validators.min(0)]],
//       bathrooms: ['', [Validators.required, Validators.min(0)]],
      
//       // Step 3: Location
//       address: ['', Validators.required],
//       city: ['', Validators.required],
//       country: ['', Validators.required],
//       latitude: [''],
//       longitude: ['']
//     });
//   }

//   loadPropertyData(): void {
//     this.isLoading = true;
//     this.propertyService.getPropertyById(this.propertyId).subscribe({
//       next: (property) => {
//         if (property) {
//           this.property = property;
//           this.existingImages = [...property.images];
//           this.populateForm();
//           this.isLoading = false;
//         } else {
//           alert('Property not found');
//           this.router.navigate(['/host/my-properties']);
//         }
//       },
//       error: (error) => {
//         console.error('Error loading property:', error);
//         alert('Failed to load property');
//         this.router.navigate(['/host/my-properties']);
//       }
//     });
//   }

//   populateForm(): void {
//     this.propertyForm.patchValue({
//       title: this.property.title,
//       description: this.property.description,
//       propertyType: this.property.propertyType,
//       pricePerNight: this.property.pricePerNight,
//       maxGuests: this.property.maxGuests,
//       bedrooms: this.property.bedrooms,
//       bathrooms: this.property.bathrooms,
//       address: this.property.address,
//       city: this.property.city,
//       country: this.property.country,
//       latitude: this.property.latitude || '',
//       longitude: this.property.longitude || ''
//     });

//     // Set selected amenities
//     this.selectedAmenities = this.property.amenities.map(a => a.id);
//   }

//   // Step Navigation
//   nextStep(): void {
//     if (this.currentStep < this.totalSteps) {
//       if (this.isCurrentStepValid()) {
//         this.currentStep++;
//       } else {
//         this.markStepAsTouched();
//       }
//     }
//   }

//   previousStep(): void {
//     if (this.currentStep > 1) {
//       this.currentStep--;
//     }
//   }

//   isCurrentStepValid(): boolean {
//     switch (this.currentStep) {
//       case 1:
//         return this.propertyForm.get('title')?.valid && 
//                this.propertyForm.get('description')?.valid &&
//                this.propertyForm.get('propertyType')?.valid || false;
//       case 2:
//         return this.propertyForm.get('pricePerNight')?.valid &&
//                this.propertyForm.get('maxGuests')?.valid &&
//                this.propertyForm.get('bedrooms')?.valid &&
//                this.propertyForm.get('bathrooms')?.valid || false;
//       case 3:
//         return this.propertyForm.get('address')?.valid &&
//                this.propertyForm.get('city')?.valid &&
//                this.propertyForm.get('country')?.valid || false;
//       case 4:
//         return true;
//       default:
//         return false;
//     }
//   }

//   markStepAsTouched(): void {
//     switch (this.currentStep) {
//       case 1:
//         this.propertyForm.get('title')?.markAsTouched();
//         this.propertyForm.get('description')?.markAsTouched();
//         this.propertyForm.get('propertyType')?.markAsTouched();
//         break;
//       case 2:
//         this.propertyForm.get('pricePerNight')?.markAsTouched();
//         this.propertyForm.get('maxGuests')?.markAsTouched();
//         this.propertyForm.get('bedrooms')?.markAsTouched();
//         this.propertyForm.get('bathrooms')?.markAsTouched();
//         break;
//       case 3:
//         this.propertyForm.get('address')?.markAsTouched();
//         this.propertyForm.get('city')?.markAsTouched();
//         this.propertyForm.get('country')?.markAsTouched();
//         break;
//     }
//   }

//   // Amenities
//   toggleAmenity(amenityId: string): void {
//     const index = this.selectedAmenities.indexOf(amenityId);
//     if (index > -1) {
//       this.selectedAmenities.splice(index, 1);
//     } else {
//       this.selectedAmenities.push(amenityId);
//     }
//   }

//   isAmenitySelected(amenityId: string): boolean {
//     return this.selectedAmenities.includes(amenityId);
//   }

//   // Existing Images Management
//   removeExistingImage(imageId: string): void {
//     if (confirm('Are you sure you want to delete this image?')) {
//       this.deletedImageIds.push(imageId);
//       this.existingImages = this.existingImages.filter(img => img.id !== imageId);
//     }
//   }

//   setPrimaryImage(imageId: string): void {
//     this.existingImages = this.existingImages.map(img => ({
//       ...img,
//       isPrimary: img.id === imageId
//     }));
//   }

//   // New Image Upload
//   onNewImageSelect(event: any): void {
//     const files = event.target.files;
//     if (files && files.length > 0) {
//       for (let i = 0; i < files.length; i++) {
//         const file = files[i];
        
//         // Validate file type
//         if (!file.type.match(/image\/(jpg|jpeg|png)/)) {
//           alert('Please upload only JPG, JPEG or PNG images');
//           continue;
//         }
        
//         // Validate file size (5MB max)
//         if (file.size > 5 * 1024 * 1024) {
//           alert('Image size should not exceed 5MB');
//           continue;
//         }
        
//         this.newImages.push(file);
        
//         // Create preview
//         const reader = new FileReader();
//         reader.onload = (e: any) => {
//           this.newImagePreviewUrls.push(e.target.result);
//         };
//         reader.readAsDataURL(file);
//       }
//     }
//   }

//   removeNewImage(index: number): void {
//     this.newImages.splice(index, 1);
//     this.newImagePreviewUrls.splice(index, 1);
//   }

//   // Form Submission
//   onSubmit(): void {
//     if (this.propertyForm.invalid) {
//       Object.keys(this.propertyForm.controls).forEach(key => {
//         this.propertyForm.get(key)?.markAsTouched();
//       });
//       return;
//     }

//     this.isSubmitting = true;

//     const formValue = this.propertyForm.value;
//     const request: UpdatePropertyRequest = {
//       title: formValue.title,
//       description: formValue.description,
//       propertyType: formValue.propertyType,
//       pricePerNight: formValue.pricePerNight,
//       maxGuests: formValue.maxGuests,
//       bedrooms: formValue.bedrooms,
//       bathrooms: formValue.bathrooms,
//       address: formValue.address,
//       city: formValue.city,
//       country: formValue.country,
//       latitude: formValue.latitude || undefined,
//       longitude: formValue.longitude || undefined,
//       amenityIds: this.selectedAmenities
//     };

//     this.propertyService.updateProperty(this.propertyId, request).subscribe({
//       next: (property) => {
//         console.log('Property updated:', property);
        
//         // Delete removed images
//         this.deleteRemovedImages(() => {
//           // Upload new images if any
//           if (this.newImages.length > 0) {
//             this.propertyService.uploadPropertyImages(this.propertyId, this.newImages).subscribe({
//               next: (images) => {
//                 console.log('New images uploaded:', images);
//                 this.navigateToMyProperties();
//               },
//               error: (error) => {
//                 console.error('Error uploading new images:', error);
//                 alert('Property updated but failed to upload new images');
//                 this.navigateToMyProperties();
//               }
//             });
//           } else {
//             this.navigateToMyProperties();
//           }
//         });
//       },
//       error: (error) => {
//         console.error('Error updating property:', error);
//         alert('Failed to update property. Please try again.');
//         this.isSubmitting = false;
//       }
//     });
//   }

//   deleteRemovedImages(callback: () => void): void {
//     if (this.deletedImageIds.length === 0) {
//       callback();
//       return;
//     }

//     let deletedCount = 0;
//     this.deletedImageIds.forEach(imageId => {
//       this.propertyService.deletePropertyImage(imageId).subscribe({
//         next: () => {
//           deletedCount++;
//           if (deletedCount === this.deletedImageIds.length) {
//             callback();
//           }
//         },
//         error: (error) => {
//           console.error('Error deleting image:', error);
//           deletedCount++;
//           if (deletedCount === this.deletedImageIds.length) {
//             callback();
//           }
//         }
//       });
//     });
//   }

//   navigateToMyProperties(): void {
//     alert('Property updated successfully!');
//     this.router.navigate(['/host/my-properties']);
//   }

//   // Helper Methods
//   getErrorMessage(fieldName: string): string {
//     const control = this.propertyForm.get(fieldName);
//     if (control?.hasError('required')) {
//       return 'This field is required';
//     }
//     if (control?.hasError('maxLength')) {
//       return `Maximum ${control.errors?.['maxLength'].requiredLength} characters allowed`;
//     }
//     if (control?.hasError('min')) {
//       return `Minimum value is ${control.errors?.['min'].min}`;
//     }
//     if (control?.hasError('max')) {
//       return `Maximum value is ${control.errors?.['max'].max}`;
//     }
//     return '';
//   }

//   getProgressPercentage(): number {
//     return (this.currentStep / this.totalSteps) * 100;
//   }
// }

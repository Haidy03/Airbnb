import { Component, OnInit, signal, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../services/property';
import { Property, HouseRules, SafetyDetails } from '../../models/property.model';
import * as L from 'leaflet'; // ✅ Import Leaflet

type EditorSection = 
  | 'photos' | 'title' | 'propertyType' | 'capacity' | 'description' 
  | 'amenities' | 'location' | 'pricing' | 'booking' | 'rules' | 'safety' | 'host';

@Component({
  selector: 'app-property-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './property-editor.html',
  styleUrls: ['./property-editor.css']
})
export class PropertyEditorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private propertyService = inject(PropertyService);

  property = signal<Property | null>(null);
  isLoading = signal(true);
  activeSection = signal<EditorSection>('title');
  loadingImages = signal<Set<string>>(new Set());
  // Edit Mode
  isEditing = signal(false);
  
  // Temp Values
  tempTitle = signal('');
  tempDescription = signal('');
  tempPrice = signal(0);
  tempPropertyType = signal('');
  tempRoomType = signal('');
  tempCapacity = signal({ guests: 1, bedrooms: 1, beds: 1, bathrooms: 1 });
  tempLocation = signal({ address: '', city: '', country: '', zipCode: '', lat: 0, lng: 0 });
  tempAmenities = signal<number[]>([]);
  tempInstantBook = signal(false);
  tempRules = signal<HouseRules>({
    checkInTime: '', checkOutTime: '', smokingAllowed: false, petsAllowed: false, 
    eventsAllowed: false, childrenAllowed: true
  });
  tempSafety = signal<SafetyDetails>({
    exteriorCamera: false, noiseMonitor: false, weapons: false
  });

  // Lists
  propertyTypesList = ['House', 'Apartment', 'Guesthouse', 'Hotel', 'Cabin', 'Villa', 'Loft'];
  roomTypesList = ['Entire place', 'Private room', 'Shared room'];
  
  // ✅ 1. Full Amenities List (Matches Backend/Database)
  availableAmenities = [
    { id: 1, name: 'WiFi', icon: 'wifi' },
    { id: 2, name: 'TV', icon: 'tv' },
    { id: 3, name: 'Kitchen', icon: 'utensils' },
    { id: 4, name: 'Washer', icon: 'washing-machine' },
    { id: 5, name: 'Dryer', icon: 'wind' },
    { id: 6, name: 'Air conditioning', icon: 'snowflake' },
    { id: 7, name: 'Heating', icon: 'flame' },
    { id: 8, name: 'Dedicated workspace', icon: 'briefcase' },
    { id: 9, name: 'Pool', icon: 'waves' },
    { id: 10, name: 'Hot tub', icon: 'hot-tub' },
    { id: 11, name: 'Patio', icon: 'home' },
    { id: 12, name: 'BBQ grill', icon: 'grill' },
    { id: 13, name: 'Outdoor dining', icon: 'utensils' },
    { id: 14, name: 'Fire pit', icon: 'flame' },
    { id: 15, name: 'Free parking', icon: 'parking' },
    { id: 16, name: 'Paid parking', icon: 'parking' },
    { id: 17, name: 'EV charger', icon: 'zap' },
    { id: 18, name: 'Smoke alarm', icon: 'alert-triangle' },
    { id: 19, name: 'Carbon monoxide alarm', icon: 'alert-circle' }
  ];

  // Map Setup
  private map: L.Map | undefined;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProperty(id);
    }
  }

  loadProperty(id: string) {
    this.propertyService.getPropertyById(id).subscribe({
      next: (data) => {
        this.property.set(data);
        this.isLoading.set(false);
        this.initTempValues(data);
      },
      error: (err) => {
        console.error(err);
        this.router.navigate(['/host/properties']);
      }
    });
  }

  initTempValues(prop: Property) {
    this.tempTitle.set(prop.title);
    this.tempDescription.set(prop.description);
    this.tempPrice.set(prop.pricing?.basePrice || 0);
    this.tempPropertyType.set(prop.propertyType);
    this.tempRoomType.set(prop.roomType);
    this.tempCapacity.set({ ...prop.capacity });
    
    this.tempLocation.set({ 
      address: prop.location?.address || '',
      city: prop.location?.city || '',
      country: prop.location?.country || '',
      zipCode: prop.location?.zipCode || '',
      lat: prop.location?.coordinates?.lat || 30.0444,
      lng: prop.location?.coordinates?.lng || 31.2357
    });

    this.tempAmenities.set([...prop.amenities]);
    this.tempInstantBook.set(prop.isInstantBook);
    if(prop.houseRules) this.tempRules.set({ ...prop.houseRules });
    if(prop.safetyDetails) this.tempSafety.set({ ...prop.safetyDetails });
  }

  setActiveSection(section: EditorSection) {
    if (section === 'host') {
      this.goToHostProfile();
      return;
    }
    this.activeSection.set(section);

    // ✅ 2. Initialize Map if Location Section is Active
    if (section === 'location') {
      setTimeout(() => {
        this.initMap();
      }, 100); // Small delay to ensure DOM is ready
    }
  }

  // ✅ Map Initialization Logic
  initMap() {
    if (this.map) {
      this.map.remove(); // Reset if already exists
    }

    const lat = this.tempLocation().lat || 30.0444;
    const lng = this.tempLocation().lng || 31.2357;

    const container = document.getElementById('editor-map');
    if (!container) return;

    this.map = L.map('editor-map').setView([lat, lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'OpenStreetMap'
    }).addTo(this.map);

    L.marker([lat, lng]).addTo(this.map);
  }

  // Capacity Helpers
  updateCapacity(field: 'guests' | 'bedrooms' | 'beds' | 'bathrooms', change: number) {
    const current = this.tempCapacity();
    const newValue = current[field] + change;
    if (newValue >= 0) {
      this.tempCapacity.set({ ...current, [field]: newValue });
    }
  }

  // Amenities Helpers
  toggleAmenity(id: number) {
    const current = this.tempAmenities();
    if (current.includes(id)) {
      this.tempAmenities.set(current.filter(a => a !== id));
    } else {
      this.tempAmenities.set([...current, id]);
    }
  }

  canToggleStatus(): boolean {
    const p = this.property();
    if (!p) return false;
    // Assuming status can be checked via isActive boolean for simplicity in UI
    return p.isApproved || p.isActive; 
  }

  getStatusText(): string {
    return this.property()?.isActive ? 'Listed' : 'Unlisted';
  }

  onStatusToggle(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    const prop = this.property();
    if (!prop) return;

    this.isLoading.set(true);
    const action = isChecked ? this.propertyService.activateProperty(prop.id) : this.propertyService.deactivateProperty(prop.id);

    action.subscribe({
      next: (updatedProp) => {
        this.property.set(updatedProp);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        (event.target as HTMLInputElement).checked = !isChecked; // Revert
        alert('Failed to update status: ' + err.message);
      }
    });
  }

  saveChanges() {
    const prop = this.property();
    if (!prop) return;

    const section = this.activeSection();
    let updates: any = {};

    switch (section) {
      case 'title': updates.title = this.tempTitle(); break;
      case 'description': updates.description = this.tempDescription(); break;
      case 'pricing': updates.pricePerNight = this.tempPrice(); break;
      case 'propertyType': 
        updates.propertyType = this.tempPropertyType(); 
        updates.roomType = this.tempRoomType(); 
        break;
      case 'capacity': 
        updates.numberOfBedrooms = this.tempCapacity().bedrooms;
        updates.numberOfBathrooms = this.tempCapacity().bathrooms;
        updates.maxGuests = this.tempCapacity().guests;
        // Note: Beds might not be in flat DTO, verify backend
        break;
      case 'location': 
        updates.address = this.tempLocation().address;
        updates.city = this.tempLocation().city;
        updates.country = this.tempLocation().country;
        break;
      case 'amenities': 
        // ✅ Fix 500 Error: Ensure we send property ID and array of numbers
        updates.amenityIds = this.tempAmenities(); 
        break;
      case 'booking': updates.isInstantBook = this.tempInstantBook(); break;
      case 'rules': updates.houseRules = this.tempRules(); break;
      case 'safety': updates.safetyDetails = this.tempSafety(); break;
    }

    this.propertyService.updateProperty(prop.id, updates).subscribe({
      next: (updatedProp) => {
        this.property.set(updatedProp);
        alert('Saved successfully!');
      },
      error: (err) => {
        console.error(err);
        alert('Failed to save changes. Please check your input.');
      }
    });
  }
  handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    const prop = this.property();
    
    if (!prop) return;

    // Show global loading or toast
    this.isLoading.set(true); 

    this.propertyService.uploadPropertyImages(prop.id, files).subscribe({
      next: (newImages) => {
        // Refresh property data to show new images
        this.loadProperty(prop.id);
        // Reset input
        input.value = '';
      },
      error: (err) => {
        this.isLoading.set(false);
        alert('Failed to upload images: ' + err.message);
      }
    });
  }

  // ✅ 2. Delete Image
  deleteImage(imageId: string) {
    const prop = this.property();
    if (!prop) return;

    if (!confirm('Delete this photo?')) return;

    // Add to loading set
    this.loadingImages.update(set => { set.add(imageId); return new Set(set); });

    this.propertyService.deletePropertyImage(imageId).subscribe({
      next: () => {
        // Remove from UI immediately for better UX
        const updatedImages = prop.images.filter(img => img.id !== imageId);
        this.property.update(p => p ? { ...p, images: updatedImages } : null);
        
        this.loadingImages.update(set => { set.delete(imageId); return new Set(set); });
      },
      error: (err) => {
        alert('Failed to delete image');
        this.loadingImages.update(set => { set.delete(imageId); return new Set(set); });
      }
    });
  }

  // ✅ 3. Set Primary (Cover) Image
  setAsPrimary(imageId: string) {
    const prop = this.property();
    if (!prop) return;

    this.isLoading.set(true);

    this.propertyService.setPrimaryImage(imageId).subscribe({
      next: () => {
        // Update UI locally to reflect change immediately
        const updatedImages = prop.images.map(img => ({
          ...img,
          isPrimary: img.id === imageId // Set true for selected, false for others
        })).sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)); // Move primary to front

        // Update cover image property
        const newCover = updatedImages.find(i => i.isPrimary)?.url || '';
        
        this.property.update(p => p ? { ...p, images: updatedImages, coverImage: newCover } : null);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        alert('Failed to update cover photo');
      }
    });
  }

  // Helper for loader
  isImageLoading(id: string) {
    return this.loadingImages().has(id);
  }

  // ✅ 3. Delete Property Logic
  deleteProperty() {
    const prop = this.property();
    if (!prop) return;

    if (confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      this.isLoading.set(true);
      this.propertyService.deleteDraft(prop.id).subscribe({
        next: () => {
          alert('Property deleted successfully.');
          this.router.navigate(['/host/properties']);
        },
        error: (err) => {
          this.isLoading.set(false);
          alert('Failed to delete property: ' + err.message);
        }
      });
    }
  }

  getCoverImage(): string {
    return this.property()?.coverImage || '/assets/images/placeholder-property.jpg';
  }

  viewListing() {
    const prop = this.property();
    if (prop && prop.id) {
      const url = this.router.serializeUrl(this.router.createUrlTree(['/listing', prop.id]));
      window.open(url, '_blank');
    }
  }

  goToHostProfile() {
    this.router.navigate(['/profile']);
  }
}
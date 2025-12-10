import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../services/property';
import { Property, HouseRules, SafetyDetails } from '../../models/property.model';
import * as L from 'leaflet'; // ✅ Import Leaflet
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

type EditorSection = 
  | 'photos' | 'title' | 'propertyType' | 'capacity' | 'description' 
  | 'amenities' | 'location' | 'pricing' | 'booking' | 'rules' | 'safety' | 'host';

interface PropTypeOption {
  id: number;
  name: string;
}

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
  private http = inject(HttpClient);
  public authService = inject(AuthService);
  private notificationService = inject(NotificationService); 

  property = signal<Property | null>(null);
  isLoading = signal(true);
  activeSection = signal<EditorSection>('title');
  loadingImages = signal<Set<string>>(new Set());
  isEditing = signal(false);
  tempTitle = signal('');
  tempDescription = signal('');
  tempPrice = signal(0);
  tempCleaningFee = signal<number | null>(null); 
  tempPropertyType = signal<number | null>(null); 
  tempRoomType = signal('');
  tempCapacity = signal({ guests: 1, bedrooms: 1, beds: 1, bathrooms: 1 });
  tempLocation = signal({ address: '', city: '', country: '', zipCode: '', lat: 0, lng: 0 });
  tempAmenities = signal<number[]>([]);
  tempInstantBook = signal(false);
  tempRules = signal<{ checkInTime: string; checkOutTime: string }>({
    checkInTime: '', 
    checkOutTime: ''
  });
  tempSafety = signal<SafetyDetails>({
    exteriorCamera: false, noiseMonitor: false, weapons: false
  });


  propertyTypesList: PropTypeOption[] = [
    { id: 1, name: 'House' },
    { id: 2, name: 'Apartment' },
    { id: 3, name: 'Barn' },
    { id: 4, name: 'Bed & breakfast' },
    { id: 5, name: 'Boat' },
    { id: 6, name: 'Cabin' },
    { id: 7, name: 'Camper/RV' },
    { id: 8, name: 'Casa particular' },
    { id: 9, name: 'Castle' },
    { id: 10, name: 'Cave' },
    { id: 11, name: 'Container' },
    { id: 12, name: 'Cycladic home' }
  ];

  roomTypesList = [
    { value: 'entire_place', label: 'Entire place' },
    { value: 'private_room', label: 'Private room' },
    { value: 'shared_room', label: 'Shared room' }
  ];
  
  // Full Amenities List
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
  private marker: L.Marker | undefined;

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
        this.notificationService.showError('Failed to load property details.');
        this.router.navigate(['/host/properties']);
      }
    });
  }

  handleImageError(event: any) {
    event.target.style.display = 'none';
  }

  initTempValues(prop: Property) {
    this.tempTitle.set(prop.title);
    this.tempDescription.set(prop.description);
    this.tempPrice.set(prop.pricing?.basePrice || 0);
    this.tempCleaningFee.set(prop.pricing?.cleaningFee || null);
    // Property Type Logic
    if ((prop as any).propertyTypeId) {
      this.tempPropertyType.set((prop as any).propertyTypeId);
    } else {
      const match = this.propertyTypesList.find(t => t.name === prop.propertyType);
      if (match) this.tempPropertyType.set(match.id);
    }

    this.tempRoomType.set(prop.roomType);
    this.tempCapacity.set({ ...prop.capacity });
    
    this.tempLocation.set({ 
      address: prop.location?.address || '',
      city: prop.location?.city || '',
      country: prop.location?.country || '',
      zipCode: prop.location?.zipCode || '',
      // state: prop.location?.state || '',
      lat: prop.location?.coordinates?.lat || 30.0444,
      lng: prop.location?.coordinates?.lng || 31.2357
    });

    this.tempAmenities.set([...prop.amenities]);
    console.log('Database Value for InstantBook:', prop.isInstantBook);
    this.tempInstantBook.set(prop.isInstantBook === true);

    // ✅ House Rules Logic (Fix: Close brackets correctly)
    const formatTime = (time: any) => {
      if (!time) return '';
      return String(time).substring(0, 5);
    };
    if (prop.houseRules) {
      this.tempRules.set({
        checkInTime: formatTime(prop.houseRules.checkInTime),
        checkOutTime: formatTime(prop.houseRules.checkOutTime)
      });
    }

    // Safety Details
    if(prop.safetyDetails) this.tempSafety.set({ ...prop.safetyDetails });
  }

  setActiveSection(section: EditorSection) {
    if (section === 'host') {
      this.goToHostProfile();
      return;
    }
    this.activeSection.set(section);

    // Initialize Map if Location Section is Active
    if (section === 'location') {
      setTimeout(() => {
        this.initMap();
      }, 100); 
    }
  }

  initMap() {
    if (this.map) {
      this.map.remove();
    }

    const lat = this.tempLocation().lat || 30.0444;
    const lng = this.tempLocation().lng || 31.2357;

    const container = document.getElementById('editor-map');
    if (!container) return;

    this.map = L.map('editor-map').setView([lat, lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'OpenStreetMap'
    }).addTo(this.map);

    // ✅ Custom Red Icon
    const redIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],      
      iconAnchor: [12, 41],   
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    this.marker = L.marker([lat, lng], { 
      draggable: true,
      icon: redIcon 
    }).addTo(this.map);

    this.marker.on('dragend', () => {
      const position = this.marker!.getLatLng();
      this.updateCoordinates(position.lat, position.lng);
      this.getAddressFromCoordinates(position.lat, position.lng);
    });

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      this.marker!.setLatLng([lat, lng]);
      this.updateCoordinates(lat, lng);
    });
    this.getAddressFromCoordinates(lat, lng);
    setTimeout(() => {
        this.map?.invalidateSize();
    }, 200);
  }

  updateCoordinates(lat: number, lng: number) {
    const current = this.tempLocation();
    this.tempLocation.set({ ...current, lat, lng });
    console.log('📍 New Location:', lat, lng);
  }

  updateCapacity(field: 'guests' | 'bedrooms' | 'beds' | 'bathrooms', change: number) {
    const current = this.tempCapacity();
    const newValue = current[field] + change;
    if (newValue >= 0) {
      this.tempCapacity.set({ ...current, [field]: newValue });
    }
  }

  // ✅ New helper for updating Rules Time
  updateRule(field: 'checkInTime' | 'checkOutTime', value: string) {
    const current = this.tempRules();
    this.tempRules.set({ ...current, [field]: value });
  }

  toggleAmenity(id: number) {
    const current = this.tempAmenities();
    if (current.includes(id)) {
      this.tempAmenities.set(current.filter(a => a !== id));
    } else {
      this.tempAmenities.set([...current, id]);
    }
  }

  getAddressFromCoordinates(lat: number, lng: number) {
   
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

    this.http.get<any>(url).subscribe({
      next: (data) => {
        const address = data.address;
        const currentLocation = this.tempLocation();
        
        this.tempLocation.set({
          ...currentLocation,
          address: `${address.house_number || ''} ${address.road || ''}`.trim() || currentLocation.address,
          city: address.city || address.town || address.village || address.county || currentLocation.city,
          country: address.country || currentLocation.country,
          zipCode: address.postcode || currentLocation.zipCode,
          lat: lat,
          lng: lng
        });
        
        console.log('📍 Address Updated:', address);
      },
      error: (err) => {
        console.error('Error fetching address:', err);
      }
    });
  }

  setBookingType(isInstant: boolean) {
    this.tempInstantBook.set(isInstant);
  }

  toggleSafety(field: 'exteriorCamera' | 'noiseMonitor' | 'weapons') {
    const current = this.tempSafety();
    this.tempSafety.set({
      ...current,
      [field]: !current[field]
    });
  }

  canToggleStatus(): boolean {
    const p = this.property();
    if (!p) return false;
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
        this.notificationService.showToast('success', isChecked ? 'Listing published!' : 'Listing unlisted.');
      },
      error: (err) => {
        this.isLoading.set(false);
        (event.target as HTMLInputElement).checked = !isChecked;
        this.notificationService.showError('Failed to update status: ' + err.message); 
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
      case 'pricing': 
      updates.pricePerNight = this.tempPrice();
      updates.cleaningFee = this.tempCleaningFee();
       break;
      case 'propertyType': 
        updates.propertyTypeId = this.tempPropertyType(); 
        updates.roomType = this.tempRoomType(); 
        break;
      case 'capacity': 
        updates.numberOfBedrooms = this.tempCapacity().bedrooms;
        updates.numberOfBathrooms = this.tempCapacity().bathrooms;
        updates.maxGuests = this.tempCapacity().guests;
        break;
      case 'location': 
        updates.address = this.tempLocation().address;
        updates.city = this.tempLocation().city;
        updates.country = this.tempLocation().country;
        updates.postalCode = this.tempLocation().zipCode; 
       // updates.state = this.tempLocation().state;
        updates.latitude = this.tempLocation().lat; 
        updates.longitude = this.tempLocation().lng;
        break;
      case 'amenities': 
        updates.amenityIds = this.tempAmenities(); 
        break;
      case 'booking': updates.isInstantBook = this.tempInstantBook(); break;
      case 'rules': 
   
        updates.checkInTime = this.tempRules().checkInTime;
        updates.checkOutTime = this.tempRules().checkOutTime;
        break;
      case 'safety': 
        const safety = this.tempSafety();
        updates.hasExteriorCamera = safety.exteriorCamera;
        updates.hasNoiseMonitor = safety.noiseMonitor;
        updates.hasWeapons = safety.weapons;
        break;
    }

    this.propertyService.updateProperty(prop.id, updates).subscribe({
      next: (updatedProp) => {
        this.property.set(updatedProp);
        this.notificationService.showToast('success', 'Changes saved successfully');
      },
      error: (err) => {
        console.error(err);
        this.notificationService.showError('Failed to save changes. Please check your input.'); 
      }
    });
  }

  handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    const prop = this.property();
    
    if (!prop) return;

    this.isLoading.set(true); 

    this.propertyService.uploadPropertyImages(prop.id, files).subscribe({
      next: (newImages) => {
        this.loadProperty(prop.id);
        input.value = '';
        this.notificationService.showToast('success', 'Photos uploaded successfully'); 
      },
      error: (err) => {
        this.isLoading.set(false);
        this.notificationService.showError('Failed to upload images: ' + err.message);
      }
    });
  }

  async deleteImage(imageId: string) {
    const prop = this.property();
    if (!prop) return;

    const confirmed = await this.notificationService.confirmAction('Delete Photo?', 'Are you sure you want to delete this photo?'); // ✅
    if (!confirmed) return;

    this.loadingImages.update(set => { set.add(imageId); return new Set(set); });

    this.propertyService.deletePropertyImage(imageId).subscribe({
      next: () => {
        const updatedImages = prop.images.filter(img => img.id !== imageId);
        this.property.update(p => p ? { ...p, images: updatedImages } : null);
        
        this.loadingImages.update(set => { set.delete(imageId); return new Set(set); });
        this.notificationService.showToast('success', 'Photo deleted'); // ✅
      },
      error: (err) => {
        this.notificationService.showError('Failed to delete image'); // ✅
        this.loadingImages.update(set => { set.delete(imageId); return new Set(set); });
      }
    });
  }

  setAsPrimary(imageId: string) {
    const prop = this.property();
    if (!prop) return;

    this.isLoading.set(true);

    this.propertyService.setPrimaryImage(imageId).subscribe({
      next: () => {
        const updatedImages = prop.images.map(img => ({
          ...img,
          isPrimary: img.id === imageId 
        })).sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)); 

        const newCover = updatedImages.find(i => i.isPrimary)?.url || '';
        
        this.property.update(p => p ? { ...p, images: updatedImages, coverImage: newCover } : null);
        this.isLoading.set(false);
        this.notificationService.showToast('success', 'Cover photo updated');
      },
      error: (err) => {
        this.isLoading.set(false);
        this.notificationService.showError('Failed to update cover photo'); 
      }
    });
  }

  isImageLoading(id: string) {
    return this.loadingImages().has(id);
  }

  async deleteProperty() {
    const prop = this.property();
    if (!prop) return;

    const confirmed = await this.notificationService.confirmAction(
      'Delete Listing?', 
      'Are you sure you want to delete this listing? This action cannot be undone.',
      'Yes, delete'
    ); // ✅

    if (confirmed) {
      this.isLoading.set(true);
      this.propertyService.deleteDraft(prop.id).subscribe({
        next: () => {
          this.notificationService.showSuccess('Deleted', 'Property deleted successfully.'); // ✅
          this.router.navigate(['/host/properties']);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.notificationService.showError('Failed to delete property: ' + err.message); // ✅
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
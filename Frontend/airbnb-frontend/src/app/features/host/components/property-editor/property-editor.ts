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
  
  // ✅ تعديل: المتغير أصبح يحمل رقم (ID) بدلاً من نص
  tempPropertyType = signal<number | null>(null); 
  
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

  // ✅ القائمة الجديدة المطابقة لقاعدة البيانات
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

  roomTypesList = ['Entire place', 'Private room', 'Shared room'];
  
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
    
    // ✅ تعديل: منطق تحديد النوع (ID)
    // إذا كان الباك اند يرسل propertyTypeId نستخدمه، وإلا نبحث بالاسم
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
      //state: prop.location?.state || '',
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

    // Initialize Map if Location Section is Active
    if (section === 'location') {
      setTimeout(() => {
        this.initMap();
      }, 100); 
    }
  }
  private marker: L.Marker | undefined;
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

  
    const redIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],      
      iconAnchor: [12, 41],   
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    // ✅ 2. استخدام الأيقونة الجديدة هنا
    this.marker = L.marker([lat, lng], { 
      draggable: true,
      icon: redIcon // 👈 ربط الأيقونة بالماركر
    }).addTo(this.map);

    this.marker.on('dragend', () => {
      const position = this.marker!.getLatLng();
      this.updateCoordinates(position.lat, position.lng);
    });

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      this.marker!.setLatLng([lat, lng]);
      this.updateCoordinates(lat, lng);
    });
    
    setTimeout(() => {
        this.map?.invalidateSize();
    }, 200);
  }

  // دالة مساعدة لتحديث الإحداثيات في الـ Signal
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

  toggleAmenity(id: number) {
    const current = this.tempAmenities();
    if (current.includes(id)) {
      this.tempAmenities.set(current.filter(a => a !== id));
    } else {
      this.tempAmenities.set([...current, id]);
    }
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
      },
      error: (err) => {
        this.isLoading.set(false);
        (event.target as HTMLInputElement).checked = !isChecked;
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
        updates.postalCode = this.tempLocation().zipCode; // تأكد من اسم الحقل في الباك اند (zipCode vs postalCode)
       // updates.state = this.tempLocation().state;
        updates.latitude = this.tempLocation().lat; 
        updates.longitude = this.tempLocation().lng;
        break;
      case 'amenities': 
        updates.amenityIds = this.tempAmenities(); 
        break;
      case 'booking': updates.isInstantBook = this.tempInstantBook(); break;
      case 'rules': updates.houseRules = this.tempRules(); break;
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

    this.isLoading.set(true); 

    this.propertyService.uploadPropertyImages(prop.id, files).subscribe({
      next: (newImages) => {
        this.loadProperty(prop.id);
        input.value = '';
      },
      error: (err) => {
        this.isLoading.set(false);
        alert('Failed to upload images: ' + err.message);
      }
    });
  }

  deleteImage(imageId: string) {
    const prop = this.property();
    if (!prop) return;

    if (!confirm('Delete this photo?')) return;

    this.loadingImages.update(set => { set.add(imageId); return new Set(set); });

    this.propertyService.deletePropertyImage(imageId).subscribe({
      next: () => {
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
      },
      error: (err) => {
        this.isLoading.set(false);
        alert('Failed to update cover photo');
      }
    });
  }

  isImageLoading(id: string) {
    return this.loadingImages().has(id);
  }

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
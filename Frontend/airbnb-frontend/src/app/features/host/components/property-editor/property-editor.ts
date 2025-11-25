import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../services/property';
import { Property } from '../../models/property.model';

// ✅ تعريف كل الأقسام المتاحة في الـ Editor
type EditorSection = 
  | 'photos' 
  | 'title' 
  | 'description' 
  | 'propertyType' 
  | 'location' 
  | 'amenities' 
  | 'pricing' 
  | 'safety';

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
  activeSection = signal<EditorSection>('propertyType'); // Default section
  
  // Edit Mode State
  isEditing = signal(false);
  
  // ✅ Temporary values for all sections (Form Models)
  tempTitle = signal('');
  tempDescription = signal('');
  tempPrice = signal(0);
  tempPropertyType = signal('');
  tempRoomType = signal('');
  tempLocation = signal({ address: '', city: '', country: '', zipCode: '' });
  tempAmenities = signal<number[]>([]);
  
  // Mock Data for Dropdowns (يمكنك جلبها من السيرفس لاحقاً)
  propertyTypesList = ['House', 'Apartment', 'Guesthouse', 'Hotel', 'Cabin'];
  roomTypesList = ['Entire place', 'Private room', 'Shared room'];
  
  // Mock Amenities List (نفس الموجود في ملف Amenities)
  availableAmenities = [
    { id: 1, name: 'WiFi', icon: 'wifi' },
    { id: 2, name: 'TV', icon: 'tv' },
    { id: 3, name: 'Kitchen', icon: 'utensils' },
    { id: 4, name: 'Washer', icon: 'washing-machine' },
    { id: 6, name: 'Air conditioning', icon: 'snowflake' },
    { id: 15, name: 'Free parking', icon: 'parking' },
    { id: 9, name: 'Pool', icon: 'waves' }
  ];

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
        this.initTempValues(data); // Initialize forms
      },
      error: (err) => {
        console.error(err);
        this.router.navigate(['/host/properties']);
      }
    });
  }

  // ✅ تعبئة القيم المؤقتة عند فتح الصفحة أو القسم
  initTempValues(prop: Property) {
    this.tempTitle.set(prop.title);
    this.tempDescription.set(prop.description);
    this.tempPrice.set(prop.pricing?.basePrice || 0);
    this.tempPropertyType.set(prop.propertyType);
    this.tempRoomType.set(prop.roomType);
    this.tempLocation.set({ ...prop.location });
    this.tempAmenities.set([...prop.amenities]);
  }

  setActiveSection(section: EditorSection) {
    // إذا كان هناك تعديلات غير محفوظة، يمكنك إضافة تنبيه هنا
    this.activeSection.set(section);
    this.isEditing.set(true); // Auto-enable edit mode for better UX
    
    // Re-sync temp values in case updates happened elsewhere
    if (this.property()) this.initTempValues(this.property()!);
  }

  toggleAmenity(id: number) {
    const current = this.tempAmenities();
    if (current.includes(id)) {
      this.tempAmenities.set(current.filter(a => a !== id));
    } else {
      this.tempAmenities.set([...current, id]);
    }
  }

  saveChanges() {
    const prop = this.property();
    if (!prop) return;

    const section = this.activeSection();
    let updates: any = {};

    // ✅ بناء كائن التحديث بناءً على القسم المفتوح
    switch (section) {
      case 'title':
        updates.title = this.tempTitle();
        break;
      case 'description':
        updates.description = this.tempDescription();
        break;
      case 'pricing':
        updates.pricePerNight = this.tempPrice();
        break;
      case 'propertyType':
        updates.propertyType = this.tempPropertyType();
        updates.roomType = this.tempRoomType();
        break;
      case 'location':
        updates.address = this.tempLocation().address;
        updates.city = this.tempLocation().city;
        updates.country = this.tempLocation().country;
        updates.postalCode = this.tempLocation().zipCode;
        break;
      case 'amenities':
        updates.amenityIds = this.tempAmenities();
        break;
    }

    // Call Service
    this.propertyService.updateProperty(prop.id, updates).subscribe({
      next: (updatedProp) => {
        this.property.set(updatedProp);
        // Optional: Show success toast
        alert('Saved successfully!');
      },
      error: (err) => alert('Failed to save changes')
    });
  }

  getCoverImage(): string {
    return this.property()?.coverImage || '/assets/images/placeholder-property.jpg';
  }
}
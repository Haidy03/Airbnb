// ============================================
// src/app/host/services/property.service.ts
// ============================================

import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { 
  Property, 
  CreatePropertyRequest, 
  UpdatePropertyRequest,
  HostDashboardStats 
} from '../models/property.model';
import { PropertyImage } from '../models/image.model';
import { MOCK_PROPERTIES, MOCK_DASHBOARD_STATS } from '../models/mock-data';

@Injectable({
  providedIn: 'root'
})
export class PropertyService {

  // في الوقت الحالي هنستخدم Mock Data
  // لما الـ Backend يخلص هنبدل الـ of() بـ this.http.get()
  
  private mockProperties = [...MOCK_PROPERTIES];
  private mockStats = MOCK_DASHBOARD_STATS;

  constructor() { }

  // ============================================
  // Get All Properties للـ Host
  // ============================================
  getHostProperties(hostId: string): Observable<Property[]> {
    // TODO: لما الـ Backend يخلص
    // return this.http.get<Property[]>(`${this.apiUrl}/properties/host/${hostId}`);
    
    // دلوقتي بنستخدم Mock Data
    console.log('Getting properties for host:', hostId);
    return of(this.mockProperties).pipe(delay(500)); // simulate API delay
  }

  // ============================================
  // Get Property By ID
  // ============================================
  getPropertyById(id: string): Observable<Property | undefined> {
    // TODO: لما الـ Backend يخلص
    // return this.http.get<Property>(`${this.apiUrl}/properties/${id}`);
    
    console.log('Getting property by id:', id);
    const property = this.mockProperties.find(p => p.id === id);
    return of(property).pipe(delay(300));
  }

  // ============================================
  // Create New Property
  // ============================================
  createProperty(request: CreatePropertyRequest): Observable<Property> {
    // TODO: لما الـ Backend يخلص
    // return this.http.post<Property>(`${this.apiUrl}/properties`, request);
    
    console.log('Creating property:', request);
    
    // Mock: إنشاء عقار جديد
    const newProperty: Property = {
      id: Date.now().toString(),
      hostId: 'host-1',
      title: request.title,
      description: request.description,
      propertyType: request.propertyType,
      propertyTypeName: this.getPropertyTypeName(request.propertyType),
      pricePerNight: request.pricePerNight,
      maxGuests: request.maxGuests,
      bedrooms: request.bedrooms,
      bathrooms: request.bathrooms,
      address: request.address,
      city: request.city,
      country: request.country,
      latitude: request.latitude,
      longitude: request.longitude,
      isActive: true,
      images: [],
      amenities: [],
      averageRating: 0,
      totalReviews: 0,
      totalBookings: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.mockProperties.push(newProperty);
    return of(newProperty).pipe(delay(800));
  }

  // ============================================
  // Update Property
  // ============================================
  updateProperty(id: string, request: UpdatePropertyRequest): Observable<Property> {
    // TODO: لما الـ Backend يخلص
    // return this.http.put<Property>(`${this.apiUrl}/properties/${id}`, request);
    
    console.log('Updating property:', id, request);
    
    // Mock: تحديث العقار
    const index = this.mockProperties.findIndex(p => p.id === id);
    if (index !== -1) {
      this.mockProperties[index] = {
        ...this.mockProperties[index],
        ...request,
        propertyTypeName: this.getPropertyTypeName(request.propertyType),
        updatedAt: new Date()
      };
      return of(this.mockProperties[index]).pipe(delay(800));
    }
    
    throw new Error('Property not found');
  }

  // ============================================
  // Delete Property
  // ============================================
  deleteProperty(id: string): Observable<boolean> {
    // TODO: لما الـ Backend يخلص
    // return this.http.delete<boolean>(`${this.apiUrl}/properties/${id}`);
    
    console.log('Deleting property:', id);
    
    // Mock: حذف العقار
    const index = this.mockProperties.findIndex(p => p.id === id);
    if (index !== -1) {
      this.mockProperties.splice(index, 1);
      return of(true).pipe(delay(500));
    }
    
    return of(false).pipe(delay(500));
  }

  // ============================================
  // Toggle Property Active Status
  // ============================================
  togglePropertyStatus(id: string): Observable<Property> {
    // TODO: لما الـ Backend يخلص
    // return this.http.patch<Property>(`${this.apiUrl}/properties/${id}/toggle-status`, {});
    
    console.log('Toggling property status:', id);
    
    // Mock: تغيير حالة العقار
    const property = this.mockProperties.find(p => p.id === id);
    if (property) {
      property.isActive = !property.isActive;
      property.updatedAt = new Date();
      return of(property).pipe(delay(500));
    }
    
    throw new Error('Property not found');
  }

  // ============================================
  // Upload Property Images
  // ============================================
  uploadPropertyImages(propertyId: string, files: File[]): Observable<PropertyImage[]> {
    // TODO: لما الـ Backend يخلص
    // const formData = new FormData();
    // files.forEach(file => formData.append('images', file));
    // return this.http.post<PropertyImage[]>(`${this.apiUrl}/properties/${propertyId}/images`, formData);
    
    console.log('Uploading images for property:', propertyId, files);
    
    // Mock: رفع الصور
    const images: PropertyImage[] = files.map((file, index) => ({
      id: `img-${Date.now()}-${index}`,
      propertyId: propertyId,
      imageUrl: URL.createObjectURL(file), // مؤقت للعرض فقط
      isPrimary: index === 0,
      order: index + 1
    }));
    
    return of(images).pipe(delay(1000));
  }

  // ============================================
  // Delete Property Image
  // ============================================
  deletePropertyImage(imageId: string): Observable<boolean> {
    // TODO: لما الـ Backend يخلص
    // return this.http.delete<boolean>(`${this.apiUrl}/properties/images/${imageId}`);
    
    console.log('Deleting image:', imageId);
    return of(true).pipe(delay(500));
  }

  // ============================================
  // Get Host Dashboard Stats
  // ============================================
  getHostDashboardStats(hostId: string): Observable<HostDashboardStats> {
    // TODO: لما الـ Backend يخلص
    // return this.http.get<HostDashboardStats>(`${this.apiUrl}/properties/host/${hostId}/stats`);
    
    console.log('Getting dashboard stats for host:', hostId);
    return of(this.mockStats).pipe(delay(800));
  }

  // ============================================
  // Helper Methods
  // ============================================
  
  private getPropertyTypeName(type: number): string {
    const types: { [key: number]: string } = {
      1: 'Apartment',
      2: 'House',
      3: 'Villa',
      4: 'Studio',
      5: 'Guesthouse',
      6: 'Hotel'
    };
    return types[type] || 'Unknown';
  }
}

// ============================================
// ملاحظات مهمة:
// ============================================
// 
// 1. كل الـ Functions دلوقتي بتستخدم Mock Data (بيانات وهمية)
// 2. في الـ Console.log عشان تشوفي إيه اللي بيحصل
// 3. delay() عشان نحاكي تأخير الـ API الحقيقي
// 4. لما الـ Backend يخلص، هنشيل كل الـ Mock code ونحط HttpClient
// 
// كل اللي محتاجة تعمليه:
// - استوردي HttpClient في Constructor لما Backend يخلص
// - شيلي الـ of() و delay()
// - حطي this.http.get/post/put/delete
// ============================================
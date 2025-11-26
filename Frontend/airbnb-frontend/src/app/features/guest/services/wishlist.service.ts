import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
// التصحيح: الاستيراد من ملف الموديل الرئيسي
import { Property } from '../components/search/models/property.model';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {

  private wishlistSubject = new BehaviorSubject<Property[]>([]);
  wishlist$ = this.wishlistSubject.asObservable();

  constructor() {}

  addToWishlist(property: Property) {
    const currentList = this.wishlistSubject.value;
    // مقارنة بالأرقام بعد تحويل الـ id لـ String أو العكس لضمان التطابق
    if (!currentList.find(p => p.id.toString() === property.id.toString())) {
      this.wishlistSubject.next([...currentList, property]);
    }
  }

  removeFromWishlist(propertyId: number) {
    const currentList = this.wishlistSubject.value;
    const updatedList = currentList.filter(p => Number(p.id) !== propertyId);
    this.wishlistSubject.next(updatedList);
  }

  isInWishlist(propertyId: number): boolean {
    return this.wishlistSubject.value.some(p => Number(p.id) === propertyId);
  }
}

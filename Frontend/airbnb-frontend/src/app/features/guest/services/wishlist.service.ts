import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Property } from '../components/home/home'; // تأكد أن المسار للـ interface صحيح

@Injectable({
  providedIn: 'root'
})
export class WishlistService {

  // المخزن الرئيسي للداتا (مصفوفة من العقارات)
  private wishlistSubject = new BehaviorSubject<Property[]>([]);

  // ده اللي المكونات بتسمع له (Observable)
  wishlist$ = this.wishlistSubject.asObservable();

  constructor() {}

  // إضافة للمفضلة
  addToWishlist(property: Property) {
    const currentList = this.wishlistSubject.value;
    // التأكد من عدم التكرار
    if (!currentList.find(p => p.id === property.id)) {
      this.wishlistSubject.next([...currentList, property]);
    }
  }

  // حذف من المفضلة
  removeFromWishlist(propertyId: number) {
    const currentList = this.wishlistSubject.value;
    const updatedList = currentList.filter(p => p.id !== propertyId);
    this.wishlistSubject.next(updatedList);
  }

  // التأكد هل العنصر موجود ولا لأ (عشان تلوين القلب)
  isInWishlist(propertyId: number): boolean {
    return this.wishlistSubject.value.some(p => p.id === propertyId);
  }
}

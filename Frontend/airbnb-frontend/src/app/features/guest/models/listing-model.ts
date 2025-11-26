// src/app/models/listing.model.ts

export interface RatingBreakdown {
  cleanliness: number;
  accuracy: number;
  communication: number;
  checkin: number;
  location: number;
  value: number;
}

export interface HostDetails {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string;
  joinedAt: string;
}

export interface ReviewModel {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
}

// الهيكل الرئيسي لتفاصيل العقار
export interface Listing {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  country: string;
  maxGuests: number;
  numberOfBedrooms: number;
  numberOfBathrooms: number;
  pricePerNight: number;
  cleaningFee: number;
  propertyType: string;
  isInstantBook:boolean;

  // الخصائص المفقودة في الـ JSON الحالي ولكن مطلوبة في الـ HTML
  rating?: number;            // <--- خاصية اختيارية
  reviewsCount?: number;      // <--- خاصية اختيارية
  ratingBreakdown?: RatingBreakdown; // <--- خاصية اختيارية

  host: HostDetails;
  images: string[]; // تحديد نوع دقيق أفضل
  amenities: any[]; // تحديد نوع دقيق أفضل
  reviews: ReviewModel[];
}


// 3. نحدث الـ Listing عشان يشيل الحاجات دي





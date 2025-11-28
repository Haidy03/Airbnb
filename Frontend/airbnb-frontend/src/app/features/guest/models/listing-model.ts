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
export interface amenities{
 id: number;
  name: string;
  icon: string; // اسم الأيقونة (مثل 'wifi', 'tv')
  category: string;
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
  amenities: amenities[]; // تحديد نوع دقيق أفضل
  reviews: ReviewModel[];
}
// translate models
export interface TranslationRequest {
  text: string;
}

export interface TranslationResponse {
  originalText: string;
  translatedText: string;
  detectedLanguage: string;
}





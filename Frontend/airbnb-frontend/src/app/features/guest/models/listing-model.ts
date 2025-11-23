// src/app/models/listing.model.ts

export interface Host {
  id: string;
  name: string;
  avatarUrl: string;
  isSuperhost: boolean;
  joinedDate: string;
}

export interface Amenity {
  icon: string; // اسم كلاس الأيقونة مثل 'fa-wifi'
  name: string;
}
// 1. تفاصيل تقييم الفئات (البارات اللي بتتملي)
export interface RatingBreakdown {
  cleanliness: number;    // 5.0
  accuracy: number;       // 4.9
  communication: number;  // 4.8
  location: number;       // 5.0
  checkIn: number;        // 5.0
  value: number;          // 4.7
}

// 2. شكل التعليق الواحد
export interface Review {
  id: string;
  authorName: string;
  authorAvatar: string; // رابط الصورة
  country: string;      // "Cairo, Egypt"
  date: string;         // "December 2024"
  comment: string;      // "Great place to stay..."
}

export interface Listing {
  id: string;
  title: string;
  location: string;
  description: string;

  // الصور
  images: string[];

  // الأسعار والتقييم
  pricePerNight: number;
  currency: string;
  rating: number;
  reviewsCount: number;

  // تفاصيل الغرفة
  maxGuests: number;
  bedrooms: number;
  beds: number;
  baths: number;

  // المضيف
  host: Host;

  // المزايا
  amenities: Amenity[];
   ratingBreakdown: RatingBreakdown;
  reviews: Review[];
}


// 3. نحدث الـ Listing عشان يشيل الحاجات دي





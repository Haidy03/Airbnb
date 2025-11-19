/**
 * Trip Models
 * نماذج البيانات الخاصة بالرحلات
 */

import { Booking, BookingStatus, BookingProperty, BookingGuest } from './booking_model';

// أنواع الرحلات حسب التوقيت
export enum TripType {
  UPCOMING = 'UPCOMING',         // قادمة
  ONGOING = 'ONGOING',           // جارية حالياً
  COMPLETED = 'COMPLETED',       // منتهية
  CANCELLED = 'CANCELLED'        // ملغاة
}

// تقييم الرحلة
export interface TripReview {
  id: string;
  tripId: string;
  propertyId: string;
  guestId: string;

  // التقييمات (من 1 إلى 5)
  cleanliness: number;           // النظافة
  accuracy: number;              // دقة الوصف
  checkIn: number;               // تجربة تسجيل الوصول
  communication: number;         // التواصل
  location: number;              // الموقع
  value: number;                 // القيمة مقابل السعر

  overallRating: number;         // التقييم الإجمالي (متوسط)

  // التعليق
  comment?: string;

  // الصور (اختياري)
  images?: string[];

  // رد المضيف
  hostResponse?: string;
  hostResponseAt?: Date;

  // التواريخ
  createdAt: Date;
  updatedAt: Date;
}

// الرحلة
export interface Trip {
  id: string;

  // مرتبط بالحجز
  bookingId: string;
  booking: Booking;              // كل تفاصيل الحجز

  // نوع الرحلة
  type: TripType;

  // معلومات سريعة (مكررة من الحجز لسهولة الوصول)
  property: BookingProperty;
  checkIn: Date;
  checkOut: Date;
  guests: BookingGuest;
  totalPrice: number;
  currency: string;

  // الحالة
  status: BookingStatus;

  // التقييم
  review?: TripReview;
  hasReview: boolean;

  // معلومات إضافية
  numberOfNights: number;
  daysUntilCheckIn?: number;     // عدد الأيام المتبقية (للقادمة)
  daysUntilCheckOut?: number;    // عدد الأيام المتبقية (للجارية)

  // تذكيرات
  checkInReminder: boolean;      // هل تم إرسال تذكير تسجيل الوصول
  checkOutReminder: boolean;     // هل تم إرسال تذكير المغادرة
  reviewReminder: boolean;       // هل تم إرسال تذكير التقييم
}

// بيانات إنشاء تقييم
export interface CreateReviewDto {
  tripId: string;
  cleanliness: number;
  accuracy: number;
  checkIn: number;
  communication: number;
  location: number;
  value: number;
  comment?: string;
  images?: string[] | File[];
}

// ملخص الرحلات
export interface TripsSummary {
  upcoming: Trip[];
  ongoing: Trip[];
  completed: Trip[];
  cancelled: Trip[];

  counts: {
    upcoming: number;
    ongoing: number;
    completed: number;
    cancelled: number;
    total: number;
  };
}

// فلاتر الرحلات
export interface TripFilters {
  type?: TripType | TripType[];
  status?: BookingStatus | BookingStatus[];
  startDate?: Date;
  endDate?: Date;
  propertyId?: string;
  hasReview?: boolean;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  country?: string;
}

// خيارات ترتيب الرحلات
export enum TripSortOption {
  CHECK_IN_ASC = 'checkIn_asc',       // تاريخ الوصول (الأقدم أولاً)
  CHECK_IN_DESC = 'checkIn_desc',     // تاريخ الوصول (الأحدث أولاً)
  CREATED_ASC = 'created_asc',        // تاريخ الإنشاء (الأقدم أولاً)
  CREATED_DESC = 'created_desc',      // تاريخ الإنشاء (الأحدث أولاً)
  PRICE_ASC = 'price_asc',            // السعر (الأقل أولاً)
  PRICE_DESC = 'price_desc'           // السعر (الأعلى أولاً)
}

// استجابة الرحلات
export interface TripsResponse {
  success: boolean;
  message: string;
  trips?: Trip[];
  summary?: TripsSummary;
  error?: string;
}

// معلومات بطاقة الرحلة (للعرض المختصر)
export interface TripCard {
  id: string;
  propertyImage: string;
  propertyTitle: string;
  city: string;
  country: string;
  checkIn: Date;
  checkOut: Date;
  numberOfNights: number;
  totalPrice: number;
  currency: string;
  status: BookingStatus;
  type: TripType;
  hasReview: boolean;
}

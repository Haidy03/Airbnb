/**
 * Booking Models
 * نماذج البيانات الخاصة بالحجوزات
 */

// حالات الحجز
export enum BookingStatus {
  PENDING = 'PENDING',           // في انتظار التأكيد
  CONFIRMED = 'CONFIRMED',       // مؤكد
  CANCELLED = 'CANCELLED',       // ملغي
  COMPLETED = 'COMPLETED',       // مكتمل
  REJECTED = 'REJECTED'          // مرفوض
}

// طرق الدفع
export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PAYPAL = 'PAYPAL',
  APPLE_PAY = 'APPLE_PAY',
  GOOGLE_PAY = 'GOOGLE_PAY'
}

// حالة الدفع
export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED'
}

// معلومات الضيف في الحجز
export interface BookingGuest {
  adults: number;        // عدد البالغين
  children: number;      // عدد الأطفال
  infants: number;       // عدد الرضع
  pets: number;          // عدد الحيوانات الأليفة
}

// تفاصيل السعر
export interface PriceBreakdown {
  pricePerNight: number;           // سعر الليلة الواحدة
  numberOfNights: number;          // عدد الليالي
  basePrice: number;               // السعر الأساسي (سعر × ليالي)
  cleaningFee: number;             // رسوم التنظيف
  serviceFee: number;              // رسوم الخدمة
  tax: number;                     // الضريبة
  discount?: number;               // خصم (اختياري)
  totalPrice: number;              // السعر الإجمالي
  currency: string;                // العملة (مثل: USD, EGP)
}

// معلومات العقار المختصرة في الحجز
export interface BookingProperty {
  id: string;
  title: string;
  address: string;
  city: string;
  country: string;
  image: string;                   // الصورة الرئيسية
  hostId: string;
  hostName: string;
  hostImage?: string;
}

// معلومات الدفع
export interface PaymentInfo {
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  paidAt?: Date;
  refundedAt?: Date;
}

// الحجز الرئيسي
export interface Booking {
  id: string;
  
  // معلومات المستخدم
  guestId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  
  // معلومات العقار
  property: BookingProperty;
  
  // تواريخ الحجز
  checkIn: Date;
  checkOut: Date;
  
  // معلومات الضيوف
  guests: BookingGuest;
  
  // السعر
  pricing: PriceBreakdown;
  
  // الحالة
  status: BookingStatus;
  
  // الدفع
  payment: PaymentInfo;
  
  // رسالة للمضيف (اختياري)
  messageToHost?: string;
  
  // ملاحظات خاصة
  specialRequests?: string;
  
  // التواريخ
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  
  // سبب الإلغاء (في حالة الإلغاء)
  cancellationReason?: string;
}

// بيانات إنشاء حجز جديد (DTO)
export interface CreateBookingDto {
  propertyId: string;
  checkIn: Date | string;
  checkOut: Date | string;
  guests: BookingGuest;
  messageToHost?: string;
  specialRequests?: string;
  paymentMethod: PaymentMethod;
}

// بيانات تحديث الحجز
export interface UpdateBookingDto {
  checkIn?: Date | string;
  checkOut?: Date | string;
  guests?: BookingGuest;
  messageToHost?: string;
  specialRequests?: string;
}

// استجابة إنشاء حجز
export interface BookingResponse {
  success: boolean;
  message: string;
  booking?: Booking;
  error?: string;
}

// فلاتر البحث عن الحجوزات
export interface BookingFilters {
  status?: BookingStatus | BookingStatus[];
  startDate?: Date;
  endDate?: Date;
  propertyId?: string;
  minPrice?: number;
  maxPrice?: number;
}

// إحصائيات الحجوزات (للضيف)
export interface GuestBookingStats {
  totalBookings: number;
  upcomingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalSpent: number;
}
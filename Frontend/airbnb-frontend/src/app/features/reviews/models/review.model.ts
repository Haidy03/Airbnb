export interface CreateReviewDto {
  bookingId: number;
  rating: number;
  comment?: string;
  cleanlinessRating?: number;
  communicationRating?: number;
  locationRating?: number;
  valueRating?: number;
}

export interface UpdateReviewDto {
  rating: number;
  comment?: string;
  cleanlinessRating?: number;
  communicationRating?: number;
  locationRating?: number;
  valueRating?: number;
}

export interface ReviewResponse {
  id: number;
  bookingId: number;
  propertyId: number;
  propertyTitle: string;
  reviewType: string;
  rating: number;
  comment?: string;
  cleanlinessRating?: number;
  communicationRating?: number;
  locationRating?: number;
  valueRating?: number;
  reviewerId: string;
  reviewerName: string;
  reviewerProfileImage?: string;
  revieweeId: string;
  revieweeName: string;
  createdAt: Date;
  updatedAt?: Date;
  isApproved: boolean;
}

export interface PropertyReviewsSummary {
  propertyId: number;
  averageRating: number;
  totalReviews: number;
  averageCleanlinessRating?: number;
  averageCommunicationRating?: number;
  averageLocationRating?: number;
  averageValueRating?: number;
  reviews: ReviewResponse[];
}

export interface GuestReviewsSummary {
  guestId: string;
  guestName: string;
  averageRating: number;
  totalReviews: number;
  reviews: ReviewResponse[];
}

export interface CanReviewResponse {
  canReview: boolean;
  reason?: string;
  bookingId?: number;
}
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
  icon: string;
  category: string;
}


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

  rating?: number;     
  reviewsCount?: number;     
  ratingBreakdown?: RatingBreakdown; 

  host: HostDetails;
  images: string[];
  amenities: amenities[]; 
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





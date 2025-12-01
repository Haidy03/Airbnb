export interface ServiceCard {
  id: number;
  title: string;
  hostName: string;
  hostAvatar: string;
  imageUrl: string;
  pricePerUnit: number;
  pricingUnit: string; // 'guest', 'hour', 'session'
  minimumCost: number | null; 
  rating: number;
  categoryName: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ServicePackage {
  title: string;
  description: string;
  price: number;
  duration: string;
  imageUrl: string;
}

export interface ServiceQualification {
  title: string;
  description: string;
  icon: string;
}


export interface ServiceDetails {
  id: number;
  title: string;
  description: string;
  pricePerUnit: number;
  pricingUnit: string;
  hostName: string;
  hostAvatar: string;
  city: string;
  images: string[];
  rating: number;
  reviewsCount: number;
  cancellationPolicy: string;
  guestRequirements: string;
  qualifications: ServiceQualification[];
  packages: ServicePackage[];
}

export interface ServiceCategory {
  id: number;
  name: string;
  icon: string;
  description?: string;
}

export interface HostService {
  id: number;
  title: string;
  hostName: string;
  imageUrl: string;
  pricePerUnit: number;
  pricingUnit: string;
  status: string; // 'Active', 'PendingApproval', 'Rejected', 'Draft'
  rating: number;
  categoryName: string;
  rejectionReason?: string;
}
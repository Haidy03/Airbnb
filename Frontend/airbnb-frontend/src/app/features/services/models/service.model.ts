export interface ServiceCard {
  id: number;
  title: string;
  hostName: string;
  hostAvatar: string;
  imageUrl: string;
  pricePerUnit: number;
  pricingUnit: string; // 'guest', 'hour', 'session'
  minimumCost: number | null; // الحقل الجديد المهم
  rating: number;
  categoryName: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
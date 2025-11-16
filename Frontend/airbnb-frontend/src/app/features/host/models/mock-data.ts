import { HostDashboardStats, Property, PropertyType } from "./property.model";

export const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    hostId: 'host-1',
    title: 'Luxury Apartment in Cairo',
    description: 'Beautiful 2-bedroom apartment with stunning Nile view. Located in the heart of Cairo with easy access to all major attractions.',
    propertyType: PropertyType.Apartment,
    propertyTypeName: 'Apartment',
    pricePerNight: 150,
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 2,
    address: '123 Nile Corniche',
    city: 'Cairo',
    country: 'Egypt',
    latitude: 30.0444,
    longitude: 31.2357,
    isActive: true,
    images: [
      {
        id: 'img-1',
        propertyId: '1',
        imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        isPrimary: true,
        order: 1
      },
      {
        id: 'img-2',
        propertyId: '1',
        imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
        isPrimary: false,
        order: 2
      }
    ],
    amenities: [
      { id: '1', name: 'WiFi', icon: 'bi-wifi' },
      { id: '2', name: 'Kitchen', icon: 'bi-house-door' },
      { id: '3', name: 'Air Conditioning', icon: 'bi-snow' }
    ],
    averageRating: 4.5,
    totalReviews: 25,
    totalBookings: 45,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: '2',
    hostId: 'host-1',
    title: 'Cozy Studio in Alexandria',
    description: 'Perfect studio for solo travelers or couples. Close to the beach and Mediterranean Sea.',
    propertyType: PropertyType.Studio,
    propertyTypeName: 'Studio',
    pricePerNight: 80,
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    address: '456 Corniche Road',
    city: 'Alexandria',
    country: 'Egypt',
    isActive: true,
    images: [
      {
        id: 'img-3',
        propertyId: '2',
        imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        isPrimary: true,
        order: 1
      }
    ],
    amenities: [
      { id: '1', name: 'WiFi', icon: 'bi-wifi' },
      { id: '5', name: 'TV', icon: 'bi-tv' }
    ],
    averageRating: 4.8,
    totalReviews: 18,
    totalBookings: 32,
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-15')
  },
  {
    id: '3',
    hostId: 'host-1',
    title: 'Spacious Villa in Gouna',
    description: 'Luxurious 4-bedroom villa with private pool and garden. Perfect for families.',
    propertyType: PropertyType.Villa,
    propertyTypeName: 'Villa',
    pricePerNight: 350,
    maxGuests: 8,
    bedrooms: 4,
    bathrooms: 3,
    address: '789 Marina Street',
    city: 'El Gouna',
    country: 'Egypt',
    isActive: false,
    images: [
      {
        id: 'img-4',
        propertyId: '3',
        imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
        isPrimary: true,
        order: 1
      }
    ],
    amenities: [
      { id: '1', name: 'WiFi', icon: 'bi-wifi' },
      { id: '8', name: 'Pool', icon: 'bi-water' },
      { id: '7', name: 'Free Parking', icon: 'bi-p-square' }
    ],
    averageRating: 4.9,
    totalReviews: 42,
    totalBookings: 28,
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-03-10')
  }
];

export const MOCK_DASHBOARD_STATS: HostDashboardStats = {
  totalProperties: 3,
  activeProperties: 2,
  inactiveProperties: 1,
  totalBookings: 105,
  pendingBookings: 8,
  confirmedBookings: 12,
  totalEarnings: 45250,
  thisMonthEarnings: 8750,
  averageRating: 4.7,
  topProperties: [
    {
      propertyId: '3',
      title: 'Spacious Villa in Gouna',
      totalBookings: 28,
      totalRevenue: 9800,
      averageRating: 4.9,
      imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400'
    },
    {
      propertyId: '1',
      title: 'Luxury Apartment in Cairo',
      totalBookings: 45,
      totalRevenue: 6750,
      averageRating: 4.5,
      imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400'
    }
  ]
};
import { Property, PropertyType, RoomType, PropertyStatus } from './property.model';
import { Booking, BookingStatus, PaymentStatus } from './booking.model';
import { HostDashboardStats } from './host-stats.model';

// Mock Host ID
export const MOCK_HOST_ID = 'host-12345';

// Mock Properties
export const MOCK_PROPERTIES: Property[] = [
  {
    id: 'prop-001',
    hostId: MOCK_HOST_ID,
    title: 'Luxury Beachfront Villa with Ocean Views',
    description: 'Experience paradise in this stunning 4-bedroom villa with direct beach access. Features include a private pool, gourmet kitchen, and panoramic ocean views from every room. Perfect for families or groups seeking an unforgettable coastal getaway.',
    propertyType: PropertyType.VILLA,
    roomType: RoomType.ENTIRE_PLACE,
    location: {
      address: '123 Ocean Drive',
      // Removed 'street' as it is not in PropertyLocation interface
      city: 'Miami Beach',
      state: 'Florida',
      country: 'United States',
      zipCode: '33139',
      coordinates: { lat: 25.7907, lng: -80.1300 }
    },
    capacity: {
      guests: 8,
      bedrooms: 4,
      beds: 5,
      bathrooms: 3
    },
    // Changed string[] to number[] (IDs)
    amenities: [1, 9, 6, 3, 4, 5, 2, 15, 20], 
    images: [
      {
        id: 'img-001',
        url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
        caption: 'Ocean view from living room',
        order: 1,
        isMain: true,
        // Compatibility fields for Flat structure
        imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
        isPrimary: true,
        displayOrder: 1
      },
      {
        id: 'img-002',
        url: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800',
        caption: 'Master bedroom',
        order: 2,
        isMain: false,
        imageUrl: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800',
        isPrimary: false,
        displayOrder: 2
      },
      {
        id: 'img-003',
        url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
        caption: 'Private pool',
        order: 3,
        isMain: false,
        imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
        isPrimary: false,
        displayOrder: 3
      }
    ],
    coverImage: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
    pricing: {
      basePrice: 450,
      currency: 'USD',
      weekendPrice: 550,
      weeklyDiscount: 10,
      monthlyDiscount: 20,
      cleaningFee: 150,
      serviceFee: 75,
      taxRate: 12
    },
    availability: {
      minNights: 3,
      maxNights: 30,
      advanceNotice: 2,
      preparationTime: 1,
      availabilityWindow: 12,
      blockedDates: [],
      customPricing: []
    },
    houseRules: {
      checkInTime: '15:00',
      checkOutTime: '11:00',
      smokingAllowed: false,
      petsAllowed: true,
      eventsAllowed: false,
      childrenAllowed: true,
      quietHours: { start: '22:00', end: '08:00' },
      additionalRules: 'No parties or events'
    },
    safetyDetails: {
        exteriorCamera: true,
        noiseMonitor: false,
        weapons: false
    },
    status: PropertyStatus.ACTIVE,
    isActive: true,
    isApproved: true,
    isInstantBook: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-11-10'),
    publishedAt: new Date('2024-01-20'),
    stats: {
      totalBookings: 45,
      totalEarnings: 35000,
      averageRating: 4.9,
      totalReviews: 38,
      responseRate: 98,
      acceptanceRate: 92,
      viewsLastMonth: 456,
      occupancyRate: 78
    },
    // Flat fields for compatibility
    address: '123 Ocean Drive',
    city: 'Miami Beach',
    state: 'Florida',
    country: 'United States',
    postalCode: '33139'
  },
  {
    id: 'prop-002',
    hostId: MOCK_HOST_ID,
    title: 'Modern Downtown Loft in the Heart of the City',
    description: 'Stylish industrial loft in prime downtown location. This contemporary space features exposed brick, high ceilings, and floor-to-ceiling windows. Walk to restaurants, shops, and entertainment. Ideal for business travelers and urban explorers.',
    propertyType: PropertyType.LOFT,
    roomType: RoomType.ENTIRE_PLACE,
    location: {
      address: '456 Main Street, Unit 8B',
      // Removed 'street'
      city: 'New York',
      state: 'New York',
      country: 'United States',
      zipCode: '10013',
      coordinates: { lat: 40.7128, lng: -74.0060 }
    },
    capacity: {
      guests: 4,
      bedrooms: 2,
      beds: 2,
      bathrooms: 2
    },
    amenities: [1, 6, 7, 3, 4, 2, 8, 18], // Converted to numbers
    images: [
      {
        id: 'img-004',
        url: 'https://images.unsplash.com/photo-1502672260066-6bc35f0a1f90?w=800',
        caption: 'Living area',
        order: 1,
        isMain: true,
        imageUrl: 'https://images.unsplash.com/photo-1502672260066-6bc35f0a1f90?w=800',
        isPrimary: true,
        displayOrder: 1
      },
      {
        id: 'img-005',
        url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
        caption: 'Kitchen',
        order: 2,
        isMain: false,
        imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
        isPrimary: false,
        displayOrder: 2
      }
    ],
    coverImage: 'https://images.unsplash.com/photo-1502672260066-6bc35f0a1f90?w=800',
    pricing: {
      basePrice: 220,
      currency: 'USD',
      weekendPrice: 280,
      weeklyDiscount: 8,
      monthlyDiscount: 15,
      cleaningFee: 80,
      serviceFee: 45
    },
    availability: {
      minNights: 2,
      maxNights: 28,
      advanceNotice: 1,
      preparationTime: 1,
      availabilityWindow: 12,
      blockedDates: [],
      customPricing: []
    },
    houseRules: {
      checkInTime: '16:00',
      checkOutTime: '11:00',
      smokingAllowed: false,
      petsAllowed: false,
      eventsAllowed: false,
      childrenAllowed: true,
      quietHours: { start: '22:00', end: '08:00' }
    },
    safetyDetails: {
        exteriorCamera: false,
        noiseMonitor: false,
        weapons: false
    },
    status: PropertyStatus.ACTIVE,
    isActive: true,
    isApproved: true,
    isInstantBook: true,
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-11-12'),
    publishedAt: new Date('2024-03-15'),
    stats: {
      totalBookings: 62,
      totalEarnings: 28000,
      averageRating: 4.8,
      totalReviews: 54,
      responseRate: 95,
      acceptanceRate: 88,
      viewsLastMonth: 678,
      occupancyRate: 85
    },
    address: '456 Main Street, Unit 8B',
    city: 'New York',
    state: 'New York',
    country: 'United States',
    postalCode: '10013'
  },
  {
    id: 'prop-003',
    hostId: MOCK_HOST_ID,
    title: 'Cozy Mountain Cabin Retreat',
    description: 'Escape to this charming cabin nestled in the mountains. Perfect for nature lovers, featuring a wood-burning fireplace, spacious deck with mountain views, and hiking trails right outside your door.',
    propertyType: PropertyType.CABIN,
    roomType: RoomType.ENTIRE_PLACE,
    location: {
      address: '789 Pine Ridge Road',
      city: 'Aspen',
      state: 'Colorado',
      country: 'United States',
      zipCode: '81611',
      coordinates: { lat: 39.1911, lng: -106.8175 }
    },
    capacity: {
      guests: 6,
      bedrooms: 3,
      beds: 4,
      bathrooms: 2
    },
    amenities: [1, 7, 14, 3, 4, 5, 15, 21], // Converted to numbers
    images: [
      {
        id: 'img-006',
        url: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=800',
        caption: 'Cabin exterior',
        order: 1,
        isMain: true,
        imageUrl: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=800',
        isPrimary: true,
        displayOrder: 1
      }
    ],
    coverImage: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=800',
    pricing: {
      basePrice: 180,
      currency: 'USD',
      cleaningFee: 100,
      serviceFee: 35
    },
    availability: {
      minNights: 2,
      maxNights: 14,
      advanceNotice: 2,
      preparationTime: 1,
      availabilityWindow: 12,
      blockedDates: [],
      customPricing: []
    },
    houseRules: {
      checkInTime: '15:00',
      checkOutTime: '10:00',
      smokingAllowed: false,
      petsAllowed: true,
      eventsAllowed: false,
      childrenAllowed: true
    },
    safetyDetails: {
        exteriorCamera: false,
        noiseMonitor: false,
        weapons: false
    },
    status: PropertyStatus.ACTIVE,
    isActive: true,
    isApproved: true,
    isInstantBook: false,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-11-01'),
    publishedAt: new Date('2024-02-05'),
    stats: {
      totalBookings: 28,
      totalEarnings: 12000,
      averageRating: 4.95,
      totalReviews: 24,
      responseRate: 100,
      acceptanceRate: 95,
      viewsLastMonth: 234,
      occupancyRate: 65
    },
    address: '789 Pine Ridge Road',
    city: 'Aspen',
    state: 'Colorado',
    country: 'United States',
    postalCode: '81611'
  }
];

// Mock Bookings
export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'book-001',
    propertyId: 'prop-001',
    propertyTitle: 'Luxury Beachfront Villa with Ocean Views',
    propertyImage: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400',
    guestId: 'guest-001',
    guestName: 'Sarah Johnson',
    guestEmail: 'sarah.j@email.com',
    guestJoinedDate: new Date('2022-11-01'),
    guestPhone: '+1-555-0123',
    guestProfileImage: 'https://i.pravatar.cc/150?img=1',
    numberOfGuests: 6,
    checkInDate: new Date('2024-11-20'),
    checkOutDate: new Date('2024-11-27'),
    numberOfNights: 7,
    bookedAt: new Date('2024-10-15'),
    pricing: {
      basePrice: 450,
      numberOfNights: 7,
      subtotal: 3150,
      cleaningFee: 150,
      serviceFee: 75,
      taxes: 396,
      total: 3771,
      hostEarnings: 3300,
      currency: 'USD'
    },
    status: BookingStatus.CONFIRMED,
    paymentStatus: PaymentStatus.PAID,
    hasUnreadMessages: false,
    specialRequests: 'Early check-in if possible',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    isReviewed: false,
    createdAt: new Date('2024-10-15'),
    updatedAt: new Date('2024-10-15')
  },
  {
    id: 'book-002',
    propertyId: 'prop-002',
    propertyTitle: 'Modern Downtown Loft',
    propertyImage: 'https://images.unsplash.com/photo-1502672260066-6bc35f0a1f90?w=400',
    guestId: 'guest-002',
    guestName: 'Michael Chen',
    guestEmail: 'mchen@email.com',
    guestPhone: '+1-555-0456',
    guestJoinedDate: new Date('2022-11-01'),
    guestProfileImage: 'https://i.pravatar.cc/150?img=12',
    numberOfGuests: 2,
    checkInDate: new Date('2024-11-18'),
    checkOutDate: new Date('2024-11-22'),
    numberOfNights: 4,
    bookedAt: new Date('2024-11-10'),
    pricing: {
      basePrice: 220,
      numberOfNights: 4,
      subtotal: 880,
      cleaningFee: 80,
      serviceFee: 45,
      taxes: 120,
      total: 1125,
      hostEarnings: 960,
      currency: 'USD'
    },
    status: BookingStatus.CHECKED_IN,
    paymentStatus: PaymentStatus.PAID,
    hasUnreadMessages: true,
    checkInTime: '16:00',
    checkOutTime: '11:00',
    actualCheckInTime: new Date('2024-11-18T16:30:00'),
    isReviewed: false,
    createdAt: new Date('2024-11-10'),
    updatedAt: new Date('2024-11-18')
  },
  {
    id: 'book-003',
    propertyId: 'prop-001',
    propertyTitle: 'Luxury Beachfront Villa',
    propertyImage: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400',
    guestId: 'guest-003',
    guestJoinedDate: new Date('2022-11-01'),
    guestName: 'Emily Rodriguez',
    guestEmail: 'emily.r@email.com',
    guestPhone: '+1-555-0789',
    numberOfGuests: 4,
    checkInDate: new Date('2024-12-01'),
    checkOutDate: new Date('2024-12-08'),
    numberOfNights: 7,
    bookedAt: new Date('2024-11-14'),
    pricing: {
      basePrice: 450,
      numberOfNights: 7,
      subtotal: 3150,
      cleaningFee: 150,
      serviceFee: 75,
      taxes: 396,
      total: 3771,
      hostEarnings: 3300,
      currency: 'USD'
    },
    status: BookingStatus.PENDING,
    paymentStatus: PaymentStatus.PENDING,
    hasUnreadMessages: true,
    specialRequests: 'Celebrating anniversary, any special touches appreciated!',
    isReviewed: false,
    createdAt: new Date('2024-11-14'),
    updatedAt: new Date('2024-11-14')
  }
];

// Mock Dashboard Stats
export const MOCK_DASHBOARD_STATS: HostDashboardStats = {
  overview: {
    activeListings: 3,
    totalBookings: 135,
    currentGuests: 2,
    totalEarnings: 75000,
    currency: 'USD'
  },
  earnings: {
    today: 450,
    thisWeek: 1840,
    thisMonth: 6500,
    thisYear: 75000,
    currency: 'USD',
    monthlyTrend: [
      { month: 'Jan', earnings: 5200, bookings: 8 },
      { month: 'Feb', earnings: 4800, bookings: 7 },
      { month: 'Mar', earnings: 6100, bookings: 9 },
      { month: 'Apr', earnings: 7200, bookings: 11 },
      { month: 'May', earnings: 8500, bookings: 13 },
      { month: 'Jun', earnings: 9100, bookings: 14 },
      { month: 'Jul', earnings: 10200, bookings: 16 },
      { month: 'Aug', earnings: 9800, bookings: 15 },
      { month: 'Sep', earnings: 7100, bookings: 11 },
      { month: 'Oct', earnings: 6500, bookings: 10 },
      { month: 'Nov', earnings: 6500, bookings: 10 }
    ],
    topEarningProperty: {
      id: 'prop-001',
      title: 'Luxury Beachfront Villa',
      earnings: 35000
    }
  },
  performance: {
    averageRating: 4.87,
    totalReviews: 116,
    responseRate: 97,
    responseTime: 2,
    acceptanceRate: 91,
    occupancyRate: 76,
    repeatGuestRate: 28,
    ratingTrend: 'up',
    responseRateTrend: 'stable',
    occupancyTrend: 'up'
  },
  recentActivity: {
    newBookings: [
      {
        id: 'act-001',
        type: 'booking',
        title: 'New booking request',
        description: 'Emily Rodriguez requested to book Luxury Beachfront Villa',
        timestamp: new Date('2024-11-14T10:30:00'),
        isUnread: true,
        actionRequired: true,
        relatedId: 'book-003'
      }
    ],
    recentMessages: [
      {
        id: 'act-002',
        type: 'message',
        title: 'New message from Michael Chen',
        description: 'Question about early checkout',
        timestamp: new Date('2024-11-16T14:20:00'),
        isUnread: true,
        actionRequired: true,
        relatedId: 'book-002'
      }
    ],
    recentReviews: [],
    pendingActions: []
  },
  upcomingEvents: {
    checkIns: [
      {
        bookingId: 'book-001',
        propertyId: 'prop-001',
        propertyTitle: 'Luxury Beachfront Villa',
        guestName: 'Sarah Johnson',
        guestImage: 'https://i.pravatar.cc/150?img=1',
        date: new Date('2024-11-20'),
        time: '15:00',
        numberOfGuests: 6
      }
    ],
    checkOuts: [
      {
        bookingId: 'book-002',
        propertyId: 'prop-002',
        propertyTitle: 'Modern Downtown Loft',
        guestName: 'Michael Chen',
        date: new Date('2024-11-22'),
        time: '11:00',
        numberOfGuests: 2
      }
    ],
    blockedDates: []
  }
};
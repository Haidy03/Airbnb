export interface Amenity {
  id: string;
  name: string;
  category: AmenityCategory;
  icon: string; // Icon name or path
  description?: string;
  isPremium?: boolean;
}

export enum AmenityCategory {
  BASIC = 'basic',
  ENTERTAINMENT = 'entertainment',
  KITCHEN = 'kitchen',
  BATHROOM = 'bathroom',
  HEATING_COOLING = 'heating_cooling',
  INTERNET_OFFICE = 'internet_office',
  OUTDOOR = 'outdoor',
  PARKING = 'parking',
  SAFETY = 'safety',
  ACCESSIBILITY = 'accessibility'
}

// Predefined Amenities List
export const AMENITIES_LIST: Amenity[] = [
  // Basic
  {
    id: 'wifi',
    name: 'WiFi',
    category: AmenityCategory.BASIC,
    icon: 'wifi',
    description: 'High-speed internet connection'
  },
  {
    id: 'tv',
    name: 'TV',
    category: AmenityCategory.ENTERTAINMENT,
    icon: 'tv',
    description: 'Television with standard cable'
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    category: AmenityCategory.KITCHEN,
    icon: 'utensils',
    description: 'Fully equipped kitchen'
  },
  {
    id: 'washer',
    name: 'Washer',
    category: AmenityCategory.BASIC,
    icon: 'washing-machine',
    description: 'Washing machine'
  },
  {
    id: 'dryer',
    name: 'Dryer',
    category: AmenityCategory.BASIC,
    icon: 'wind',
    description: 'Dryer'
  },
  {
    id: 'air-conditioning',
    name: 'Air conditioning',
    category: AmenityCategory.HEATING_COOLING,
    icon: 'snowflake',
    description: 'Central or window AC'
  },
  {
    id: 'heating',
    name: 'Heating',
    category: AmenityCategory.HEATING_COOLING,
    icon: 'flame',
    description: 'Central heating'
  },
  {
    id: 'workspace',
    name: 'Dedicated workspace',
    category: AmenityCategory.INTERNET_OFFICE,
    icon: 'briefcase',
    description: 'Room with desk and chair'
  },
  
  // Kitchen
  {
    id: 'refrigerator',
    name: 'Refrigerator',
    category: AmenityCategory.KITCHEN,
    icon: 'archive',
    description: 'Full-size refrigerator'
  },
  {
    id: 'microwave',
    name: 'Microwave',
    category: AmenityCategory.KITCHEN,
    icon: 'microwave',
    description: 'Microwave oven'
  },
  {
    id: 'dishwasher',
    name: 'Dishwasher',
    category: AmenityCategory.KITCHEN,
    icon: 'droplet',
    description: 'Built-in dishwasher'
  },
  {
    id: 'coffee-maker',
    name: 'Coffee maker',
    category: AmenityCategory.KITCHEN,
    icon: 'coffee',
    description: 'Coffee maker or espresso machine'
  },
  {
    id: 'cooking-basics',
    name: 'Cooking basics',
    category: AmenityCategory.KITCHEN,
    icon: 'chef-hat',
    description: 'Pots, pans, oil, salt and pepper'
  },
  {
    id: 'dishes-silverware',
    name: 'Dishes and silverware',
    category: AmenityCategory.KITCHEN,
    icon: 'plate',
    description: 'Bowls, plates, cups, etc.'
  },
  
  // Bathroom
  {
    id: 'hair-dryer',
    name: 'Hair dryer',
    category: AmenityCategory.BATHROOM,
    icon: 'hair-dryer',
    description: 'Hair dryer'
  },
  {
    id: 'shampoo',
    name: 'Shampoo',
    category: AmenityCategory.BATHROOM,
    icon: 'bottle',
    description: 'Shampoo and conditioner'
  },
  {
    id: 'hot-water',
    name: 'Hot water',
    category: AmenityCategory.BATHROOM,
    icon: 'droplet',
    description: 'Hot water available 24/7'
  },
  
  // Entertainment
  {
    id: 'netflix',
    name: 'Netflix',
    category: AmenityCategory.ENTERTAINMENT,
    icon: 'film',
    description: 'Netflix subscription available',
    isPremium: true
  },
  {
    id: 'amazon-prime',
    name: 'Amazon Prime Video',
    category: AmenityCategory.ENTERTAINMENT,
    icon: 'video',
    description: 'Amazon Prime subscription',
    isPremium: true
  },
  {
    id: 'game-console',
    name: 'Game console',
    category: AmenityCategory.ENTERTAINMENT,
    icon: 'gamepad',
    description: 'PlayStation, Xbox, or Nintendo'
  },
  {
    id: 'sound-system',
    name: 'Sound system',
    category: AmenityCategory.ENTERTAINMENT,
    icon: 'speaker',
    description: 'Speakers or sound system'
  },
  
  // Outdoor
  {
    id: 'pool',
    name: 'Pool',
    category: AmenityCategory.OUTDOOR,
    icon: 'waves',
    description: 'Private or shared pool',
    isPremium: true
  },
  {
    id: 'hot-tub',
    name: 'Hot tub',
    category: AmenityCategory.OUTDOOR,
    icon: 'hot-tub',
    description: 'Private hot tub',
    isPremium: true
  },
  {
    id: 'patio',
    name: 'Patio or balcony',
    category: AmenityCategory.OUTDOOR,
    icon: 'home',
    description: 'Outdoor space'
  },
  {
    id: 'bbq-grill',
    name: 'BBQ grill',
    category: AmenityCategory.OUTDOOR,
    icon: 'grill',
    description: 'Outdoor grill'
  },
  {
    id: 'garden',
    name: 'Garden or backyard',
    category: AmenityCategory.OUTDOOR,
    icon: 'tree',
    description: 'Private outdoor area'
  },
  {
    id: 'outdoor-furniture',
    name: 'Outdoor furniture',
    category: AmenityCategory.OUTDOOR,
    icon: 'chair',
    description: 'Tables, chairs, loungers'
  },
  
  // Parking
  {
    id: 'free-parking',
    name: 'Free parking on premises',
    category: AmenityCategory.PARKING,
    icon: 'parking',
    description: 'Free parking included'
  },
  {
    id: 'paid-parking',
    name: 'Paid parking on premises',
    category: AmenityCategory.PARKING,
    icon: 'parking',
    description: 'Parking available for a fee'
  },
  {
    id: 'street-parking',
    name: 'Free street parking',
    category: AmenityCategory.PARKING,
    icon: 'road',
    description: 'Street parking available'
  },
  {
    id: 'ev-charger',
    name: 'EV charger',
    category: AmenityCategory.PARKING,
    icon: 'zap',
    description: 'Electric vehicle charging',
    isPremium: true
  },
  
  // Safety
  {
    id: 'smoke-alarm',
    name: 'Smoke alarm',
    category: AmenityCategory.SAFETY,
    icon: 'alert-triangle',
    description: 'Working smoke detector'
  },
  {
    id: 'carbon-monoxide',
    name: 'Carbon monoxide alarm',
    category: AmenityCategory.SAFETY,
    icon: 'alert-circle',
    description: 'CO detector installed'
  },
  {
    id: 'fire-extinguisher',
    name: 'Fire extinguisher',
    category: AmenityCategory.SAFETY,
    icon: 'fire',
    description: 'Fire extinguisher available'
  },
  {
    id: 'first-aid',
    name: 'First aid kit',
    category: AmenityCategory.SAFETY,
    icon: 'plus-square',
    description: 'First aid supplies'
  },
  {
    id: 'security-cameras',
    name: 'Security cameras',
    category: AmenityCategory.SAFETY,
    icon: 'camera',
    description: 'Exterior security cameras'
  },
  {
    id: 'lockbox',
    name: 'Lockbox',
    category: AmenityCategory.SAFETY,
    icon: 'lock',
    description: 'Self check-in with lockbox'
  },
  
  // Accessibility
  {
    id: 'step-free-entrance',
    name: 'Step-free guest entrance',
    category: AmenityCategory.ACCESSIBILITY,
    icon: 'accessibility',
    description: 'No stairs to enter'
  },
  {
    id: 'accessible-bathroom',
    name: 'Accessible-height bed',
    category: AmenityCategory.ACCESSIBILITY,
    icon: 'bed',
    description: 'Bed at wheelchair height'
  },
  {
    id: 'wide-doorways',
    name: 'Wide doorways',
    category: AmenityCategory.ACCESSIBILITY,
    icon: 'door',
    description: 'Wheelchair accessible doorways'
  }
];
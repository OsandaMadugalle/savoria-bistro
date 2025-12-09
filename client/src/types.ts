export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'Starter' | 'Main' | 'Dessert' | 'Drink';
  image: string;
  cloudinaryId?: string;
  tags: string[]; // e.g., 'Vegan', 'Spicy', 'GF'
  ingredients?: string[];
  dietary?: string[];
  calories?: number;
  prepTime?: number;
  featured?: boolean; // For Chef's Specialties on home page
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface ReservationData {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  notes: string;
  status?: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  confirmationCode?: string;
  userId?: string;
  tableNumber?: string;
  duration?: number;
  paymentRequired?: boolean;
  depositAmount?: number;
  paymentStatus?: 'unpaid' | 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt?: string;
  expiresAt?: string;
}

export interface PrivateEventInquiry {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  eventType: 'wedding' | 'birthday' | 'corporate' | 'anniversary' | 'other';
  guestCount?: number;
  eventDate?: string;
  message?: string;
  status?: 'new' | 'contacted';
  createdAt?: string;
  contactHistory?: {
    staffName?: string;
    subject?: string;
    body: string;
    sentAt?: string;
  }[];
}

export interface Review {
  _id?: string;
  id?: string;
  userId?: string;
  userEmail?: string;
  userName: string;
  author?: string;
  title?: string;
  rating: number;
  text: string;
  image?: string;
  status?: 'pending' | 'approved' | 'rejected';
  date?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GalleryItem {
  id: string;
  src: string;
  caption: string;
  category: string;
}

export interface OrderHistoryItem {
  id: string;
  date: string;
  items: string[];
  total: number;
  status: 'Delivered' | 'Cancelled' | 'Processing';
}

export interface Order {
  _id?: string;
  orderId: string;
  items: { name: string; quantity: number; price?: number }[];
  total: number;
  status: 'Confirmed' | 'Preparing' | 'Quality Check' | 'Ready' | 'Delivered';
  createdAt: string;
}

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  birthday?: string;
  favoriteCuisine?: string;
  dietaryRestrictions?: string;
  preferredDiningTime?: string;
  specialRequests?: string;
  loyaltyPoints: number;
  memberSince: string;
  tier: 'Bronze' | 'Silver' | 'Gold';
  role: 'customer' | 'staff' | 'admin' | 'masterAdmin';
  history: OrderHistoryItem[];
  permissions?: {
    manageMenu?: boolean;
    viewOrders?: boolean;
    manageUsers?: boolean;
  };
}

export enum Page {
  HOME = 'HOME',
  MENU = 'MENU',
  RESERVATION = 'RESERVATION',
  ORDER = 'ORDER',
  CONTACT = 'CONTACT',
  GALLERY = 'GALLERY',
  REVIEWS = 'REVIEWS'
}

export interface OrderFeedback {
  _id?: string;
  orderId: string;
  userId: string;
  overallRating: number;
  items?: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    itemRating?: number;
    comment?: string;
  }>;
  serviceRating?: number;
  deliveryRating?: number;
  comment?: string;
  wouldRecommend?: boolean;
  improvementSuggestions?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockAlert {
  _id?: string;
  itemId: string;
  itemName: string;
  currentStock: number;
  lowStockThreshold: number;
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'BACK_IN_STOCK';
  isActive: boolean;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}
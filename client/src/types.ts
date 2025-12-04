export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'Starter' | 'Main' | 'Dessert' | 'Drink';
  image: string;
  tags: string[]; // e.g., 'Vegan', 'Spicy', 'GF'
  ingredients?: string[];
  calories?: number;
  prepTime?: number;
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
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
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
  orderId: string;
  items: { name: string; quantity: number }[];
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
  loyaltyPoints: number;
  memberSince: string;
  tier: 'Bronze' | 'Silver' | 'Gold';
  role: 'customer' | 'staff' | 'admin';
  history: OrderHistoryItem[];
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
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
  // console.log('🔑 DeliveryAPI Token:', token ? 'Found' : 'Not found', token?.substring(0, 20));
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
    // console.log('✅ Authorization header set');
  } else {
    // console.log('❌ No token or headers to set');
  }
  return config;
});

export interface DeliveryRider {
  _id: string;
  name: string;
  phone: string;
  email: string;
  vehicleType: 'Bike' | 'Scooter' | 'Car' | 'Bicycle';
  vehicleNumber: string;
  status: 'Available' | 'On Delivery' | 'Offline';
  currentLocation?: {
    lat: number;
    lng: number;
  };
  assignedOrders: string[];
  totalDeliveries: number;
  completedDeliveries: number;
  rating: number;
  earnings: number;
  isActive: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryStats {
  riders: {
    total: number;
    available: number;
    onDelivery: number;
  };
  deliveries: {
    pending: number;
    outForDelivery: number;
    completedToday: number;
  };
  topRiders: Array<{
    _id: string;
    name: string;
    completedDeliveries: number;
    rating: number;
    earnings: number;
  }>;
}

export interface RiderDeliveryData {
  rider: {
    name: string;
    status: string;
    totalDeliveries: number;
    completedDeliveries: number;
    rating: number;
    earnings: number;
  };
  activeDeliveries: any[];
  recentCompletedDeliveries: any[];
}

// Create a new delivery rider
export const createRider = async (riderData: {
  name: string;
  phone: string;
  email: string;
  vehicleType: string;
  vehicleNumber: string;
  password: string;
}) => {
  const response = await api.post('/delivery/riders', riderData);
  return response.data;
};

// Get all riders
export const getAllRiders = async (filters?: { status?: string; isActive?: boolean }) => {
  const response = await api.get<DeliveryRider[]>('/delivery/riders', { params: filters });
  return response.data;
};

// Get available riders
export const getAvailableRiders = async () => {
  const response = await api.get<DeliveryRider[]>('/delivery/riders/available');
  return response.data;
};

// Get rider by ID
export const getRiderById = async (riderId: string) => {
  const response = await api.get<DeliveryRider>(`/delivery/riders/${riderId}`);
  return response.data;
};

// Update rider details
export const updateRider = async (riderId: string, updates: Partial<DeliveryRider>) => {
  const response = await api.put(`/delivery/riders/${riderId}`, updates);
  return response.data;
};

// Delete/deactivate rider
export const deleteRider = async (riderId: string) => {
  const response = await api.delete(`/delivery/riders/${riderId}`);
  return response.data;
};

// Assign rider to order
export const assignRiderToOrder = async (orderId: string, riderId: string, estimatedDeliveryTime?: string) => {
  const response = await api.put(`/delivery/assign/${orderId}`, {
    riderId,
    estimatedDeliveryTime
  });
  return response.data;
};

// Mark order as picked up
export const markOrderPickedUp = async (orderId: string) => {
  const response = await api.put(`/delivery/pickup/${orderId}`);
  return response.data;
};

// Mark order as out for delivery
export const markOrderOutForDelivery = async (orderId: string) => {
  const response = await api.put(`/delivery/out-for-delivery/${orderId}`);
  return response.data;
};

// Mark order as delivered
export const markOrderDelivered = async (orderId: string, data?: {
  deliveryProof?: string;
  deliveryNotes?: string;
  rating?: number;
  codAmount?: number;
}) => {
  const response = await api.put(`/delivery/deliver/${orderId}`, data || {});
  return response.data;
};

// Get delivery statistics
export const getDeliveryStats = async () => {
  const response = await api.get<DeliveryStats>('/delivery/stats');
  return response.data;
};

// Get rider's own deliveries (for rider app)
export const getMyDeliveries = async () => {
  const response = await api.get<RiderDeliveryData>('/delivery/my-deliveries');
  return response.data;
};

// Update rider location
export const updateRiderLocation = async (lat: number, lng: number) => {
  const response = await api.put('/delivery/location', { lat, lng });
  return response.data;
};

export default {
  createRider,
  getAllRiders,
  getAvailableRiders,
  getRiderById,
  updateRider,
  deleteRider,
  assignRiderToOrder,
  markOrderPickedUp,
  markOrderOutForDelivery,
  markOrderDelivered,
  getDeliveryStats,
  getMyDeliveries,
  updateRiderLocation
};

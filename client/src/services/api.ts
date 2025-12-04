// Fetch single order by orderId
export const fetchOrderById = async (orderId: string): Promise<Order | null> => {
  const res = await fetch(`${API_URL}/orders/${orderId}`);
  if (!res.ok) return null;
  return await res.json();
};
// Fetch all orders for a user (customer-side tracking)
export const fetchUserOrders = async (userId: string): Promise<Order[]> => {
  const res = await fetch(`${API_URL}/orders/user/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch user orders');
  return await res.json();
};
export const updateUserProfile = async (email: string, updates: Partial<User>): Promise<User> => {
  const res = await fetch(`${API_URL}/auth/me?email=${encodeURIComponent(email)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Profile update failed');
  return await res.json();
};
// --- PROFILE API ---
export const fetchUserProfile = async (email: string): Promise<User> => {
  const res = await fetch(`${API_URL}/auth/me?email=${encodeURIComponent(email)}`);
  if (!res.ok) throw new Error('Profile fetch failed');
  return await res.json();
};
import { MenuItem, User, Order, ReservationData } from '../types';

// Use environment variable for API URL with a default fallback
const API_URL = 'http://localhost:5000/api';



// --- MENU API ---
export const fetchMenu = async (): Promise<MenuItem[]> => {
  const res = await fetch(`${API_URL}/menu`);
  if (!res.ok) throw new Error('API unreachable');
  return await res.json();
};

export const addMenuItem = async (item: MenuItem): Promise<MenuItem> => {
  const res = await fetch(`${API_URL}/menu`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
  return await res.json();
};

export const updateMenuItem = async (id: string, item: Partial<MenuItem>): Promise<MenuItem> => {
  const res = await fetch(`${API_URL}/menu/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
  return await res.json();
};

export const deleteMenuItem = async (id: string): Promise<void> => {
  await fetch(`${API_URL}/menu/${id}`, { method: 'DELETE' });
};

// --- AUTH API ---
export const loginUser = async (email: string, password: string): Promise<User> => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error('Login failed');
  return await res.json();
};

export const registerUser = async (userData: any): Promise<User> => {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  if (!res.ok) throw new Error('Signup failed');
  return await res.json();
};

// --- ORDER API ---
export const createOrder = async (order: any): Promise<{ orderId: string }> => {
  const res = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  });
  if (!res.ok) throw new Error('Order failed');
  const data = await res.json();
  return { orderId: data.orderId || data._id };
};

export const fetchAllOrders = async (): Promise<Order[]> => {
  try {
    const res = await fetch(`${API_URL}/orders`);
    if (!res.ok) return [];
    return await res.json();
  } catch (e) { return []; }
};

export const updateOrderStatus = async (orderId: string, status: string): Promise<void> => {
  await fetch(`${API_URL}/orders/${orderId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
};

// --- RESERVATION API ---
export const fetchReservations = async (): Promise<ReservationData[]> => {
  try {
    const res = await fetch(`${API_URL}/reservations`);
    return await res.json();
  } catch (e) { return []; }
};

// Update reservation status (complete/cancel)
export const updateReservationStatus = async (reservationId: string, action: 'complete' | 'cancel'): Promise<void> => {
  const res = await fetch(`${API_URL}/reservations/${reservationId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action })
  });
  if (!res.ok) throw new Error('Failed to update reservation status');
};
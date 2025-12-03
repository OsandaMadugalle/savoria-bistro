import { MenuItem, User, Order, ReservationData } from '../types';
import { MENU_ITEMS, DEMO_USER } from '../constants';

// Use environment variable for API URL with a default fallback
const API_URL = process.env.API_URL || 'http://localhost:5000/api';

// Helper to simulate network delay for mocks
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- MENU API ---
export const fetchMenu = async (): Promise<MenuItem[]> => {
  try {
    const res = await fetch(`${API_URL}/menu`);
    if (!res.ok) throw new Error('API unreachable');
    return await res.json();
  } catch (error) {
    console.warn("Backend not available, using mock menu data.");
    await delay(500); // Simulate loading
    return MENU_ITEMS;
  }
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
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error('Login failed');
    return await res.json();
  } catch (error) {
    console.warn("Backend not available, using mock login.");
    await delay(800);
    // Simple mock logic
    if (email === DEMO_USER.email && password === 'password') {
        return DEMO_USER;
    }
    // Mock Admin
    if (email === 'admin@savoria.com' && password === 'admin123') {
       return { ...DEMO_USER, id: 'admin1', name: 'Admin Owner', role: 'admin' };
    }
    // Mock Staff
    if (email === 'staff@savoria.com' && password === 'staff123') {
       return { ...DEMO_USER, id: 'staff1', name: 'Kitchen Staff', role: 'staff' };
    }
    throw new Error("Invalid credentials");
  }
};

export const registerUser = async (userData: any): Promise<User> => {
  try {
    const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
    if (!res.ok) throw new Error('Signup failed');
    return await res.json();
  } catch (error) {
    console.warn("Backend not available, using mock signup.");
    await delay(800);
    return {
        id: `u-${Date.now()}`,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        loyaltyPoints: 0,
        tier: 'Bronze',
        role: 'customer',
        memberSince: new Date().getFullYear().toString(),
        history: []
    };
  }
};

// --- ORDER API ---
export const createOrder = async (order: any): Promise<{ orderId: string }> => {
  try {
    const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
    });
    if (!res.ok) throw new Error('Order failed');
    const data = await res.json();
    return { orderId: data.orderId || data._id };
  } catch (error) {
    console.warn("Using mock order creation.");
    await delay(1500);
    return { orderId: Math.floor(1000 + Math.random() * 9000).toString() };
  }
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
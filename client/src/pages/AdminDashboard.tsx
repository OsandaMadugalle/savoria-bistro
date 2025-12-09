import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { fetchMenu, fetchAllOrders, addAdmin, addStaff, fetchAllReviews, updateReviewStatus, deleteReview, fetchGalleryImages, uploadGalleryImage, deleteGalleryImage, getNewsletterStats, getNewsletterSubscribers, sendNewsletterCampaign, addMenuItem, updateMenuItem, deleteMenuItem, fetchAllAdmins, updateAdmin, deleteAdmin, fetchPrivateEventInquiries, fetchReservations, fetchAllPromos, createPromo, updatePromo, deletePromo } from '../services/api';
import type { MenuItemPayload, Promo } from '../services/api';
import { MenuItem, User, Order, PrivateEventInquiry } from '../types';
import { LayoutDashboard, Plus, Trash2, Edit2, Upload, Send, Calendar } from 'lucide-react';
import ToastContainer, { Toast, ToastType } from '../components/Toast';
import StockManagement from '../components/StockManagement';
import FeedbackAnalytics from '../components/FeedbackAnalytics';

const DIETARY_TAGS = ['Vegetarian', 'Vegan', 'GF'];

const getEmptyMenuForm = (): Partial<MenuItem> => ({
  name: '',
  description: '',
  price: 0,
  category: 'Main',
  image: '',
  tags: [],
  ingredients: [],
  dietary: [],
  featured: false,
  prepTime: 0,
  calories: 0,
});

// ===== UTILITY FUNCTIONS =====
/**
 * Generic CSV export utility
 */
const exportToCSV = (filename: string, headers: string[], rows: (string | number)[][]): void => {
  if (rows.length === 0) return;
  
  let csv = headers.join(',') + '\n';
  csv += rows.map(r => r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

/**
 * Analytics helpers
 */
const getRevenueByDay = (orders: any[]) => {
  const map: Record<string, number> = {};
  orders.forEach(o => {
    const d = new Date(o.createdAt).toLocaleDateString();
    map[d] = (map[d] || 0) + (o.total || 0);
  });
  return Object.entries(map).map(([date, revenue]) => ({ date, revenue: Number(revenue) }));
};

const getOrdersByDay = (orders: any[]) => {
  const map: Record<string, number> = {};
  orders.forEach(o => {
    const d = new Date(o.createdAt).toLocaleDateString();
    map[d] = (map[d] || 0) + 1;
  });
  return Object.entries(map).map(([date, orders]) => ({ date, orders: Number(orders) }));
};

const getUsersByDay = (users: any[]) => {
  const map: Record<string, number> = {};
  users.forEach(u => {
    if (!u.memberSince) return;
    const d = new Date(u.memberSince).toLocaleDateString();
    map[d] = (map[d] || 0) + 1;
  });
  return Object.entries(map).map(([date, users]) => ({ date, users: Number(users) }));
};

/**
 * Popular Items Analysis
 */
const getPopularItems = (orders: any[]) => {
  const itemFrequency: Record<string, { name: string; count: number; revenue: number }> = {};
  orders.forEach(o => {
    o.items?.forEach((item: any) => {
      if (!itemFrequency[item.itemId]) {
        itemFrequency[item.itemId] = { name: item.name, count: 0, revenue: 0 };
      }
      itemFrequency[item.itemId].count += item.quantity;
      itemFrequency[item.itemId].revenue += (item.price * item.quantity);
    });
  });
  return Object.values(itemFrequency)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((item, idx) => ({ rank: idx + 1, ...item }));
};

/**
 * Revenue Analysis by Category
 */
const getRevenueByCategory = (menuItems: any[], orders: any[]) => {
  const categoryRevenue: Record<string, number> = {};
  orders.forEach(o => {
    o.items?.forEach((item: any) => {
      const menuItem = menuItems.find(m => m.id === item.itemId || m._id === item.itemId);
      const category = menuItem?.category || 'Other';
      categoryRevenue[category] = (categoryRevenue[category] || 0) + (item.price * item.quantity);
    });
  });
  return Object.entries(categoryRevenue)
    .map(([category, revenue]) => ({ category, revenue: Number(revenue) }))
    .sort((a, b) => b.revenue - a.revenue);
};

// Customer demographics data is now filtered directly in the component render

/**
 * Booking Patterns Analysis
 */
const getBookingPatterns = (reservations: any[]) => {
  const byDayOfWeek: Record<string, number> = {};
  const byHour: Record<number, number> = {};
  const byMonth: Record<string, number> = {};

  reservations.forEach(r => {
    if (r.date) {
      const date = new Date(r.date);
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
      byDayOfWeek[dayName] = (byDayOfWeek[dayName] || 0) + 1;

      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      byMonth[monthName] = (byMonth[monthName] || 0) + 1;
    }

    if (r.time) {
      const hour = parseInt(r.time.split(':')[0]);
      byHour[hour] = (byHour[hour] || 0) + 1;
    }
  });

  return {
    byDayOfWeek: Object.entries(byDayOfWeek).map(([day, count]) => ({ day, count })),
    byHour: Object.entries(byHour)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => a.hour - b.hour),
    byMonth: Object.entries(byMonth).map(([month, count]) => ({ month, count })),
  };
};

/**
 * Order Status Distribution
 */
const getOrderStatusDistribution = (orders: any[]) => {
  const distribution: Record<string, number> = {};
  orders.forEach(o => {
    const status = o.status || 'Pending';
    distribution[status] = (distribution[status] || 0) + 1;
  });
  return Object.entries(distribution).map(([status, count]) => ({ status, count, percentage: ((count / orders.length) * 100).toFixed(1) }));
};

/**
 * Revenue Trend (Last 30 days)
 */
const getRevenueTrend = (orders: any[]) => {
  const last30Days: Record<string, number> = {};
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString();
    last30Days[dateStr] = 0;
  }

  orders.forEach(o => {
    const d = new Date(o.createdAt).toLocaleDateString();
    if (last30Days.hasOwnProperty(d)) {
      last30Days[d] += o.total || 0;
    }
  });

  return Object.entries(last30Days).map(([date, revenue]) => ({ date, revenue: Number(revenue) }));
};

// ===== COMPONENT =====
interface AdminDashboardProps {
  user: User | null;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';
  // ===== STATE: EDIT/DELETE =====
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<{ 
    name: string; 
    email: string; 
    phone?: string; 
    password?: string; 
    permissions?: { manageMenu?: boolean; viewOrders?: boolean; manageUsers?: boolean } 
  }>({ name: '', email: '' });
  const [editMsg, setEditMsg] = useState('');

  // ===== STATE: TABS & LISTS =====
  const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'reservationsHistory' | 'eventsHistory' | 'settings' | 'addAdmin' | 'addStaff' | 'customers' | 'logs' | 'analytics' | 'profile' | 'reviews' | 'gallery' | 'newsletter' | 'promos' | 'stock' | 'feedback'>('analytics');
  const [reservationSubTab, setReservationSubTab] = useState<'reservations' | 'payments'>('reservations');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed' | 'refunded'>('all');
  const [eventInquiries, setEventInquiries] = useState<PrivateEventInquiry[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState('');
  const [settings, setSettings] = useState<any>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  // ===== STATE: NEWSLETTER =====
  const [newsletterStats, setNewsletterStats] = useState<{ total: number; active: number; inactive: number; activePercentage: number } | null>(null);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<any[]>([]);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterError, setNewsletterError] = useState('');
  const [newsletterSearch, setNewsletterSearch] = useState('');
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [campaignContent, setCampaignContent] = useState('');
  const [campaignSubject, setCampaignSubject] = useState('');
  const [campaignSending, setCampaignSending] = useState(false);
  
  // ===== STATE: FORMS =====
  const [adminForm, setAdminForm] = useState<{ name: string; email: string; password: string; phone?: string }>({ name: '', email: '', password: '', phone: '' });
  const [staffForm, setStaffForm] = useState<{ name: string; email: string; password: string; phone?: string }>({ name: '', email: '', password: '', phone: '' });
  const [adminMsg, setAdminMsg] = useState('');
  const [staffMsg, setStaffMsg] = useState('');
  const [showAddAdminForm, setShowAddAdminForm] = useState(false);
  const [showAddStaffForm, setShowAddStaffForm] = useState(false);
  
  // ===== STATE: ADMIN MANAGEMENT =====
  const [allAdmins, setAllAdmins] = useState<User[]>([]);
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [adminEditForm, setAdminEditForm] = useState<{ name: string; email: string; phone?: string; password?: string }>({ name: '', email: '', phone: '' });
  
  // ===== STATE: FILTERS & LOADING =====
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderDateFilter, setOrderDateFilter] = useState('');
  const [reservationSearch, setReservationSearch] = useState('');
  const [reservationStatusFilter, setReservationStatusFilter] = useState<'all' | 'Completed' | 'Confirmed' | 'Pending' | 'Cancelled'>('all');
  const [logSearch, setLogSearch] = useState('');
  const [logDateFilter, setLogDateFilter] = useState('');
  const [menuSearch, setMenuSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [staffSearch, setStaffSearch] = useState('');

  // ===== STATE: MENU MANAGEMENT =====
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [menuForm, setMenuForm] = useState<Partial<MenuItem>>(getEmptyMenuForm());
  const [menuImageFile, setMenuImageFile] = useState<File | null>(null);
  const [menuMessage, setMenuMessage] = useState('');
  const [menuError, setMenuError] = useState('');
  const [menuTagsInput, setMenuTagsInput] = useState('');
  const [menuIngredientsInput, setMenuIngredientsInput] = useState('');
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState('');

  const resetMenuFormState = () => {
    setMenuForm(getEmptyMenuForm());
    setMenuTagsInput('');
    setMenuIngredientsInput('');
    setMenuImageFile(null);
  };

  const closeMenuForm = () => {
    setShowMenuForm(false);
    setEditingMenuId(null);
  };

  const toggleDietaryOption = (option: string) => {
    setMenuForm(prev => {
      const existing = prev.dietary || [];
      const next = existing.includes(option)
        ? existing.filter(tag => tag !== option)
        : [...existing, option];
      return { ...prev, dietary: next };
    });
  };

  // ===== STATE: GALLERY =====
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [showGalleryUpload, setShowGalleryUpload] = useState(false);
  const [galleryUploadForm, setGalleryUploadForm] = useState({ caption: '', category: '', file: null as File | null });
  const [galleryUploading, setGalleryUploading] = useState(false);

  // ===== STATE: PROMOS =====
  const [promos, setPromos] = useState<Promo[]>([]);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [promoForm, setPromoForm] = useState({ code: '', discount: 20, expiryDate: '', active: true });
  const [promoMessage, setPromoMessage] = useState('');
  const [promoError, setPromoError] = useState('');

  // ===== STATE: TOASTS =====
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = 'success', duration: number = 3000) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // ===== VALIDATION FUNCTIONS =====
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone.trim()) return true; // Optional field
    const phoneRegex = /^[\d\s\-()]{10,}$/;
    return phoneRegex.test(phone);
  };

  const validateMenuForm = (): boolean => {
    if (!menuForm.name?.trim()) {
      showToast('Dish name is required', 'error');
      return false;
    }
    if (menuForm.name.trim().length < 3) {
      showToast('Dish name must be at least 3 characters', 'error');
      return false;
    }
    if (!menuForm.price || menuForm.price <= 0) {
      showToast('Valid price is required (must be greater than 0)', 'error');
      return false;
    }
    if (!menuForm.description?.trim()) {
      showToast('Description is required', 'error');
      return false;
    }
    if (menuForm.description.trim().length < 10) {
      showToast('Description must be at least 10 characters', 'error');
      return false;
    }
    return true;
  };

  const validateAdminForm = (): boolean => {
    if (!adminForm.name?.trim()) {
      showToast('Admin name is required', 'error');
      return false;
    }
    if (adminForm.name.trim().length < 3) {
      showToast('Admin name must be at least 3 characters', 'error');
      return false;
    }
    if (!adminForm.email?.trim()) {
      showToast('Admin email is required', 'error');
      return false;
    }
    if (!validateEmail(adminForm.email)) {
      showToast('Please enter a valid email address', 'error');
      return false;
    }
    if (!adminForm.password?.trim()) {
      showToast('Admin password is required', 'error');
      return false;
    }
    if (!validatePassword(adminForm.password)) {
      showToast('Password must be at least 6 characters', 'error');
      return false;
    }
    if (adminForm.phone && !validatePhoneNumber(adminForm.phone)) {
      showToast('Please enter a valid phone number', 'error');
      return false;
    }
    return true;
  };

  const validateStaffForm = (): boolean => {
    if (!staffForm.name?.trim()) {
      showToast('Staff name is required', 'error');
      return false;
    }
    if (staffForm.name.trim().length < 3) {
      showToast('Staff name must be at least 3 characters', 'error');
      return false;
    }
    if (!staffForm.email?.trim()) {
      showToast('Staff email is required', 'error');
      return false;
    }
    if (!validateEmail(staffForm.email)) {
      showToast('Please enter a valid email address', 'error');
      return false;
    }
    if (!staffForm.password?.trim()) {
      showToast('Staff password is required', 'error');
      return false;
    }
    if (!validatePassword(staffForm.password)) {
      showToast('Password must be at least 6 characters', 'error');
      return false;
    }
    if (staffForm.phone && !validatePhoneNumber(staffForm.phone)) {
      showToast('Please enter a valid phone number', 'error');
      return false;
    }
    return true;
  };

  const validatePromoForm = (): boolean => {
    if (!promoForm.code?.trim()) {
      showToast('Promo code is required', 'error');
      return false;
    }
    if (promoForm.code.trim().length < 3) {
      showToast('Promo code must be at least 3 characters', 'error');
      return false;
    }
    if (!promoForm.discount || promoForm.discount <= 0 || promoForm.discount > 100) {
      showToast('Discount must be between 1 and 100 percent', 'error');
      return false;
    }
    if (promoForm.expiryDate && new Date(promoForm.expiryDate) <= new Date()) {
      showToast('Expiry date must be in the future', 'error');
      return false;
    }
    return true;
  };

  const validateAdminEditForm = (): boolean => {
    if (!adminEditForm.name?.trim()) {
      showToast('Admin name is required', 'error');
      return false;
    }
    if (adminEditForm.name.trim().length < 3) {
      showToast('Admin name must be at least 3 characters', 'error');
      return false;
    }
    if (!adminEditForm.email?.trim()) {
      showToast('Admin email is required', 'error');
      return false;
    }
    if (!validateEmail(adminEditForm.email)) {
      showToast('Please enter a valid email address', 'error');
      return false;
    }
    if (adminEditForm.password && !validatePassword(adminEditForm.password)) {
      showToast('Password must be at least 6 characters', 'error');
      return false;
    }
    if (adminEditForm.phone && !validatePhoneNumber(adminEditForm.phone)) {
      showToast('Please enter a valid phone number', 'error');
      return false;
    }
    return true;
  };

  // ===== HANDLERS: MENU MANAGEMENT =====
  const readFileAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Unable to read image file'));
    reader.readAsDataURL(file);
  });

  const handleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMenuError('');
    setMenuMessage('');

    if (!validateMenuForm()) {
      return;
    }

    try {
      const imageData = menuImageFile ? await readFileAsDataUrl(menuImageFile) : undefined;
      const dietaryTags = menuForm.dietary || [];
      const inputTags = menuTagsInput.split(',').map(tag => tag.trim()).filter(Boolean);
      const tags = Array.from(new Set([...dietaryTags, ...inputTags]));
      const ingredients = menuIngredientsInput.split(',').map(item => item.trim()).filter(Boolean);
      const payload: MenuItemPayload = { ...menuForm, tags, ingredients, dietary: dietaryTags };
      if (imageData) payload.imageData = imageData;

      if (editingMenuId) {
        await updateMenuItem(editingMenuId, payload, user?.email);
        showToast('Dish updated successfully!', 'success');
        const updatedMenu = await fetchMenu();
        setMenuItems(updatedMenu);
        setEditingMenuId(null);
      } else {
        await addMenuItem(payload, user?.email);
        showToast('Dish added successfully!', 'success');
        const updatedMenu = await fetchMenu();
        setMenuItems(updatedMenu);
      }
      resetMenuFormState();
      setTimeout(() => closeMenuForm(), 1500);
    } catch (err: any) {
      showToast(err.message || 'Failed to save dish', 'error');
    }
  };

  const handleDeleteMenu = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this dish?')) return;
    try {
      await deleteMenuItem(id, user?.email);
      showToast('Dish deleted successfully!', 'success');
      const updatedMenu = await fetchMenu();
      setMenuItems(updatedMenu);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete dish', 'error');
    }
  };

  const handleEditMenu = (item: MenuItem) => {
    const derivedDietary = item.dietary?.length
      ? item.dietary
      : (item.tags || []).filter(tag => DIETARY_TAGS.includes(tag));
    setMenuForm({ ...item, dietary: derivedDietary });
    setEditingMenuId(item.id);
    setShowMenuForm(true);
    setMenuImageFile(null);
    setMenuTagsInput(item.tags?.join(', ') || '');
    setMenuIngredientsInput(item.ingredients?.join(', ') || '');
  };

  // ===== HANDLERS: PROMO MANAGEMENT =====
  const handlePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    setPromoMessage('');

    if (!validatePromoForm()) {
      return;
    }

    try {
      if (editingPromoId) {
        // Edit existing promo
        await updatePromo(editingPromoId, {
          code: promoForm.code,
          discount: promoForm.discount,
          expiryDate: promoForm.expiryDate,
          active: promoForm.active
        });
        showToast(`Promo code "${promoForm.code}" updated successfully!`, 'success');
        setEditingPromoId(null);
      } else {
        // Add new promo
        await createPromo({
          code: promoForm.code,
          discount: promoForm.discount,
          expiryDate: promoForm.expiryDate,
          active: promoForm.active
        });
        showToast(`Promo code "${promoForm.code}" created successfully!`, 'success');
      }

      // Reload promos from API
      const updated = await fetchAllPromos();
      setPromos(updated);
      
      setPromoForm({ code: '', discount: 20, expiryDate: '', active: true });
      setTimeout(() => {
        setShowPromoForm(false);
        setPromoMessage('');
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save promo';
      showToast(message, 'error');
      setPromoError(message);
    }
  };

  const handleEditPromo = (promo: Promo) => {
    setEditingPromoId(promo._id || null);
    setPromoForm({
      code: promo.code,
      discount: promo.discount,
      expiryDate: promo.expiryDate.split('T')[0],
      active: promo.active
    });
    setShowPromoForm(true);
    setPromoMessage('');
    setPromoError('');
  };

  const handleDeletePromo = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this promo code?')) {
      try {
        const deleted = promos.find(p => p._id === id);
        await deletePromo(id);
        
        // Reload promos from API
        const updated = await fetchAllPromos();
        setPromos(updated);
        
        showToast(`Promo code "${deleted?.code}" deleted successfully!`, 'success');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete promo';
        showToast(message, 'error');
      }
    }
  };

  const handleCancelPromoForm = () => {
    setShowPromoForm(false);
    setEditingPromoId(null);
    setPromoForm({ code: '', discount: 20, expiryDate: '', active: true });
    setPromoError('');
    setPromoMessage('');
  };

  // ===== HANDLERS: EDIT/DELETE =====
  const handleEditUser = useCallback((u: User) => {
    setEditUser(u);
    setEditForm({
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      password: '',
      permissions: {
        manageMenu: u.permissions?.manageMenu || false,
        viewOrders: u.permissions?.viewOrders || false,
        manageUsers: u.permissions?.manageUsers || false,
      },
    });
  }, []);

  const handleEditFormChange = useCallback((field: string, value: string) => {
    setEditForm(f => ({ ...f, [field]: value }));
  }, []);

  const handlePermissionChange = useCallback((perm: string, checked: boolean) => {
    setEditForm(f => ({
      ...f,
      permissions: {
        ...f.permissions,
        [perm]: checked,
      },
    }));
  }, []);

  const handleEditFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setEditMsg('');
    try {
      const { updateUser } = await import('../services/userActionsApi');
      const updates = { ...editForm, requesterEmail: user?.email };
      await updateUser(editForm.email, updates);
      showToast('User updated successfully!', 'success');
      setEditUser(null);
      setEditForm({ name: '', email: '' });
      await loadUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to update user', 'error');
    }
  }, [editForm, user]);

  const handleDeleteUser = useCallback(async (u: User) => {
    if (window.confirm(`Are you sure you want to delete ${u.name}?`)) {
      try {
        const { deleteUser } = await import('../services/userActionsApi');
        await deleteUser(u.email);
        showToast('User deleted successfully!', 'success');
        await loadUsers?.();
      } catch (err: any) {
        showToast(err.message || 'Failed to delete user', 'error');
      }
    }
  }, []);

  // ===== HANDLERS: CSV EXPORTS =====
  const handleExportStaffCSV = useCallback(() => {
    const staff = users.filter(u => u.role === 'staff');
    const headers = ['Name', 'Email', 'Phone'];
    const rows = staff.map(u => [u.name, u.email, u.phone || '-'] as (string | number)[]);
    exportToCSV('staff.csv', headers, rows);
    showToast('Staff export downloaded!', 'success');
  }, [users]);

  const handleExportCustomersCSV = useCallback(() => {
    const customers = users.filter(u => u.role === 'customer');
    const headers = ['Name', 'Email', 'Phone', 'Loyalty Points', 'Tier', 'Member Since'];
    const rows = customers.map(u => [u.name, u.email, u.phone || '-', u.loyaltyPoints ?? 0, u.tier ?? '-', u.memberSince ?? '-'] as (string | number)[]);
    exportToCSV('customers.csv', headers, rows);
    showToast('Customer export downloaded!', 'success');
  }, [users]);

  const handleExportOrdersCSV = useCallback(() => {
    const headers = ['Order ID', 'Date', 'Items', 'Total', 'Status'];
    const rows = orders.map(order => [
      order.orderId,
      new Date(order.createdAt).toLocaleString(),
      order.items.map(i => `${i.quantity}x ${i.name}`).join(', '),
      order.total.toFixed(2),
      order.status
    ] as (string | number)[]);
    exportToCSV('orders.csv', headers, rows);
    showToast('Orders export downloaded!', 'success');
  }, [orders]);

  const handleExportLogsCSV = useCallback(() => {
    const headers = ['User Email', 'Action', 'Details', 'Timestamp'];
    const rows = activityLogs.map(log => [log.userEmail, log.action, log.details, new Date(log.timestamp).toLocaleString()] as (string | number)[]);
    exportToCSV('activity_logs.csv', headers, rows);
    showToast('Activity logs export downloaded!', 'success');
  }, [activityLogs]);

  // ===== DATA LOADING =====
  const loadData = useCallback(async () => {
    try {
      const [menuData, ordersData, reservationsData] = await Promise.all([
        fetchMenu(),
        fetchAllOrders(),
        fetchReservations()
      ]);
      setMenuItems(menuData);
      setOrders(ordersData);
      setReservations(reservationsData);
    } catch (err) {
      console.error('Failed to load data:', err);
      const [menuData, ordersData] = await Promise.all([fetchMenu(), fetchAllOrders()]);
      setMenuItems(menuData);
      setOrders(ordersData);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const { fetchAllUsers } = await import('../services/usersApi');
      const allUsers = await fetchAllUsers();
      setUsers(allUsers);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, []);

  const loadGalleryImages = useCallback(async () => {
    try {
      const images = await fetchGalleryImages();
      setGalleryImages(images);
    } catch (err) {
      console.error('Failed to fetch gallery:', err);
    }
  }, []);

  const loadEventInquiries = useCallback(async () => {
    setEventsLoading(true);
    setEventsError('');
    try {
      const inquiries = await fetchPrivateEventInquiries();
      setEventInquiries(inquiries);
    } catch (err: any) {
      setEventsError(err.message || 'Failed to load event history');
    } finally {
      setEventsLoading(false);
    }
  }, []);

  const loadPayments = useCallback(async () => {
    setPaymentsLoading(true);
    try {
      const response = await fetch(`${API_URL}/payments/admin/reservations`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      const data = await response.json();
      setPayments(data);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load payments';
      console.error('Failed to load payments:', errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setPaymentsLoading(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const response = await fetch(`${API_URL}/settings`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      const data = await response.json();
      setSettings(data);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load settings';
      console.error('Failed to load settings:', errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          adminEmail: user?.email
        })
      });
      if (!response.ok) throw new Error('Failed to update settings');
      const data = await response.json();
      setSettings(data.settings);
      showToast('Settings updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update settings', 'error');
    }
  };

  // ===== HANDLERS: FORM SUBMISSIONS =====
  const loadAdmins = useCallback(async () => {
    try {
      const admins = await fetchAllAdmins(user?.email);
      setAllAdmins(admins);
    } catch (err: any) {
      console.error('Failed to load admins:', err);
    }
  }, [user?.email]);

  const handleAddAdmin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAdminForm()) {
      return;
    }
    try {
      await addAdmin({ ...adminForm, requesterEmail: user?.email } as any);
      showToast('Admin added successfully!', 'success');
      setAdminForm({ name: '', email: '', password: '', phone: '' });
      await loadAdmins();
      await loadUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to add admin', 'error');
    }
  }, [adminForm, user, loadAdmins, loadUsers, showToast, validateAdminForm]);

  const handleEditAdminStart = (admin: User) => {
    if (admin._id) {
      setEditingAdminId(admin._id);
      setAdminEditForm({ name: admin.name, email: admin.email, phone: admin.phone || '' });
    }
  };

  const handleSaveAdmin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdminId) return;
    if (!validateAdminEditForm()) {
      return;
    }
    try {
      await updateAdmin(editingAdminId, adminEditForm);
      showToast('Admin updated successfully!', 'success');
      setEditingAdminId(null);
      setAdminEditForm({ name: '', email: '', phone: '' });
      await loadAdmins();
    } catch (err: any) {
      showToast(err.message || 'Failed to update admin', 'error');
    }
  }, [editingAdminId, adminEditForm, loadAdmins, showToast, validateAdminEditForm]);

  const handleDeleteAdmin = useCallback(async (adminId: string) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    try {
      await deleteAdmin(adminId);
      await loadAdmins();
      showToast('Admin deleted successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete admin', 'error');
    }
  }, [loadAdmins, showToast]);

  const handleAddStaff = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStaffForm()) {
      return;
    }
    try {
      await addStaff({ ...staffForm, requesterEmail: user?.email } as any);
      showToast('Staff added successfully!', 'success');
      setStaffForm({ name: '', email: '', password: '', phone: '' });
      await loadUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to add staff', 'error');
    }
  }, [staffForm, user, loadUsers, showToast, validateStaffForm]);

  // ===== HANDLERS: MASTER ADMIN OPERATIONS =====
  const handleRefreshData = useCallback(async () => {
    try {
      await Promise.all([loadData(), loadUsers(), loadEventInquiries()]);
      showToast('Data refreshed successfully!', 'success');
    } catch (err: any) {
      showToast('Failed to refresh data', 'error');
    }
  }, [loadData, loadUsers, loadEventInquiries]);

  const handleBulkDeleteStaff = useCallback(async () => {
    const count = users.filter(u => u.role === 'staff').length;
    if (!count) {
      showToast('No staff members to delete', 'info');
      return;
    }
    if (window.confirm(`Are you sure you want to delete all ${count} staff members? This action cannot be undone.`)) {
      try {
        const { deleteUser } = await import('../services/userActionsApi');
        const staff = users.filter(u => u.role === 'staff');
        await Promise.all(staff.map(s => deleteUser(s.email)));
        await loadUsers();
        showToast(`Successfully deleted ${count} staff members`, 'success');
      } catch (err: any) {
        showToast('Failed to delete staff members', 'error');
      }
    }
  }, [users, loadUsers]);

  const handleGenerateSystemReport = useCallback(() => {
    const report = {
      generatedAt: new Date().toLocaleString(),
      totalUsers: users.length,
      admins: users.filter(u => u.role === 'admin').length,
      staff: users.filter(u => u.role === 'staff').length,
      customers: users.filter(u => u.role === 'customer').length,
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0),
      menuItems: menuItems.length,
      activityLogsCount: activityLogs.length,
    };
    
    const csv = Object.entries(report)
      .map(([key, value]) => `${key},${value}`)
      .join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `system-report-${new Date().getTime()}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    showToast('System report downloaded!', 'success');
  }, [users, orders, menuItems, activityLogs]);

  // ===== EFFECTS =====

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'staff' || user.role === 'masterAdmin')) {
      loadData();
      loadUsers();
      if (user.role === 'masterAdmin') {
        loadAdmins();
      }
      if (user.role === 'admin' || user.role === 'masterAdmin') {
        loadEventInquiries();
      }
    }
  }, [user, loadData, loadUsers, loadAdmins, loadEventInquiries]);

  useEffect(() => {
    if (user && user.role === 'masterAdmin' && activeTab === 'logs') {
      setLogsLoading(true);
      setLogsError('');
      import('../services/userActionsApi').then(({ fetchActivityLogs }) => {
        fetchActivityLogs(user.email)
          .then(setActivityLogs)
          .catch(err => setLogsError(err.message || 'Failed to fetch logs'))
          .finally(() => setLogsLoading(false));
      });
    }
  }, [user, activeTab]);

  useEffect(() => {
    if (activeTab === 'reviews') {
      setReviewsLoading(true);
      setReviewsError('');
      fetchAllReviews()
        .then(setAllReviews)
        .catch(err => setReviewsError(err.message || 'Failed to fetch reviews'))
        .finally(() => setReviewsLoading(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'gallery') {
      loadGalleryImages();
    }
  }, [activeTab, loadGalleryImages]);

  useEffect(() => {
    if (activeTab === 'newsletter') {
      setNewsletterLoading(true);
      setNewsletterError('');
      Promise.all([getNewsletterStats(), getNewsletterSubscribers()])
        .then(([stats, subscribers]) => {
          setNewsletterStats(stats);
          setNewsletterSubscribers(subscribers);
        })
        .catch(err => setNewsletterError(err.message || 'Failed to fetch newsletter data'))
        .finally(() => setNewsletterLoading(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'eventsHistory') {
      loadEventInquiries();
    }
  }, [activeTab, loadEventInquiries]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showAddAdminForm || showAddStaffForm || showMenuForm || showGalleryUpload || showCampaignForm || showPromoForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAddAdminForm, showAddStaffForm, showMenuForm, showGalleryUpload, showCampaignForm, showPromoForm]);

  // Load promos on mount
  useEffect(() => {
    const loadPromos = async () => {
      try {
        const data = await fetchAllPromos();
        setPromos(data);
      } catch (err) {
        console.error('Failed to fetch promos:', err);
        showToast('Failed to load promo codes', 'error');
      }
    };
    loadPromos();
  }, []);

  return (
    <div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* Edit Modal (always rendered at top level) */}
      {editUser ? (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl min-w-[320px]">
            <h2 className="text-xl font-bold mb-4">Edit {editUser.role === 'admin' ? 'Admin' : 'Staff'}</h2>
            <form onSubmit={handleEditFormSubmit} className="flex flex-col gap-4">
              <input required placeholder="Name" className="p-3 rounded border border-stone-200" value={editForm.name} onChange={e => handleEditFormChange('name', e.target.value)} />
              <input required type="email" placeholder="Email" className="p-3 rounded border border-stone-200" value={editForm.email} onChange={e => handleEditFormChange('email', e.target.value)} />
              <input placeholder="Phone" className="p-3 rounded border border-stone-200" value={editForm.phone} onChange={e => handleEditFormChange('phone', e.target.value)} />
              <input type="password" placeholder="New Password (optional)" className="p-3 rounded border border-stone-200" value={editForm.password || ''} onChange={e => handleEditFormChange('password', e.target.value)} />
              {/* Permissions checkboxes for admin/staff */}
              {(editUser?.role === 'admin' || editUser?.role === 'staff') && (
                <div className="flex flex-col gap-2 border-t pt-4 mt-2">
                  <div className="font-bold mb-1">Permissions</div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={!!editForm.permissions?.manageMenu} onChange={e => handlePermissionChange('manageMenu', e.target.checked)} /> Manage Menu
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={!!editForm.permissions?.viewOrders} onChange={e => handlePermissionChange('viewOrders', e.target.checked)} /> View Orders
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={!!editForm.permissions?.manageUsers} onChange={e => handlePermissionChange('manageUsers', e.target.checked)} /> Manage Users
                  </label>
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-lg font-bold">Save</button>
                <button type="button" className="px-4 py-2 bg-stone-300 text-stone-900 rounded-lg font-bold" onClick={() => setEditUser(null)}>Cancel</button>
              </div>
              {editMsg && <span className="text-green-600 text-sm mt-2">{editMsg}</span>}
            </form>
          </div>
        </div>
      ) : null}
      {/* Admin Panel - for both masterAdmin and admin */}
      {user && (user.role === 'masterAdmin' || user.role === 'admin') ? (
        <div className="pt-24 pb-20 min-h-screen bg-stone-100 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-serif font-bold text-stone-900 flex items-center gap-3 mb-2">
                <LayoutDashboard className="text-orange-600" size={32} /> {user.role === 'masterAdmin' ? 'Master Admin' : 'Admin'} Panel
              </h1>
              <p className="text-stone-600">{user.role === 'masterAdmin' ? 'Manage all system resources, staff, analytics, and configurations' : 'Manage staff, orders, menu, and business operations'}</p>
            </div>

            {/* Quick Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg p-4 border border-stone-200 shadow-sm">
                <div className="text-2xl font-bold text-stone-900">{users.length}</div>
                <div className="text-xs text-stone-600 mt-1">👥 Total Users</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-stone-200 shadow-sm">
                <div className="text-2xl font-bold text-orange-600">{users.filter(u => u.role === 'admin').length + users.filter(u => u.role === 'staff').length}</div>
                <div className="text-xs text-stone-600 mt-1">👨‍💼 Staff Members</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-stone-200 shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
                <div className="text-xs text-stone-600 mt-1">📦 Total Orders</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-stone-200 shadow-sm">
                <div className="text-2xl font-bold text-green-600">${orders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2)}</div>
                <div className="text-xs text-stone-600 mt-1">💰 Total Revenue</div>
              </div>
            </div>

            {/* Main Layout with Vertical Sidebar */}
            <div className="flex gap-6">
              {/* Left Vertical Sidebar */}
              <div className="w-56 flex-shrink-0">
                <div className="sticky top-28">
                  <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                    <div className="max-h-[calc(100vh-8rem)] overflow-y-auto">
                      {/* Quick Stats Mini-Bar */}
                      <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 border-b border-stone-200 px-4 py-3">
                        <div className="text-xs font-bold text-stone-600 uppercase tracking-wide">Dashboard</div>
                      </div>

                      <div className="p-3 space-y-1">
                        {/* Core Operations */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 px-3 py-2">
                            <span className="text-lg">📦</span>
                            <p className="text-xs font-bold text-stone-600 uppercase tracking-wide flex-1">Orders</p>
                          </div>
                          <button 
                            className={`w-full text-left px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'orders' ? 'bg-orange-600 text-white' : 'text-stone-700 hover:bg-stone-100'}`} 
                            onClick={() => setActiveTab('orders')}
                          >
                            All Orders
                          </button>
                          <button
                            className={`w-full text-left px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'reservationsHistory' ? 'bg-orange-600 text-white' : 'text-stone-700 hover:bg-stone-100'}`}
                            onClick={() => setActiveTab('reservationsHistory')}
                          >
                            Reservations History
                          </button>
                          <button
                            className={`w-full text-left px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'eventsHistory' ? 'bg-orange-600 text-white' : 'text-stone-700 hover:bg-stone-100'}`}
                            onClick={() => setActiveTab('eventsHistory')}
                          >
                            Event History
                          </button>
                        </div>

                        <div className="border-t border-stone-200"></div>

                        {/* Menu & Content */}
                        {(user?.role === 'masterAdmin' || user?.role === 'admin') && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 px-3 py-2">
                              <span className="text-lg">🍽️</span>
                              <p className="text-xs font-bold text-stone-600 uppercase tracking-wide flex-1">Content</p>
                            </div>
                            <button 
                              className={`w-full text-left px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'menu' ? 'bg-orange-600 text-white' : 'text-stone-700 hover:bg-stone-100'}`} 
                              onClick={() => setActiveTab('menu')}
                            >
                              Menu Items
                            </button>
                            <button 
                              className={`w-full text-left px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'gallery' ? 'bg-orange-600 text-white' : 'text-stone-700 hover:bg-stone-100'}`} 
                              onClick={() => setActiveTab('gallery')}
                            >
                              Gallery
                            </button>
                            <button 
                              className={`w-full text-left px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'newsletter' ? 'bg-orange-600 text-white' : 'text-stone-700 hover:bg-stone-100'}`} 
                              onClick={() => setActiveTab('newsletter')}
                            >
                              Newsletter
                            </button>
                            <button 
                              className={`w-full text-left px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'promos' ? 'bg-orange-600 text-white' : 'text-stone-700 hover:bg-stone-100'}`} 
                              onClick={() => setActiveTab('promos')}
                            >
                              Promo Codes
                            </button>
                          </div>
                        )}

                        <div className="border-t border-stone-200"></div>

                        {/* People Management */}
                        {(user?.role === 'masterAdmin' || user?.role === 'admin') && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 px-3 py-2">
                              <span className="text-lg">👥</span>
                              <p className="text-xs font-bold text-stone-600 uppercase tracking-wide flex-1">People</p>
                            </div>
                            {user?.role === 'masterAdmin' && (
                              <button 
                                className={`w-full text-left px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'addAdmin' ? 'bg-orange-600 text-white' : 'text-stone-700 hover:bg-stone-100'}`} 
                                onClick={() => setActiveTab('addAdmin')}
                              >
                                Admins
                              </button>
                            )}
                            {(user?.role === 'masterAdmin' || user?.role === 'admin') && (
                              <button 
                                className={`w-full text-left px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'addStaff' ? 'bg-orange-600 text-white' : 'text-stone-700 hover:bg-stone-100'}`} 
                                onClick={() => setActiveTab('addStaff')}
                              >
                                Staff
                              </button>
                            )}
                            <button 
                              className={`w-full text-left px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'customers' ? 'bg-orange-600 text-white' : 'text-stone-700 hover:bg-stone-100'}`} 
                              onClick={() => setActiveTab('customers')}
                            >
                              Customers
                            </button>
                          </div>
                        )}

                        <div className="border-t border-stone-200"></div>

                        {/* Feedback & Analytics */}
                        {(user?.role === 'masterAdmin' || user?.role === 'admin') && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 px-3 py-2">
                              <span className="text-lg">📊</span>
                              <p className="text-xs font-bold text-stone-600 uppercase tracking-wide flex-1">Insights</p>
                            </div>
                            <button 
                              className={`w-full text-left px-4 py-2 rounded-lg font-medium text-sm transition-all relative ${activeTab === 'reviews' ? 'bg-orange-600 text-white' : 'text-stone-700 hover:bg-stone-100'}`} 
                              onClick={() => setActiveTab('reviews')}
                            >
                              <span className="flex items-center justify-between">
                                Reviews
                                {allReviews.filter((r: any) => r.status === 'pending').length > 0 && (
                                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                    {allReviews.filter((r: any) => r.status === 'pending').length}
                                  </span>
                                )}
                              </span>
                            </button>
                            <button 
                              className={`w-full text-left px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'analytics' ? 'bg-orange-600 text-white' : 'text-stone-700 hover:bg-stone-100'}`} 
                              onClick={() => setActiveTab('analytics')}
                            >
                              Analytics
                            </button>
                            {user?.role === 'masterAdmin' && (
                              <button 
                                className={`w-full text-left px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'logs' ? 'bg-orange-600 text-white' : 'text-stone-700 hover:bg-stone-100'}`}
                                onClick={() => setActiveTab('logs')}
                              >
                                Logs
                              </button>
                            )}
                          </div>
                        )}

                        <div className="border-t border-stone-200"></div>

                        {/* Operations */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 px-3 py-2">
                            <span className="text-lg">📦</span>
                            <p className="text-xs font-bold text-stone-600 uppercase tracking-wide flex-1">Operations</p>
                          </div>
                          <button 
                            className={`w-full text-left px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'stock' ? 'bg-orange-600 text-white' : 'text-stone-700 hover:bg-stone-100'}`}
                            onClick={() => setActiveTab('stock')}
                          >
                            Stock Management
                          </button>
                          <button 
                            className={`w-full text-left px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'feedback' ? 'bg-orange-600 text-white' : 'text-stone-700 hover:bg-stone-100'}`}
                            onClick={() => setActiveTab('feedback')}
                          >
                            Feedback & Ratings
                          </button>
                        </div>

                        <div className="border-t border-stone-200"></div>

                        {/* Account */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 px-3 py-2">
                            <span className="text-lg">⚙️</span>
                            <p className="text-xs font-bold text-stone-600 uppercase tracking-wide flex-1">Account</p>
                          </div>
                          <button 
                            className={`w-full text-left px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'profile' ? 'bg-orange-600 text-white' : 'text-stone-700 hover:bg-stone-100'}`}
                            onClick={() => setActiveTab('profile')}
                          >
                            My Profile
                          </button>
                          {user?.role === 'masterAdmin' && (
                            <button 
                              className={`w-full text-left px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'settings' ? 'bg-orange-600 text-white' : 'text-stone-700 hover:bg-stone-100'}`}
                              onClick={() => { setActiveTab('settings'); loadSettings(); }}
                            >
                              Restaurant Settings
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 min-w-0">
            <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-xl shadow-lg p-4 mb-8 text-white">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">Bistro Operations</h3>
                  <p className="text-orange-100 text-sm">Manage staff, orders, menu, and business reports</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={handleRefreshData}
                    className="px-4 py-2 bg-white text-orange-600 rounded-lg font-bold hover:bg-orange-50 transition-colors"
                  >
                    🔄 Refresh Data
                  </button>
                  <button 
                    onClick={handleGenerateSystemReport}
                    className="px-4 py-2 bg-white text-orange-600 rounded-lg font-bold hover:bg-orange-50 transition-colors"
                  >
                    📄 Business Report
                  </button>
                  <button 
                    onClick={handleBulkDeleteStaff}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-colors"
                  >
                    🗑️ Remove All Staff
                  </button>
                </div>
              </div>
            </div>

                {/* Analytics Tab: Summary Stats and Charts */}
                {activeTab === 'analytics' && (
                  <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm mb-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">Analytics & Statistics</h2>
                      <div className="flex gap-2 flex-wrap">
                        <button 
                          onClick={async () => {
                            const { generateRevenueReport, exportToCSV } = await import('../services/reportingService');
                            const reportData = generateRevenueReport(orders);
                            exportToCSV('revenue-report', reportData, ['Order ID', 'Date', 'Customer', 'Items Count', 'Subtotal', 'Discount', 'Tax', 'Total', 'Payment Status', 'Order Status']);
                          }}
                          className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 font-semibold"
                          title="Export all orders and revenue data"
                        >
                          📊 Revenue Report
                        </button>
                        <button 
                          onClick={async () => {
                            const { generateCustomerReport, exportToCSV } = await import('../services/reportingService');
                            const reportData = generateCustomerReport(users);
                            exportToCSV('customer-report', reportData, ['Customer ID', 'Name', 'Email', 'Phone', 'Member Since', 'Total Orders', 'Loyalty Points', 'Tier', 'Total Spent']);
                          }}
                          className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 font-semibold"
                          title="Export customer and loyalty data"
                        >
                          👥 Customer Report
                        </button>
                        <button 
                          onClick={async () => {
                            const { generatePopularItemsReport, exportToCSV } = await import('../services/reportingService');
                            const reportData = generatePopularItemsReport(orders);
                            exportToCSV('popular-items-report', reportData, ['Rank', 'Item Name', 'Units Sold', 'Revenue', 'Avg Price']);
                          }}
                          className="px-3 py-1 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 font-semibold"
                          title="Export top selling items"
                        >
                          🍽️ Popular Items
                        </button>
                        <button 
                          onClick={async () => {
                            const { generateReservationReport, exportToCSV } = await import('../services/reportingService');
                            const reportData = generateReservationReport(reservations);
                            exportToCSV('reservations-report', reportData, ['Reservation ID', 'Customer Name', 'Email', 'Phone', 'Date', 'Time', 'Guests', 'Special Requests', 'Status', 'Created']);
                          }}
                          className="px-3 py-1 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 font-semibold"
                          title="Export all reservations"
                        >
                          📅 Reservations
                        </button>
                        <button 
                          onClick={async () => {
                            const { generateTierReport, exportToCSV } = await import('../services/reportingService');
                            const reportData = generateTierReport(users);
                            exportToCSV('tier-report', reportData, ['Tier', 'Count', 'Percentage', 'Avg Points', 'Avg Spent']);
                          }}
                          className="px-3 py-1 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600 font-semibold"
                          title="Export loyalty tier analysis"
                        >
                          ⭐ Tier Analysis
                        </button>
                        <button 
                          onClick={async () => {
                            const { generateSalesReport, exportToCSV } = await import('../services/reportingService');
                            const reportData = generateSalesReport(orders);
                            exportToCSV('sales-report', reportData, ['Date', 'Orders', 'Total Revenue', 'Avg Order Value', 'Total Items']);
                          }}
                          className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 font-semibold"
                          title="Export detailed sales report"
                        >
                          📈 Sales Report
                        </button>
                        <button 
                          onClick={async () => {
                            const { generateStaffPerformanceReport, exportToCSV } = await import('../services/reportingService');
                            const reportData = generateStaffPerformanceReport(users, orders);
                            exportToCSV('staff-performance', reportData, ['Staff Name', 'Email', 'Phone', 'Total Orders', 'Total Revenue', 'Avg Revenue per Order', 'Shift Hours', 'Status']);
                          }}
                          className="px-3 py-1 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 font-semibold"
                          title="Export staff performance metrics"
                        >
                          👔 Staff Performance
                        </button>
                        <button 
                          onClick={async () => {
                            const { generateInventoryReport, exportToCSV } = await import('../services/reportingService');
                            const reportData = generateInventoryReport(menuItems);
                            exportToCSV('inventory-report', reportData, ['Item ID', 'Item Name', 'Category', 'Price', 'Availability', 'Dietary', 'Prep Time (min)', 'Calories', 'Featured']);
                          }}
                          className="px-3 py-1 bg-teal-500 text-white rounded-lg text-sm hover:bg-teal-600 font-semibold"
                          title="Export inventory and menu management"
                        >
                          📦 Inventory
                        </button>
                        <button 
                          onClick={async () => {
                            const { generateComprehensiveReport, exportToPDF } = await import('../services/reportingService');
                            const reportContent = await generateComprehensiveReport(orders, users, reservations, menuItems);
                            exportToPDF('comprehensive-report', 'Comprehensive Business Report', reportContent);
                          }}
                          className="px-3 py-1 bg-pink-500 text-white rounded-lg text-sm hover:bg-pink-600 font-semibold"
                          title="Export complete business report as PDF"
                        >
                          📄 PDF Report
                        </button>
                      </div>
                    </div>

                    {/* Summary Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="text-2xl font-bold text-blue-700">{users.filter(u => u.role === 'customer').length}</div>
                        <div className="text-sm text-blue-600 mt-1">Total Customers</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="text-2xl font-bold text-green-700">{orders.length}</div>
                        <div className="text-sm text-green-600 mt-1">Total Orders</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <div className="text-2xl font-bold text-purple-700">${orders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(0)}</div>
                        <div className="text-sm text-purple-600 mt-1">Total Revenue</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <div className="text-2xl font-bold text-orange-700">${orders.length > 0 ? (orders.reduce((sum, o) => sum + (o.total || 0), 0) / orders.length).toFixed(2) : '0'}</div>
                        <div className="text-sm text-orange-600 mt-1">Avg Order Value</div>
                      </div>
                    </div>

                    {/* Customer Demographics */}
                    {users.filter(u => u.role === 'customer').length > 0 && (
                    <div className="bg-stone-50 p-4 rounded-lg mb-8 border border-stone-200">
                      <h3 className="text-lg font-bold mb-4">Customer Demographics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="text-sm font-semibold text-stone-700 mb-3">Tier Distribution</div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-stone-600">🥉 Bronze</span>
                              <div className="flex items-center gap-2">
                                <div className="w-32 h-2 bg-stone-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-amber-600" 
                                    style={{ width: `${users.filter(u => u.role === 'customer' && u.tier === 'Bronze').length > 0 ? (users.filter(u => u.role === 'customer' && u.tier === 'Bronze').length / users.filter(u => u.role === 'customer').length) * 100 : 0}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-semibold text-stone-700 w-10">{users.filter(u => u.role === 'customer' && u.tier === 'Bronze').length}</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-stone-600">🥈 Silver</span>
                              <div className="flex items-center gap-2">
                                <div className="w-32 h-2 bg-stone-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gray-400" 
                                    style={{ width: `${users.filter(u => u.role === 'customer' && u.tier === 'Silver').length > 0 ? (users.filter(u => u.role === 'customer' && u.tier === 'Silver').length / users.filter(u => u.role === 'customer').length) * 100 : 0}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-semibold text-stone-700 w-10">{users.filter(u => u.role === 'customer' && u.tier === 'Silver').length}</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-stone-600">🥇 Gold</span>
                              <div className="flex items-center gap-2">
                                <div className="w-32 h-2 bg-stone-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-yellow-500" 
                                    style={{ width: `${users.filter(u => u.role === 'customer' && u.tier === 'Gold').length > 0 ? (users.filter(u => u.role === 'customer' && u.tier === 'Gold').length / users.filter(u => u.role === 'customer').length) * 100 : 0}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-semibold text-stone-700 w-10">{users.filter(u => u.role === 'customer' && u.tier === 'Gold').length}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-stone-700 mb-3">Loyalty Metrics</div>
                          <div className="space-y-3">
                            <div>
                              <div className="text-sm text-stone-600">Total Loyalty Points</div>
                              <div className="text-2xl font-bold text-purple-700">{users.filter(u => u.role === 'customer').reduce((sum, u) => sum + (u.loyaltyPoints || 0), 0).toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-sm text-stone-600">Avg Points per Customer</div>
                              <div className="text-2xl font-bold text-purple-700">{users.filter(u => u.role === 'customer').length > 0 ? (users.filter(u => u.role === 'customer').reduce((sum, u) => sum + (u.loyaltyPoints || 0), 0) / users.filter(u => u.role === 'customer').length).toFixed(0) : 0}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    )}

                    {/* Revenue Trend */}
                    <div className="mb-8">
                      <h3 className="text-lg font-bold mb-2">Revenue Trend (Last 30 Days)</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={getRevenueTrend(orders)} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Area type="monotone" dataKey="revenue" fill="#ea580c" stroke="#d4380d" name="Revenue" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Popular Items */}
                    <div className="mb-8">
                      <h3 className="text-lg font-bold mb-2">Top 10 Popular Items</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={getPopularItems(orders)} margin={{ top: 10, right: 30, left: 0, bottom: 50 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Units Sold" />
                          <Bar yAxisId="right" dataKey="revenue" fill="#f59e0b" name="Revenue" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Revenue by Category */}
                    <div className="mb-8">
                      <h3 className="text-lg font-bold mb-2">Revenue by Category</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={getRevenueByCategory(menuItems, orders)}
                            dataKey="revenue"
                            nameKey="category"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label
                          >
                            {getRevenueByCategory(menuItems, orders).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={['#ea580c', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][index % 6]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Booking Patterns */}
                    <div className="mb-8">
                      <h3 className="text-lg font-bold mb-2">Reservation Booking Patterns</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-semibold text-stone-700 mb-3">By Day of Week</h4>
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={getBookingPatterns(reservations).byDayOfWeek} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="day" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="count" fill="#10b981" name="Bookings" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-stone-700 mb-3">By Time of Day</h4>
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={getBookingPatterns(reservations).byHour} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="hour" label={{ value: 'Hour (24h)', position: 'insideBottomRight', offset: -5 }} />
                              <YAxis />
                              <Tooltip />
                              <Line type="monotone" dataKey="count" stroke="#f59e0b" name="Reservations" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* Order Status Distribution */}
                    <div className="mb-8">
                      <h3 className="text-lg font-bold mb-2">Order Status Distribution</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                              <Pie
                                data={getOrderStatusDistribution(orders)}
                                dataKey="count"
                                nameKey="status"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label
                              >
                                {getOrderStatusDistribution(orders).map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 4]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div>
                          <div className="space-y-2">
                            {getOrderStatusDistribution(orders).map((stat: any) => (
                              <div key={stat.status} className="flex justify-between items-center p-3 bg-stone-50 rounded-lg">
                                <span className="font-semibold text-stone-700">{stat.status}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm text-stone-600">{stat.percentage}%</span>
                                  <span className="font-bold text-stone-900 text-lg">{stat.count}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sales/Revenue by Day Chart */}
                    <div className="mb-8">
                      <h3 className="text-lg font-bold mb-2">Sales (Revenue) by Day</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={getRevenueByDay(orders)} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="revenue" fill="#ea580c" name="Revenue" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Orders by Day Chart */}
                    <div className="mb-8">
                      <h3 className="text-lg font-bold mb-2">Orders by Day</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={getOrdersByDay(orders)} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="orders" stroke="#ea580c" name="Orders" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* New Users by Day Chart */}
                    <div className="mb-8">
                      <h3 className="text-lg font-bold mb-2">New Users by Day</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={getUsersByDay(users)} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="users" stroke="#ea580c" name="New Users" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

              {/* Customers Tab: List Customers */}
              {activeTab === 'customers' && (
                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                  <h2 className="text-xl font-bold mb-2 flex items-center justify-between">
                    <span>Customers</span>
                    <button
                      className="px-3 py-1 bg-orange-600 text-white rounded-lg font-bold text-sm hover:bg-orange-700"
                      onClick={handleExportCustomersCSV}
                    >
                      Export CSV
                    </button>
                  </h2>
                  <div className="flex gap-2 mb-4 flex-wrap">
                    <input
                      type="text"
                      className="p-2 border rounded min-w-[160px]"
                      placeholder="Search name, email, phone..."
                      value={customerSearch}
                      onChange={e => setCustomerSearch(e.target.value)}
                    />
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-100">
                        <th className="p-2">Name</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Phone</th>
                        <th className="p-2">Loyalty Points</th>
                        <th className="p-2">Tier</th>
                        <th className="p-2">Member Since</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.filter(u => u.role === 'customer').filter(u =>
                        [u.name, u.email, u.phone].join(' ').toLowerCase().includes(customerSearch.toLowerCase())
                      ).map((u, idx) => (
                        <tr key={u.email || idx} className="border-b">
                          <td className="p-2">{u.name}</td>
                          <td className="p-2">{u.email}</td>
                          <td className="p-2">{u.phone || '-'}</td>
                          <td className="p-2">{u.loyaltyPoints ?? 0}</td>
                          <td className="p-2">{u.tier ?? '-'}</td>
                          <td className="p-2">{u.memberSince ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {activeTab === 'eventsHistory' && (
                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                  <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold">Private Event History</h2>
                      <p className="text-sm text-stone-500">Monitor every inquiry that has been submitted through the concierge.</p>
                    </div>
                    <button
                      className="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg font-semibold text-sm hover:bg-stone-200 transition"
                      onClick={loadEventInquiries}
                      disabled={eventsLoading}
                                >
                                  Refresh Inquiries
                                </button>
                              </div>
                              {eventsLoading ? (
                                <div className="text-center py-12 text-stone-500">Loading inquiries…</div>
                              ) : eventsError ? (
                                <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">{eventsError}</div>
                              ) : eventInquiries.length === 0 ? (
                                <div className="text-center py-12 text-stone-500">No private event inquiries yet.</div>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="min-w-full text-sm text-left">
                                    <thead className="bg-stone-50 border-b border-stone-200">
                                      <tr>
                                        <th className="p-3 font-bold text-stone-600">Name</th>
                                        <th className="p-3 font-bold text-stone-600">Email</th>
                                        <th className="p-3 font-bold text-stone-600">Phone</th>
                                        <th className="p-3 font-bold text-stone-600">Event</th>
                                        <th className="p-3 font-bold text-stone-600">Date</th>
                                        <th className="p-3 font-bold text-stone-600">Guests</th>
                                        <th className="p-3 font-bold text-stone-600">Status</th>
                                        <th className="p-3 font-bold text-stone-600">Replies</th>
                                        <th className="p-3 font-bold text-stone-600">Submitted</th>
                                        <th className="p-3 font-bold text-stone-600">Notes</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100">
                                      {eventInquiries.map(inquiry => (
                                        <tr key={inquiry._id} className="hover:bg-stone-50">
                                          <td className="p-3 font-semibold text-stone-900">{inquiry.name}</td>
                                          <td className="p-3 text-stone-600">{inquiry.email}</td>
                                          <td className="p-3 text-stone-600">{inquiry.phone || '-'}</td>
                                          <td className="p-3 text-stone-600 uppercase tracking-wide text-xs">{inquiry.eventType}</td>
                                          <td className="p-3 text-stone-600 flex items-center gap-2">
                                            <Calendar size={14} className="text-orange-500" />
                                            {inquiry.eventDate ? new Date(inquiry.eventDate).toLocaleDateString() : 'TBD'}
                                          </td>
                                          <td className="p-3 text-stone-600">{inquiry.guestCount ?? '-'}</td>
                                          <td className="p-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${inquiry.status === 'contacted' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                              {inquiry.status || 'new'}
                                            </span>
                                          </td>
                                          <td className="p-3">
                                            {inquiry.contactHistory && inquiry.contactHistory.length > 0 ? (
                                              <ul className="space-y-2 text-xs text-stone-600">
                                                {inquiry.contactHistory.map((reply, idx) => (
                                                  <li key={`${reply.sentAt || idx}-${idx}`} className="border border-stone-100 rounded-xl p-2 bg-stone-50">
                                                    <div className="font-semibold text-stone-900">{reply.subject || 'Follow-up'}</div>
                                                    <div className="text-stone-500">{reply.body}</div>
                                                    <div className="text-stone-400 text-[11px]">{reply.staffName || 'Staff'} · {reply.sentAt ? new Date(reply.sentAt).toLocaleString() : 'Just now'}</div>
                                                  </li>
                                                ))}
                                              </ul>
                                            ) : (
                                              <span className="text-stone-400 text-xs">No replies yet</span>
                                            )}
                                          </td>
                                          <td className="p-3 text-stone-600 text-xs">{inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleString() : '-'}</td>
                                          <td className="p-3 text-stone-500 italic">{inquiry.message || '-'}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          )}
              {activeTab === 'reservationsHistory' && (
                <div className="space-y-4">
                  {/* Sub-tabs for Reservations and Payments */}
                  <div className="flex gap-2 border-b border-stone-200">
                    <button
                      onClick={() => setReservationSubTab('reservations')}
                      className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
                        reservationSubTab === 'reservations'
                          ? 'border-orange-600 text-orange-600'
                          : 'border-transparent text-stone-600 hover:text-orange-600'
                      }`}
                    >
                      Reservations
                    </button>
                    <button
                      onClick={() => { setReservationSubTab('payments'); loadPayments(); }}
                      className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
                        reservationSubTab === 'payments'
                          ? 'border-orange-600 text-orange-600'
                          : 'border-transparent text-stone-600 hover:text-orange-600'
                      }`}
                    >
                      Payments
                    </button>
                  </div>

                  {/* Reservations Tab */}
                  {reservationSubTab === 'reservations' && (
                  <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-b border-stone-200 bg-stone-50">
                      <div className="flex gap-2 flex-wrap">
                        <input
                          type="text"
                          className="p-2 border rounded min-w-[140px]"
                          placeholder="Search name, email..."
                          value={reservationSearch}
                          onChange={e => setReservationSearch(e.target.value)}
                        />
                        <select
                          className="p-2 border rounded"
                          value={reservationStatusFilter}
                          onChange={e => setReservationStatusFilter(e.target.value as any)}
                        >
                          <option value="all">All Statuses</option>
                          <option value="Completed">Completed</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Pending">Pending</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-stone-200">
                        <thead className="bg-stone-50">
                          <tr>
                            <th className="p-4 text-left font-bold text-stone-700">Date & Time</th>
                            <th className="p-4 text-left font-bold text-stone-700">Guest Name</th>
                            <th className="p-4 text-left font-bold text-stone-700">Party Size</th>
                            <th className="p-4 text-left font-bold text-stone-700">Email</th>
                            <th className="p-4 text-left font-bold text-stone-700">Phone</th>
                            <th className="p-4 text-left font-bold text-stone-700">Confirmation Code</th>
                            <th className="p-4 text-left font-bold text-stone-700">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-sm">
                          {reservations
                            .filter(res => {
                              // Status filter
                              if (reservationStatusFilter !== 'all' && res.status !== reservationStatusFilter) return false;
                              // Search filter
                              const search = reservationSearch.toLowerCase();
                              return (
                                res.name.toLowerCase().includes(search) ||
                                res.email.toLowerCase().includes(search) ||
                                (res.phone && res.phone.toLowerCase().includes(search)) ||
                                (res.confirmationCode && res.confirmationCode.toLowerCase().includes(search))
                              );
                            })
                            .map((res, idx) => (
                              <tr key={res._id || idx} className="hover:bg-stone-50">
                                <td className="p-4 font-medium text-stone-900">{res.date} {res.time}</td>
                                <td className="p-4 font-semibold text-stone-900">{res.name}</td>
                                <td className="p-4 text-center text-stone-700">{res.guests} {res.guests === 1 ? 'guest' : 'guests'}</td>
                                <td className="p-4 text-stone-600 break-all text-xs">{res.email}</td>
                                <td className="p-4 text-stone-600">{res.phone}</td>
                                <td className="p-4 font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">{res.confirmationCode || '-'}</td>
                                <td className="p-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                                    res.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                    res.status === 'Confirmed' ? 'bg-blue-100 text-blue-700' :
                                    res.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {res.status || 'Pending'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          {reservations.filter(res => reservationStatusFilter === 'all' || res.status === reservationStatusFilter).length === 0 && (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-stone-500">No reservations found.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  )}

                  {/* Payments Tab */}
                  {reservationSubTab === 'payments' && (
                  <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-b border-stone-200 bg-stone-50">
                      <div className="flex gap-2 flex-wrap">
                        <input
                          type="text"
                          className="p-2 border rounded min-w-[140px]"
                          placeholder="Search customer, code..."
                          value={paymentSearch}
                          onChange={e => setPaymentSearch(e.target.value)}
                        />
                        <select
                          className="p-2 border rounded"
                          value={paymentStatusFilter}
                          onChange={e => setPaymentStatusFilter(e.target.value as any)}
                        >
                          <option value="all">All Status</option>
                          <option value="completed">Completed</option>
                          <option value="pending">Pending</option>
                          <option value="failed">Failed</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      </div>
                      <button
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700"
                        onClick={loadPayments}
                        disabled={paymentsLoading}
                      >
                        Refresh
                      </button>
                    </div>

                    {paymentsLoading ? (
                      <div className="p-8 text-center text-stone-500">Loading payments...</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-stone-200">
                          <thead className="bg-stone-50">
                            <tr>
                              <th className="p-4 text-left font-bold text-stone-700">Customer</th>
                              <th className="p-4 text-left font-bold text-stone-700">Confirmation</th>
                              <th className="p-4 text-left font-bold text-stone-700">Amount</th>
                              <th className="p-4 text-left font-bold text-stone-700">Method</th>
                              <th className="p-4 text-left font-bold text-stone-700">Status</th>
                              <th className="p-4 text-left font-bold text-stone-700">Date</th>
                              <th className="p-4 text-left font-bold text-stone-700">Card</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100 text-sm">
                            {payments
                              .filter(p => {
                                const search = paymentSearch.toLowerCase();
                                return (
                                  (paymentStatusFilter === 'all' || p.status === paymentStatusFilter) &&
                                  (p.reservationId?.name?.toLowerCase().includes(search) ||
                                   p.confirmationCode?.toLowerCase().includes(search) ||
                                   p.reservationId?.email?.toLowerCase().includes(search))
                                );
                              })
                              .map((payment, idx) => (
                                <tr key={payment._id || idx} className="hover:bg-stone-50">
                                  <td className="p-4 font-semibold text-stone-900">{payment.reservationId?.name || '-'}</td>
                                  <td className="p-4 font-mono text-xs font-bold text-orange-600">{payment.confirmationCode || '-'}</td>
                                  <td className="p-4 font-bold text-green-600">${(payment.amount / 100).toFixed(2)}</td>
                                  <td className="p-4 text-stone-600 capitalize">{payment.paymentMethod || 'card'}</td>
                                  <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                                      payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                      payment.status === 'refunded' ? 'bg-blue-100 text-blue-700' :
                                      'bg-red-100 text-red-700'
                                    }`}>
                                      {payment.status}
                                    </span>
                                  </td>
                                  <td className="p-4 text-stone-600 text-xs">{payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : '-'}</td>
                                  <td className="p-4 text-stone-600 text-xs">{payment.last4Digits ? `${payment.cardBrand} ****${payment.last4Digits}` : '-'}</td>
                                </tr>
                              ))}
                            {payments.filter(p => paymentStatusFilter === 'all' || p.status === paymentStatusFilter).length === 0 && (
                              <tr>
                                <td colSpan={7} className="p-8 text-center text-stone-500">No payments found.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  )}
                </div>
              )}
              {/* Admin Tab: Add Admin + List Admins */}
              {activeTab === 'addAdmin' && user?.role === 'masterAdmin' && (
                <div className="space-y-6">
                  {/* Add Admin Button */}
                  <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold">Admin Management</h2>
                      <button 
                        onClick={() => {
                          setShowAddAdminForm(!showAddAdminForm);
                          if (!showAddAdminForm) {
                            setAdminForm({ name: '', email: '', password: '', phone: '' });
                            setAdminMsg('');
                          }
                        }}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold flex items-center gap-2 transition-colors"
                      >
                        <Plus size={18} /> {showAddAdminForm ? 'Cancel' : 'Add Admin'}
                      </button>
                    </div>

                    {/* Add Admin Modal Popup */}
                    {showAddAdminForm && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full mx-4 animate-in fade-in scale-in-95">
                          <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-stone-900">Add New Admin</h3>
                            <button 
                              onClick={() => setShowAddAdminForm(false)}
                              className="text-stone-400 hover:text-stone-600 text-2xl"
                            >
                              ×
                            </button>
                          </div>
                          <form onSubmit={e => {
                            handleAddAdmin(e);
                            setShowAddAdminForm(false);
                          }} className="space-y-4">
                            <div>
                              <label className="block text-sm font-bold text-stone-700 mb-1">Name *</label>
                              <input required placeholder="Admin Name" className="w-full p-3 rounded border border-stone-200 focus:ring-2 focus:ring-orange-500 focus:outline-none" value={adminForm.name} onChange={e => setAdminForm(f => ({...f, name: e.target.value}))} />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-stone-700 mb-1">Email *</label>
                              <input required type="email" placeholder="admin@example.com" className="w-full p-3 rounded border border-stone-200 focus:ring-2 focus:ring-orange-500 focus:outline-none" value={adminForm.email} onChange={e => setAdminForm(f => ({...f, email: e.target.value}))} />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-stone-700 mb-1">Password *</label>
                              <input required type="password" placeholder="••••••••" className="w-full p-3 rounded border border-stone-200 focus:ring-2 focus:ring-orange-500 focus:outline-none" value={adminForm.password} onChange={e => setAdminForm(f => ({...f, password: e.target.value}))} />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-stone-700 mb-1">Phone</label>
                              <input placeholder="(optional)" className="w-full p-3 rounded border border-stone-200 focus:ring-2 focus:ring-orange-500 focus:outline-none" value={adminForm.phone} onChange={e => setAdminForm(f => ({...f, phone: e.target.value}))} />
                            </div>
                            {adminMsg && (
                              <div className="p-3 rounded-lg font-bold text-center bg-green-50 text-green-600 border border-green-300">
                                {adminMsg}
                              </div>
                            )}
                            <div className="flex gap-2 pt-4">
                              <button type="submit" className="flex-1 px-6 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition-colors">Add Admin</button>
                              <button type="button" onClick={() => setShowAddAdminForm(false)} className="flex-1 px-6 py-2 bg-stone-200 text-stone-900 rounded-lg font-bold hover:bg-stone-300 transition-colors">Cancel</button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Edit Admin Form */}
                  {editingAdminId && (
                    <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                      <h2 className="text-xl font-bold mb-4">Edit Admin</h2>
                      <form onSubmit={e => handleSaveAdmin(e)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <input required placeholder="Name" className="p-3 rounded border border-stone-200" value={adminEditForm.name} onChange={e => setAdminEditForm(f => ({...f, name: e.target.value}))} />
                          <input required type="email" placeholder="Email" className="p-3 rounded border border-stone-200" value={adminEditForm.email} onChange={e => setAdminEditForm(f => ({...f, email: e.target.value}))} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <input type="password" placeholder="New Password (optional)" className="p-3 rounded border border-stone-200" value={adminEditForm.password || ''} onChange={e => setAdminEditForm(f => ({...f, password: e.target.value}))} />
                          <input placeholder="Phone" className="p-3 rounded border border-stone-200" value={adminEditForm.phone} onChange={e => setAdminEditForm(f => ({...f, phone: e.target.value}))} />
                        </div>
                        <div className="flex gap-2">
                          <button type="submit" className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">Save Changes</button>
                          <button type="button" onClick={() => setEditingAdminId(null)} className="flex-1 px-6 py-2 bg-stone-300 text-stone-900 rounded-lg font-bold hover:bg-stone-400">Cancel</button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Admin List */}
                  <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                    <h2 className="text-xl font-bold mb-4">All Admins ({allAdmins.length})</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-stone-100 border-b-2">
                            <th className="p-3">Name</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Phone</th>
                            <th className="p-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allAdmins.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-6 text-center text-stone-500">No admins found</td>
                            </tr>
                          ) : (
                            allAdmins.map((admin, idx) => (
                              <tr key={admin._id || idx} className="border-b hover:bg-stone-50">
                                <td className="p-3 font-bold">{admin.name}</td>
                                <td className="p-3">{admin.email}</td>
                                <td className="p-3">{admin.phone || '-'}</td>
                                <td className="p-3 flex gap-2">
                                  <button onClick={() => handleEditAdminStart(admin)} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-bold">Edit</button>
                                  <button onClick={() => admin._id && handleDeleteAdmin(admin._id)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-bold" disabled={!admin._id}>Delete</button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              {/* Staff Tab: Add Staff + List Staff */}
              {activeTab === 'addStaff' && (
                <div>
                  <div className="mb-4 bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold">Staff Management</h2>
                      <button 
                        onClick={() => {
                          setShowAddStaffForm(!showAddStaffForm);
                          if (!showAddStaffForm) {
                            setStaffForm({ name: '', email: '', password: '', phone: '' });
                            setStaffMsg('');
                          }
                        }}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold flex items-center gap-2 transition-colors"
                      >
                        <Plus size={18} /> {showAddStaffForm ? 'Cancel' : 'Add Staff'}
                      </button>
                    </div>

                    {/* Add Staff Modal Popup */}
                    {showAddStaffForm && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full mx-4 animate-in fade-in scale-in-95">
                          <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-stone-900">Add New Staff</h3>
                            <button 
                              onClick={() => setShowAddStaffForm(false)}
                              className="text-stone-400 hover:text-stone-600 text-2xl"
                            >
                              ×
                            </button>
                          </div>
                          <form onSubmit={e => {
                            handleAddStaff(e);
                            setShowAddStaffForm(false);
                          }} className="space-y-4">
                            <div>
                              <label className="block text-sm font-bold text-stone-700 mb-1">Name *</label>
                              <input required placeholder="Staff Name" className="w-full p-3 rounded border border-stone-200 focus:ring-2 focus:ring-orange-500 focus:outline-none" value={staffForm.name} onChange={e => setStaffForm(f => ({...f, name: e.target.value}))} />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-stone-700 mb-1">Email *</label>
                              <input required type="email" placeholder="staff@example.com" className="w-full p-3 rounded border border-stone-200 focus:ring-2 focus:ring-orange-500 focus:outline-none" value={staffForm.email} onChange={e => setStaffForm(f => ({...f, email: e.target.value}))} />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-stone-700 mb-1">Password *</label>
                              <input required type="password" placeholder="••••••••" className="w-full p-3 rounded border border-stone-200 focus:ring-2 focus:ring-orange-500 focus:outline-none" value={staffForm.password} onChange={e => setStaffForm(f => ({...f, password: e.target.value}))} />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-stone-700 mb-1">Phone</label>
                              <input placeholder="(optional)" className="w-full p-3 rounded border border-stone-200 focus:ring-2 focus:ring-orange-500 focus:outline-none" value={staffForm.phone} onChange={e => setStaffForm(f => ({...f, phone: e.target.value}))} />
                            </div>
                            {staffMsg && (
                              <div className="p-3 rounded-lg font-bold text-center bg-red-50 text-red-600 border border-red-300">
                                {staffMsg}
                              </div>
                            )}
                            <div className="flex gap-2 pt-4">
                              <button type="submit" className="flex-1 px-6 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition-colors">Add Staff</button>
                              <button type="button" onClick={() => setShowAddStaffForm(false)} className="flex-1 px-6 py-2 bg-stone-200 text-stone-900 rounded-lg font-bold hover:bg-stone-300 transition-colors">Cancel</button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                    <h2 className="text-xl font-bold mb-2 flex items-center justify-between">
                      <span>Staff</span>
                      <button
                        className="px-3 py-1 bg-orange-600 text-white rounded-lg font-bold text-sm hover:bg-orange-700"
                        onClick={handleExportStaffCSV}
                      >
                        Export CSV
                      </button>
                    </h2>
                    <div className="flex gap-2 mb-4 flex-wrap">
                      <input
                        type="text"
                        className="p-2 border rounded min-w-[160px]"
                        placeholder="Search name, email, phone..."
                        value={staffSearch}
                        onChange={e => setStaffSearch(e.target.value)}
                      />
                    </div>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-stone-100">
                          <th className="p-2">Name</th>
                          <th className="p-2">Email</th>
                          <th className="p-2">Phone</th>
                          <th className="p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.filter(u => u.role === 'staff').filter(u =>
                          [u.name, u.email, u.phone].join(' ').toLowerCase().includes(staffSearch.toLowerCase())
                        ).map((u, idx) => (
                          <tr key={u.email || idx} className="border-b">
                            <td className="p-2">{u.name}</td>
                            <td className="p-2">{u.email}</td>
                            <td className="p-2">{u.phone || '-'}</td>
                            <td className="p-2">
                              <button className="text-blue-600 mr-2" onClick={() => handleEditUser(u)}>Edit</button>
                              <button className="text-red-600" onClick={() => handleDeleteUser(u)}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {activeTab === 'menu' && (
                <div className="space-y-6">
                  {showMenuForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-in fade-in scale-in-95">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-2xl font-bold text-stone-900">{editingMenuId ? 'Edit Dish' : 'Add New Dish'}</h3>
                          <button 
                            onClick={() => {
                              resetMenuFormState();
                              closeMenuForm();
                            }}
                            className="text-stone-400 hover:text-stone-600 text-2xl"
                          >
                            ×
                          </button>
                        </div>
                        {menuError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{menuError}</div>}
                        {menuMessage && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm">{menuMessage}</div>}
                        <form onSubmit={handleMenuSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            name="dishName"
                            type="text"
                            placeholder="Dish Name"
                            value={menuForm.name || ''}
                            onChange={e => setMenuForm({ ...menuForm, name: e.target.value })}
                            className="p-2 border rounded"
                            required
                          />
                          <select
                            name="category"
                            value={menuForm.category || 'Main'}
                            onChange={e => setMenuForm({ ...menuForm, category: e.target.value as any })}
                            className="p-2 border rounded"
                          >
                            <option value="Starter">Starter</option>
                            <option value="Main">Main</option>
                            <option value="Dessert">Dessert</option>
                            <option value="Drink">Drink</option>
                          </select>
                        </div>
                        <textarea
                          name="description"
                          placeholder="Description"
                          value={menuForm.description || ''}
                          onChange={e => setMenuForm({ ...menuForm, description: e.target.value })}
                          className="w-full p-2 border rounded text-sm"
                          rows={3}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <label className="flex flex-col text-sm font-semibold text-stone-700">
                            Price
                            <input
                              id="price"
                              name="price"
                              type="number"
                              placeholder="Price"
                              step="0.01"
                              value={menuForm.price || 0}
                              onChange={e => setMenuForm({ ...menuForm, price: parseFloat(e.target.value) })}
                              className="mt-2 p-2 border rounded"
                              required
                            />
                          </label>
                          <label className="flex flex-col text-sm font-semibold text-stone-700">
                            Image URL
                            <input
                              id="imageUrl"
                              name="imageUrl"
                              type="text"
                              placeholder="Image URL"
                              value={menuForm.image || ''}
                              onChange={e => setMenuForm({ ...menuForm, image: e.target.value })}
                              className="mt-2 p-2 border rounded"
                            />
                          </label>
                          <label className="flex flex-col text-sm font-semibold text-stone-700">
                            Prep Time (mins)
                            <input
                              id="prepTime"
                              name="prepTime"
                              type="number"
                              placeholder="Prep Time (mins)"
                              value={menuForm.prepTime ?? ''}
                              min={0}
                              onChange={e => setMenuForm({ ...menuForm, prepTime: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                              className="mt-2 p-2 border rounded"
                            />
                          </label>
                          <label className="flex flex-col text-sm font-semibold text-stone-700">
                            Calories
                            <input
                              id="calories"
                              name="calories"
                              type="number"
                              placeholder="Calories"
                              value={menuForm.calories ?? ''}
                              min={0}
                              onChange={e => setMenuForm({ ...menuForm, calories: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                              className="mt-2 p-2 border rounded"
                            />
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Upload Image (optional)</label>
                          <input
                            name="imageUpload"
                            type="file"
                            accept="image/*"
                            onChange={e => setMenuImageFile(e.target.files?.[0] || null)}
                            className="w-full p-2 border rounded"
                          />
                          {menuImageFile && (
                            <p className="text-xs text-stone-500 mt-1">Selected: {menuImageFile.name}</p>
                          )}
                          <p className="text-xs text-stone-400 mt-1">Select a file to have Cloudinary host the image; the Image URL stays in sync after upload.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
                            <input
                              name="tags"
                              type="text"
                              value={menuTagsInput}
                              onChange={e => setMenuTagsInput(e.target.value)}
                              placeholder="e.g. Vegetarian, Spicy, Featured"
                              className="w-full p-2 border rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Key Ingredients (comma separated)</label>
                            <input
                              name="ingredients"
                              type="text"
                              value={menuIngredientsInput}
                              onChange={e => setMenuIngredientsInput(e.target.value)}
                              placeholder="e.g. basil, lemon zest, ricotta"
                              className="w-full p-2 border rounded"
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium">Dietary Tags</label>
                            <span className="text-xs text-stone-400">Tap to toggle</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {DIETARY_TAGS.map(option => (
                              <button
                                type="button"
                                key={option}
                                onClick={() => toggleDietaryOption(option)}
                                className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                                  menuForm.dietary?.includes(option)
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-stone-50 border-transparent text-stone-500 hover:bg-stone-100'
                                }`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            name="featured"
                            type="checkbox"
                            checked={menuForm.featured || false}
                            onChange={e => setMenuForm({ ...menuForm, featured: e.target.checked })}
                            id="featured"
                          />
                          <label htmlFor="featured" className="text-sm">Mark as Featured (Chef's Special)</label>
                        </div>
                        <div className="flex gap-2 pt-4">
                          <button type="submit" className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700">
                            {editingMenuId ? 'Update Dish' : 'Add Dish'}
                          </button>
                          <button type="button" onClick={() => {
                            resetMenuFormState();
                            closeMenuForm();
                          }} className="flex-1 bg-stone-300 text-stone-900 px-4 py-2 rounded-lg font-bold hover:bg-stone-400">
                            Cancel
                          </button>
                        </div>
                      </form>
                      </div>
                    </div>
                  )}
                  <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                      <h2 className="text-xl font-bold text-stone-900">Menu Management</h2>
                      <button onClick={() => {
                        if (showMenuForm) {
                          resetMenuFormState();
                          closeMenuForm();
                          return;
                        }
                        resetMenuFormState();
                        setEditingMenuId(null);
                        setShowMenuForm(true);
                      }} className="bg-stone-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-stone-800">
                        <Plus size={18} /> Add Dish
                      </button>
                    </div>
                    <div className="flex gap-2 mb-4 px-6 pt-4 flex-wrap">
                      <input
                        type="text"
                        className="p-2 border rounded min-w-[160px]"
                        placeholder="Search dish, category..."
                        value={menuSearch}
                        onChange={e => setMenuSearch(e.target.value)}
                      />
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-stone-200">
                        <thead className="bg-stone-50">
                          <tr>
                            <th className="p-4 text-left font-bold text-stone-700">Dish</th>
                            <th className="p-4 text-left font-bold text-stone-700">Category</th>
                            <th className="p-4 text-left font-bold text-stone-700">Price</th>
                            <th className="p-4 text-left font-bold text-stone-700">Featured</th>
                            <th className="p-4 text-left font-bold text-stone-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-sm">
                          {menuItems.filter(item =>
                            item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
                            item.category.toLowerCase().includes(menuSearch.toLowerCase())
                          ).map((item, idx) => (
                            <tr key={item.id || idx} className="hover:bg-stone-50">
                              <td className="p-4 font-bold text-stone-900">{item.name}</td>
                              <td className="p-4 text-stone-600">{item.category}</td>
                              <td className="p-4 font-bold text-stone-900">${item.price}</td>
                              <td className="p-4">{item.featured ? '⭐ Yes' : 'No'}</td>
                              <td className="p-4 flex gap-2">
                                <button onClick={() => handleEditMenu(item)} className="text-blue-600 hover:underline"><Edit2 size={16} /></button>
                                <button onClick={() => handleDeleteMenu(item.id)} className="text-red-600 hover:underline"><Trash2 size={16} /></button>
                              </td>
                            </tr>
                          ))}
                          {menuItems.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-stone-500">No menu items found.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'orders' && (
                <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                  {/* Food Orders View */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-b border-stone-200 bg-stone-50">
                      <div className="flex gap-2 flex-wrap">
                        <input
                          type="text"
                          className="p-2 border rounded min-w-[140px]"
                          placeholder="Search order ID, item..."
                          value={orderSearch}
                          onChange={e => setOrderSearch(e.target.value)}
                          />
                          <input
                            type="date"
                            className="p-2 border rounded"
                            value={orderDateFilter}
                            onChange={e => setOrderDateFilter(e.target.value)}
                          />
                          <select
                            className="p-2 border rounded"
                            value={orderStatusFilter}
                            onChange={e => setOrderStatusFilter(e.target.value)}
                          >
                            <option value="all">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                        <button
                          className="px-3 py-1 bg-orange-600 text-white rounded-lg font-bold text-sm hover:bg-orange-700"
                          onClick={handleExportOrdersCSV}
                        >
                          Export CSV
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-stone-200">
                          <thead className="bg-stone-50">
                            <tr>
                              <th className="p-4 text-left font-bold text-stone-700">Order ID</th>
                          <th className="p-4 text-left font-bold text-stone-700">Date</th>
                          <th className="p-4 text-left font-bold text-stone-700">Items</th>
                          <th className="p-4 text-left font-bold text-stone-700">Total</th>
                          <th className="p-4 text-left font-bold text-stone-700">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-sm">
                        {orders
                          .filter(order => {
                            // Status filter
                            if (orderStatusFilter !== 'all' && order.status !== orderStatusFilter) return false;
                            // Date filter
                            if (orderDateFilter) {
                              const orderDate = new Date(order.createdAt);
                              const filterDate = new Date(orderDateFilter);
                              if (
                                orderDate.getFullYear() !== filterDate.getFullYear() ||
                                orderDate.getMonth() !== filterDate.getMonth() ||
                                orderDate.getDate() !== filterDate.getDate()
                              ) return false;
                            }
                            // Search filter
                            const search = orderSearch.toLowerCase();
                            return (
                              String(order.orderId).toLowerCase().includes(search) ||
                              order.items.some(i => i.name.toLowerCase().includes(search))
                            );
                          })
                          .map((order, idx) => (
                            <tr key={order.orderId || idx} className="hover:bg-stone-50">
                              <td className="p-4 font-mono font-bold text-stone-900">#{order.orderId}</td>
                              <td className="p-4 text-stone-600">{new Date(order.createdAt).toLocaleDateString()} <span className="text-xs text-stone-400">{new Date(order.createdAt).toLocaleTimeString()}</span></td>
                              <td className="p-4">
                                <p className="text-stone-900 font-medium truncate max-w-xs">{order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</p>
                              </td>
                              <td className="p-4 font-bold text-stone-900">${order.total.toFixed(2)}</td>
                              <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                                  order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                  order.status === 'Confirmed' ? 'bg-red-100 text-red-700' :
                                  'bg-orange-100 text-orange-700'
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        {orders.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-stone-500">No orders found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                      </div>
                    </div>
                  </div>
              )}
              {activeTab === 'logs' && user?.role === 'masterAdmin' && (
                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm mt-4">
                  <h2 className="text-xl font-bold mb-2 flex items-center justify-between">
                    <span>System Activity Logs</span>
                    <button
                      className="px-3 py-1 bg-orange-600 text-white rounded-lg font-bold text-sm hover:bg-orange-700"
                      onClick={handleExportLogsCSV}
                    >
                      Export CSV
                    </button>
                  </h2>
                  <div className="flex gap-2 mb-4 flex-wrap">
                    <input
                      type="text"
                      className="p-2 border rounded min-w-[160px]"
                      placeholder="Search email, action, details..."
                      value={logSearch}
                      onChange={e => setLogSearch(e.target.value)}
                    />
                    <input
                      type="date"
                      className="p-2 border rounded"
                      value={logDateFilter}
                      onChange={e => setLogDateFilter(e.target.value)}
                    />
                  </div>
                  {logsLoading ? (
                    <div>Loading logs...</div>
                  ) : logsError ? (
                    <div style={{ color: 'red' }}>{logsError}</div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-stone-100">
                          <th className="p-2">User Email</th>
                          <th className="p-2">Action</th>
                          <th className="p-2">Details</th>
                          <th className="p-2">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activityLogs
                          .filter(log => {
                            // Date filter
                            if (logDateFilter) {
                              const logDate = new Date(log.timestamp);
                              const filterDate = new Date(logDateFilter);
                              if (
                                logDate.getFullYear() !== filterDate.getFullYear() ||
                                logDate.getMonth() !== filterDate.getMonth() ||
                                logDate.getDate() !== filterDate.getDate()
                              ) return false;
                            }
                            // Search filter
                            const search = logSearch.toLowerCase();
                            return (
                              log.userEmail?.toLowerCase().includes(search) ||
                              log.action?.toLowerCase().includes(search) ||
                              log.details?.toLowerCase().includes(search)
                            );
                          })
                          .map((log, idx) => (
                            <tr key={log._id || idx} className="border-b">
                              <td className="p-2">{log.userEmail}</td>
                              <td className="p-2">{log.action}</td>
                              <td className="p-2">{log.details}</td>
                              <td className="p-2">{new Date(log.timestamp).toLocaleString()}</td>
                            </tr>
                          ))}
                        {activityLogs.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-stone-500">No logs found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
              {activeTab === 'reviews' && (
                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm mt-4">
                  <h2 className="text-xl font-bold mb-4">Review Management</h2>
                  
                  {/* Filter Buttons */}
                  <div className="flex gap-2 mb-6 flex-wrap">
                    <button
                      onClick={() => setReviewFilter('all')}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                        reviewFilter === 'all' ? 'bg-orange-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      📋 All ({allReviews.length})
                    </button>
                    <button
                      onClick={() => setReviewFilter('pending')}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                        reviewFilter === 'pending' ? 'bg-orange-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      ⏳ Pending ({allReviews.filter((r: any) => r.status === 'pending').length})
                    </button>
                    <button
                      onClick={() => setReviewFilter('approved')}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                        reviewFilter === 'approved' ? 'bg-orange-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      ✓ Approved ({allReviews.filter((r: any) => r.status === 'approved').length})
                    </button>
                    <button
                      onClick={() => setReviewFilter('rejected')}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                        reviewFilter === 'rejected' ? 'bg-orange-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      ✕ Rejected ({allReviews.filter((r: any) => r.status === 'rejected').length})
                    </button>
                  </div>
                  
                  {reviewsLoading ? (
                    <div className="text-center py-8">Loading reviews...</div>
                  ) : reviewsError ? (
                    <div className="bg-red-100 text-red-700 p-4 rounded-lg">{reviewsError}</div>
                  ) : allReviews.filter((r: any) => reviewFilter === 'all' || r.status === reviewFilter).length === 0 ? (
                    <div className="text-center py-8 text-stone-500">No {reviewFilter} reviews</div>
                  ) : (
                    <div className="space-y-4">
                      {allReviews.filter((r: any) => reviewFilter === 'all' || r.status === reviewFilter).map((review: any) => (
                        <div key={review._id} className="border border-stone-200 rounded-lg p-4 hover:bg-stone-50 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-stone-900">{review.userName}</span>
                                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Pending</span>
                              </div>
                              <p className="text-sm font-semibold text-stone-700 mb-1">{review.title}</p>
                              <p className="text-xs text-stone-500 mb-2">
                                {review.userEmail} • {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Unknown date'}
                              </p>
                              <div className="flex text-orange-500 mb-2">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i}>
                                    {i < review.rating ? '⭐' : '☆'}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <p className="text-stone-700 text-sm mb-4 bg-stone-50 p-3 rounded line-clamp-3">"{review.text}"</p>

                          {review.image && (
                            <div className="mb-4">
                              <img 
                                src={review.image} 
                                alt="Review" 
                                className="max-w-sm h-40 object-cover rounded-lg border border-stone-200"
                                onError={(e) => {
                                  console.error('Admin: Image failed to load:', review.image);
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                                onLoad={() => {
                                  console.log('Admin: Image loaded for review:', review._id);
                                }}
                              />
                            </div>
                          )}

                          <div className="flex gap-2">
                            {(user?.role === 'masterAdmin' || user?.role === 'admin') && review.status === 'pending' && (
                              <>
                                <button
                                  onClick={async () => {
                                    try {
                                      await updateReviewStatus(review._id, 'approved', '');
                                      setAllReviews(allReviews.map((r: any) => r._id === review._id ? {...r, status: 'approved'} : r));
                                      showToast('Review approved successfully!', 'success');
                                    } catch (err: any) {
                                      showToast('Failed to approve review', 'error');
                                    }
                                  }}
                                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded font-medium text-sm transition-colors"
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  onClick={async () => {
                                    try {
                                      await updateReviewStatus(review._id, 'rejected', 'Rejected by admin');
                                      setAllReviews(allReviews.map((r: any) => r._id === review._id ? {...r, status: 'rejected'} : r));
                                      showToast('Review rejected successfully!', 'success');
                                    } catch (err: any) {
                                      showToast('Failed to reject review', 'error');
                                    }
                                  }}
                                  className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded font-medium text-sm transition-colors"
                                >
                                  ✕ Reject
                                </button>
                              </>
                            )}
                            {(user?.role === 'masterAdmin' || user?.role === 'admin') && (
                              <button
                                onClick={async () => {
                                  try {
                                    await deleteReview(review._id);
                                    setAllReviews(allReviews.filter((r: any) => r._id !== review._id));
                                    showToast('Review deleted successfully!', 'success');
                                  } catch (err: any) {
                                    showToast('Failed to delete review', 'error');
                                  }
                                }}
                                className="flex items-center gap-1 bg-stone-400 hover:bg-stone-500 text-white px-3 py-2 rounded font-medium text-sm transition-colors ml-auto"
                              >
                                🗑️ Delete
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'stock' && (
                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                  <h2 className="text-xl font-bold mb-6">📦 Stock Management</h2>
                  {user && <StockManagement userEmail={user.email} />}
                </div>
              )}

              {activeTab === 'feedback' && (
                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                  <h2 className="text-xl font-bold mb-6">⭐ Feedback & Ratings Analytics</h2>
                  {user && <FeedbackAnalytics userEmail={user.email} />}
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                  <h2 className="text-xl font-bold mb-6">My Profile</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-bold text-stone-600">Name</label>
                      <p className="text-lg text-stone-900 mt-1">{user?.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-stone-600">Email</label>
                      <p className="text-lg text-stone-900 mt-1">{user?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-stone-600">Phone</label>
                      <p className="text-lg text-stone-900 mt-1">{user?.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-stone-600">Role</label>
                      <p className="text-lg text-orange-600 font-bold mt-1 capitalize">{user?.role}</p>
                    </div>
                  </div>
                  <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Master Admin Access:</strong> You have full control over the bistro management system including staff management, menu configuration, order tracking, customer management, and system analytics.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && user?.role === 'masterAdmin' && (
                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                  <h2 className="text-xl font-bold mb-6">Restaurant Settings</h2>
                  
                  {settingsLoading ? (
                    <div className="text-center py-8 text-stone-500">Loading settings...</div>
                  ) : settings ? (
                    <form onSubmit={handleUpdateSettings} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-stone-600 mb-2">Max Table Capacity</label>
                          <input
                            type="number"
                            value={settings.maxTableCapacity}
                            onChange={(e) => setSettings({ ...settings, maxTableCapacity: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                          />
                          <p className="text-xs text-stone-500 mt-1">Total number of guests the restaurant can accommodate</p>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-stone-600 mb-2">Deposit Amount ($)</label>
                          <input
                            type="number"
                            value={settings.depositAmount / 100}
                            onChange={(e) => setSettings({ ...settings, depositAmount: Math.round(parseFloat(e.target.value) * 100) })}
                            step="0.01"
                            className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                          />
                          <p className="text-xs text-stone-500 mt-1">Required deposit per reservation</p>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-stone-600 mb-2">Reservation Duration (minutes)</label>
                          <input
                            type="number"
                            value={settings.reservationDuration}
                            onChange={(e) => setSettings({ ...settings, reservationDuration: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                          />
                          <p className="text-xs text-stone-500 mt-1">Default dining duration per reservation</p>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-stone-600 mb-2">Cancellation Lead Time (hours)</label>
                          <input
                            type="number"
                            value={settings.cancellationHours}
                            onChange={(e) => setSettings({ ...settings, cancellationHours: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                          />
                          <p className="text-xs text-stone-500 mt-1">Hours before reservation to allow cancellation</p>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-stone-600 mb-2">Opening Time</label>
                          <input
                            type="time"
                            value={settings.operatingHoursOpen}
                            onChange={(e) => setSettings({ ...settings, operatingHoursOpen: e.target.value })}
                            className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-stone-600 mb-2">Closing Time</label>
                          <input
                            type="time"
                            value={settings.operatingHoursClose}
                            onChange={(e) => setSettings({ ...settings, operatingHoursClose: e.target.value })}
                            className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      </div>

                      <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                        <h3 className="font-semibold text-stone-900 mb-3">Current Settings Summary</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-stone-600 text-xs">Max Capacity</p>
                            <p className="font-bold text-stone-900">{settings.maxTableCapacity} guests</p>
                          </div>
                          <div>
                            <p className="text-stone-600 text-xs">Deposit</p>
                            <p className="font-bold text-stone-900">${(settings.depositAmount / 100).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-stone-600 text-xs">Duration</p>
                            <p className="font-bold text-stone-900">{settings.reservationDuration} min</p>
                          </div>
                          <div>
                            <p className="text-stone-600 text-xs">Cancellation Notice</p>
                            <p className="font-bold text-stone-900">{settings.cancellationHours}h before</p>
                          </div>
                          <div>
                            <p className="text-stone-600 text-xs">Hours</p>
                            <p className="font-bold text-stone-900">{settings.operatingHoursOpen} - {settings.operatingHoursClose}</p>
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-lg transition-colors"
                      >
                        Save Settings
                      </button>
                    </form>
                  ) : null}
                </div>
              )}

              {activeTab === 'gallery' && (
                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Gallery Management</h2>
                    <button 
                      onClick={() => setShowGalleryUpload(!showGalleryUpload)}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                    >
                      <Upload size={18} /> Upload Image
                    </button>
                  </div>

                  {showGalleryUpload && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full mx-4 animate-in fade-in scale-in-95">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-2xl font-bold text-stone-900">Upload New Image</h3>
                          <button 
                            onClick={() => setShowGalleryUpload(false)}
                            className="text-stone-400 hover:text-stone-600 text-2xl"
                          >
                            ×
                          </button>
                        </div>
                        <form onSubmit={async (e) => {
                        e.preventDefault();
                        if (!galleryUploadForm.caption || !galleryUploadForm.category || !galleryUploadForm.file) {
                          showToast('All fields required', 'error');
                          return;
                        }
                        try {
                          setGalleryUploading(true);
                          const reader = new FileReader();
                          reader.onload = async (event) => {
                            const base64 = event.target?.result as string;
                            await uploadGalleryImage({
                              caption: galleryUploadForm.caption,
                              category: galleryUploadForm.category,
                              imageBase64: base64,
                              uploadedBy: user?.email || '',
                              uploadedByName: user?.name || ''
                            });
                            setGalleryUploadForm({ caption: '', category: '', file: null });
                            setShowGalleryUpload(false);
                            showToast('Image uploaded successfully!', 'success');
                            loadGalleryImages();
                          };
                          reader.readAsDataURL(galleryUploadForm.file);
                        } catch (error) {
                          showToast('Failed to upload image', 'error');
                        } finally {
                          setGalleryUploading(false);
                        }
                      }} className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold mb-1">Caption</label>
                          <input 
                            type="text"
                            value={galleryUploadForm.caption}
                            onChange={(e) => setGalleryUploadForm({...galleryUploadForm, caption: e.target.value})}
                            placeholder="e.g., Main Dining Area"
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold mb-1">Category</label>
                          <input 
                            type="text"
                            value={galleryUploadForm.category}
                            onChange={(e) => setGalleryUploadForm({...galleryUploadForm, category: e.target.value})}
                            placeholder="e.g., Ambiance, Food, Staff"
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold mb-1">Image File</label>
                          <input 
                            type="file"
                            accept="image/*"
                            onChange={(e) => setGalleryUploadForm({...galleryUploadForm, file: e.target.files?.[0] || null})}
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={() => setShowGalleryUpload(false)}
                            className="flex-1 px-4 py-2 border border-stone-300 rounded-lg hover:bg-stone-50"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit"
                            disabled={galleryUploading}
                            className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-stone-400 text-white rounded-lg font-bold"
                          >
                            {galleryUploading ? 'Uploading...' : 'Upload'}
                          </button>
                        </div>
                      </form>
                      </div>
                    </div>
                  )}



                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.isArray(galleryImages) && galleryImages.map((img: any) => (
                      <div key={img._id} className="border border-stone-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <img src={img.src} alt={img.caption} className="w-full h-32 object-cover" />
                        <div className="p-3">
                          <p className="font-bold text-stone-900">{img.caption}</p>
                          <p className="text-xs text-stone-600">{img.category}</p>
                          <button 
                            onClick={() => {
                              if (window.confirm('Delete this image?')) {
                                deleteGalleryImage(img._id).then(() => {
                                  loadGalleryImages();
                                  showToast('Image deleted successfully!', 'success');
                                }).catch(() => {
                                  showToast('Failed to delete image', 'error');
                                });
                              }
                            }}
                            className="mt-3 w-full px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded font-bold flex items-center justify-center gap-1"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {!Array.isArray(galleryImages) || galleryImages.length === 0 && (
                    <p className="text-center py-8 text-stone-600">No images yet. Upload one to get started!</p>
                  )}
                </div>
              )}

              {activeTab === 'newsletter' && (
                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Newsletter Management</h2>
                    <button
                      onClick={() => setShowCampaignForm(!showCampaignForm)}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                    >
                      <Send size={18} /> Send Campaign
                    </button>
                  </div>

                  {showCampaignForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-in fade-in scale-in-95">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-2xl font-bold text-stone-900">Send Newsletter Campaign</h3>
                          <button 
                            onClick={() => setShowCampaignForm(false)}
                            className="text-stone-400 hover:text-stone-600 text-2xl"
                          >
                            ×
                          </button>
                        </div>
                        <form onSubmit={async (e) => {
                        e.preventDefault();
                          if (!campaignContent.trim()) {
                            showToast('Newsletter content is required', 'error');
                            return;
                          }
                          try {
                            setCampaignSending(true);
                            const result = await sendNewsletterCampaign(campaignContent, campaignSubject);
                            showToast(`Campaign sent: ${result.sent} emails sent, ${result.failed} failed`, result.failed === 0 ? 'success' : 'info');
                            setCampaignContent('');
                            setCampaignSubject('');
                            setShowCampaignForm(false);
                          } catch (error) {
                            showToast(error instanceof Error ? error.message : 'Failed to send campaign', 'error');
                          } finally {
                            setCampaignSending(false);
                          }
                      }} className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold mb-1">Subject (Optional)</label>
                          <input
                            type="text"
                            value={campaignSubject}
                            onChange={(e) => setCampaignSubject(e.target.value)}
                            placeholder="Newsletter subject line"
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold mb-1">Campaign Content</label>
                          <textarea
                            value={campaignContent}
                            onChange={(e) => setCampaignContent(e.target.value)}
                            placeholder="Enter your newsletter content (HTML or plain text)"
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg h-32"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowCampaignForm(false)}
                            className="flex-1 px-4 py-2 border border-stone-300 rounded-lg hover:bg-stone-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={campaignSending}
                            className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-stone-400 text-white rounded-lg font-bold flex items-center justify-center gap-2"
                          >
                            <Send size={16} /> {campaignSending ? 'Sending...' : 'Send Campaign'}
                          </button>
                        </div>
                      </form>
                      </div>
                    </div>
                  )}

                  {newsletterLoading ? (
                    <p className="text-center py-8 text-stone-600">Loading newsletter data...</p>
                  ) : newsletterError ? (
                    <p className="text-center py-8 text-red-600">Error: {newsletterError}</p>
                  ) : (
                    <>
                      {/* Statistics Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-blue-600 text-sm font-bold">Total Subscribers</p>
                          <p className="text-3xl font-bold text-blue-700">{newsletterStats?.total || 0}</p>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <p className="text-green-600 text-sm font-bold">Active</p>
                          <p className="text-3xl font-bold text-green-700">{newsletterStats?.active || 0}</p>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <p className="text-red-600 text-sm font-bold">Inactive</p>
                          <p className="text-3xl font-bold text-red-700">{newsletterStats?.inactive || 0}</p>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <p className="text-purple-600 text-sm font-bold">Active Rate</p>
                          <p className="text-3xl font-bold text-purple-700">{Math.round(newsletterStats?.activePercentage || 0)}%</p>
                        </div>
                      </div>

                      {/* Subscribers Search */}
                      <div className="mb-4">
                        <input
                          type="text"
                          placeholder="Search subscribers by email..."
                          value={newsletterSearch}
                          onChange={(e) => setNewsletterSearch(e.target.value)}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                        />
                      </div>

                      {/* Subscribers Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-stone-100 border-b border-stone-200">
                            <tr>
                              <th className="px-4 py-3 text-left font-bold">Email</th>
                              <th className="px-4 py-3 text-left font-bold">Name</th>
                              <th className="px-4 py-3 text-left font-bold">Subscribed</th>
                              <th className="px-4 py-3 text-left font-bold">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-200">
                            {(newsletterSubscribers || [])
                              .filter((sub: any) => !newsletterSearch || sub.email.toLowerCase().includes(newsletterSearch.toLowerCase()))
                              .map((subscriber: any, idx: number) => (
                                <tr key={subscriber.email || idx} className="hover:bg-stone-50">
                                  <td className="px-4 py-3">{subscriber.email}</td>
                                  <td className="px-4 py-3">{subscriber.name || '—'}</td>
                                  <td className="px-4 py-3 text-xs text-stone-600">{new Date(subscriber.subscribedAt).toLocaleDateString()}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                                      subscriber.isActive 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-gray-100 text-gray-700'
                                    }`}>
                                      {subscriber.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                        {(!newsletterSubscribers || newsletterSubscribers.length === 0) && (
                          <p className="text-center py-8 text-stone-600">No subscribers yet.</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'promos' && (
                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-stone-900">🎟️ Promo Code Management</h2>
                    <button 
                      onClick={() => {
                        if (showPromoForm) {
                          handleCancelPromoForm();
                        } else {
                          setShowPromoForm(true);
                          setEditingPromoId(null);
                          setPromoForm({ code: '', discount: 20, expiryDate: '', active: true });
                        }
                      }}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                    >
                      <Plus size={18} /> {showPromoForm ? 'Cancel' : 'Add Promo'}
                    </button>
                  </div>

                  {/* Offer Section Enable/Disable */}
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                  </div>

                  {showPromoForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-2xl w-full mx-4 animate-in fade-in scale-in-95">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-2xl font-bold text-stone-900">{editingPromoId ? 'Edit Promo Code' : 'Add Promo Code'}</h3>
                          <button 
                            onClick={handleCancelPromoForm}
                            className="text-stone-400 hover:text-stone-600 text-2xl"
                          >
                            ×
                          </button>
                        </div>
                        <form 
                          onSubmit={handlePromoSubmit}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-stone-700 mb-2">Promo Code</label>
                          <input 
                            type="text" 
                            value={promoForm.code}
                            onChange={(e) => setPromoForm({...promoForm, code: e.target.value.toUpperCase()})}
                            placeholder="e.g., SAVE10"
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-stone-700 mb-2">Discount %</label>
                          <input 
                            type="number" 
                            value={promoForm.discount}
                            onChange={(e) => setPromoForm({...promoForm, discount: parseInt(e.target.value)})}
                            min="1"
                            max="100"
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-stone-700 mb-2">Expiry Date</label>
                          <input 
                            type="date" 
                            value={promoForm.expiryDate}
                            onChange={(e) => setPromoForm({...promoForm, expiryDate: e.target.value})}
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                          />
                        </div>
                        <div className="flex items-end">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={promoForm.active}
                              onChange={(e) => setPromoForm({...promoForm, active: e.target.checked})}
                              className="w-4 h-4 rounded border-stone-300"
                            />
                            <span className="text-sm font-semibold text-stone-700">Active</span>
                          </label>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          type="submit"
                          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-bold"
                        >
                          {editingPromoId ? 'Update Promo' : 'Create Promo'}
                        </button>
                        <button 
                          type="button"
                          onClick={handleCancelPromoForm}
                          className="flex-1 bg-stone-200 hover:bg-stone-300 text-stone-700 px-4 py-2 rounded-lg font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                          {promoError && <p className="text-red-600 text-sm mt-2">{promoError}</p>}
                          {promoMessage && <p className="text-green-600 text-sm mt-2">{promoMessage}</p>}
                        </form>
                      </div>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-stone-100 border-b border-stone-200">
                        <tr>
                          <th className="p-4 font-bold text-stone-900">Code</th>
                          <th className="p-4 font-bold text-stone-900">Discount</th>
                          <th className="p-4 font-bold text-stone-900">Expiry Date</th>
                          <th className="p-4 font-bold text-stone-900">Status</th>
                          <th className="p-4 font-bold text-stone-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-sm">
                        {promos.map((promo) => (
                          <tr key={promo._id} className="hover:bg-stone-50">
                            <td className="p-4 font-bold text-stone-900">{promo.code}</td>
                            <td className="p-4 text-stone-600">{promo.discount}% off</td>
                            <td className="p-4 text-stone-600">{new Date(promo.expiryDate).toLocaleDateString()}</td>
                            <td className="p-4">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${promo.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {promo.active ? '✓ Active' : '✗ Inactive'}
                              </span>
                            </td>
                            <td className="p-4 flex gap-2">
                              <button 
                                onClick={() => handleEditPromo(promo)}
                                className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                              >
                                <Edit2 size={16} /> Edit
                              </button>
                              <button 
                                onClick={() => handleDeletePromo(promo._id || '')}
                                className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center gap-1"
                              >
                                <Trash2 size={16} /> Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {promos.length === 0 && (
                      <p className="text-center py-8 text-stone-600">No promo codes yet. Create one to get started!</p>
                    )}
                  </div>
                  {promoMessage && !showPromoForm && (
                    <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${promoMessage.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {promoMessage}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      ) : null}

      {/* Image Lightbox - commented out as lightboxImage is not used */}
      {/* Lightbox removed - unused state variables */}
    </div>
  );
}
export default AdminDashboard;
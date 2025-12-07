import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import { fetchMenu, fetchAllOrders, addAdmin, addStaff, fetchAllReviews, updateReviewStatus, deleteReview, fetchGalleryImages, uploadGalleryImage, deleteGalleryImage, getNewsletterStats, getNewsletterSubscribers, sendNewsletterCampaign, addMenuItem, updateMenuItem, deleteMenuItem, fetchAllAdmins, updateAdmin, deleteAdmin, fetchPrivateEventInquiries } from '../services/api';
import type { MenuItemPayload } from '../services/api';
import { MenuItem, User, Order, PrivateEventInquiry } from '../types';
import { LayoutDashboard, Plus, Trash2, Edit2, Upload, Send, X, Calendar } from 'lucide-react';
import ToastContainer, { Toast, ToastType } from '../components/Toast';

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

// ===== COMPONENT =====
interface AdminDashboardProps {
  user: User | null;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
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
  const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'eventsHistory' | 'addAdmin' | 'addStaff' | 'customers' | 'logs' | 'analytics' | 'profile' | 'reviews' | 'gallery' | 'newsletter' | 'promos'>('analytics');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [eventInquiries, setEventInquiries] = useState<PrivateEventInquiry[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState('');
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

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
  const [campaignMessage, setCampaignMessage] = useState('');
  
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
  const [galleryMessage, setGalleryMessage] = useState('');

  // ===== STATE: PROMOS =====
  const [promos, setPromos] = useState<any[]>([
    { id: 1, code: 'SAVORIA20', discount: 20, expiryDate: '2025-12-31', active: true },
    { id: 2, code: 'SAVE10', discount: 10, expiryDate: '2025-12-31', active: true },
  ]);
  const [offerEnabled, setOfferEnabled] = useState(true);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState<number | null>(null);
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

    if (!menuForm.name?.trim()) {
      setMenuError('Dish name is required');
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
  const handlePromoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    setPromoMessage('');

    if (!promoForm.code.trim()) {
      setPromoError('Promo code is required');
      return;
    }

    let updatedPromos: any[];
    
    if (editingPromoId) {
      // Edit existing promo
      updatedPromos = promos.map(p => 
        p.id === editingPromoId 
          ? { ...p, ...promoForm }
          : p
      );
      showToast(`Promo code "${promoForm.code}" updated successfully!`, 'success');
      setEditingPromoId(null);
    } else {
      // Add new promo
      const newPromo = {
        id: Math.max(...promos.map(p => p.id || 0), 0) + 1,
        ...promoForm
      };
      updatedPromos = [...promos, newPromo];
      showToast(`Promo code "${promoForm.code}" created successfully!`, 'success');
    }

    setPromos(updatedPromos);
    // Save to localStorage for syncing with home page
    localStorage.setItem('activePromos', JSON.stringify(updatedPromos));
    localStorage.setItem('offerEnabled', JSON.stringify(offerEnabled));
    
    setPromoForm({ code: '', discount: 20, expiryDate: '', active: true });
    setTimeout(() => {
      setShowPromoForm(false);
      setPromoMessage('');
    }, 1500);
  };

  const handleEditPromo = (promo: any) => {
    setEditingPromoId(promo.id);
    setPromoForm(promo);
    setShowPromoForm(true);
    setPromoMessage('');
    setPromoError('');
  };

  const handleDeletePromo = (id: number) => {
    if (window.confirm('Are you sure you want to delete this promo code?')) {
      const deleted = promos.find(p => p.id === id);
      const updatedPromos = promos.filter(p => p.id !== id);
      setPromos(updatedPromos);
      // Update localStorage
      localStorage.setItem('activePromos', JSON.stringify(updatedPromos));
      localStorage.setItem('offerEnabled', JSON.stringify(offerEnabled));
      showToast(`Promo code "${deleted?.code}" deleted successfully!`, 'success');
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
    const [menuData, ordersData] = await Promise.all([fetchMenu(), fetchAllOrders()]);
    setMenuItems(menuData);
    setOrders(ordersData);
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
    try {
      await addAdmin({ ...adminForm, requesterEmail: user?.email } as any);
      showToast('Admin added successfully!', 'success');
      setAdminForm({ name: '', email: '', password: '', phone: '' });
      await loadAdmins();
      await loadUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to add admin', 'error');
    }
  }, [adminForm, user, loadAdmins, loadUsers, showToast]);

  const handleEditAdminStart = (admin: User) => {
    if (admin._id) {
      setEditingAdminId(admin._id);
      setAdminEditForm({ name: admin.name, email: admin.email, phone: admin.phone || '' });
    }
  };

  const handleSaveAdmin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdminId) return;
    try {
      await updateAdmin(editingAdminId, adminEditForm);
      showToast('Admin updated successfully!', 'success');
      setEditingAdminId(null);
      setAdminEditForm({ name: '', email: '', phone: '' });
      await loadAdmins();
    } catch (err: any) {
      showToast(err.message || 'Failed to update admin', 'error');
    }
  }, [editingAdminId, adminEditForm, loadAdmins, showToast]);

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
    try {
      await addStaff({ ...staffForm, requesterEmail: user?.email } as any);
      showToast('Staff added successfully!', 'success');
      setStaffForm({ name: '', email: '', password: '', phone: '' });
      await loadUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to add staff', 'error');
    }
  }, [staffForm, user, loadUsers, showToast]);

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

  // ===== LIGHTBOX HANDLERS =====
  const openLightbox = (image: string) => {
    setLightboxImage(image);
    document.body.classList.add('overflow-hidden');
  };

  const closeLightbox = () => {
    setLightboxImage(null);
    document.body.classList.remove('overflow-hidden');
  };

  // ===== EFFECTS =====
  // Load promo settings from localStorage on mount
  useEffect(() => {
    const storedPromos = localStorage.getItem('activePromos');
    if (storedPromos) {
      try {
        setPromos(JSON.parse(storedPromos));
      } catch (err) {
        // Keep default promos if parsing fails
      }
    }
    
    const storedOfferEnabled = localStorage.getItem('offerEnabled');
    if (storedOfferEnabled !== null) {
      setOfferEnabled(JSON.parse(storedOfferEnabled));
    }
  }, []);

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
                  <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4">
                    <div className="space-y-2 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
                      <h3 className="text-xs font-bold uppercase text-stone-500 px-2 mb-3">Navigation</h3>
                      
                      {/* Staff Management */}
                      <div>
                        <p className="text-xs font-bold text-stone-600 px-2 py-1 uppercase tracking-wide">Staff</p>
                        {user?.role === 'masterAdmin' && (
                          <button 
                            className={`w-full text-left px-3 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'addAdmin' ? 'bg-orange-600 text-white' : 'text-stone-700 hover:bg-stone-100'}`} 
                            onClick={() => setActiveTab('addAdmin')}
                          >
                            👨‍💼 Admins
                          </button>
                        )}
                        {(user?.role === 'masterAdmin' || user?.role === 'admin') && (
                          <button 
                            className={`w-full text-left px-3 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'addStaff' ? 'bg-orange-600 text-white' : 'text-stone-700 hover:bg-stone-100'}`} 
                            onClick={() => setActiveTab('addStaff')}
                          >
                            👥 Staff
                          </button>
                        )}
                      </div>

                      <div className="border-t border-stone-200"></div>

                      {/* Customer Management */}
                      {(user?.role === 'masterAdmin' || user?.role === 'admin') && (
                        <div>
                          <p className="text-xs font-bold text-stone-600 px-2 py-1 uppercase tracking-wide">Customers</p>
                          <button 
                            className={`w-full text-left px-3 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'customers' ? 'bg-orange-600 text-white' : 'text-stone-700 hover:bg-stone-100'}`} 
                            onClick={() => setActiveTab('customers')}
                          >
                            👤 All Customers
                          </button>
                        </div>
                      )}

                      <div className="border-t border-stone-200"></div>

                      {/* Business Management */}
                      <div>
                        <p className="text-xs font-bold text-stone-600 px-2 py-1 uppercase tracking-wide">Business</p>
                        {(user?.role === 'masterAdmin' || user?.role === 'admin') && (
                          <button 
                            className={`w-full text-left px-3 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'menu' ? 'bg-orange-600 text-white' : 'text-stone-700 hover:bg-stone-100'}`} 
                            onClick={() => setActiveTab('menu')}
                          >
                            🍽️ Menu
                          </button>
                        )}
                        <button 
                          className={`w-full text-left px-3 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'orders' ? 'bg-orange-600 text-white' : 'text-stone-700 hover:bg-stone-100'}`} 
                          onClick={() => setActiveTab('orders')}
                        >
                          📦 Orders
                        </button>
                      </div>

                      <div className="border-t border-stone-200"></div>

                      {/* Reviews & Feedback */}
                      {(user?.role === 'masterAdmin' || user?.role === 'admin') && (
                        <div>
                          <p className="text-xs font-bold text-stone-600 px-2 py-1 uppercase tracking-wide">Feedback</p>
                          <button 
                            className={`w-full text-left px-3 py-2 rounded-lg font-medium text-sm transition-all relative ${activeTab === 'reviews' ? 'bg-orange-600 text-white' : 'text-stone-700 hover:bg-stone-100'}`} 
                            onClick={() => setActiveTab('reviews')}
                          >
                            ⭐ Reviews
                            {allReviews.filter((r: any) => r.status === 'pending').length > 0 && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                {allReviews.filter((r: any) => r.status === 'pending').length}
                              </span>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Gallery Management */}
                      {(user?.role === 'masterAdmin' || user?.role === 'admin') && (
                        <div>
                          <button 
                            className={`w-full text-left px-3 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'gallery' ? 'bg-orange-600 text-white' : 'text-stone-700 hover:bg-stone-100'}`} 
                            onClick={() => setActiveTab('gallery')}
                          >
                            🖼️ Gallery
                          </button>
                          <button 
                            className={`w-full text-left px-3 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'newsletter' ? 'bg-orange-600 text-white' : 'text-stone-700 hover:bg-stone-100'}`} 
                            onClick={() => setActiveTab('newsletter')}
                          >
                            📧 Newsletter
                          </button>
                          <button 
                            className={`w-full text-left px-3 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'promos' ? 'bg-orange-600 text-white' : 'text-stone-700 hover:bg-stone-100'}`} 
                            onClick={() => setActiveTab('promos')}
                          >
                            🎟️ Promo Codes
                          </button>
                        </div>
                      )}

                      <div className="border-t border-stone-200"></div>

                      {/* Analytics & Monitoring */}
                      <div>
                        <p className="text-xs font-bold text-stone-600 px-2 py-1 uppercase tracking-wide">Insights</p>
                        {(user?.role === 'masterAdmin' || user?.role === 'admin') && (
                          <button 
                            className={`w-full text-left px-3 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'analytics' ? 'bg-orange-600 text-white' : 'text-stone-700 hover:bg-stone-100'}`} 
                            onClick={() => setActiveTab('analytics')}
                          >
                            📊 Analytics
                          </button>
                        )}
                        {user?.role === 'masterAdmin' && (
                          <button 
                            className={`w-full text-left px-3 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'logs' ? 'bg-orange-600 text-white' : 'text-stone-700 hover:bg-stone-100'}`}
                            onClick={() => setActiveTab('logs')}
                          >
                            📋 Logs
                          </button>
                        )}
                      </div>

                      <div className="border-t border-stone-200"></div>

                      {/* Profile */}
                          <button
                            className={`w-full text-left px-3 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'eventsHistory' ? 'bg-orange-600 text-white' : 'text-stone-700 hover:bg-stone-100'}`}
                            onClick={() => setActiveTab('eventsHistory')}
                          >
                            🎉 Event History
                          </button>
                      <div>
                        <p className="text-xs font-bold text-stone-600 px-2 py-1 uppercase tracking-wide">Account</p>
                        <button 
                          className={`w-full text-left px-3 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'profile' ? 'bg-orange-600 text-white' : 'text-stone-700 hover:bg-stone-100'}`}
                          onClick={() => setActiveTab('profile')}
                        >
                          👤 My Profile
                        </button>
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
                    <h2 className="text-xl font-bold mb-4">Analytics & Statistics</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-orange-50 p-4 rounded-lg text-center">
                        <div className="text-3xl font-bold text-orange-700">{users.length}</div>
                        <div className="text-stone-700 mt-1">Total Users</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg text-center">
                        <div className="text-3xl font-bold text-orange-700">{orders.length}</div>
                        <div className="text-stone-700 mt-1">Total Orders</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg text-center">
                        <div className="text-3xl font-bold text-orange-700">${orders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2)}</div>
                        <div className="text-stone-700 mt-1">Total Revenue</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg text-center">
                        <div className="text-3xl font-bold text-orange-700">{menuItems.length}</div>
                        <div className="text-stone-700 mt-1">Menu Items</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg text-center">
                        <div className="text-3xl font-bold text-orange-700">{users.filter(u => u.role === 'admin').length}</div>
                        <div className="text-stone-700 mt-1">Admins</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg text-center">
                        <div className="text-3xl font-bold text-orange-700">{users.filter(u => u.role === 'staff').length}</div>
                        <div className="text-stone-700 mt-1">Staff</div>
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
            <div>
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
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4">
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
                                className="max-w-sm h-40 object-cover rounded-lg border border-stone-200 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => openLightbox(review.image)}
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
                  {reviewMessage && (
                    <div className="mt-4 bg-green-100 text-green-700 p-3 rounded-lg text-sm">
                      {reviewMessage}
                    </div>
                  )}
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
                          setGalleryMessage('All fields required');
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
                            setGalleryMessage('Image uploaded successfully!');
                            loadGalleryImages();
                            setTimeout(() => setGalleryMessage(''), 3000);
                          };
                          reader.readAsDataURL(galleryUploadForm.file);
                        } catch (error) {
                          setGalleryMessage('Failed to upload image');
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

                  {galleryMessage && (
                    <div className="fixed top-4 right-4 px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg shadow-lg z-40 animate-in fade-in slide-in-from-top-2">
                      {galleryMessage}
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
                        {campaignMessage && (
                          <div className={`p-3 rounded-lg text-sm font-medium ${campaignMessage.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {campaignMessage}
                          </div>
                        )}
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
                    <div>
                      <h3 className="font-bold text-stone-900">Special Offer Section</h3>
                      <p className="text-sm text-stone-600">Enable or disable the offer banner on the home page</p>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={offerEnabled}
                        onChange={(e) => {
                          setOfferEnabled(e.target.checked);
                          localStorage.setItem('offerEnabled', JSON.stringify(e.target.checked));
                        }}
                        className="w-6 h-6 rounded border-blue-300 cursor-pointer"
                      />
                      <span className={`font-bold ${offerEnabled ? 'text-green-600' : 'text-red-600'}`}>
                        {offerEnabled ? '✓ Enabled' : '✗ Disabled'}
                      </span>
                    </label>
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
                          <tr key={promo.id} className="hover:bg-stone-50">
                            <td className="p-4 font-bold text-stone-900">{promo.code}</td>
                            <td className="p-4 text-stone-600">{promo.discount}% off</td>
                            <td className="p-4 text-stone-600">{promo.expiryDate || 'No expiry'}</td>
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
                                onClick={() => handleDeletePromo(promo.id)}
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
      </div>
      ) : null}

      {/* Image Lightbox */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeLightbox}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeLightbox}
              className="absolute -top-10 right-0 text-white hover:text-orange-400 transition-colors"
            >
              <X size={32} />
            </button>
            <img 
              src={lightboxImage} 
              alt="Review fullscreen" 
              className="max-w-4xl max-h-[85vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
export default AdminDashboard;
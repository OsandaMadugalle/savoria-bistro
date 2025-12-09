import { MenuItem, User, Order, ReservationData, PrivateEventInquiry } from '../types';

// Use environment variable for API URL with a default fallback
const API_URL = 'http://localhost:5000/api';

// Fetch all reservations for a user (by email)
export const fetchUserReservations = async (email: string): Promise<ReservationData[]> => {
  const res = await fetch(`${API_URL}/reservations?email=${encodeURIComponent(email)}`);
  if (!res.ok) throw new Error('Failed to fetch reservations');
  return await res.json();
};
// --- RESERVATION CREATION ---
export const createReservation = async (reservation: Partial<ReservationData>): Promise<any> => {
  const res = await fetch(`${API_URL}/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reservation)
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Reservation failed');
  }
  return res.json();
};
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
export interface MenuItemPayload extends Partial<MenuItem> {
  imageData?: string;
}



// --- MENU API ---
export const fetchMenu = async (): Promise<MenuItem[]> => {
  const res = await fetch(`${API_URL}/menu`);
  if (!res.ok) throw new Error('API unreachable');
  return await res.json();
};

export const addMenuItem = async (item: MenuItemPayload, requesterEmail?: string): Promise<MenuItem> => {
  const res = await fetch(`${API_URL}/menu`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...item, requesterEmail })
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to add menu item');
  }
  return await res.json();
};

export const updateMenuItem = async (id: string, item: MenuItemPayload, requesterEmail?: string): Promise<MenuItem> => {
  const res = await fetch(`${API_URL}/menu/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...item, requesterEmail })
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to update menu item');
  }
  return await res.json();
};

export const deleteMenuItem = async (id: string, requesterEmail?: string): Promise<void> => {
  const res = await fetch(`${API_URL}/menu/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requesterEmail })
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to delete menu item');
  }
};

// --- AUTH API ---
// Add Admin (masterAdmin only)
export const addAdmin = async (adminData: { name: string; email: string; password: string; phone?: string }): Promise<User> => {
  const res = await fetch(`${API_URL}/auth/add-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(adminData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to add admin');
  }
  return await res.json();
};

// Fetch all admins (masterAdmin only)
export const fetchAllAdmins = async (email?: string): Promise<User[]> => {
  const url = email ? `${API_URL}/auth/admins?requesterEmail=${encodeURIComponent(email)}` : `${API_URL}/auth/admins`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch admins');
  return await res.json();
};

// Update admin (masterAdmin only)
export const updateAdmin = async (id: string, adminData: Partial<User>): Promise<User> => {
  const res = await fetch(`${API_URL}/auth/admins/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(adminData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to update admin');
  }
  return await res.json();
};

// Delete admin (masterAdmin only)
export const deleteAdmin = async (id: string): Promise<void> => {
  const res = await fetch(`${API_URL}/auth/admins/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to delete admin');
  }
};

// Add Staff (admin or masterAdmin)
export const addStaff = async (staffData: { name: string; email: string; password: string; phone?: string; requesterEmail?: string }): Promise<User> => {
  const res = await fetch(`${API_URL}/auth/add-staff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(staffData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to add staff');
  }
  return await res.json();
};
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
export const createOrder = async (order: any): Promise<{ orderId: string; pointsEarned: number; userTier: string; message: string }> => {
  const res = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  });
  if (!res.ok) throw new Error('Order failed');
  const data = await res.json();
  return { 
    orderId: data.orderId || data._id,
    pointsEarned: data.pointsEarned || 0,
    userTier: data.userTier || 'Bronze',
    message: data.message || 'Order placed'
  };
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

export const fetchUserLoyalty = async (userId: string): Promise<{ loyaltyPoints: number; tier: string; pointsToNextTier: number; nextTier: string }> => {
  try {
    const res = await fetch(`${API_URL}/orders/loyalty/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch loyalty info');
    return await res.json();
  } catch (e) {
    console.error('Loyalty fetch error:', e);
    return { loyaltyPoints: 0, tier: 'Bronze', pointsToNextTier: 500, nextTier: 'Silver' };
  }
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

export const updateReservationTable = async (reservationId: string, tableNumber: string): Promise<void> => {
  const res = await fetch(`${API_URL}/reservations/${reservationId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tableNumber })
  });
  if (!res.ok) throw new Error('Failed to assign table');
};

// --- REVIEW API ---
export interface Review {
  _id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  rating: number;
  title: string;
  text: string;
  image?: string;
  cloudinaryId?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Get approved reviews only (for customers)
export const fetchApprovedReviews = async (): Promise<Review[]> => {
  try {
    const res = await fetch(`${API_URL}/reviews/approved`);
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    return [];
  }
};

// --- PRIVATE EVENTS API ---
export interface PrivateEventInquiryPayload {
  name: string;
  email: string;
  phone: string;
  eventType: 'wedding' | 'birthday' | 'corporate' | 'anniversary' | 'other';
  guestCount?: number;
  eventDate?: string;
  message?: string;
}

export const submitPrivateEventInquiry = async (payload: PrivateEventInquiryPayload): Promise<PrivateEventInquiry> => {
  const res = await fetch(`${API_URL}/private-events/inquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to submit inquiry');
  return await res.json();
};

export const fetchPrivateEventInquiries = async (): Promise<PrivateEventInquiry[]> => {
  const res = await fetch(`${API_URL}/private-events/inquiries`);
  if (!res.ok) throw new Error('Failed to load inquiries');
  return await res.json();
};

export const updatePrivateEventInquiryStatus = async (id: string, status: PrivateEventInquiry['status']): Promise<PrivateEventInquiry> => {
  const res = await fetch(`${API_URL}/private-events/inquiries/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Failed to update inquiry');
  return await res.json();
};

export interface PrivateEventContactPayload {
  subject: string;
  body: string;
  staffName?: string;
}

export const sendPrivateEventEmail = async (inquiryId: string, payload: PrivateEventContactPayload): Promise<PrivateEventInquiry> => {
  const res = await fetch(`${API_URL}/private-events/inquiries/${inquiryId}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to send email');
  }
  return await res.json();
};

// Get all reviews (for admin)
export const fetchAllReviews = async (): Promise<Review[]> => {
  try {
    const res = await fetch(`${API_URL}/reviews/all`);
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    return [];
  }
};

// Get pending reviews (for admin moderation)
export const fetchPendingReviews = async (): Promise<Review[]> => {
  try {
    const res = await fetch(`${API_URL}/reviews/pending`);
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    return [];
  }
};

// Get user's own reviews
export const fetchUserReviews = async (userEmail: string): Promise<Review[]> => {
  try {
    const res = await fetch(`${API_URL}/reviews/user/${encodeURIComponent(userEmail)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    return [];
  }
};

// Submit a new review
export const submitReview = async (review: Omit<Review, '_id' | 'createdAt' | 'updatedAt'>): Promise<Review> => {
  const res = await fetch(`${API_URL}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(review)
  });
  if (!res.ok) throw new Error('Failed to submit review');
  return await res.json();
};

// Update review status (approve/reject - admin)
export const updateReviewStatus = async (reviewId: string, status: 'approved' | 'rejected', adminNotes: string = ''): Promise<Review> => {
  const res = await fetch(`${API_URL}/reviews/${reviewId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, adminNotes })
  });
  if (!res.ok) throw new Error('Failed to update review status');
  return await res.json();
};

// Delete review (admin)
export const deleteReview = async (reviewId: string): Promise<void> => {
  const res = await fetch(`${API_URL}/reviews/${reviewId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete review');
};

// --- GALLERY API ---
export interface GalleryImage {
  _id?: string;
  caption: string;
  category: string;
  src: string; // base64 or URL
  uploadedBy: string;
  uploadedByName: string;
  createdAt?: string;
  updatedAt?: string;
}

// Get all gallery images
export const fetchGalleryImages = async (): Promise<GalleryImage[]> => {
  try {
    const res = await fetch(`${API_URL}/gallery`);
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    return [];
  }
};

// Upload new gallery image (admin)
export const uploadGalleryImage = async (image: { caption: string; category: string; imageBase64: string; uploadedBy: string; uploadedByName: string }): Promise<GalleryImage> => {
  const res = await fetch(`${API_URL}/gallery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(image)
  });
  if (!res.ok) throw new Error('Failed to upload image');
  return await res.json();
};

// Update gallery image
export const updateGalleryImage = async (imageId: string, updates: Partial<GalleryImage>): Promise<GalleryImage> => {
  const res = await fetch(`${API_URL}/gallery/${imageId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update image');
  return await res.json();
};

// Delete gallery image (admin)
export const deleteGalleryImage = async (imageId: string): Promise<void> => {
  const res = await fetch(`${API_URL}/gallery/${imageId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete image');
};

// Newsletter API functions
export const subscribeNewsletter = async (email: string, name?: string): Promise<{ message: string }> => {
  const res = await fetch(`${API_URL}/newsletter/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name })
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to subscribe to newsletter');
  }
  return res.json();
};

export const unsubscribeNewsletter = async (email: string): Promise<{ message: string }> => {
  const res = await fetch(`${API_URL}/newsletter/unsubscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  if (!res.ok) throw new Error('Failed to unsubscribe from newsletter');
  return res.json();
};

export const getNewsletterStats = async (): Promise<{ total: number; active: number; inactive: number; activePercentage: number }> => {
  const res = await fetch(`${API_URL}/newsletter/stats`);
  if (!res.ok) throw new Error('Failed to fetch newsletter stats');
  return res.json();
};

export const getNewsletterSubscribers = async (): Promise<Array<{ email: string; name?: string; subscribedAt: string; isActive: boolean }>> => {
  const res = await fetch(`${API_URL}/newsletter/subscribers`);
  if (!res.ok) throw new Error('Failed to fetch newsletter subscribers');
  const data = await res.json();
  return Array.isArray(data) ? data : data.data || [];
};

export const sendNewsletterCampaign = async (content: string, subject?: string): Promise<{ message: string; sent: number; failed: number; total: number }> => {
  const res = await fetch(`${API_URL}/newsletter/send-campaign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, subject })
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to send newsletter campaign');
  }
  return res.json();
};

// --- STOCK MANAGEMENT API ---
export const getStockAlerts = async () => {
  const res = await fetch(`${API_URL}/stock/alerts`);
  if (!res.ok) throw new Error('Failed to fetch stock alerts');
  return res.json();
};

export const getActiveStockAlerts = async () => {
  const res = await fetch(`${API_URL}/stock/alerts/active`);
  if (!res.ok) throw new Error('Failed to fetch active alerts');
  return res.json();
};

export const getLowStockItems = async () => {
  const res = await fetch(`${API_URL}/stock/low-stock`);
  if (!res.ok) throw new Error('Failed to fetch low stock items');
  return res.json();
};

export const getOutOfStockItems = async () => {
  const res = await fetch(`${API_URL}/stock/out-of-stock`);
  if (!res.ok) throw new Error('Failed to fetch out of stock items');
  return res.json();
};

export const updateItemStock = async (
  itemId: string,
  quantity: number,
  reason: string,
  requesterEmail: string
) => {
  const res = await fetch(`${API_URL}/stock/${itemId}/stock`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity, reason, requesterEmail })
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to update stock');
  }
  return res.json();
};

export const setLowStockThreshold = async (
  itemId: string,
  threshold: number,
  requesterEmail: string
) => {
  const res = await fetch(`${API_URL}/stock/${itemId}/threshold`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ threshold, requesterEmail })
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to set threshold');
  }
  return res.json();
};

export const acknowledgeStockAlert = async (alertId: string, requesterEmail: string) => {
  const res = await fetch(`${API_URL}/stock/alerts/${alertId}/acknowledge`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requesterEmail })
  });
  if (!res.ok) throw new Error('Failed to acknowledge alert');
  return res.json();
};

export const getStockStats = async () => {
  const res = await fetch(`${API_URL}/stock/stats`);
  if (!res.ok) throw new Error('Failed to fetch stock stats');
  return res.json();
};

// --- ORDER FEEDBACK API ---
export const submitOrderFeedback = async (feedback: any) => {
  const res = await fetch(`${API_URL}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feedback)
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to submit feedback');
  }
  return res.json();
};

export const getOrderFeedback = async (orderId: string) => {
  const res = await fetch(`${API_URL}/feedback/order/${orderId}`);
  if (!res.ok) return null;
  return res.json();
};

export const getUserFeedbackHistory = async (userId: string) => {
  const res = await fetch(`${API_URL}/feedback/user/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch feedback history');
  return res.json();
};

export const getFeedbackStats = async (requesterEmail: string) => {
  const res = await fetch(`${API_URL}/feedback/stats/summary?requesterEmail=${encodeURIComponent(requesterEmail)}`);
  if (!res.ok) throw new Error('Failed to fetch feedback stats');
  return res.json();
};

export const getItemFeedback = async (itemId: string) => {
  const res = await fetch(`${API_URL}/feedback/item/${itemId}/feedback`);
  if (!res.ok) throw new Error('Failed to fetch item feedback');
  return res.json();
};
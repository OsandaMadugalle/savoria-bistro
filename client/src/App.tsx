import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import Home from './pages/Home';
import MenuPage from './pages/MenuPage';
import ReservationPage from './pages/ReservationPage';
import MyReservationsPage from './pages/MyReservationsPage';
import OrderPage from './pages/OrderPage';
import ContactPage from './pages/ContactPage';
import GalleryPage from './pages/GalleryPage';
import ReviewsPage from './pages/ReviewsPage';
import TrackerPage from './pages/TrackerPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';
import RiderDashboard from './pages/RiderDashboard';
import NotFoundPage from './pages/NotFoundPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

import AIChef from './components/AIChef';
import { MenuItem, CartItem, User } from './types';

// ScrollToTop Helper
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Protected Route Component - Only customers can access
const ProtectedCustomerRoute: React.FC<{ element: React.ReactElement; user: User | null }> = ({ element, user }) => {
  // Redirect admin/staff/masterAdmin/rider to their dashboards
  if (user && (user.role === 'admin' || user.role === 'masterAdmin')) {
    return <Navigate to="/admin" replace />;
  }
  if (user && user.role === 'staff') {
    return <Navigate to="/staff" replace />;
  }
  if (user && user.role === 'rider') {
    return <Navigate to="/rider" replace />;
  }
  return element;
};

// Protected Route Component - Only staff can access
const ProtectedStaffRoute: React.FC<{ element: React.ReactElement; user: User | null }> = ({ element, user }) => {
  if (!user || (user.role !== 'staff' && user.role !== 'admin' && user.role !== 'masterAdmin')) {
    return <Navigate to="/" replace />;
  }
  return element;
};

// Protected Route Component - Only admin/masterAdmin can access
const ProtectedAdminRoute: React.FC<{ element: React.ReactElement; user: User | null }> = ({ element, user }) => {
  if (!user || (user.role !== 'admin' && user.role !== 'masterAdmin')) {
    return <Navigate to="/" replace />;
  }
  return element;
};

// Protected Route Component - Only authenticated users can access
const ProtectedAuthRoute: React.FC<{ element: React.ReactElement; user: User | null }> = ({ element, user }) => {
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return element;
};

// Protected Route Component - Only riders can access
const ProtectedRiderRoute: React.FC<{ element: React.ReactElement; user: User | null }> = ({ element, user }) => {
  if (!user || user.role !== 'rider') {
    return <Navigate to="/" replace />;
  }
  return element;
};

// HomeRedirector: redirect staff/admin/masterAdmin from Home to dashboard
const HomeRedirector: React.FC<{ user: User | null }> = ({ user }) => {
  if (user && (user.role === 'staff' || user.role === 'admin' || user.role === 'masterAdmin' || user.role === 'rider')) {
    if (user.role === 'staff') {
      return <Navigate to="/staff" replace />;
    } else if (user.role === 'rider') {
      return <Navigate to="/rider" replace />;
    } else {
      return <Navigate to="/admin" replace />;
    }
  }
  return <Home />;
};

const AppContent: React.FC<{
  user: User | null;
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  handleLogin: (user: User) => void;
  handleLogout: () => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (isOpen: boolean) => void;
  authMode: 'signin' | 'signup' | 'forgot';
  setAuthMode: (mode: 'signin' | 'signup' | 'forgot') => void;
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}> = ({
  user, cart, addToCart, updateQuantity, removeFromCart, clearCart,
  handleLogin, handleLogout, isLoginModalOpen, setIsLoginModalOpen,
  authMode, setAuthMode, setCart
}) => {

  const location = useLocation();
  const isDashboardRoute = location.pathname.startsWith('/staff') || location.pathname.startsWith('/rider') || location.pathname.startsWith('/admin') || location.pathname.startsWith('/delivery');
  const isFooterHiddenRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/staff') || location.pathname.startsWith('/rider') || location.pathname.startsWith('/delivery');

  // Show sign-in modal if coming from password reset
  React.useEffect(() => {
    if (location.state && location.state.showSignIn) {
      setAuthMode('signin');
      setIsLoginModalOpen(true);
      // Remove the state so it doesn't trigger again
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location.state, setAuthMode, setIsLoginModalOpen, location.pathname]);

  return (
    <div className="flex flex-col min-h-screen">
      {!isDashboardRoute && <Navbar cart={cart} user={user} onLogin={handleLogin} onLogout={handleLogout} isLoginModalOpen={isLoginModalOpen} setIsLoginModalOpen={setIsLoginModalOpen} authMode={authMode} setAuthMode={setAuthMode} />}

      <main className="flex-grow">
        <Routes>
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/" element={<HomeRedirector user={user} />} />
          <Route path="/menu" element={<MenuPage addToCart={addToCart} />} />
          <Route path="/gallery" element={<GalleryPage user={user} />} />
          <Route path="/contact" element={<ContactPage user={user} />} />
          <Route path="/reviews" element={<ReviewsPage user={user} onOpenSignIn={() => { setAuthMode('signin'); setIsLoginModalOpen(true); }} />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />

          {/* Customer-only routes - staff/admin/masterAdmin redirected to /admin */}
          <Route path="/reservation" element={<ProtectedCustomerRoute element={<ReservationPage user={user} />} user={user} />} />
          <Route path="/my-reservations" element={<ProtectedAuthRoute element={<MyReservationsPage user={user} />} user={user} />} />
          <Route path="/order" element={<ProtectedCustomerRoute element={<OrderPage cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} clearCart={clearCart} user={user} />} user={user} />} />
          <Route path="/tracker" element={<ProtectedCustomerRoute element={<TrackerPage user={user} />} user={user} />} />

          {/* Profile route - accessible to all authenticated users */}
          <Route path="/profile" element={<ProtectedAuthRoute element={<ProfilePage initialUser={user} />} user={user} />} />

          {/* Protected Dashboard Routes - admin and masterAdmin only */}
          <Route path="/admin" element={<ProtectedAdminRoute element={<AdminDashboard user={user} onLogout={handleLogout} />} user={user} />} />

          {/* Protected Staff Portal - staff, admin, masterAdmin */}
          <Route path="/staff" element={<ProtectedStaffRoute element={<StaffDashboard user={user} onLogin={handleLogin} onLogout={handleLogout} />} user={user} />} />

          {/* Protected Rider Dashboard - riders only */}
          <Route path="/rider" element={<ProtectedRiderRoute element={<RiderDashboard user={user} onLogout={handleLogout} />} user={user} />} />

          {/* Protected Delivery Dashboard - deliveryManager, admin, masterAdmin */}
          <Route path="/delivery" element={<ProtectedAdminRoute element={<DeliveryDashboard user={user} onLogout={handleLogout} />} user={user} />} />

          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {!isFooterHiddenRoute && <Footer />}
      {!isFooterHiddenRoute && <AIChef user={user} cart={cart} setCart={setCart} />}
    </div>
  );
};

const App: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const storedCart = sessionStorage.getItem('cart');
    if (storedCart) {
      try {
        const parsed = JSON.parse(storedCart);
        if (Array.isArray(parsed)) {
          return parsed.filter((item: any) =>
            item && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.price === 'number' && typeof item.quantity === 'number'
          );
        }
      } catch (err) {
        console.error('Failed to parse stored cart:', err);
        sessionStorage.removeItem('cart');
      }
    }
    return [];
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const [user, setUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => setCart([]);

  const handleLogin = (user: User) => {
    setUser(user);
    sessionStorage.setItem('user', JSON.stringify(user));
    sessionStorage.setItem('userEmail', user.email);
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('accessToken');
  };

  // Initialize user from localStorage on app load
  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const userWithDefaults = {
          ...parsedUser,
          id: parsedUser.id || parsedUser._id || '',
          loyaltyPoints: parsedUser.loyaltyPoints ?? 0,
          tier: parsedUser.tier || 'Bronze',
          memberSince: parsedUser.memberSince || new Date().getFullYear().toString(),
          name: parsedUser.name || 'User',
          phone: parsedUser.phone || '',
          email: parsedUser.email || '',
          address: parsedUser.address || '',
          birthday: parsedUser.birthday || ''
        };
        setUser(userWithDefaults);
      } catch (err) {
        console.error('Failed to parse stored user:', err);
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('userEmail');
      }
    }
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <AppContent
        user={user}
        cart={cart}
        addToCart={addToCart}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        clearCart={clearCart}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
        isLoginModalOpen={isLoginModalOpen}
        setIsLoginModalOpen={setIsLoginModalOpen}
        authMode={authMode}
        setAuthMode={setAuthMode}
        setCart={setCart}
      />
    </Router>
  );
};

export default App;

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Navbar, Footer } from './components/LayoutComponents';

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
import NotFoundPage from './pages/NotFoundPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';

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
  // Allow only customers (no role or role === 'customer')
  if (user && (user.role === 'admin' || user.role === 'masterAdmin' || user.role === 'staff')) {
    return <Navigate to="/admin" replace />;
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

const App: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const storedCart = localStorage.getItem('cart');
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
        localStorage.removeItem('cart');
      }
    }
    return [];
  });
    // Load cart from localStorage on app load
    // (removed duplicate cart initialization)

    // Save cart to localStorage whenever it changes
    useEffect(() => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

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
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('userEmail', user.email);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('token');
  };

  // Initialize user from localStorage on app load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const userEmail = localStorage.getItem('userEmail');
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUser(user);
      } catch (err) {
        console.error('Failed to parse stored user:', err);
        localStorage.removeItem('user');
        localStorage.removeItem('userEmail');
      }
    }
  }, []);


  // Only hide Navbar/Footer on dashboard routes
  const location = window.location.pathname;
  const isDashboardRoute = location.startsWith('/admin') || location.startsWith('/staff');

  // HomeRedirector: redirect staff/admin/masterAdmin from Home to dashboard
  const HomeRedirector: React.FC<{ user: User | null }> = ({ user }) => {
    if (user && (user.role === 'staff' || user.role === 'admin' || user.role === 'masterAdmin')) {
      if (user.role === 'staff') {
        return <Navigate to="/staff" replace />;
      } else {
        return <Navigate to="/admin" replace />;
      }
    }
    return <Home />;
  };

  return (
    <Router>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen">
        <Navbar cart={cart} user={user} onLogin={handleLogin} onLogout={handleLogout} isLoginModalOpen={isLoginModalOpen} setIsLoginModalOpen={setIsLoginModalOpen} authMode={authMode} setAuthMode={setAuthMode} />

        <main className="flex-grow">
          <Routes>
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
            <Route path="/admin" element={<ProtectedAdminRoute element={<AdminDashboard user={user} />} user={user} />} />

            {/* Protected Staff Portal - staff, admin, masterAdmin */}
            <Route path="/staff" element={<ProtectedStaffRoute element={<StaffDashboard user={user} onLogin={handleLogin} onLogout={handleLogout} />} user={user} />} />

            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        {!isDashboardRoute && <Footer />}
        {!isDashboardRoute && <AIChef user={user} cart={cart} setCart={setCart} />}
      </div>
    </Router>
  );
};

export default App;
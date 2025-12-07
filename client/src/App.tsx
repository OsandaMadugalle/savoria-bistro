import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Navbar, Footer } from './components/LayoutComponents';

// Pages
import Home from './pages/Home';
import MenuPage from './pages/MenuPage';
import ReservationPage from './pages/ReservationPage';
import OrderPage from './pages/OrderPage';
import ContactPage from './pages/ContactPage';
import GalleryPage from './pages/GalleryPage';
import ReviewsPage from './pages/ReviewsPage';
import TrackerPage from './pages/TrackerPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import NotFoundPage from './pages/NotFoundPage';

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

const App: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
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

  const handleLogin = (user: User) => setUser(user);
  const handleLogout = () => setUser(null);

  return (
    <Router>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen">
        {user?.role !== 'staff' && (
          <Navbar cart={cart} user={user} onLogin={handleLogin} onLogout={handleLogout} isLoginModalOpen={isLoginModalOpen} setIsLoginModalOpen={setIsLoginModalOpen} authMode={authMode} setAuthMode={setAuthMode} />
        )}
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<MenuPage addToCart={addToCart} />} />
            <Route path="/gallery" element={<GalleryPage user={user} />} />
            <Route path="/contact" element={<ContactPage user={user} />} />
            <Route path="/reviews" element={<ReviewsPage user={user} onOpenSignIn={() => { setAuthMode('signin'); setIsLoginModalOpen(true); }} />} />
            
            {/* Customer-only routes - staff/admin/masterAdmin redirected to /admin */}
            <Route path="/reservation" element={<ProtectedCustomerRoute element={<ReservationPage user={user} />} user={user} />} />
            <Route path="/order" element={<ProtectedCustomerRoute element={<OrderPage cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} clearCart={clearCart} user={user} />} user={user} />} />
            <Route path="/tracker" element={<ProtectedCustomerRoute element={<TrackerPage />} user={user} />} />
            
            {/* Profile route - accessible to all authenticated users */}
            <Route path="/profile" element={<ProfilePage />} />
            
            {/* Protected Dashboard Routes - admin and masterAdmin only */}
            <Route path="/admin" element={<ProtectedAdminRoute element={<AdminDashboard user={user} />} user={user} />} />
            
            {/* Protected Staff Portal - staff, admin, masterAdmin */}
            <Route path="/staff" element={<ProtectedStaffRoute element={<StaffDashboard user={user} onLogin={handleLogin} onLogout={handleLogout} />} user={user} />} />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        {( !user || (user.role !== 'staff' && user.role !== 'admin' && user.role !== 'masterAdmin') ) && <Footer />}
        <AIChef />
      </div>
    </Router>
  );
};

export default App;
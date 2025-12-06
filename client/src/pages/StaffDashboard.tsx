import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllOrders, updateOrderStatus, fetchReservations, loginUser } from '../services/api';
import { Order, ReservationData, User } from '../types';
import { ChefHat, CheckCircle, Clock, Utensils, Calendar, RefreshCcw, Lock, AlertTriangle } from 'lucide-react';
import ToastContainer, { Toast, ToastType } from '../components/Toast';

interface StaffDashboardProps {
  user: User | null;
  onLogin: (user: User) => void;
  onLogout: () => void;
}

const StaffDashboard: React.FC<StaffDashboardProps> = ({ user, onLogin, onLogout }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [activeTab, setActiveTab] = useState<'kitchen' | 'reservations'>('kitchen');
  const [loading, setLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [reservationActionLoading, setReservationActionLoading] = useState<string | null>(null); // reservation id
  const [reservationActionError, setReservationActionError] = useState<string | null>(null);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = 'success', duration = 3000) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, resData] = await Promise.all([fetchAllOrders(), fetchReservations()]);
      setOrders(ordersData);
      setReservations(resData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'staff' || user.role === 'admin' || user.role === 'masterAdmin')) {
      loadData();
      const interval = setInterval(loadData, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const loggedUser = await loginUser(email, password);
      if (loggedUser.role === 'customer') {
        setLoginError('Access Denied: Staff accounts only.');
        showToast('Access denied for customer accounts.', 'error');
      } else {
        onLogin(loggedUser);
        showToast(`Welcome back, ${loggedUser.name}!`, 'success');
      }
    } catch (err) {
      setLoginError('Invalid credentials.');
      showToast('Invalid credentials.', 'error');
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setStatusError(null);
    // Optimistic update
    setOrders(prev => prev.map(o => (o.orderId === orderId || o._id === orderId) ? { ...o, status: newStatus as any } : o));
    try {
      await updateOrderStatus(orderId, newStatus);
      await loadData(); // Re-fetch to ensure sync
      showToast(`Order #${orderId} moved to ${newStatus}.`, 'success');
    } catch (err) {
      setStatusError('Failed to update order status. Please try again.');
      showToast('Failed to update order status. Please try again.', 'error');
      await loadData(); // Revert optimistic update
    }
  };

  const getNextStatus = (current: string) => {
    switch (current) {
      case 'Confirmed': return 'Preparing';
      case 'Preparing': return 'Quality Check';
      case 'Quality Check': return 'Ready';
      case 'Ready': return 'Delivered';
      default: return null;
    }
  };

  // Reservation actions (if backend supports status)
  const handleReservationAction = async (reservationId: string, action: 'complete' | 'cancel') => {
    setReservationActionLoading(reservationId);
    setReservationActionError(null);
    try {
      // Call the actual API function
      await import('../services/api').then(api => api.updateReservationStatus(reservationId, action));
      await loadData();
      const verb = action === 'complete' ? 'completed' : 'cancelled';
      showToast(`Reservation ${verb} successfully.`, 'success');
    } catch (err) {
      setReservationActionError('Failed to update reservation.');
      showToast('Failed to update reservation.', 'error');
    } finally {
      setReservationActionLoading(null);
    }
  };

  // --- ACCESS CONTROL ---

  if (!user) {
    return (
      <div className="pt-32 pb-20 min-h-screen bg-stone-100 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-stone-200">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-600">
              <Lock size={32} />
            </div>
            <h1 className="text-2xl font-bold text-stone-900">Staff Portal</h1>
            <p className="text-stone-500 text-sm mt-1">Please log in to access KDS</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">{loginError}</div>}
            <input 
              type="email" 
              placeholder="Staff Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-orange-500 outline-none"
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-orange-500 outline-none"
            />
            <button type="submit" className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3 rounded-xl transition-colors">
              Access Dashboard
            </button>
          </form>
          <div className="mt-6 text-center text-xs text-stone-400">
            <p>Demo: staff@savoria.com / staff123</p>
          </div>
        </div>
      </div>
    );
  }

  if (user.role === 'customer') {
    return (
      <div className="pt-32 pb-20 min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
           <AlertTriangle size={64} className="text-red-500 mx-auto mb-4" />
           <h1 className="text-3xl font-bold text-stone-900 mb-2">Access Denied</h1>
           <p className="text-stone-600 mb-6">You do not have permission to view this page.</p>
           <button onClick={() => window.location.href = '#/'} className="text-orange-600 font-bold hover:underline">Return to Home</button>
        </div>
      </div>
    );
  }

  // --- DASHBOARD ---

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Staff Navbar - Similar to Admin Navbar */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <nav className="fixed top-0 left-0 w-full bg-gradient-to-r from-stone-900 to-orange-900 border-b border-orange-700 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center shadow-lg">
                <ChefHat size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-serif font-bold text-white tracking-tight">Staff Portal</h1>
                <p className="text-xs text-orange-200">Kitchen Management System</p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-2">
              {(user?.role === 'admin' || user?.role === 'masterAdmin') && (
                <button
                  onClick={() => navigate('/admin')}
                  className="px-4 py-2 rounded-lg font-medium transition-all text-orange-100 hover:bg-stone-800"
                >
                  Dashboard
                </button>
              )}
              <button
                onClick={() => navigate('/staff')}
                className="px-4 py-2 rounded-lg font-medium transition-all bg-orange-600 text-white"
              >
                Staff Portal
              </button>
            </div>

            {/* Right Side - User Menu */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-stone-800 bg-opacity-50 px-4 py-2 rounded-lg border border-orange-700">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center font-bold text-white">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-white">{user?.name}</p>
                  <p className="text-xs text-orange-200 capitalize">{user?.role}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  localStorage.removeItem('userEmail');
                  onLogout();
                  navigate('/');
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-sm transition-colors shadow-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-20 px-4 relative">
      {loading && (
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center">
            <RefreshCcw size={32} className="animate-spin text-orange-600 mb-2" />
            <span className="text-stone-700 font-bold">Loading...</span>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-stone-900 flex items-center gap-3">
             <ChefHat className="text-orange-600" /> Staff Portal
          </h1>
          <button onClick={loadData} className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all">
             <RefreshCcw size={20} className={loading ? 'animate-spin text-orange-600' : 'text-stone-600'} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
           <button 
             onClick={() => setActiveTab('kitchen')}
             className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'kitchen' ? 'bg-orange-600 text-white shadow-lg' : 'bg-white text-stone-600'}`}
           >
             Live Kitchen
           </button>
           <button 
             onClick={() => setActiveTab('reservations')}
             className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'reservations' ? 'bg-orange-600 text-white shadow-lg' : 'bg-white text-stone-600'}`}
           >
             Reservations
           </button>
        </div>
        {statusError && (
          <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">{statusError}</div>
        )}
        {activeTab === 'kitchen' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {orders.filter(o => o.status !== 'Delivered').map(order => (
               <div key={order._id || order.orderId} className="bg-white rounded-xl shadow-md overflow-hidden border border-stone-200 flex flex-col animate-in fade-in zoom-in-95">
                  <div className={`p-4 text-white flex justify-between items-center ${
                      order.status === 'Confirmed' ? 'bg-red-500' : 
                      order.status === 'Preparing' ? 'bg-orange-500' : 
                      order.status === 'Quality Check' ? 'bg-yellow-500' : 'bg-green-600'
                  }`}>
                     <span className="font-bold">#{order.orderId}</span>
                     <span className="text-xs uppercase font-bold tracking-wider bg-black/20 px-2 py-1 rounded">{order.status}</span>
                  </div>
                  <div className="p-4 flex-1">
                     <div className="flex items-center text-xs text-stone-500 mb-3 gap-1">
                        <Clock size={12} /> {new Date(order.createdAt).toLocaleTimeString()}
                     </div>
                     <ul className="space-y-2 mb-4">
                        {order.items.map((item, idx) => (
                           <li key={idx} className="flex justify-between text-sm font-medium text-stone-800 border-b border-stone-50 pb-1">
                              <span>{item.name}</span>
                              <span className="bg-stone-100 px-2 rounded-full text-stone-600">x{item.quantity}</span>
                           </li>
                        ))}
                     </ul>
                  </div>
                  <div className="p-4 bg-stone-50 border-t border-stone-100">
                    {getNextStatus(order.status) && (
                      <button 
                        onClick={() => handleStatusUpdate(order._id || order.orderId, getNextStatus(order.status)!)}
                        className="w-full py-2 bg-stone-900 text-white rounded-lg font-bold hover:bg-stone-800 transition-colors"
                        disabled={loading}
                      >
                        Mark {getNextStatus(order.status)}
                      </button>
                    )}
                  </div>
               </div>
             ))}
             {orders.filter(o => o.status !== 'Delivered').length === 0 && (
               <div className="col-span-full text-center py-20 text-stone-500">
                 <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
                 <h3 className="text-xl font-bold">All caught up!</h3>
                 <p>No active orders in the queue.</p>
               </div>
             )}
          </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
              {reservationActionError && (
               <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">{reservationActionError}</div>
              )}
              <table className="w-full text-left">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="p-4 font-bold text-stone-600 text-sm">Date & Time</th>
                    <th className="p-4 font-bold text-stone-600 text-sm">Guest Name</th>
                    <th className="p-4 font-bold text-stone-600 text-sm">Party Size</th>
                    <th className="p-4 font-bold text-stone-600 text-sm">Contact</th>
                    <th className="p-4 font-bold text-stone-600 text-sm">Notes</th>
                    <th className="p-4 font-bold text-stone-600 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {reservations.map((res) => (
                    <tr key={res._id || res.date + res.time} className="hover:bg-stone-50">
                      <td className="p-4 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-orange-500" />
                          {res.date} at {res.time}
                        </div>
                      </td>
                      <td className="p-4 text-sm font-bold text-stone-900">{res.name}</td>
                      <td className="p-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Utensils size={14} className="text-stone-400" /> {res.guests}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-stone-600">{res.phone}</td>
                      <td className="p-4 text-sm text-stone-500 italic">{res.notes || '-'}</td>
                      <td className="p-4 text-sm">
                       {/* Only show actions if reservation is not completed/cancelled */}
                       {res.status !== 'Completed' && res.status !== 'Cancelled' && (
                        <div className="flex gap-2">
                          <button
                           className="px-3 py-1 rounded-lg bg-green-600 text-white font-bold text-xs disabled:opacity-50"
                           disabled={reservationActionLoading === res._id || loading}
                           onClick={() => res._id && handleReservationAction(res._id, 'complete')}
                          >
                           {reservationActionLoading === res._id ? '...' : 'Mark Completed'}
                          </button>
                          <button
                           className="px-3 py-1 rounded-lg bg-red-600 text-white font-bold text-xs disabled:opacity-50"
                           disabled={reservationActionLoading === res._id || loading}
                           onClick={() => res._id && handleReservationAction(res._id, 'cancel')}
                          >
                           {reservationActionLoading === res._id ? '...' : 'Cancel'}
                          </button>
                        </div>
                       )}
                       {(res.status === 'Completed' || res.status === 'Cancelled') && (
                        <span className={`px-3 py-1 rounded-lg font-bold text-xs ${res.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{res.status}</span>
                       )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {reservations.length === 0 && (
                <div className="p-12 text-center text-stone-500">No upcoming reservations found.</div>
              )}
            </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
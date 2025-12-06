import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllOrders, updateOrderStatus, fetchReservations, loginUser, fetchPrivateEventInquiries, updatePrivateEventInquiryStatus, sendPrivateEventEmail } from '../services/api';
import { Order, ReservationData, User, PrivateEventInquiry } from '../types';
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
  const [activeTab, setActiveTab] = useState<'kitchen' | 'reservations' | 'events'>('kitchen');
  const [loading, setLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [reservationActionLoading, setReservationActionLoading] = useState<string | null>(null); // reservation id
  const [reservationActionError, setReservationActionError] = useState<string | null>(null);
  const [eventInquiries, setEventInquiries] = useState<PrivateEventInquiry[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState('');
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  
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

  const loadEventInquiries = useCallback(async () => {
    setEventsLoading(true);
    setEventsError('');
    try {
      const inquiries = await fetchPrivateEventInquiries();
      setEventInquiries(inquiries);
    } catch (err: any) {
      setEventsError(err.message || 'Failed to load event inquiries');
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && (user.role === 'staff' || user.role === 'admin' || user.role === 'masterAdmin')) {
      loadData();
      const interval = setInterval(loadData, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'events') {
      loadEventInquiries();
    }
  }, [activeTab, loadEventInquiries]);

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

  const handleMarkInquiryContacted = async (inquiryId: string) => {
    try {
      const updated = await updatePrivateEventInquiryStatus(inquiryId, 'contacted');
      setEventInquiries(prev => prev.map(inquiry => (inquiry._id === inquiryId ? updated : inquiry)));
      showToast('Inquiry marked as contacted.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Could not update inquiry status.', 'error');
    }
  };

  const handleSendInquiryEmail = async (inquiry: PrivateEventInquiry) => {
    const defaultMessage = `Hi ${inquiry.name},\n\nThanks for reaching out about your ${inquiry.eventType} event. We'll be happy to assist with seating ${inquiry.guestCount || 'your guests'} on ${inquiry.eventDate || 'your preferred date'}.`;    
    const body = window.prompt('Message to customer', defaultMessage);
    if (!body) return;
    setSendingEmailId(inquiry._id || null);
    try {
      await sendPrivateEventEmail(inquiry._id || '', {
        subject: 'Follow-up on your private event inquiry',
        body,
        staffName: user?.name
      });
      showToast('Email sent to customer.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to send email.', 'error');
    } finally {
      setSendingEmailId(null);
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
           <button 
             onClick={() => setActiveTab('events')}
             className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'events' ? 'bg-orange-600 text-white shadow-lg' : 'bg-white text-stone-600'}`}
           >
             Private Events
           </button>
        </div>
        {activeTab !== 'events' && statusError && (
          <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">{statusError}</div>
        )}
        {activeTab === 'kitchen' && (
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
        )}
        {activeTab === 'reservations' && (
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
        {activeTab === 'events' && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <div>
                <h2 className="text-xl font-bold text-stone-900">Private Event Inquiries</h2>
                <p className="text-sm text-stone-500">Track new inquiries and mark them as contacted.</p>
              </div>
              <button
                onClick={loadEventInquiries}
                className="px-4 py-2 bg-stone-100 rounded-full text-sm font-semibold text-stone-600 hover:bg-stone-200 transition"
              >
                Refresh
              </button>
            </div>
            <div className="p-6">
              {eventsLoading && (
                <div className="text-center py-12 text-stone-500">Loading inquiries…</div>
              )}
              {eventsError && !eventsLoading && (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">{eventsError}</div>
              )}
              {!eventsLoading && !eventsError && eventInquiries.length === 0 && (
                <div className="text-center py-12 text-stone-500">No event inquiries yet.</div>
              )}
              {!eventsLoading && !eventsError && eventInquiries.length > 0 && (
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
                        <th className="p-3 font-bold text-stone-600">Notes</th>
                        <th className="p-3 font-bold text-stone-600">Status</th>
                        <th className="p-3 font-bold text-stone-600">Action</th>
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
                            <Calendar size={14} />
                            {inquiry.eventDate ? new Date(inquiry.eventDate).toLocaleDateString() : 'TBD'}
                          </td>
                          <td className="p-3 text-stone-600">{inquiry.guestCount || '-'}</td>
                          <td className="p-3 text-stone-500 italic">{inquiry.message || '-'}</td>
                          <td className="p-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${inquiry.status === 'contacted' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                              {inquiry.status || 'new'}
                            </span>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => inquiry._id && handleMarkInquiryContacted(inquiry._id)}
                              disabled={inquiry.status === 'contacted'}
                              className="px-3 py-1 rounded-lg bg-stone-900 text-white text-xs font-bold disabled:bg-stone-300"
                            >
                              {inquiry.status === 'contacted' ? 'Contacted' : 'Mark Contacted'}
                            </button>
                            <button
                              onClick={() => handleSendInquiryEmail(inquiry)}
                              disabled={sendingEmailId === inquiry._id}
                              className="px-3 py-1 rounded-lg bg-orange-600 text-white text-xs font-bold disabled:bg-orange-200"
                            >
                              {sendingEmailId === inquiry._id ? 'Sending…' : 'Send Email'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
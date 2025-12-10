import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllOrders, updateOrderStatus, fetchReservations, loginUser, fetchPrivateEventInquiries, updatePrivateEventInquiryStatus, sendPrivateEventEmail } from '../services/api';
import { Order, ReservationData, User, PrivateEventInquiry } from '../types';
import { ChefHat, CheckCircle, Clock, Utensils, Calendar, RefreshCcw, Lock, AlertTriangle, X, Filter } from 'lucide-react';
import ToastContainer, { Toast, ToastType } from '../components/Toast';

import AdminNavigation from '../components/AdminNavigation';

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
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyModalInquiry, setReplyModalInquiry] = useState<PrivateEventInquiry | null>(null);
  const [replySubject, setReplySubject] = useState('');
  const [replyBody, setReplyBody] = useState('');
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Reservation Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled'>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [tableAssignmentModal, setTableAssignmentModal] = useState<{ open: boolean; reservationId: string | null; currentTable: string }>({ open: false, reservationId: null, currentTable: '' });
  const [tableInputValue, setTableInputValue] = useState('');

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

  const openReplyModal = (inquiry: PrivateEventInquiry) => {
    const formattedDate = inquiry.eventDate ? new Date(inquiry.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'your preferred date';
    const defaultMessage = `Hi ${inquiry.name},\n\nThanks for reaching out about your ${inquiry.eventType} event. We'll be happy to assist with seating ${inquiry.guestCount || 'your guests'} on ${formattedDate}.`;
    setReplySubject('Follow-up on your private event inquiry');
    setReplyBody(defaultMessage);
    setReplyModalInquiry(inquiry);
    setReplyModalOpen(true);
  };

  const closeReplyModal = () => {
    setReplyModalOpen(false);
    setReplyModalInquiry(null);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyModalInquiry) return;
    if (!replyBody.trim()) {
      showToast('Response body cannot be empty.', 'error');
      return;
    }
    setSendingEmailId(replyModalInquiry._id || null);
    try {
      const updated = await sendPrivateEventEmail(replyModalInquiry._id || '', {
        subject: replySubject || 'Follow-up on your private event inquiry',
        body: replyBody,
        staffName: user?.name
      });
      setEventInquiries(prev => prev.map(item => (item._id === updated._id ? updated : item)));
      showToast('Email sent to customer.', 'success');
      closeReplyModal();
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
      case 'Quality Check': return 'Packing';
      case 'Packing': return 'Packed & Ready';
      case 'Packed & Ready': return 'Out for Delivery';
      case 'Out for Delivery': return 'Delivered';
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

  // Assign table to reservation
  const handleAssignTable = async (reservationId: string) => {
    if (!tableInputValue.trim()) {
      showToast('Please enter a table number', 'error');
      return;
    }
    
    setReservationActionLoading(reservationId);
    try {
      await import('../services/api').then(api => api.updateReservationTable(reservationId, tableInputValue));
      await loadData();
      setTableAssignmentModal({ open: false, reservationId: null, currentTable: '' });
      setTableInputValue('');
      showToast('Table assigned successfully', 'success');
    } catch (err) {
      showToast('Failed to assign table', 'error');
    } finally {
      setReservationActionLoading(null);
    }
  };

  // Filter reservations
  const filteredReservations = reservations.filter(res => {
    const statusMatch = statusFilter === 'all' || res.status === statusFilter;
    const dateMatch = !dateFilter || res.date === dateFilter;
    return statusMatch && dateMatch;
  });

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
      {/* Staff Navbar */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <AdminNavigation user={user} onLogout={onLogout} />

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
                      order.status === 'Quality Check' ? 'bg-yellow-500' : 
                      order.status === 'Packing' ? 'bg-blue-500' : 
                      order.status === 'Packed & Ready' ? 'bg-indigo-500' : 
                      order.status === 'Out for Delivery' ? 'bg-purple-500' : 'bg-green-600'
                  }`}>
                     <span className="font-bold">#{order.orderId}</span>
                     <span className="text-xs uppercase font-bold tracking-wider bg-black/20 px-2 py-1 rounded">{order.status}</span>
                  </div>
                  <div className="p-4 flex-1">
                     <div className="flex items-center justify-between text-xs text-stone-500 mb-3">
                        <div className="flex items-center gap-1">
                          <Clock size={12} /> {new Date(order.createdAt).toLocaleTimeString()}
                        </div>
                        {/* Payment Status Badge */}
                        {order.paymentMethod === 'cod' && order.paymentStatus === 'Pending' ? (
                          <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-bold">
                            💵 COD - Payment Pending
                          </span>
                        ) : (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                            ✅ Paid
                          </span>
                        )}
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
              {/* Filter Section */}
              <div className="p-6 border-b border-stone-200 bg-stone-50">
                <div className="flex items-center gap-2 mb-4">
                  <Filter size={18} className="text-orange-600" />
                  <h3 className="font-bold text-stone-900">Filters</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-stone-600 uppercase mb-2 block">Status</label>
                    <select 
                      value={statusFilter} 
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                      <option value="all">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-600 uppercase mb-2 block">Date</label>
                    <input 
                      type="date" 
                      value={dateFilter} 
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      onClick={() => { setStatusFilter('all'); setDateFilter(''); }}
                      className="flex-1 px-4 py-2 bg-stone-300 hover:bg-stone-400 text-stone-900 font-semibold rounded-lg transition-colors text-sm"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
                <p className="text-xs text-stone-500 mt-3">Showing {filteredReservations.length} of {reservations.length} reservations</p>
              </div>

              {/* Error Message */}
              {reservationActionError && (
               <div className="mx-6 mt-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">{reservationActionError}</div>
              )}

              {/* Reservations Table */}
              <table className="w-full text-left">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="p-4 font-bold text-stone-600 text-sm">Date & Time</th>
                    <th className="p-4 font-bold text-stone-600 text-sm">Guest Name</th>
                    <th className="p-4 font-bold text-stone-600 text-sm">Party Size</th>
                    <th className="p-4 font-bold text-stone-600 text-sm">Contact</th>
                    <th className="p-4 font-bold text-stone-600 text-sm">Email</th>
                    <th className="p-4 font-bold text-stone-600 text-sm">Table</th>
                    <th className="p-4 font-bold text-stone-600 text-sm">Status</th>
                    <th className="p-4 font-bold text-stone-600 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredReservations.map((res) => (
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
                      <td className="p-4 text-sm text-stone-600 break-all">{res.email}</td>
                      <td className="p-4 text-sm">
                        {res.tableNumber ? (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-semibold text-xs">Table {res.tableNumber}</span>
                        ) : (
                          <span className="text-stone-400 text-xs">Unassigned</span>
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        <span className={`px-2 py-1 rounded-lg font-semibold text-xs ${
                          res.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                          res.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          res.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {res.status || 'Pending'}
                        </span>
                      </td>
                      <td className="p-4 text-sm">
                       {res.status !== 'Completed' && res.status !== 'Cancelled' && (
                        <div className="flex gap-2 flex-wrap">
                          <button
                           className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs disabled:opacity-50 transition-colors"
                           disabled={reservationActionLoading === res._id || loading}
                           onClick={() => { setTableAssignmentModal({ open: true, reservationId: res._id || '', currentTable: res.tableNumber || '' }); setTableInputValue(res.tableNumber || ''); }}
                          >
                           🪑 Table
                          </button>
                          <button
                           className="px-2 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-xs disabled:opacity-50 transition-colors"
                           disabled={reservationActionLoading === res._id || loading}
                           onClick={() => res._id && handleReservationAction(res._id, 'complete')}
                          >
                           {reservationActionLoading === res._id ? '...' : '✓'}
                          </button>
                          <button
                           className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs disabled:opacity-50 transition-colors"
                           disabled={reservationActionLoading === res._id || loading}
                           onClick={() => res._id && handleReservationAction(res._id, 'cancel')}
                          >
                           ✕
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
              {filteredReservations.length === 0 && (
                <div className="p-12 text-center text-stone-500">No reservations matching filters found.</div>
              )}
            </div>
        )}

        {/* Table Assignment Modal */}
        {tableAssignmentModal.open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-stone-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-stone-900">Assign Table</h2>
                <button
                  onClick={() => setTableAssignmentModal({ open: false, reservationId: null, currentTable: '' })}
                  className="text-stone-400 hover:text-stone-600"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-stone-600">Enter table number for this reservation</p>
                <input
                  type="text"
                  placeholder="e.g., 1, A1, Window-2"
                  value={tableInputValue}
                  onChange={(e) => setTableInputValue(e.target.value)}
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setTableAssignmentModal({ open: false, reservationId: null, currentTable: '' })}
                    className="flex-1 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-900 font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => tableAssignmentModal.reservationId && handleAssignTable(tableAssignmentModal.reservationId)}
                    disabled={reservationActionLoading !== null}
                    className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {reservationActionLoading ? 'Assigning...' : 'Assign Table'}
                  </button>
                </div>
              </div>
            </div>
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
                        <th className="p-3 font-bold text-stone-600">Last Reply</th>
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
                          <td className="p-3 text-stone-600">
                            {(() => {
                              const latest = inquiry.contactHistory?.[inquiry.contactHistory.length - 1];
                              if (!latest) return <span className="text-stone-400">—</span>;
                              return (
                                <div className="space-y-1 text-xs">
                                  <div className="font-semibold text-stone-900">{latest.staffName || 'Staff'}</div>
                                  <div className="text-stone-500">{latest.subject || 'Follow-up sent'}</div>
                                  <div className="text-stone-400">{latest.sentAt ? new Date(latest.sentAt).toLocaleString() : 'Just now'}</div>
                                </div>
                              );
                            })()}
                          </td>
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
                              onClick={() => openReplyModal(inquiry)}
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
      {replyModalOpen && replyModalInquiry && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-6">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-stone-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-stone-100">
              <div>
                <h3 className="text-lg font-bold">Respond to {replyModalInquiry.name}</h3>
                <p className="text-sm text-stone-500">You can edit the subject/body before sending.</p>
              </div>
              <button onClick={closeReplyModal} className="text-stone-500 hover:text-stone-900">✕</button>
            </div>
            <form onSubmit={handleSendReply} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-stone-500">Subject</label>
                <input
                  value={replySubject}
                  onChange={e => setReplySubject(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-stone-500">Message</label>
                <textarea
                  rows={6}
                  value={replyBody}
                  onChange={e => setReplyBody(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={closeReplyModal} className="px-4 py-2 rounded-lg border border-stone-200 text-stone-600">Cancel</button>
                <button
                  type="submit"
                  disabled={sendingEmailId === replyModalInquiry._id}
                  className="px-4 py-2 rounded-lg bg-orange-600 text-white font-bold disabled:opacity-50"
                >
                  {sendingEmailId === replyModalInquiry._id ? 'Sending…' : 'Send Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
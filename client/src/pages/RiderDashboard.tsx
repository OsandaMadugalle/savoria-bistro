import { useState, useEffect } from 'react';
import ToastContainer, { Toast, ToastType } from '../components/Toast';
import { User } from '../types';
import { fetchAllOrders } from '../services/api';
import { markOrderPickedUp, markOrderOutForDelivery, markOrderDelivered, getMyDeliveries } from '../services/deliveryApi';
import { Package, MapPin, Clock, CheckCircle, Phone, DollarSign } from 'lucide-react';

interface RiderDashboardProps {
  user: User | null;
  onLogout: () => void;
}

export default function RiderDashboard({ user, onLogout }: RiderDashboardProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'assigned' | 'completed'>('assigned');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [codAmount, setCodAmount] = useState<{ [key: string]: number }>({});
  const [deliveryProof, setDeliveryProof] = useState<{ [key: string]: File | null }>({});
  const [proofPreview, setProofPreview] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadOrders();
    fetchEarnings();
    // Removed auto-refresh interval for better UX
    // Only refresh on mount or user change
  }, [user]);

  const fetchEarnings = async () => {
    try {
      const data = await getMyDeliveries();
      console.log('getMyDeliveries response:', data);
      setEarnings(data.rider?.earnings || 0);
      console.log('Set earnings to:', data.rider?.earnings || 0);
    } catch (error) {
      setEarnings(0);
      console.error('Error fetching earnings:', error);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const allOrders = await fetchAllOrders();
      // Filter orders assigned to this rider
      const myOrders = allOrders.filter((o: any) => 
        o.assignedRider?.email === user?.email || o.assignedRider?._id === user?.id
      );
      setOrders(myOrders);
    } catch (error: any) {
      // Ignore network errors that happen on page refresh/unload
      if (error.code === 'ERR_CANCELED' || error.message === 'Network Error' || error.name === 'AbortError') {
        return;
      }
      console.error('Failed to load orders:', error);
      showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: ToastType = 'success', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => removeToast(id), duration);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handlePickup = async (orderId: string) => {
    try {
      await markOrderPickedUp(orderId);
      showToast('Order marked as picked up!', 'success');
      await loadOrders();
    } catch (error: any) {
      let msg = error.message || 'Failed to update order';
      if (error.response) {
        msg += ` | Status: ${error.response.status} | ${JSON.stringify(error.response.data)}`;
      }
      console.error('Pickup error:', error);
      showToast(msg, 'error');
    }
  };

  const handleOutForDelivery = async (orderId: string) => {
    try {
      await markOrderOutForDelivery(orderId);
      showToast('Order marked as out for delivery!', 'success');
      await loadOrders();
    } catch (error: any) {
      let msg = error.message || 'Failed to update order';
      if (error.response) {
        msg += ` | Status: ${error.response.status} | ${JSON.stringify(error.response.data)}`;
      }
      console.error('Out for delivery error:', error);
      showToast(msg, 'error');
    }
  };

  const handleDeliver = async (orderId: string) => {
    try {
      const order = orders.find(o => o._id === orderId);
      const payload: any = {};
      if (order?.paymentMethod === 'cod') {
        const amount = codAmount[orderId];
        if (!amount || amount <= 0) {
          showToast('Please enter valid COD amount collected', 'error');
          return;
        }
        payload.codAmount = amount;
      }
      // Handle delivery proof
      const file = deliveryProof[orderId];
      if (file) {
        // Convert to base64 (for demo; in production, use proper file upload API)
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        payload.deliveryProof = base64;
      }
      await markOrderDelivered(orderId, payload);
      showToast('Order delivered successfully!', 'success');
      await loadOrders();
      await fetchEarnings();
      showToast(`Total Earnings: Rs ${(earnings + Math.floor(order.total * 0.1)).toLocaleString()}`, 'info');
      setCodAmount(prev => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
      setDeliveryProof(prev => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
      setProofPreview(prev => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
    } catch (error: any) {
      let msg = error.message || 'Failed to complete delivery';
      if (error.response) {
        msg += ` | Status: ${error.response.status} | ${JSON.stringify(error.response.data)}`;
      }
      console.error('Delivery error:', error);
      showToast(msg, 'error');
    }
  };

  const activeOrders = orders.filter(o => 
    ['Assigned', 'Picked Up', 'Out for Delivery'].includes(o.status)
  );
  
  const completedOrders = orders.filter(o => o.status === 'Delivered');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Assigned': return 'bg-blue-100 text-blue-700';
      case 'Picked Up': return 'bg-purple-100 text-purple-700';
      case 'Out for Delivery': return 'bg-orange-100 text-orange-700';
      case 'Delivered': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getNextAction = (status: string, orderId: string) => {
    let order: any = undefined;
    if (status === 'Out for Delivery') {
      order = orders.find(o => o._id === orderId);
    }
    switch (status) {
      case 'Assigned':
        return (
          <button
            onClick={() => handlePickup(orderId)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex items-center gap-2"
          >
            <Package size={18} /> Mark as Picked Up
          </button>
        );
      case 'Picked Up':
        return (
          <button
            onClick={() => handleOutForDelivery(orderId)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold flex items-center gap-2"
          >
            <MapPin size={18} /> Start Delivery
          </button>
        );
      case 'Out for Delivery':
        return (
          <div className="space-y-2">
            {order?.paymentMethod === 'cod' && (
              <div className="flex items-center gap-2">
                <DollarSign size={18} className="text-orange-600" />
                <input
                  type="number"
                  placeholder="COD Amount"
                  value={codAmount[orderId] || ''}
                  onChange={(e) => setCodAmount(prev => ({ ...prev, [orderId]: parseFloat(e.target.value) || 0 }))}
                  className="p-2 border rounded w-32"
                  step="0.01"
                />
              </div>
            )}
            {/* Delivery Proof Upload */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-stone-700">Upload Delivery Proof (Photo)</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => {
                  const file = e.target.files?.[0] || null;
                  setDeliveryProof(prev => ({ ...prev, [orderId]: file }));
                  if (file) {
                    const url = URL.createObjectURL(file);
                    setProofPreview(prev => ({ ...prev, [orderId]: url }));
                  } else {
                    setProofPreview(prev => {
                      const updated = { ...prev };
                      delete updated[orderId];
                      return updated;
                    });
                  }
                }}
              />
              {proofPreview[orderId] && (
                <img src={proofPreview[orderId]} alt="Proof Preview" className="w-32 h-32 object-cover rounded border" />
              )}
            </div>
            <button
              onClick={() => handleDeliver(orderId)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold flex items-center gap-2"
            >
              <CheckCircle size={18} /> Complete Delivery
            </button>
          </div>
        );
      default:
        return null;
    }
  };


  return (
    <div className="min-h-screen bg-stone-50">
      {/* Toast Notification (bottom left) */}
      <div className="fixed bottom-4 left-4 z-[100] flex flex-col-reverse gap-3 max-w-md pointer-events-none">
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-stone-900">Delivery Dashboard</h1>
              <p className="text-sm text-stone-600">Welcome, {user?.name}!</p>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Removed old inline toast notification */}

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-stone-600">Active Deliveries</p>
                <p className="text-2xl font-bold text-stone-900">{activeOrders.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-stone-600">Completed Today</p>
                <p className="text-2xl font-bold text-stone-900">{completedOrders.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="text-orange-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-stone-600">Total Orders</p>
                <p className="text-2xl font-bold text-stone-900">{orders.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <DollarSign className="text-yellow-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-stone-600">Total Earnings</p>
                <p className="text-2xl font-bold text-stone-900">Rs {earnings.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200">
        <div className="border-b border-stone-200">
          <div className="flex gap-4 px-6">
            <button
              onClick={() => setActiveTab('assigned')}
              className={`py-4 px-2 font-bold border-b-2 transition-colors ${
                activeTab === 'assigned'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              Active Deliveries ({activeOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`py-4 px-2 font-bold border-b-2 transition-colors ${
                activeTab === 'completed'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              Completed ({completedOrders.length})
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
              <p className="mt-4 text-stone-600">Loading orders...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(activeTab === 'assigned' ? activeOrders : completedOrders).length === 0 ? (
                <div className="text-center py-12">
                  <Package size={48} className="mx-auto text-stone-300 mb-4" />
                  <p className="text-stone-600 font-bold">
                    {activeTab === 'assigned' ? 'No active deliveries' : 'No completed deliveries'}
                  </p>
                </div>
              ) : (
                (activeTab === 'assigned' ? activeOrders : completedOrders).map((order) => (
                  <div key={order._id} className="border border-stone-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-stone-900">Order #{order._id?.slice(-6)}</span>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          {order.paymentMethod === 'cod' && (
                            <span className="px-2 py-1 rounded text-xs font-bold bg-orange-100 text-orange-700">
                              COD - ${order.total?.toFixed(2)}
                            </span>
                          )}
                          {order.paymentStatus === 'Paid' && (
                            <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700">
                              Paid
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-stone-600">
                          <div className="flex items-center gap-2">
                            <MapPin size={16} />
                            <span><strong>Address:</strong> {
                              order.deliveryAddress
                                ? [order.deliveryAddress.street, order.deliveryAddress.city, order.deliveryAddress.postalCode, order.deliveryAddress.notes].filter(Boolean).join(', ')
                                : 'N/A'
                            }</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone size={16} />
                            <span><strong>Customer:</strong> {order.userId?.name || 'N/A'} - {order.userId?.phone || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package size={16} />
                            <span><strong>Items:</strong> {order.items?.length || 0} item(s)</span>
                          </div>
                          {order.pickedUpAt && (
                            <div className="flex items-center gap-2">
                              <Clock size={16} />
                              <span><strong>Picked up:</strong> {new Date(order.pickedUpAt).toLocaleString()}</span>
                            </div>
                          )}
                          {/* Show delivery proof if available (for completed orders) */}
                          {order.status === 'Delivered' && order.deliveryProof && (
                            <div className="flex items-center gap-2 mt-2">
                              <img src={order.deliveryProof} alt="Delivery Proof" className="w-32 h-32 object-cover rounded border" />
                              <span className="text-xs text-stone-500">Delivery Proof</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getNextAction(order.status, order._id)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import ToastContainer, { Toast, ToastType } from '../components/Toast';
import { 
  getDeliveryStats, 
  getAllRiders, 
  updateRider,
  type DeliveryRider, 
  type DeliveryStats 
} from '../services/deliveryApi';
import { fetchAllOrders } from '../services/api';
import RiderAssignment from '../components/RiderAssignment';
import AdminNavigation from '../components/AdminNavigation';
import { User } from '../types';
import { 
  Bike, 
  TrendingUp, 
  Users, 
  Package, 
  Truck, 
  CheckCircle,
  Star,
  Phone,
  Mail
} from 'lucide-react';

interface DeliveryDashboardProps {
  user: User | null;
  onLogout: () => void;
}

export default function DeliveryDashboard({ user, onLogout }: DeliveryDashboardProps) {
  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [riders, setRiders] = useState<DeliveryRider[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'riders' | 'deliveries'>('overview');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    loadData(true); // Only show loading screen on first load
    // Removed auto-refresh interval for better UX
  }, []);

  // Only show loading screen if initialLoad is true
  const loadData = async (initialLoad = false) => {
    try {
      if (initialLoad) setLoading(true);
      const [statsData, ridersData, ordersData] = await Promise.all([
        getDeliveryStats(),
        getAllRiders({ isActive: true }),
        fetchAllOrders()
      ]);
      setStats(statsData);
      setRiders(ridersData);
      setOrders(ordersData.filter((o: any) => o.status === 'Packed & Ready'));
    } catch (error) {
      console.error('Failed to load delivery data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      if (initialLoad) setLoading(false);
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

  const handleAssignRider = (order: any) => {
    setSelectedOrder(order);
    setShowAssignModal(true);
  };

  const handleRiderAssigned = async () => {
    setShowAssignModal(false);
    setSelectedOrder(null);
    await loadData();
    showToast('Rider assigned successfully!', 'success');
  };

  const handleToggleRiderStatus = async (riderId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'Available' ? 'Offline' : 'Available';
      await updateRider(riderId, { status: newStatus });
      await loadData();
      showToast(`Rider status updated to ${newStatus}`, 'success');
    } catch (error) {
      showToast('Failed to update rider status', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto mb-4"></div>
          <p className="text-stone-600 font-semibold">Loading delivery dashboard...</p>
        </div>
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 pb-12 pt-20">
      <AdminNavigation user={user} onLogout={onLogout} />
      {/* Toast Notification */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="bg-white text-stone-900 py-8 px-6 shadow-sm border-b border-stone-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-4xl font-serif font-bold flex items-center gap-3 mb-2">
            <Truck className="w-10 h-10 text-orange-600" />
            Delivery Management
          </h1>
          <button
            onClick={() => { loadData(); showToast('Dashboard refreshed', 'info'); }}
            className="ml-4 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-semibold shadow hover:bg-orange-200 transition-all flex items-center gap-2"
            title="Refresh Dashboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582M20 20v-5h-.581M5.635 19A9 9 0 1021 12.35" /></svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-stone-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-stone-600 font-semibold">Available Riders</h3>
                <Users className="w-8 h-8 text-stone-500" />
              </div>
              <p className="text-3xl font-bold text-stone-900">{stats.riders.available}</p>
              <p className="text-sm text-stone-500 mt-1">of {stats.riders.total} total</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-600">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-stone-600 font-semibold">On Delivery</h3>
                <Bike className="w-8 h-8 text-orange-600" />
              </div>
              <p className="text-3xl font-bold text-stone-900">{stats.riders.onDelivery}</p>
              <p className="text-sm text-stone-500 mt-1">riders active</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-stone-600 font-semibold">Pending</h3>
                <Package className="w-8 h-8 text-orange-500" />
              </div>
              <p className="text-3xl font-bold text-stone-900">{stats.deliveries.pending}</p>
              <p className="text-sm text-stone-500 mt-1">awaiting assignment</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-stone-600 font-semibold">Completed Today</h3>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-stone-900">{stats.deliveries.completedToday}</p>
              <p className="text-sm text-stone-500 mt-1">deliveries</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6 p-2 flex gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-3 px-6 rounded-lg font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <TrendingUp className="w-5 h-5 inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('riders')}
            className={`flex-1 py-3 px-6 rounded-lg font-bold transition-all ${
              activeTab === 'riders'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Users className="w-5 h-5 inline mr-2" />
            Riders ({riders.length})
          </button>
          <button
            onClick={() => setActiveTab('deliveries')}
            className={`flex-1 py-3 px-6 rounded-lg font-bold transition-all ${
              activeTab === 'deliveries'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Package className="w-5 h-5 inline mr-2" />
            Pending Deliveries ({orders.length})
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Top Performers */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-stone-900 mb-4 flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-500" />
                Top Performing Riders
              </h2>
              <div className="space-y-3">
                {stats.topRiders.map((rider, index) => (
                  <div key={rider._id} className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-stone-400'
                      }`}>
                        #{index + 1}
                      </div>
                      <div>
                        <h3 className="font-bold text-stone-900">{rider.name}</h3>
                        <p className="text-sm text-stone-600">{rider.completedDeliveries} deliveries</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-yellow-500 font-semibold mb-1">
                        <Star className="w-4 h-4 fill-yellow-500" />
                        {rider.rating.toFixed(1)}
                      </div>
                      <p className="text-sm text-green-600 font-semibold">Rs {rider.earnings.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Riders Tab */}
        {activeTab === 'riders' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-stone-900">All Riders</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {riders.map((rider) => (
                <div key={rider._id} className="border-2 border-stone-200 rounded-lg p-4 hover:border-orange-300 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-stone-900">{rider.name}</h3>
                      <p className="text-sm text-stone-600">{rider.vehicleType} • {rider.vehicleNumber}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      rider.status === 'Available' ? 'bg-green-100 text-green-700' :
                      rider.status === 'On Delivery' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {rider.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-stone-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {rider.phone}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {rider.email}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                    <div className="bg-stone-50 p-2 rounded text-center">
                      <p className="text-stone-500">Completed</p>
                      <p className="font-bold text-stone-900">{rider.completedDeliveries}</p>
                    </div>
                    <div className="bg-stone-50 p-2 rounded text-center">
                      <p className="text-stone-500">Rating</p>
                      <p className="font-bold text-stone-900 flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        {rider.rating.toFixed(1)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleRiderStatus(rider._id, rider.status)}
                      className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${
                        rider.status === 'Available'
                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {rider.status === 'Available' ? 'Set Offline' : 'Set Available'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deliveries Tab */}
        {activeTab === 'deliveries' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-stone-900 mb-6">Pending Deliveries</h2>
            
            {orders.length === 0 ? (
              <div className="text-center py-12 text-stone-500">
                <Package className="w-16 h-16 mx-auto mb-4 text-stone-300" />
                <p className="font-semibold text-lg">No pending deliveries</p>
                <p className="text-sm">All orders are either assigned or delivered</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {orders.map((order) => (
                  <div key={order._id} className="border-2 border-stone-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-stone-900">#{order.orderId}</h3>
                        <p className="text-sm text-stone-600">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        order.status === 'Packed & Ready' 
                          ? 'bg-orange-100 text-orange-700' 
                          : order.status === 'Assigned'
                          ? 'bg-stone-200 text-stone-800'
                          : order.status === 'Picked Up'
                          ? 'bg-orange-200 text-orange-800'
                          : 'bg-stone-100 text-stone-600'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-semibold text-stone-700 mb-2">Items:</p>
                      <ul className="space-y-1">
                        {order.items.map((item: any, idx: number) => (
                          <li key={idx} className="text-sm text-stone-600 flex justify-between">
                            <span>{item.name}</span>
                            <span className="font-medium">x{item.quantity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-stone-200">
                      <div>
                        <p className="text-sm text-stone-600">Total</p>
                        <p className="text-xl font-bold text-stone-900">Rs {order.total.toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => handleAssignRider(order)}
                        disabled={order.status !== 'Packed & Ready'}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {order.status === 'Packed & Ready' ? 'Assign Rider' : 'Already Assigned'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {showAssignModal && selectedOrder && (
        <RiderAssignment
          orderId={selectedOrder._id}
          orderTotal={selectedOrder.total}
          onAssigned={handleRiderAssigned}
          onCancel={() => {
            setShowAssignModal(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
}

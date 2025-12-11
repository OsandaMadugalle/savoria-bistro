import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, ChefHat, Search, Bike, Package } from 'lucide-react';
import { fetchOrderById } from '../services/api';
import FeedbackForm from '../components/FeedbackForm';
import type { User, Order } from '../types';


// Expanded to support all kitchen/staff statuses
const statusToStep: Record<string, number> = {
   'Confirmed': 0,
   'Preparing': 1,
   'Quality Check': 2,
   'Packing': 3,
   'Packed & Ready': 4,
   'Assigned': 5,
   'Picked Up': 6,
   'Out for Delivery': 7,
   'Ready': 4, // alias for Packed & Ready
   'Ready for Pickup': 4,
   'Delivered': 8
};

interface TrackerPageProps {
   user?: User | null;
}

const TrackerPage: React.FC<TrackerPageProps> = ({ user }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(() => searchParams.get('orderId') || '');
  const [inputOrderId, setInputOrderId] = useState('');
  const isTracking = !!(searchParams.get('orderId') || orderId);
  const [trackingStep, setTrackingStep] = useState(0);
  const [orderStatus, setOrderStatus] = useState<string>('');
  // For display
  const statusLabels = [
    'Order Confirmed',
    'Preparing',
    'Quality Check',
    'Packing',
    'Packed & Ready',
    'Assigned to Rider',
    'Picked Up',
    'Out for Delivery',
    'Delivered'
  ];
  const statusDescriptions = [
    "We've received your order.",
    "Our chefs are working their magic.",
    "Ensuring everything is perfect.",
    "Packing your order for delivery.",
    "Order is packed and ready.",
    "Assigned to a delivery rider.",
    "Rider has picked up your order.",
    "Your order is on the way!",
    "Order delivered. Enjoy your meal!"
  ];
  const statusIcons = [
    <CheckCircle size={24} />, // Confirmed
    <ChefHat size={24} />,     // Preparing
    <Search size={24} />,      // Quality Check
    <Package size={24} />,     // Packing
    <Package size={24} />,     // Packed & Ready
    <Bike size={24} />,        // Assigned
    <Bike size={24} />,        // Picked Up
    <Bike size={24} />,        // Out for Delivery
    <CheckCircle size={24} /> // Delivered
  ];
  const [orderError, setOrderError] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (isTracking && (orderId || searchParams.get('orderId'))) {
      const currentOrderId = searchParams.get('orderId') || orderId;
      const pollOrder = async () => {
        const fetchedOrder = await fetchOrderById(currentOrderId);
        if (!fetchedOrder) {
          setOrderError('Order not found.');
          setOrder(null);
          return;
        }
        setOrderError('');
        setOrder(fetchedOrder);
        setOrderStatus(fetchedOrder.status);
        setTrackingStep(statusToStep[fetchedOrder.status] ?? 0);
        if (fetchedOrder.status !== 'Delivered' && !cancelled) {
          setTimeout(pollOrder, 4000);
        }
      };
      pollOrder();
      return () => { cancelled = true; };
    } else {
      setOrder(null);
      setOrderError('');
    }
  }, [isTracking, orderId, searchParams]);

   // Remove old steps array, use statusLabels/statusDescriptions/statusIcons

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-stone-900 via-orange-900 to-stone-800 text-white py-12 sm:py-16 px-4 pt-24 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl" />
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-2000"></div>
        </div>
        <div className="max-w-7xl mx-auto relative z-10 text-center px-2">
          <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
            <Search size={18} className="text-yellow-300" />
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-orange-200">Order Tracking</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-3 sm:mb-4">Track Your Order</h1>
          <p className="text-orange-100 max-w-2xl mx-auto text-sm sm:text-base md:text-lg">Enter your order number to see real-time status and delivery progress.</p>
        </div>
      </div>

      <div className="pt-0 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tracking Number Input Form */}
          {!isTracking && (
            <form
              className="max-w-md mx-auto bg-white/90 rounded-xl shadow-lg p-8 mb-12 border border-white/50 relative z-20"
              style={{
                transform: 'translateY(-4rem)',
                boxShadow: '0 10px 32px 0 rgba(0,0,0,0.10)',
              }}
              onSubmit={e => {
                e.preventDefault();
                if (inputOrderId.trim()) {
                  setSearchParams({ orderId: inputOrderId.trim() });
                  setOrderId(inputOrderId.trim());
                }
              }}
            >
              <h2 className="text-2xl font-serif font-bold mb-4 text-center text-stone-900">Track Your Order</h2>
              <label htmlFor="track-input" className="block text-stone-700 font-semibold mb-2">Enter your Order Number</label>
              <input
                id="track-input"
                type="text"
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 mb-4"
                placeholder="e.g. ORD-XXXXXXXXXXXXX-XXXX"
                value={inputOrderId}
                onChange={e => setInputOrderId(e.target.value)}
                required
              />
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Track Order
              </button>
            </form>
          )}
          {/* Tracking Results */}
          {orderError && isTracking && (
            <div className="max-w-md mx-auto bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 mt-8 text-center font-semibold">
              {orderError}
            </div>
          )}
          {isTracking && order && !orderError && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Header Card */}
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-8 text-center text-stone-900 border border-white/50">
                <h2 className="text-3xl font-serif font-bold mb-2">Real-Time Order Tracking</h2>
                <p className="text-stone-600">Order #{orderId || '8834'}</p>
                <p className="text-lg font-bold text-orange-600 mt-2">{orderStatus || 'Loading...'}</p>
              </div>
              {/* Main Tracking Card */}
              <div className="bg-white/50 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-white/50">
                {/* Stepper Timeline */}
                <div className="p-8">
                  <div className="flex flex-col md:flex-row gap-8 md:gap-4 items-center justify-between">
                    {statusLabels.map((label, idx) => (
                      <div key={label} className={`flex flex-col items-center flex-1 ${idx < statusLabels.length - 1 ? 'md:border-r md:border-stone-200' : ''}`}>
                        <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center border-4 flex-shrink-0 transition-all duration-500 shadow-lg ${
                          idx <= trackingStep 
                            ? 'bg-gradient-to-br from-orange-400 to-orange-600 border-orange-600 text-white scale-110' 
                            : 'bg-white border-stone-300 text-stone-400'
                        }`}>
                          {statusIcons[idx]}
                        </div>
                        <h4 className={`font-bold text-base md:text-lg mt-2 transition-colors ${idx <= trackingStep ? 'text-stone-900' : 'text-stone-500'}`}>{label}</h4>
                        <p className="text-xs md:text-sm text-stone-500 mt-1 text-center">{statusDescriptions[idx]}</p>
                        {idx < statusLabels.length - 1 && (
                          <div className="hidden md:block w-1 h-8 bg-gradient-to-b from-orange-400 to-stone-200 mx-auto my-2"></div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 text-center">
                    {orderStatus === 'Delivered' ? (
                      <div className="inline-block px-6 py-3 bg-green-50 rounded-full border border-green-200">
                        <p className="text-green-600 text-sm font-semibold animate-pulse">
                          ✅ Order delivered! Enjoy your meal!
                        </p>
                      </div>
                    ) : (
                      <div className="inline-block px-6 py-3 bg-orange-50 rounded-full border border-orange-200">
                        <p className="text-stone-600 text-sm font-semibold animate-pulse">
                          ⏱️ Waiting for next status update...
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Feedback Form Modal */}
              {showFeedbackForm && order && user && (
                <FeedbackForm
                  order={order}
                  user={user}
                  onClose={() => setShowFeedbackForm(false)}
                  onSuccess={() => setShowFeedbackForm(false)}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackerPage;
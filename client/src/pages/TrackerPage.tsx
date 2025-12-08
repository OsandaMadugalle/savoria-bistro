import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle, ChefHat, Search, Bike } from 'lucide-react';
import { fetchOrderById, getOrderFeedback } from '../services/api';
import FeedbackForm from '../components/FeedbackForm';
import type { User, Order } from '../types';


const statusToStep: Record<string, number> = {
   'Confirmed': 0,
   'Preparing': 1,
   'Quality Check': 2,
   'Ready': 3,
   'Delivered': 3,
};

interface TrackerPageProps {
   user?: User | null;
}

const TrackerPage: React.FC<TrackerPageProps> = ({ user }) => {
   const [searchParams] = useSearchParams();
   const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
   const [isTracking, setIsTracking] = useState(!!searchParams.get('orderId'));
   const [trackingStep, setTrackingStep] = useState(0);
   const [orderStatus, setOrderStatus] = useState<string>('');
   const [orderError, setOrderError] = useState('');
   const [order, setOrder] = useState<Order | null>(null);
   const [showFeedbackForm, setShowFeedbackForm] = useState(false);
   const [hasFeedback, setHasFeedback] = useState(false);
   const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

   useEffect(() => {
      if (isTracking && orderId) {
         let cancelled = false;
         const pollOrder = async () => {
            const fetchedOrder = await fetchOrderById(orderId);
            if (!fetchedOrder) {
               setOrderError('Order not found.');
               return;
            }
            setOrder(fetchedOrder);
            setOrderStatus(fetchedOrder.status);
            setTrackingStep(statusToStep[fetchedOrder.status] ?? 0);
            
            // Check if feedback already exists
            if (fetchedOrder.status === 'Delivered') {
               const feedback = await getOrderFeedback(orderId);
               setHasFeedback(!!feedback);
            }
            
            if (fetchedOrder.status !== 'Delivered' && !cancelled) {
               pollRef.current = setTimeout(pollOrder, 4000);
            }
         };
         pollOrder();
         return () => {
            cancelled = true;
            if (pollRef.current) clearTimeout(pollRef.current);
         };
      }
   }, [isTracking, orderId]);

  const handleTrack = async (e: React.FormEvent) => {
     e.preventDefault();
     if(orderId.trim()) {
        setOrderError('');
        setIsTracking(true);
     }
  };

  const steps = [
    { label: 'Order Confirmed', icon: <CheckCircle size={24} />, desc: "We've received your order." },
    { label: 'Preparing', icon: <ChefHat size={24} />, desc: "Our chefs are working their magic." },
    { label: 'Quality Check', icon: <Search size={24} />, desc: "Ensuring everything is perfect." },
    { label: 'Ready for Pickup', icon: <Bike size={24} />, desc: "Your order is ready!" },
  ];

  return (
    <div className="pt-32 pb-20 min-h-screen bg-gradient-to-br from-stone-900 via-orange-900 to-stone-900 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Search Form */}
        <div className="mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">Track Your Order</h1>
            <p className="text-white/70 mb-6">Enter your order ID to see live status</p>
            
            <form onSubmit={handleTrack} className="flex gap-3 flex-col sm:flex-row">
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g. 8834" 
                  className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 focus:ring-2 focus:ring-orange-400 outline-none transition-all"
                />
              </div>
              <button 
                type="submit" 
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-8 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                Track Now <ArrowRight size={18} />
              </button>
            </form>
            
            {orderError && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg text-sm">
                {orderError}
              </div>
            )}
          </div>
        </div>

        {/* Tracking Results */}
        {isTracking && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center text-white border border-white/10">
                 <h2 className="text-3xl font-serif font-bold mb-2">Real-Time Order Tracking</h2>
                 <p className="text-white/70">Order #{orderId || '8834'}</p>
                 <p className="text-lg font-bold text-orange-400 mt-2">{orderStatus || 'Loading...'}</p>
              </div>

              {/* Main Tracking Card */}
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                 {/* Status Header */}
                 <div className="bg-gradient-to-r from-orange-50 to-stone-50 p-8 border-b border-stone-100">
                    <div className="flex justify-center mb-8">
                       <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${
                          trackingStep === 3 
                            ? 'bg-gradient-to-br from-green-400 to-green-600 text-white' 
                            : 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                       }`}>
                          {trackingStep === 0 && <CheckCircle size={64} className="animate-pulse" />}
                          {trackingStep === 1 && <ChefHat size={64} className="animate-bounce" />}
                          {trackingStep === 2 && <Search size={64} className="animate-pulse" />}
                          {trackingStep === 3 && <Bike size={64} className="animate-spin" style={{ animationDuration: '2s' }} />}
                       </div>
                    </div>
                    <div className="text-center">
                       <p className="text-sm text-stone-600 mb-1">Estimated Delivery</p>
                       <p className="text-3xl font-bold text-orange-600">15-20 minutes</p>
                    </div>
                 </div>

                 {/* Timeline Content */}
                 <div className="p-8">

                 <div className="relative">
                    <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-stone-100 md:hidden"></div>
                    <div className="hidden md:block absolute top-5 left-0 w-full h-0.5 bg-stone-100"></div>
                    <div className="hidden md:block absolute top-5 left-0 h-0.5 bg-orange-500 transition-all duration-1000 ease-in-out" style={{ width: `${(trackingStep / 3) * 100}%` }}></div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4 relative z-10">
                       {steps.map((step, index) => (
                          <div key={index} className={`flex md:flex-col items-center gap-4 md:gap-2 transition-colors duration-500 ${index <= trackingStep ? 'opacity-100' : 'opacity-40'}`}>
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                                index <= trackingStep ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-stone-200 text-stone-400'
                             }`}>
                                {step.icon}
                             </div>
                             <div className="md:text-center">
                                <h4 className={`font-bold text-sm ${index <= trackingStep ? 'text-stone-900' : 'text-stone-500'}`}>{step.label}</h4>
                                <p className="text-xs text-stone-400 hidden md:block">{step.desc}</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>

                 <div className="mt-12 text-center">
                    {trackingStep === 3 ? (
                        <div className="space-y-4">
                           <div className="p-4 bg-green-50 text-green-700 rounded-lg inline-block">
                              <p className="font-bold">Enjoy your meal! 🍽️</p>
                           </div>
                           {user && order && (
                              <div className="mt-6">
                                 {hasFeedback ? (
                                    <div className="p-4 bg-blue-50 text-blue-700 rounded-lg inline-block">
                                       <p className="font-bold">✅ Thank you for your feedback!</p>
                                    </div>
                                 ) : (
                                    <button
                                       onClick={() => setShowFeedbackForm(true)}
                                       className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold transition-colors"
                                    >
                                       📝 Leave Feedback & Rate Your Order
                                    </button>
                                 )}
                              </div>
                           )}
                        </div>
                    ) : (
                       <p className="text-stone-500 text-sm animate-pulse">Waiting for status update...</p>
                    )}
                 </div>
                 </div>
              </div>
            </div>
        )}

        {/* Feedback Form Modal */}
        {showFeedbackForm && order && user && (
           <FeedbackForm
              order={order}
              user={user}
              onClose={() => setShowFeedbackForm(false)}
              onSuccess={() => setHasFeedback(true)}
           />
        )}
      </div>
    </div>
  );
};

export default TrackerPage;
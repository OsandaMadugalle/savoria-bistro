import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle, ChefHat, Search, Bike } from 'lucide-react';
import { Zap } from 'lucide-react';
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
     if (!orderId.trim()) {
        setOrderError('Please enter an order ID');
        setIsTracking(false);
        return;
     }
     setOrderError('');
     setIsTracking(true);
  };

  const steps = [
    { label: 'Order Confirmed', icon: <CheckCircle size={24} />, desc: "We've received your order." },
    { label: 'Preparing', icon: <ChefHat size={24} />, desc: "Our chefs are working their magic." },
    { label: 'Quality Check', icon: <Search size={24} />, desc: "Ensuring everything is perfect." },
    { label: 'Ready for Pickup', icon: <Bike size={24} />, desc: "Your order is ready!" },
  ];

  return (
         <div className="min-h-screen bg-stone-50">
             <div className="bg-gradient-to-br from-stone-900 via-orange-900 to-stone-800 text-white py-12 sm:py-16 px-4 pt-24 relative overflow-hidden">
                <div className="absolute -right-20 -top-20 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl" />
                <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl" />
                <div className="max-w-7xl mx-auto relative z-10 text-center px-2">
                            <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
                               <Zap size={18} className="text-yellow-300" />
                               <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-orange-200">Order Updates</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-3 sm:mb-4">Track Your Order</h1>
                            <p className="text-orange-100 max-w-2xl mx-auto text-sm sm:text-base md:text-lg">Enter your order ID to see live status and updates.</p>
                </div>
             </div>
             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Search Form */}
            <div className="mb-8">
               <div className="bg-white/50 backdrop-blur-sm rounded-xl p-8 border border-white/50">
                  <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                     <div className="flex-1 relative">
                        <input 
                           type="text" 
                           value={orderId}
                           onChange={(e) => setOrderId(e.target.value)}
                           placeholder="e.g. 8834" 
                           className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-stone-200 bg-white text-stone-800 placeholder-stone-400 focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm sm:text-base"
                        />
                     </div>
                     <button 
                        type="submit" 
                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-5 sm:px-8 py-2 sm:py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base"
                     >
                        Track Now <ArrowRight size={16} />
                     </button>
                  </form>
                  {orderError && (
                     <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-red-500/20 border border-red-500/50 text-red-700 rounded-lg text-xs sm:text-sm">
                        {orderError}
                     </div>
                  )}
               </div>
            </div>

        {/* Tracking Results */}
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
                 {/* Status Header */}
                 <div className="bg-gradient-to-r from-orange-500 via-orange-400 to-red-500 p-12 text-center text-white relative overflow-hidden">
                    {/* Animated background */}
                    <div className="absolute inset-0 opacity-20">
                       <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full mix-blend-overlay blur-3xl animate-pulse"></div>
                    </div>
                    <div className="relative z-10">
                       <div className="flex justify-center mb-6">
                          <div className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl border-4 border-white ${
                             trackingStep === 3 
                               ? 'bg-gradient-to-br from-green-400 to-emerald-600' 
                               : 'bg-white/20 backdrop-blur-sm'
                          }`}>
                             {trackingStep === 0 && <CheckCircle size={80} className="animate-pulse text-white" />}
                             {trackingStep === 1 && <ChefHat size={80} className="animate-bounce text-white" />}
                             {trackingStep === 2 && <Search size={80} className="animate-pulse text-white" />}
                             {trackingStep === 3 && <Bike size={80} className="text-white" style={{ animation: 'spin 1s linear infinite' }} />}
                          </div>
                       </div>
                       <h3 className="text-3xl font-bold mb-2">{steps[trackingStep]?.label}</h3>
                       <p className="text-white/90 text-lg mb-4">{steps[trackingStep]?.desc}</p>
                       <div className="inline-block bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full border border-white/40">
                          <p className="text-sm font-semibold">Estimated Delivery: <span className="text-2xl font-bold">15-20 min</span></p>
                       </div>
                    </div>
                 </div>

                 {/* Timeline Content */}
                 <div className="p-8">
                    {orderStatus === 'Delivered' ? (
                       // Completed Order Summary
                       <div className="space-y-6">
                          <div className="text-center">
                             <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white flex items-center justify-center mx-auto shadow-2xl">
                                <CheckCircle size={64} />
                             </div>
                             <h3 className="text-2xl font-bold text-gray-900 mt-6">Order Delivered!</h3>
                             <p className="text-gray-600 mt-2">Thank you for your order</p>
                          </div>

                          {/* Order Summary Card */}
                          <div className="bg-stone-50 rounded-xl p-6 border border-stone-200">
                             <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                   <p className="text-sm text-stone-600 font-semibold">Order ID</p>
                                   <p className="text-lg font-bold text-gray-900">#{orderId}</p>
                                </div>
                                <div>
                                   <p className="text-sm text-stone-600 font-semibold">Total Amount</p>
                                   <p className="text-lg font-bold text-orange-600">${order?.total?.toFixed(2) || 'N/A'}</p>
                                </div>
                                <div>
                                   <p className="text-sm text-stone-600 font-semibold">Items Ordered</p>
                                   <p className="text-lg font-bold text-gray-900">{order?.items?.length || 0} item(s)</p>
                                </div>
                                <div>
                                   <p className="text-sm text-stone-600 font-semibold">Status</p>
                                   <p className="text-lg font-bold text-green-600">✅ Delivered</p>
                                </div>
                             </div>

                             {/* Items List */}
                             {order?.items && order.items.length > 0 && (
                                <div className="border-t border-stone-200 pt-4">
                                   <p className="font-semibold text-stone-700 mb-3">Items Delivered:</p>
                                   <ul className="space-y-2">
                                      {order.items.map((item, index) => (
                                         <li key={index} className="flex justify-between items-center text-sm">
                                            <span className="text-gray-700">{item.name}</span>
                                            <span className="text-stone-600">x{item.quantity}</span>
                                         </li>
                                      ))}
                                   </ul>
                                </div>
                             )}
                          </div>

                          {/* Feedback Section */}
                          {user && order && (
                             <div className="mt-6">
                                {hasFeedback ? (
                                   <div className="p-4 bg-blue-50 text-blue-700 rounded-lg text-center border border-blue-200">
                                      <p className="font-bold">✅ Thank you for your feedback!</p>
                                      <p className="text-sm mt-1">We appreciate your ratings and comments</p>
                                   </div>
                                ) : (
                                   <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                                      <h4 className="font-bold text-orange-900 mb-2">Share Your Experience</h4>
                                      <p className="text-sm text-orange-800 mb-4">Help us improve by rating your order and leaving feedback</p>
                                      <button
                                         onClick={() => setShowFeedbackForm(true)}
                                         className="w-full px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold transition-colors"
                                      >
                                         📝 Leave Feedback & Rate Your Order
                                      </button>
                                   </div>
                                )}
                             </div>
                          )}

                          <div className="text-center pt-4">
                             <p className="text-stone-600 text-sm">Enjoy your meal! 🍽️</p>
                          </div>
                       </div>
                    ) : (
                       // Live Tracking View
                       <div className="relative pt-8">
                          {/* Timeline Line */}
                          <div className="absolute left-8 top-12 bottom-0 w-1 bg-gradient-to-b from-orange-300 via-orange-400 to-stone-200 md:hidden"></div>
                          <div className="hidden md:block absolute top-24 left-0 w-full h-1.5 bg-gradient-to-r from-stone-200 via-orange-300 to-stone-200 rounded-full"></div>
                          <div className="hidden md:block absolute top-24 left-0 h-1.5 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-400 transition-all duration-1000 ease-in-out rounded-full shadow-lg" style={{ width: `${(trackingStep / 3) * 100}%` }}></div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4 relative z-10">
                             {steps.map((step, index) => (
                                <div key={index} className={`transition-all duration-700 ${index <= trackingStep ? 'opacity-100 scale-100' : 'opacity-50 scale-95'}`}>
                                   <div className="flex md:flex-col items-start md:items-center gap-4 md:gap-3">
                                      {/* Connector Line for Mobile */}
                                      {index > 0 && (
                                         <div className="absolute left-3.5 -top-8 w-1 h-8 bg-gradient-to-b from-orange-400 to-stone-200 md:hidden"></div>
                                      )}
                                      {/* Circle Badge */}
                                      <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center border-4 flex-shrink-0 transition-all duration-500 shadow-lg ${
                                         index <= trackingStep 
                                            ? 'bg-gradient-to-br from-orange-400 to-orange-600 border-orange-600 text-white scale-110' 
                                            : 'bg-white border-stone-300 text-stone-400'
                                      }`}>
                                         {step.icon}
                                      </div>
                                      <div className="md:text-center flex-1">
                                         <h4 className={`font-bold text-base md:text-lg transition-colors ${index <= trackingStep ? 'text-stone-900' : 'text-stone-500'}`}>
                                            {step.label}
                                         </h4>
                                         <p className="text-xs md:text-sm text-stone-500 hidden md:block mt-1">{step.desc}</p>
                                      </div>
                                   </div>
                                </div>
                             ))}
                          </div>

                          <div className="mt-16 text-center">
                             <div className="inline-block px-6 py-3 bg-orange-50 rounded-full border border-orange-200">
                                <p className="text-stone-600 text-sm font-semibold animate-pulse">
                                   ⏱️ Waiting for next status update...
                                </p>
                             </div>
                          </div>
                       </div>
                    )}
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
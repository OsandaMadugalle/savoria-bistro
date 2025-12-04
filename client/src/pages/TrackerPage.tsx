import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle, ChefHat, Search, Bike, Package } from 'lucide-react';
import { fetchOrderById } from '../services/api';


const statusToStep: Record<string, number> = {
   'Confirmed': 0,
   'Preparing': 1,
   'Quality Check': 2,
   'Ready': 3,
   'Delivered': 3,
};

const TrackerPage: React.FC = () => {
   const [searchParams] = useSearchParams();
   const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
   const [isTracking, setIsTracking] = useState(!!searchParams.get('orderId'));
   const [trackingStep, setTrackingStep] = useState(0);
   const [orderStatus, setOrderStatus] = useState<string>('');
   const [orderError, setOrderError] = useState('');
   const pollRef = useRef<NodeJS.Timeout | null>(null);

   useEffect(() => {
      if (isTracking && orderId) {
         let cancelled = false;
         const pollOrder = async () => {
            const order = await fetchOrderById(orderId);
            if (!order) {
               setOrderError('Order not found.');
               return;
            }
            setOrderStatus(order.status);
            setTrackingStep(statusToStep[order.status] ?? 0);
            if (order.status !== 'Delivered' && !cancelled) {
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

  if (isTracking) {
     return (
        <div className="pt-32 pb-20 min-h-screen bg-stone-50 px-4">
           <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-stone-900 p-8 text-center text-white relative">
                 <button onClick={() => setIsTracking(false)} className="absolute top-4 left-4 text-stone-400 hover:text-white flex items-center gap-1 text-sm">
                    <ArrowRight className="rotate-180" size={16} /> Back
                 </button>
                 <h2 className="text-3xl font-serif font-bold mb-2">Order Status</h2>
                 <p className="text-stone-400">Order #{orderId || '8834'} • Status: {orderStatus || 'Loading...'}</p>
              </div>
              <div className="p-8">
                 <div className="flex justify-center mb-12">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${trackingStep === 3 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                       {trackingStep === 0 && <CheckCircle size={48} className="animate-pulse" />}
                       {trackingStep === 1 && <ChefHat size={48} className="animate-bounce" />}
                       {trackingStep === 2 && <Search size={48} className="animate-pulse" />}
                       {trackingStep === 3 && <Bike size={48} />}
                    </div>
                 </div>

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
                    {orderError ? (
                      <div className="p-4 bg-red-50 text-red-600 rounded-lg inline-block">{orderError}</div>
                    ) : trackingStep === 3 ? (
                        <div className="p-4 bg-green-50 text-green-700 rounded-lg inline-block">
                           <p className="font-bold">Enjoy your meal! 🍽️</p>
                        </div>
                    ) : (
                       <p className="text-stone-500 text-sm animate-pulse">Waiting for status update...</p>
                    )}
                 </div>
              </div>
           </div>
        </div>
     );
  }

  return (
      <div className="pt-32 pb-20 min-h-screen bg-stone-50 px-4 flex items-center justify-center">
         <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-stone-100">
            <div className="text-center mb-8">
               <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package size={32} />
               </div>
               <h1 className="text-2xl font-serif font-bold text-stone-900">Track Your Order</h1>
               <p className="text-stone-500 mt-2">Enter your order ID to see the live status.</p>
            </div>
            
            <form onSubmit={handleTrack} className="space-y-4">
               <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1 ml-1">Order ID</label>
                  <input 
                     type="text" 
                     value={orderId}
                     onChange={(e) => setOrderId(e.target.value)}
                     placeholder="e.g. 8834" 
                     className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  />
               </div>
               <button 
                  type="submit" 
                  className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
               >
                  Track Now <ArrowRight size={18} />
               </button>
            </form>
            <div className="mt-6 text-center text-xs text-stone-400">
               <p>Don't have an order ID? Try entering "123" for a demo.</p>
            </div>
         </div>
      </div>
  );
};

export default TrackerPage;
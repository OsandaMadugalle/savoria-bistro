import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ShoppingBag, Minus, Plus, Trash2, Trophy } from 'lucide-react';
import { CartItem, User } from '../types';
import { createOrder } from '../services/api';

interface OrderPageProps {
  cart: CartItem[];
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  user: User | null;
}

const OrderPage: React.FC<OrderPageProps> = ({ cart, updateQuantity, removeFromCart, clearCart, user }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (!user) return;
    setIsProcessing(true);
    // Create order object to send to backend
    const orderData = {
      userId: user.id,
      items: cart.map(i => ({ itemId: i.id, name: i.name, quantity: i.quantity, price: i.price })),
      total: total
    };
    try {
      const { orderId } = await createOrder(orderData);
      clearCart();
      navigate(`/tracker?demo=true&orderId=${orderId}`);
    } catch (err) {
      // Optionally show error to user
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Cart Empty View ---
  if (cart.length === 0) {
    return (
      <div className="pt-32 pb-20 min-h-screen bg-stone-50 px-4 text-center">
        <div className="max-w-md mx-auto animate-in zoom-in-95 duration-300">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
            <ShoppingBag size={48} className="mx-auto text-stone-300 mb-4" />
            <h2 className="text-2xl font-bold text-stone-900 mb-2">Your bag is empty</h2>
            <p className="text-stone-500 mb-6">Looks like you haven't added any delicious items yet.</p>
            <NavLink to="/menu" className="inline-block bg-orange-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-orange-700 transition-colors">
              Browse Menu
            </NavLink>
          </div>
        </div>
      </div>
    );
  }

  // --- Cart Active View ---
  return (
    <div className="pt-24 pb-20 min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 grid md:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="md:col-span-2 space-y-4">
          <h1 className="text-2xl font-bold text-stone-900 mb-6">Your Order</h1>
          {cart.map(item => (
            <div key={item._id || item.id || item.name} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex gap-4 items-center">
              <img src={item.image} alt={item.name} className="w-20 h-20 rounded-lg object-cover bg-stone-200" />
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <h3 className="font-semibold text-stone-900">{item.name}</h3>
                  <span className="font-bold text-stone-900">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
                <p className="text-xs text-stone-500 mb-3">${item.price.toFixed(2)} each</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-stone-100 rounded-lg p-1">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded shadow-sm transition-all"><Minus size={14} /></button>
                    <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded shadow-sm transition-all"><Plus size={14} /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-600 text-xs font-medium flex items-center gap-1">
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 sticky top-24">
            <h3 className="font-bold text-lg mb-4">Order Summary</h3>
            <div className="space-y-2 mb-4 text-sm text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (8%)</span>
                <span>${(total * 0.08).toFixed(2)}</span>
              </div>
            </div>
            <div className="border-t border-stone-100 pt-4 mb-6">
              <div className="flex justify-between font-bold text-lg text-stone-900">
                <span>Total</span>
                <span>${(total * 1.08).toFixed(2)}</span>
              </div>
            </div>
            
            {user && (
               <div className="mb-4 bg-yellow-50 text-yellow-800 text-xs p-3 rounded-lg flex items-start gap-2">
                 <Trophy size={14} className="mt-0.5 flex-shrink-0" />
                 You'll earn {Math.floor(total * 10)} points with this order!
               </div>
            )}

            {!user && (
              <div className="mb-4 text-center text-red-500 text-sm font-semibold">You must be logged in to place an order.</div>
            )}
            <button 
              onClick={handleCheckout}
              disabled={isProcessing || !user}
              className={`w-full font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2 ${!user ? 'bg-stone-300 text-stone-500 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-200'}`}
            >
              {isProcessing ? 'Processing...' : 'Proceed to Checkout'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPage;
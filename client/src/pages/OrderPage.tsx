import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingBag, Minus, Plus, Trash2, Trophy, Check } from 'lucide-react';
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
  const [promoCode, setPromoCode] = useState('');
  const [appliedCode, setAppliedCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const VALID_PROMOS: { [key: string]: number } = {
    'SAVORIA20': 20,
    'SAVE10': 10,
  };

  // Auto-apply promo code from URL on load
  useEffect(() => {
    const urlPromo = searchParams.get('promo');
    if (urlPromo && VALID_PROMOS[urlPromo]) {
      setAppliedCode(urlPromo);
    }
    // Also check localStorage for saved promo
    const savedPromo = localStorage.getItem('appliedPromoCode');
    if (savedPromo && VALID_PROMOS[savedPromo] && !urlPromo) {
      setAppliedCode(savedPromo);
    }
  }, [searchParams]);

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = appliedCode ? (total * (VALID_PROMOS[appliedCode] / 100)) : 0;
  const finalTotal = total - discount;

  const handleApplyPromo = () => {
    if (!user) {
      setCodeError('Please sign in to apply promo code');
      // Show error message for 3 seconds
      setTimeout(() => setCodeError(''), 3000);
      return;
    }
    
    const code = promoCode.toUpperCase().trim();
    if (!code) {
      setCodeError('Enter a promo code');
      return;
    }
    if (VALID_PROMOS[code]) {
      setAppliedCode(code);
      setCodeError('');
      setPromoCode('');
      // Store in localStorage for persistence
      localStorage.setItem('appliedPromoCode', code);
    } else {
      setCodeError('Invalid promo code');
      setAppliedCode('');
    }
  };

  const handleRemovePromo = () => {
    setAppliedCode('');
    setPromoCode('');
    setCodeError('');
    localStorage.removeItem('appliedPromoCode');
  };

  const handleCheckout = async () => {
    if (!user) return;
    setIsProcessing(true);
    // Create order object to send to backend
    const orderData = {
      userId: user.id,
      items: cart.map(i => ({ itemId: i.id, name: i.name, quantity: i.quantity, price: i.price })),
      total: finalTotal,
      discountCode: appliedCode,
      originalTotal: total
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
            <div key={item.id || item.name} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex gap-4 items-center">
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
          <div className="bg-white p-6 rounded-xl shadow-lg border border-stone-200 sticky top-24 space-y-4">
            <h3 className="font-bold text-xl text-stone-900 pb-4 border-b border-stone-100">Order Summary</h3>
            
            {/* Promo Code Section */}
            <div className="space-y-3">
              {!appliedCode ? (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-stone-600 block uppercase tracking-wide">Promo Code</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value);
                        setCodeError('');
                      }}
                      placeholder="Enter code"
                      className="w-full px-3 py-2 pr-14 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-stone-50"
                    />
                    <button 
                      onClick={handleApplyPromo}
                      className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 bg-orange-600 text-white rounded text-xs font-semibold hover:bg-orange-700 transition-colors shadow-md"
                    >
                      Apply
                    </button>
                  </div>
                  {codeError && <p className="text-xs text-red-500 font-medium">{codeError}</p>}
                  {!user ? (
                    <p className="text-xs text-orange-600 font-medium bg-orange-50 p-2 rounded">ℹ️ Sign in to apply promo codes</p>
                  ) : (
                    <button 
                      onClick={() => {
                        setPromoCode('SAVORIA20');
                      }}
                      className="text-xs text-orange-600 hover:text-orange-700 font-semibold"
                    >
                      💡 Try: SAVORIA20 (20% off)
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-green-50 p-3 rounded-lg flex items-center justify-between border border-green-200">
                  <div className="flex items-center gap-2 flex-1">
                    <Check size={16} className="text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-green-900">{appliedCode}</p>
                      <p className="text-xs text-green-700">{VALID_PROMOS[appliedCode]}% discount</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleRemovePromo}
                    className="text-green-600 hover:text-green-700 text-xs font-semibold ml-2"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 pt-3 border-t border-stone-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-stone-600">Subtotal</span>
                <span className="font-semibold text-stone-900">${total.toFixed(2)}</span>
              </div>
              {appliedCode && (
                <div className="flex justify-between items-center text-green-600">
                  <span className="text-sm font-medium">Discount ({VALID_PROMOS[appliedCode]}%)</span>
                  <span className="font-bold">-${discount.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-stone-900">Total</span>
                <span className="text-2xl font-bold text-orange-600">${finalTotal.toFixed(2)}</span>
              </div>
              {appliedCode && (
                <p className="text-xs text-orange-700">You're saving ${discount.toFixed(2)}!</p>
              )}
            </div>
            
            {user && (
               <div className="bg-yellow-50 text-yellow-800 text-xs p-3 rounded-lg flex items-start gap-2 border border-yellow-200">
                 <Trophy size={14} className="mt-0.5 flex-shrink-0" />
                 <span><span className="font-bold">{Math.floor(finalTotal * 10)}</span> reward points earned</span>
               </div>
            )}

            {!user && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg text-center font-semibold border border-red-200">
                ⚠️ Sign in to place an order
              </div>
            )}
            <button 
              onClick={handleCheckout}
              disabled={isProcessing || !user}
              className={`w-full font-bold py-3 rounded-lg transition-all flex justify-center items-center gap-2 text-white ${!user ? 'bg-stone-300 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-200 hover:shadow-orange-300'}`}
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
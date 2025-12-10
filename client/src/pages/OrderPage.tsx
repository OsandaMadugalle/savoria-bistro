import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingBag, Minus, Plus, Trash2, Trophy, Check } from 'lucide-react';
import { CartItem, User } from '../types';
import { createOrder, fetchActivePromos, Promo } from '../services/api';
import { notificationService } from '../services/notificationService';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface OrderPageProps {
  cart: CartItem[];
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  user: User | null;
}

const publishableKey = (import.meta as any).env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

const OrderPage: React.FC<OrderPageProps> = ({ cart, updateQuantity, removeFromCart, clearCart, user }) => {
  const [promoCode, setPromoCode] = useState('');
  const [appliedCode, setAppliedCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [intentLoading, setIntentLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [validPromos, setValidPromos] = useState<Promo[]>([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';

  // Build valid promos map
  const getPromoDiscountMap = () => {
    const map: { [key: string]: number } = {};
    validPromos.forEach(promo => {
      map[promo.code] = promo.discount;
    });
    return map;
  };
  const VALID_PROMOS = getPromoDiscountMap();

  // Tier-based discounts
  const getTierDiscount = () => {
    if (!user) return 0;
    if (user.tier === 'Gold') return 20; // 20% discount for Gold
    if (user.tier === 'Silver') return 10; // 10% discount for Silver
    return 0; // No discount for Bronze
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tierDiscount = (total * getTierDiscount()) / 100;
  const promoDiscount = appliedCode ? (total * (VALID_PROMOS[appliedCode] / 100)) : 0;
  
  // Use tier discount if available and better than promo code, otherwise use promo code
  const discount = Math.max(tierDiscount, promoDiscount);
  const finalTotal = Math.max(0, total - discount);

  const fetchClientSecret = useCallback(async () => {
    if (!user || finalTotal <= 0) return;
    setIntentLoading(true);
    try {
      const amountInCents = Math.round(finalTotal * 100);
      if (amountInCents < 50) {
        setPaymentError('Minimum order amount is Rs 50');
        setIntentLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/payments/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountInCents,
          currency: 'usd'
        })
      });
      const data = await response.json();
      if (response.ok && data.clientSecret) {
        setClientSecret(data.clientSecret);
        setPaymentError('');
      } else {
        // Handle specific error codes
        if (data.code === 'STRIPE_NOT_CONFIGURED') {
          setPaymentError('Payment service is not configured. Please contact support.');
        } else if (data.code === 'STRIPE_AUTH_ERROR') {
          setPaymentError('Payment service authentication failed. Please contact support.');
        } else {
          setPaymentError(data.error || 'Unable to prepare payment.');
        }
      }
    } catch (err) {
      setPaymentError('Could not reach payment service. Please check your connection.');
    } finally {
      setIntentLoading(false);
    }
  }, [API_BASE, finalTotal, user]);

  // Fetch active promos on mount
  useEffect(() => {
    const loadPromos = async () => {
      try {
        const data = await fetchActivePromos();
        setValidPromos(data);
      } catch (err) {
        console.error('Failed to fetch promos:', err);
        setValidPromos([]);
      }
    };
    loadPromos();
  }, []);

  useEffect(() => {
    if (validPromos.length === 0) return;

    const promoMap = getPromoDiscountMap();
    const urlPromo = searchParams.get('promo');
    if (urlPromo && promoMap[urlPromo]) {
      setAppliedCode(urlPromo);
    }
    const savedPromo = localStorage.getItem('appliedPromoCode');
    if (savedPromo && promoMap[savedPromo] && !urlPromo) {
      setAppliedCode(savedPromo);
    }
  }, [searchParams, validPromos]);

  useEffect(() => {
    if (!showPaymentModal) return;
    fetchClientSecret();
  }, [fetchClientSecret, showPaymentModal]);

  const handleApplyPromo = () => {
    if (!user) {
      setCodeError('Please sign in to apply promo code');
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

  const handleStartPayment = () => {
    if (!user || finalTotal <= 0) return;
    setPaymentError('');
    setClientSecret('');
    setShowPaymentModal(true);
  };

  const handleClosePayment = () => {
    setShowPaymentModal(false);
    setClientSecret('');
    setPaymentError('');
  };

  const CheckoutForm: React.FC = () => {
    const stripe = useStripe();
    const elements = useElements();
    const [cardError, setCardError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
      if (!stripe || !elements || !clientSecret || !user) return;
      setIsSubmitting(true);
      setCardError('');

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setCardError('Card details are not ready.');
        setIsSubmitting(false);
        return;
      }

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (result.error) {
        setCardError(result.error.message || 'Payment could not be completed.');
        setIsSubmitting(false);
        return;
      }

      if (result.paymentIntent?.status !== 'succeeded') {
        setCardError('Payment was not confirmed.');
        setIsSubmitting(false);
        return;
      }

      try {
        // Verify payment status before creating order
        const verifyRes = await fetch(`${API_BASE}/payments/verify-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId: result.paymentIntent.id })
        });
        
        if (!verifyRes.ok) {
          throw new Error('Payment verification failed');
        }

        const orderData = {
          userId: user.id,
          items: cart.map(i => ({ itemId: i.id, name: i.name, quantity: i.quantity, price: i.price })),
          total: finalTotal,
          discountCode: appliedCode,
          originalTotal: total,
          paymentIntentId: result.paymentIntent.id,
          requesterEmail: user.email,
        };
        const response = await createOrder(orderData);
        const { orderId, pointsEarned, userTier } = response;
        clearCart();
        handleClosePayment();
        
        // Send notification for order placement
        if (user?.email) {
          notificationService.init(user.email);
          notificationService.notifyOrderPlaced(orderId, finalTotal, pointsEarned || 0, userTier || 'Bronze');
        }
        
        // Show success with loyalty points feedback
        const loyaltyMsg = pointsEarned ? ` | Earned ${pointsEarned} loyalty points (Tier: ${userTier})` : '';
        console.log(`Order placed successfully: ${orderId}${loyaltyMsg}`);
        
        navigate(`/tracker?demo=true&orderId=${orderId}`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Order finalization failed';
        setCardError(errorMsg);
        console.error('Order creation error:', err);
      } finally {
        setIsSubmitting(false);
      }
    };

    if (!clientSecret) {
      return <p className="text-sm text-stone-500">{intentLoading ? 'Preparing secure payment...' : paymentError || 'Payment not ready.'}</p>;
    }

    return (
      <div className="space-y-4">
        <div className="border border-stone-200 rounded-2xl bg-stone-50 p-4">
          <label className="text-xs font-semibold uppercase text-stone-500 mb-2 block">Card Details</label>
          <div className="bg-white p-3 rounded-xl border border-stone-200">
            <CardElement options={{ hidePostalCode: true }} />
          </div>
        </div>
        {cardError && <p className="text-sm text-red-600">{cardError}</p>}
        <button
          onClick={handleSubmit}
          disabled={!clientSecret || isSubmitting}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-70"
        >
          {isSubmitting ? 'Processing payment...' : `Confirm & Pay Rs ${finalTotal.toFixed(2)}`}
        </button>
      </div>
    );
  };

  if (cart.length === 0) {
    return (
      <div className="pt-20 sm:pt-32 pb-12 sm:pb-20 min-h-screen bg-gradient-to-br from-stone-50 to-orange-50 px-2 sm:px-4 text-center">
        <div className="max-w-xs sm:max-w-md mx-auto animate-in zoom-in-95 duration-300">
          <div className="bg-gradient-to-br from-white to-stone-50 p-6 sm:p-10 rounded-2xl sm:rounded-3xl shadow-lg border-2 border-stone-200">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <ShoppingBag size={36} className="sm:size-48 text-orange-500" />
            </div>
            <h2 className="text-xl sm:text-3xl font-serif font-bold text-stone-900 mb-2 sm:mb-3">Your Bag is Empty</h2>
            <p className="text-stone-600 mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base">Looks like you haven't added any delicious items yet. Explore our menu and find your favorites!</p>
            <NavLink to="/menu" className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg text-sm sm:text-base">
              <ShoppingBag size={16} className="sm:size-20" />
              Continue Shopping
            </NavLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 sm:pt-28 pb-12 sm:pb-20 min-h-screen bg-gradient-to-br from-stone-50 to-orange-50">
      <div className="max-w-xs sm:max-w-5xl mx-auto px-2 sm:px-4 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
        <div className="md:col-span-2 space-y-3 sm:space-y-4">
          <h1 className="text-xl sm:text-3xl font-serif font-bold text-stone-900 mb-4 sm:mb-6">🛒 Your Order</h1>
          <div className="space-y-2 sm:space-y-3">
            {cart.map((item, idx) => (
              <div key={item.id || idx} className="group bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border-2 border-stone-100 hover:shadow-lg hover:border-orange-300 transition-all duration-300 flex flex-col sm:flex-row gap-3 sm:gap-4 items-center">
                <div className="relative overflow-hidden rounded-lg sm:rounded-xl w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 mx-auto sm:mx-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="flex-1 w-full">
                  <div className="flex justify-between mb-1 sm:mb-2">
                    <h3 className="font-serif font-bold text-stone-900 text-base sm:text-lg group-hover:text-orange-600 transition-colors">{item.name}</h3>
                    <span className="font-serif font-bold text-orange-600 text-base sm:text-lg">Rs {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-600 mb-2 sm:mb-4">Rs {item.price.toFixed(2)} × {item.quantity}</p>
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-1 sm:gap-2 bg-stone-100 rounded-md sm:rounded-lg p-1 sm:p-2 border border-stone-200">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded-md transition-all text-stone-600 hover:text-orange-600"><Minus size={16} /></button>
                      <span className="text-xs sm:text-sm font-bold w-6 sm:w-8 text-center text-stone-900">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded-md transition-all text-stone-600 hover:text-orange-600"><Plus size={16} /></button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs sm:text-sm font-semibold flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all">
                      <Trash2 size={16} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="md:col-span-1">
          <div className="bg-gradient-to-br from-white to-orange-50 p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border-2 border-stone-200 sticky top-20 sm:top-28 space-y-4 sm:space-y-6">
            <div className="relative">
              <h3 className="font-serif font-bold text-2xl text-stone-900 pb-4 border-b-2 border-stone-100">📋 Order Summary</h3>
            </div>
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
                  ) : null}
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

            <div className="space-y-3 pt-3 border-t border-stone-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-stone-600">Subtotal</span>
                <span className="font-semibold text-stone-900">Rs {total.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className={`flex justify-between items-center ${tierDiscount > promoDiscount ? 'text-blue-600' : 'text-green-600'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      Discount {tierDiscount > promoDiscount ? `(${user?.tier} Tier ${getTierDiscount()}%)` : `(${appliedCode})`}
                    </span>
                    {tierDiscount > promoDiscount && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-bold">Tier Benefit</span>
                    )}
                  </div>
                  <span className="font-bold">-${discount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-stone-900">Total</span>
                <span className="text-2xl font-bold text-orange-600">${finalTotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <p className="text-xs text-orange-700">You're saving Rs {discount.toFixed(2)}!</p>
              )}
            </div>

            {paymentError && <p className="text-sm text-red-600">{paymentError}</p>}

            {user && (
              <div className="space-y-2">
                <div className="bg-yellow-50 text-yellow-800 text-xs p-3 rounded-lg flex items-start gap-2 border border-yellow-200">
                  <Trophy size={14} className="mt-0.5 flex-shrink-0" />
                  <span><span className="font-bold">{Math.floor(finalTotal * 10)}</span> reward points earned</span>
                </div>
                {getTierDiscount() > 0 && (
                  <div className={`text-xs p-3 rounded-lg flex items-start gap-2 border ${getTierDiscount() === 20 ? 'bg-yellow-50 text-yellow-800 border-yellow-200' : 'bg-gray-50 text-gray-800 border-gray-200'}`}>
                    <span className={`${getTierDiscount() === 20 ? '⭐' : '✨'} mt-0.5 flex-shrink-0`} />
                    <span><span className="font-bold">{user.tier}</span> Member: {getTierDiscount()}% discount applied!</span>
                  </div>
                )}
              </div>
            )}

            {!user && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg text-center font-semibold border border-red-200">
                ⚠️ Sign in to place an order
              </div>
            )}

            {user && !publishableKey && (
              <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs p-3">
                ⚠️ Configure <code>VITE_STRIPE_PUBLISHABLE_KEY</code> in <code>client/.env</code> to load Stripe Elements.
              </div>
            )}

            {user && publishableKey && (
              <div className="space-y-3">
                <button
                  onClick={handleStartPayment}
                  disabled={!user || finalTotal <= 0}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-70"
                >
                  Proceed to payment
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {showPaymentModal && publishableKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in scale-in-95">
            <button
              onClick={handleClosePayment}
              className="absolute right-4 top-4 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-full p-1 transition-colors"
              aria-label="Close payment modal"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-stone-900 mb-2">Secure payment</h3>
            <p className="text-xs text-stone-500 mb-4">Enter your card details securely via Stripe.</p>
            {stripePromise && (
              <Elements stripe={stripePromise} options={clientSecret ? { clientSecret } : undefined}>
                <CheckoutForm />
              </Elements>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderPage;

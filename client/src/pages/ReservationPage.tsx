import React, { useState, useEffect } from 'react';
import { CheckCircle, Phone, Clock, MapPin, Calendar, Users, User as UserIcon, AlertCircle, Copy, Check, LogIn } from 'lucide-react';
import { Zap } from 'lucide-react';
import { User, ReservationData } from '../types';
import { createReservation } from '../services/api';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import LoginModal from '../components/LoginModal';
import ReservationPayment from '../components/ReservationPayment';

interface ReservationPageProps {
  user: User | null;
}

interface ReservationResponse {
  message: string;
  reservation: ReservationData & { confirmationCode: string; _id: string };
  confirmationCode: string;
}

const DEPOSIT_AMOUNT = 250000; // Rs 2500.00 in cents
const publishableKey = (import.meta as any).env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

const ReservationPage: React.FC<ReservationPageProps> = ({ user }) => {
  const [formData, setFormData] = useState<ReservationData>({
    name: '', email: '', phone: '', date: '', time: '', guests: 2, notes: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'payment_pending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [reservationResponse, setReservationResponse] = useState<ReservationResponse | null>(null);
  const [pendingReservationData, setPendingReservationData] = useState<ReservationData | null>(null);
  const [availability, setAvailability] = useState<{ available: boolean; availableSlots: number; maxCapacity?: number } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, name: user.name, email: user.email, phone: user.phone }));
    }
  }, [user]);

  const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';

  const checkAvailability = async (date: string, time: string) => {
    if (!date || !time) return;
    try {
      const response = await fetch(`${API_URL}/reservations/check-availability/${date}/${time}`);
      const data = await response.json();
      setAvailability(data);
    } catch (err) {
      console.error('Failed to check availability:', err);
    }
  };

  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (name === 'date' || name === 'time') {
      const newDate = name === 'date' ? value : formData.date;
      const newTime = name === 'time' ? value : formData.time;
      checkAvailability(newDate, newTime);
    }
  };


  // Step 1: On submit, create a pending reservation first, then proceed to payment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');
    try {
      // Create reservation with status 'Pending' (not confirmed yet)
      const response = await createReservation({
        ...formData,
        userId: user?.id || '',
        status: 'Pending',
        paymentStatus: 'pending',
      });
      setPendingReservationData(response.reservation);
      setStatus('payment_pending');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Reservation failed. Please try again.');
    }
  };

  // Step 2: After payment, mark reservation as confirmed
  const handlePaymentSuccess = async () => {
    if (!pendingReservationData) return;
    setStatus('submitting');
    setErrorMessage('');
    try {
      // Fetch the updated reservation (should now be confirmed by backend after payment)
      // Optionally, you could call an API to update status to 'Confirmed' if needed
      // For now, just fetch the reservation by ID
      const res = await fetch(`${(import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api'}/reservations/user/${user?.id}`);
      const reservations = await res.json();
      const updated = reservations.find((r: any) => r._id === pendingReservationData._id);
      setReservationResponse({
        message: 'Reservation confirmed',
        reservation: updated || pendingReservationData,
        confirmationCode: (updated || pendingReservationData).confirmationCode,
      });
      setStatus('success');
      setFormData({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', date: '', time: '', guests: 2, notes: '' });
      setPendingReservationData(null);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Reservation confirmation failed. Please try again.');
    }
  };

  const handlePaymentError = (error: string) => {
    setStatus('payment_pending');
    setErrorMessage(error);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const copyConfirmationCode = () => {
    if (reservationResponse?.confirmationCode) {
      navigator.clipboard.writeText(reservationResponse.confirmationCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
  };

  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50">
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-stone-900 via-orange-900 to-stone-800 text-white py-12 sm:py-16 px-4 pt-24 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl" />
          <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl" />
          <div className="max-w-7xl mx-auto relative z-10 text-center px-2">
            <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
              <Zap size={18} className="text-yellow-300" />
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-orange-200">Reserve Now</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-3 sm:mb-4">Book Your Table</h1>
            <p className="text-orange-100 max-w-2xl mx-auto text-sm sm:text-base md:text-lg">Experience culinary excellence in our elegant dining rooms. Reserve your perfect moment with us.</p>
          </div>
        </div>

        <div className="pt-0 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border-2 border-stone-100 p-6 sm:p-10 text-center mt-8">
              <div className="inline-block p-3 bg-red-100 rounded-full mb-4">
                <AlertCircle size={32} className="text-red-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mb-2">Authentication Required</h2>
              <p className="text-stone-600 text-sm sm:text-base mb-4 leading-relaxed">
                To secure your reservation and receive confirmation details, please sign in to your Savoria account or create a new one.
              </p>
              <p className="text-stone-500 text-xs mb-6">
                🔐 Your account helps us personalize your experience and manage your reservations.
              </p>
              <button
                onClick={() => setShowLoginModal(true)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold rounded-lg transition-all shadow-md text-sm"
              >
                <LogIn size={16} />
                Sign In or Create Account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-stone-900 via-orange-900 to-stone-800 text-white py-12 sm:py-16 px-4 pt-24 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto relative z-10 text-center px-2">
          <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
            <Zap size={18} className="text-yellow-300" />
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-orange-200">Reserve Now</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-3 sm:mb-4">Book Your Table</h1>
          <p className="text-orange-100 max-w-2xl mx-auto text-sm sm:text-base md:text-lg">Experience culinary excellence in our elegant dining rooms. Reserve your perfect moment with us.</p>
        </div>
      </div>

      <div className="pt-0 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Info Side */}
          <div className="space-y-6">
            <div className="bg-white/50 backdrop-blur-sm rounded-xl shadow-xl p-10 border border-white/50">
              <h2 className="text-3xl font-serif font-bold text-stone-900 mb-6 flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Calendar className="text-orange-600" size={28} />
                </div>
                Reservation Info
              </h2>
              <p className="text-stone-600 mb-8 leading-relaxed">
                Reservations are recommended, especially on weekends and special occasions. We hold tables for 15 minutes past your reservation time. Your confirmation code is required for modifications and cancellations.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-stone-50 rounded-xl hover:bg-orange-50 transition-colors">
                  <Phone className="text-orange-500 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-semibold text-stone-900">Call Us</p>
                    <p className="text-stone-600 text-sm">+94 11 234 5678</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-stone-50 rounded-xl hover:bg-orange-50 transition-colors">
                  <Clock className="text-orange-500 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-semibold text-stone-900">Hours</p>
                    <p className="text-stone-600 text-sm">Daily 11 AM - 10 PM</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-stone-50 rounded-xl hover:bg-orange-50 transition-colors">
                  <MapPin className="text-orange-500 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-semibold text-stone-900">Location</p>
                    <p className="text-stone-600 text-sm">123 Galle Road, Colombo 03</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-stone-200">
                <p className="text-sm text-stone-500 font-semibold mb-2">📢 Note:</p>
                <p className="text-sm text-stone-600 mb-3">For groups larger than 10, please call us directly to arrange the perfect dining experience.</p>
                <p className="text-sm text-stone-600">
                  <strong>Cancellation Policy:</strong> Cancel at least 2 hours before your reservation using your confirmation code to avoid any inconvenience.
                </p>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="bg-white/50 backdrop-blur-sm rounded-xl shadow-xl p-10 border border-white/50">
            {status === 'payment_pending' && pendingReservationData ? (
              <div className="space-y-6">
                <h3 className="text-2xl font-serif font-bold text-stone-900 mb-4">Complete Payment</h3>
                <p className="text-stone-600">Complete your reservation by paying the deposit amount of Rs {(DEPOSIT_AMOUNT / 100).toFixed(2)}.</p>
                <div className="bg-stone-50 rounded-xl p-4 space-y-3">
                  <p className="font-semibold text-stone-900">Reservation Details:</p>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-stone-600">Date:</span>
                      <span className="font-semibold text-stone-900">{pendingReservationData.date ?? ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600">Time:</span>
                      <span className="font-semibold text-stone-900">{pendingReservationData.time ?? ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600">Party Size:</span>
                      <span className="font-semibold text-stone-900">{pendingReservationData.guests ?? ''} guests</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-stone-200">
                      <span className="text-stone-600 font-semibold">Deposit Amount:</span>
                      <span className="font-bold text-orange-600">Rs {(DEPOSIT_AMOUNT / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Elements stripe={stripePromise}>
                  <ReservationPayment
                    reservationId={pendingReservationData._id || ''}
                    amount={DEPOSIT_AMOUNT}
                    email={pendingReservationData.email}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    errorMessage={errorMessage}
                  />
                </Elements>

                <button
                  onClick={() => setStatus('idle')}
                  className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : status === 'success' && reservationResponse && reservationResponse.reservation ? (
              <div className="h-full min-h-96 flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-50 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <CheckCircle size={40} />
                </div>
                <h3 className="text-3xl font-serif font-bold text-stone-900 mb-3">Reservation Confirmed!</h3>
                <p className="text-stone-600 mb-6">We look forward to welcoming you at Savoria Bistro.</p>
                
                {/* Confirmation Code Display */}
                <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-6 w-full mb-6">
                  <p className="text-sm text-stone-600 mb-2 font-semibold">Your Confirmation Code</p>
                  <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-orange-200">
                    <span className="text-2xl font-bold text-orange-600 font-mono">
                      {reservationResponse.confirmationCode}
                    </span>
                    <button
                      onClick={copyConfirmationCode}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm font-semibold"
                    >
                      {copiedCode ? (
                        <>
                          <Check size={16} /> Copied
                        </>
                      ) : (
                        <>
                          <Copy size={16} /> Copy
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-stone-600 mt-3">Save this code for modifications and cancellations</p>
                </div>

                {/* Reservation Details */}
                <div className="bg-stone-50 rounded-xl p-4 w-full text-left mb-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-stone-700">Date:</span>
                    <span className="text-stone-600">{reservationResponse.reservation?.date ?? ''}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-stone-200 pt-2">
                    <span className="font-semibold text-stone-700">Time:</span>
                    <span className="text-stone-600">{reservationResponse.reservation?.time ?? ''}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-stone-200 pt-2">
                    <span className="font-semibold text-stone-700">Party Size:</span>
                    <span className="text-stone-600">{reservationResponse.reservation?.guests ?? ''} {reservationResponse.reservation?.guests === 1 ? 'guest' : 'guests'}</span>
                  </div>
                </div>

                <p className="text-sm text-stone-600 mb-6">A confirmation email has been sent to <strong>{reservationResponse.reservation?.email ?? ''}</strong></p>
                
                <button 
                  onClick={() => setStatus('idle')}
                  className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors w-full"
                >
                  Make Another Booking
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <h3 className="text-2xl font-serif font-bold text-stone-900 mb-4">Reservation Form</h3>
                {user && (
                   <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl text-sm text-orange-800 flex items-center gap-3 mb-4 shadow-sm">
                      <UserIcon size={18} className="flex-shrink-0" /> 
                      <span>Logged in as <span className="font-bold">{user.name}</span>. Details pre-filled.</span>
                   </div>
                )}
                
                {status === 'error' && (
                  <div className="bg-red-50 border border-red-300 text-red-700 p-4 rounded-xl text-sm flex items-start gap-3">
                    <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                    <div>{errorMessage}</div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-600 mb-2">Date *</label>
                    <div className="relative">
                       <Calendar className="absolute left-3 top-3.5 text-orange-500" size={18} />
                       <input 
                         required 
                         type="date" 
                         name="date" 
                         min={getTodayDateString()}
                         value={formData.date} 
                         onChange={handleDateTimeChange} 
                         className="w-full pl-11 pr-3 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm hover:border-stone-300 transition-colors" 
                       />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-600 mb-2">Time *</label>
                    <div className="relative">
                       <Clock className="absolute left-3 top-3.5 text-orange-500" size={18} />
                       <input 
                         required 
                         type="time" 
                         name="time" 
                         value={formData.time} 
                         onChange={handleDateTimeChange} 
                         className="w-full pl-11 pr-3 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm hover:border-stone-300 transition-colors" 
                       />
                    </div>
                  </div>
                </div>

                {/* Availability Status */}
                {availability && (
                  <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
                    availability.available 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {availability.available ? (
                      <>
                        <Check size={16} />
                        <span>✓ Available! {availability.availableSlots} table(s) remaining{availability.maxCapacity ? ` (Max capacity: ${availability.maxCapacity})` : ''}</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={16} />
                        <span>⚠ Fully booked for this time. Please select another time.</span>
                      </>
                    )}
                  </div>
                )}

                <div>
                   <label className="block text-xs font-bold uppercase text-stone-600 mb-2">Number of Guests * (Min: 1, Max: 10)</label>
                   <div className="relative">
                       <Users className="absolute left-3 top-3.5 text-orange-500" size={18} />
                       <select 
                         name="guests" 
                         value={formData.guests} 
                         onChange={handleChange} 
                         className="w-full pl-11 pr-3 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm bg-white hover:border-stone-300 transition-colors"
                       >
                         {[1,2,3,4,5,6,7,8,9,10].map(num => <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>)}
                       </select>
                   </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-2">Full Name *</label>
                  <input 
                    required 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    placeholder="John Doe" 
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm hover:border-stone-300 transition-colors" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-600 mb-2">Email Address *</label>
                    <input 
                      required 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                      placeholder="john@example.com" 
                      className="w-full px-3 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm hover:border-stone-300 transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-600 mb-2">Phone Number *</label>
                    <input 
                      required 
                      type="tel" 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleChange} 
                      placeholder="(555) 000-0000" 
                      className="w-full px-3 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm hover:border-stone-300 transition-colors" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-2">Special Requests</label>
                  <textarea 
                    name="notes" 
                    value={formData.notes} 
                    onChange={handleChange} 
                    rows={3} 
                    placeholder="Allergies, high chair needed, celebrating an occasion..." 
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm resize-none hover:border-stone-300 transition-colors"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={status === 'submitting' || !availability?.available}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-orange-200/50 mt-6"
                >
                  {status === 'submitting' ? 'Confirming...' : 'Confirm Reservation'}
                </button>
              </form>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationPage;
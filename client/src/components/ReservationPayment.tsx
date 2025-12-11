import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { AlertCircle, Loader, CheckCircle, CreditCard } from 'lucide-react';

interface ReservationPaymentProps {
  reservationId: string;
  amount: number;
  email: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const ReservationPayment: React.FC<ReservationPaymentProps & { errorMessage?: string }> = ({
  reservationId,
  amount, // amount in paise
  email,
  onSuccess,
  onError,
  errorMessage = ''
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(errorMessage);
  const [cardError, setCardError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  // Handle real-time card input errors
  const handleCardChange = (event: any) => {
    if (event.error) {
      setCardError(event.error.message);
    } else {
      setCardError('');
    }
    // Clear main error if user starts editing card info
    if (error) setError('');
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      setError('Payment system not loaded. Please refresh the page.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';
      // Create payment intent on backend
      const intentResponse = await fetch(`${API_URL}/payments/reservation/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId, amount, email })
      });

      const intentData = await intentResponse.json();

      if (!intentData.clientSecret) {
        throw new Error('Failed to create payment intent');
      }

      // Confirm payment with Stripe
      const result = await stripe.confirmCardPayment(intentData.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: { email }
        }
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed');
        setPaymentStatus('error');
        onError(result.error.message || 'Payment failed');
      } else if (result.paymentIntent?.status === 'succeeded') {
        // Confirm payment on backend
        const confirmResponse = await fetch(`${API_URL}/payments/reservation/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId: intentData.paymentIntentId, reservationId })
        });

        const confirmData = await confirmResponse.json();

        if (confirmData.success) {
          setPaymentStatus('success');
          onSuccess();
        } else {
          throw new Error(confirmData.message || 'Payment confirmation failed');
        }
      } else {
        setError('Payment could not be completed. Please try again.');
        setPaymentStatus('error');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'An error occurred during payment';
      setError(errorMsg);
      setPaymentStatus('error');
      onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (paymentStatus === 'success') {
    return (
      <div className="bg-green-50 border border-green-300 rounded-xl p-6 text-center">
        <CheckCircle className="text-green-600 mx-auto mb-3" size={32} />
        <h3 className="text-lg font-bold text-green-900 mb-2">Payment Successful</h3>
        <p className="text-green-700">Your deposit of Rs {(amount / 100).toFixed(2)} has been confirmed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="text-blue-600 mt-0.5 flex-shrink-0" size={18} />
        <div className="text-sm text-blue-700">
          <p className="font-semibold mb-1">Deposit Required</p>
          <p>A deposit of Rs {(amount / 100).toFixed(2)} is required to confirm your reservation.</p>
        </div>
      </div>

      <form onSubmit={handlePayment} className="space-y-4">
        <div className="bg-white border border-stone-200 rounded-lg p-4">
          <label className="block text-xs font-bold uppercase text-stone-600 mb-2">Card Information</label>
          {cardError && (
            <div className="bg-red-50 border border-red-300 text-red-700 p-2 rounded-lg text-xs mb-2 flex items-start gap-2">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              <div>{cardError}</div>
            </div>
          )}
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '14px',
                  color: '#1c1917',
                  '::placeholder': { color: '#a8a29e' }
                },
                invalid: {
                  color: '#dc2626'
                }
              },
              hidePostalCode: true
            }}
            className="p-2"
            onChange={handleCardChange}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !stripe}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader size={18} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard size={18} />
              Pay Rs {(amount / 100).toFixed(2)}
            </>
          )}
        </button>

        <p className="text-xs text-stone-500 text-center">
          Your payment is secure and encrypted. We accept all major credit and debit cards.
        </p>
      </form>
    </div>
  );
};

export default ReservationPayment;

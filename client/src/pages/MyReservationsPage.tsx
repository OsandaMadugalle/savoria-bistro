import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Phone, Mail, Trash2, Check, AlertCircle, Copy, Loader } from 'lucide-react';
import { User, ReservationData } from '../types';

interface ReservationWithCode extends ReservationData {
  _id: string;
  confirmationCode: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  createdAt: string;
  expiresAt?: string;
}

interface MyReservationsPageProps {
  user: User | null;
}

const MyReservationsPage: React.FC<MyReservationsPageProps> = ({ user }) => {
  const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';
  const [reservations, setReservations] = useState<ReservationWithCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadReservations();
    } else {
      setLoading(false);
      setError('Please log in to view your reservations');
    }
  }, [user?.id]);

  const loadReservations = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/reservations/user/${user?.id}`);
      if (!response.ok) throw new Error('Failed to load reservations');
      const data = await response.json();
      setReservations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (confirmationCode: string) => {
    if (!window.confirm('Are you sure? This action cannot be undone.')) return;

    setCancellingId(confirmationCode);
    try {
      const response = await fetch(`${API_URL}/reservations/${confirmationCode}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to cancel reservation');
      
      setReservations(prev => prev.filter(r => r.confirmationCode !== confirmationCode));
      setSuccessMessage('Reservation cancelled successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel reservation');
    } finally {
      setCancellingId(null);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isUpcoming = (date: string, time: string) => {
    const reservationDateTime = new Date(`${date}T${time}`);
    return reservationDateTime > new Date();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Confirmed': return 'bg-green-100 text-green-800 border-green-300';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Completed': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-stone-100 text-stone-800 border-stone-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-orange-50 pt-32 pb-16">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-3">My Reservations</h1>
          <p className="text-stone-600 text-lg">Manage and view all your dining reservations at Savoria Bistro</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 p-4 rounded-xl mb-6 flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-300 text-green-700 p-4 rounded-xl mb-6 flex items-start gap-3">
            <Check size={18} className="mt-0.5 flex-shrink-0" />
            <div>{successMessage}</div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-16">
            <Loader size={32} className="mx-auto text-orange-500 mb-4 animate-spin" />
            <p className="text-stone-600">Loading your reservations...</p>
          </div>
        ) : reservations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Calendar size={48} className="mx-auto text-stone-300 mb-4" />
            <h3 className="text-xl font-semibold text-stone-900 mb-2">No Reservations</h3>
            <p className="text-stone-600 mb-6">You haven't made any reservations yet.</p>
            <a 
              href="/reservation" 
              className="inline-block px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
            >
              Book a Table
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Upcoming Reservations */}
            {reservations.filter(r => isUpcoming(r.date, r.time) && r.status !== 'Cancelled').length > 0 && (
              <div>
                <h2 className="text-2xl font-serif font-bold text-stone-900 mb-4 flex items-center gap-2">
                  <Check size={24} className="text-green-600" />
                  Upcoming
                </h2>
                <div className="grid gap-4">
                  {reservations
                    .filter(r => isUpcoming(r.date, r.time) && r.status !== 'Cancelled')
                    .map(reservation => (
                      <ReservationCard 
                        key={reservation._id} 
                        reservation={reservation} 
                        onCancel={handleCancelReservation}
                        isCancelling={cancellingId === reservation.confirmationCode}
                        copiedCode={copiedCode}
                        onCopy={copyToClipboard}
                        getStatusColor={getStatusColor}
                        formatDate={formatDate}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Past Reservations */}
            {reservations.filter(r => !isUpcoming(r.date, r.time) || r.status === 'Cancelled').length > 0 && (
              <div>
                <h2 className="text-2xl font-serif font-bold text-stone-900 mb-4 flex items-center gap-2">
                  <Calendar size={24} className="text-stone-400" />
                  Past & Cancelled
                </h2>
                <div className="grid gap-4 opacity-75">
                  {reservations
                    .filter(r => !isUpcoming(r.date, r.time) || r.status === 'Cancelled')
                    .map(reservation => (
                      <ReservationCard 
                        key={reservation._id} 
                        reservation={reservation} 
                        onCancel={handleCancelReservation}
                        isCancelling={cancellingId === reservation.confirmationCode}
                        copiedCode={copiedCode}
                        onCopy={copyToClipboard}
                        getStatusColor={getStatusColor}
                        formatDate={formatDate}
                        isPast={true}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface ReservationCardProps {
  reservation: ReservationWithCode;
  onCancel: (code: string) => Promise<void>;
  isCancelling: boolean;
  copiedCode: string | null;
  onCopy: (code: string) => void;
  getStatusColor: (status: string) => string;
  formatDate: (date: string) => string;
  isPast?: boolean;
}

const ReservationCard: React.FC<ReservationCardProps> = ({
  reservation,
  onCancel,
  isCancelling,
  copiedCode,
  onCopy,
  getStatusColor,
  formatDate,
  isPast = false
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 mb-3">
              <h3 className="text-xl font-semibold text-stone-900">{reservation.name}</h3>
              <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getStatusColor(reservation.status)}`}>
                {reservation.status}
              </span>
            </div>

            {/* Reservation Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-orange-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-stone-500 uppercase font-semibold">Date</p>
                  <p className="text-sm font-semibold text-stone-900">{formatDate(reservation.date)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock size={16} className="text-orange-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-stone-500 uppercase font-semibold">Time</p>
                  <p className="text-sm font-semibold text-stone-900">{reservation.time}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Users size={16} className="text-orange-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-stone-500 uppercase font-semibold">Guests</p>
                  <p className="text-sm font-semibold text-stone-900">{reservation.guests}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Phone size={16} className="text-orange-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-stone-500 uppercase font-semibold">Phone</p>
                  <p className="text-sm font-semibold text-stone-900">{reservation.phone}</p>
                </div>
              </div>

              {reservation.tableNumber && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-stone-500 uppercase font-semibold">Table</p>
                    <p className="text-sm font-semibold text-stone-900">#{reservation.tableNumber}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div className="flex items-center gap-2 text-sm text-stone-600 mb-4">
              <Mail size={14} className="flex-shrink-0" />
              {reservation.email}
            </div>

            {/* Special Notes */}
            {reservation.notes && (
              <div className="bg-stone-50 rounded-lg p-3 text-sm text-stone-700 border-l-4 border-orange-400">
                <p className="font-semibold mb-1">Special Requests:</p>
                {reservation.notes}
              </div>
            )}
          </div>

          {/* Confirmation Code Section */}
          <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4 min-w-64">
            <p className="text-xs text-stone-600 font-bold uppercase mb-2">Confirmation Code</p>
            <div className="bg-white rounded-lg p-2.5 mb-3 font-mono font-bold text-orange-600 text-center text-sm break-all">
              {reservation.confirmationCode}
            </div>
            <button
              onClick={() => onCopy(reservation.confirmationCode)}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-xs font-semibold ${
                copiedCode === reservation.confirmationCode
                  ? 'bg-green-600 text-white'
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              }`}
            >
              {copiedCode === reservation.confirmationCode ? (
                <>
                  <Check size={14} /> Copied
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy Code
                </>
              )}
            </button>
            <p className="text-xs text-stone-500 mt-2 text-center">Use for modifications and cancellations</p>
          </div>
        </div>

        {/* Cancel Button */}
        {!isPast && reservation.status !== 'Cancelled' && reservation.status !== 'Completed' && (
          <div className="pt-4 border-t border-stone-200">
            <button
              onClick={() => onCancel(reservation.confirmationCode)}
              disabled={isCancelling}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCancelling ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Cancel Reservation
                </>
              )}
            </button>
            <p className="text-xs text-stone-500 text-center mt-2">Cancel at least 2 hours before your reservation</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReservationsPage;

import React, { useState, useEffect } from 'react';
import { CheckCircle, Phone, Clock, MapPin, Calendar, Users, User as UserIcon } from 'lucide-react';
import { User, ReservationData } from '../types';
import { createReservation } from '../services/api';

interface ReservationPageProps {
  user: User | null;
}

const ReservationPage: React.FC<ReservationPageProps> = ({ user }) => {
  const [formData, setFormData] = useState<ReservationData>({
    name: '', email: '', phone: '', date: '', time: '', guests: 2, notes: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, name: user.name, email: user.email, phone: user.phone }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      await createReservation(formData);
      setStatus('success');
      setFormData({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', date: '', time: '', guests: 2, notes: '' });
    } catch (err) {
      setStatus('idle');
      alert('Reservation failed. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-orange-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-stone-900 via-orange-900 to-stone-900 text-white pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Book Your Table</h1>
          <p className="text-orange-100 text-lg max-w-2xl mx-auto">
            Reserve your seat at Savoria Bistro and enjoy an unforgettable culinary experience in an elegant ambiance.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Info Side */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-serif font-bold text-stone-900 mb-6 flex items-center gap-2">
                <Calendar className="text-orange-500" size={28} />
                Reservation Details
              </h2>
              <p className="text-stone-600 mb-8 leading-relaxed">
                Reservations are recommended, especially on weekends and special occasions. We hold tables for 15 minutes past your reservation time.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-stone-50 rounded-xl hover:bg-orange-50 transition-colors">
                  <Phone className="text-orange-500 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-semibold text-stone-900">Call Us</p>
                    <p className="text-stone-600 text-sm">(555) 123-4567</p>
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
                    <p className="text-stone-600 text-sm">123 Culinary Ave, New York</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-stone-200">
                <p className="text-sm text-stone-500 font-semibold mb-2">📢 Note:</p>
                <p className="text-sm text-stone-600">For groups larger than 10, please call us directly to arrange the perfect dining experience.</p>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {status === 'success' ? (
              <div className="h-full min-h-96 flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-50 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <CheckCircle size={40} />
                </div>
                <h3 className="text-3xl font-serif font-bold text-stone-900 mb-3">Reservation Confirmed!</h3>
                <p className="text-stone-600 mb-2">We look forward to welcoming you at Savoria Bistro.</p>
                <p className="text-stone-500 text-sm mb-8">A confirmation email has been sent to your inbox with all the details.</p>
                <button 
                  onClick={() => setStatus('idle')}
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-600 mb-2">Date</label>
                    <div className="relative">
                       <Calendar className="absolute left-3 top-3.5 text-orange-500" size={18} />
                       <input required type="date" name="date" value={formData.date} onChange={handleChange} className="w-full pl-11 pr-3 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm hover:border-stone-300 transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-600 mb-2">Time</label>
                    <div className="relative">
                       <Clock className="absolute left-3 top-3.5 text-orange-500" size={18} />
                       <input required type="time" name="time" value={formData.time} onChange={handleChange} className="w-full pl-11 pr-3 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm hover:border-stone-300 transition-colors" />
                    </div>
                  </div>
                </div>

                <div>
                   <label className="block text-xs font-bold uppercase text-stone-600 mb-2">Number of Guests</label>
                   <div className="relative">
                       <Users className="absolute left-3 top-3.5 text-orange-500" size={18} />
                       <select name="guests" value={formData.guests} onChange={handleChange} className="w-full pl-11 pr-3 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm bg-white hover:border-stone-300 transition-colors">
                         {[1,2,3,4,5,6,7,8,9,10].map(num => <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>)}
                       </select>
                   </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-2">Full Name</label>
                  <input required type="text" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" className="w-full px-3 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm hover:border-stone-300 transition-colors" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-600 mb-2">Email Address</label>
                    <input required type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" className="w-full px-3 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm hover:border-stone-300 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-600 mb-2">Phone Number</label>
                    <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="(555) 000-0000" className="w-full px-3 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm hover:border-stone-300 transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-2">Special Requests</label>
                  <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} placeholder="Allergies, high chair needed, celebrating an occasion..." className="w-full px-3 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm resize-none hover:border-stone-300 transition-colors"></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={status === 'submitting'}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 shadow-lg hover:shadow-orange-200/50 mt-6"
                >
                  {status === 'submitting' ? 'Confirming...' : 'Confirm Reservation'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationPage;
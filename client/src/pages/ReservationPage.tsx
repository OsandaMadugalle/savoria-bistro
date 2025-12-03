import React, { useState, useEffect } from 'react';
import { CheckCircle, Phone, Clock, MapPin, Calendar, Users, User as UserIcon } from 'lucide-react';
import { User, ReservationData } from '../types';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    // Simulate backend call
    setTimeout(() => {
      setStatus('success');
      setFormData({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', date: '', time: '', guests: 2, notes: '' });
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="pt-24 pb-20 min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden grid md:grid-cols-5">
          {/* Info Side */}
          <div className="md:col-span-2 bg-stone-900 p-8 text-white flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-serif font-bold mb-6">Book a Table</h2>
              <p className="text-stone-400 mb-8 text-sm leading-relaxed">
                Reservations are recommended, especially on weekends. We hold tables for 15 minutes past the reservation time.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="text-orange-500" size={18} />
                  <span>(555) 123-4567</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="text-orange-500" size={18} />
                  <span>Daily 11 AM - 10 PM</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="text-orange-500" size={18} />
                  <span>123 Culinary Ave, NY</span>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-stone-800">
              <p className="text-xs text-stone-500">For groups larger than 10, please call us directly.</p>
            </div>
          </div>

          {/* Form Side */}
          <div className="md:col-span-3 p-8">
            {status === 'success' ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-in fade-in">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-2xl font-bold text-stone-900 mb-2">Reservation Confirmed!</h3>
                <p className="text-stone-600 mb-6">We look forward to welcoming you. A confirmation email has been sent.</p>
                <button 
                  onClick={() => setStatus('idle')}
                  className="text-orange-600 font-semibold hover:underline"
                >
                  Make another booking
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {user && (
                   <div className="bg-orange-50 border border-orange-100 p-3 rounded-lg text-sm text-orange-800 flex items-center gap-2 mb-2">
                      <UserIcon size={16} /> 
                      Logged in as <span className="font-bold">{user.name}</span>. Details pre-filled.
                   </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Date</label>
                    <div className="relative">
                       <Calendar className="absolute left-3 top-2.5 text-stone-400" size={16} />
                       <input required type="date" name="date" value={formData.date} onChange={handleChange} className="w-full pl-10 pr-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Time</label>
                    <div className="relative">
                       <Clock className="absolute left-3 top-2.5 text-stone-400" size={16} />
                       <input required type="time" name="time" value={formData.time} onChange={handleChange} className="w-full pl-10 pr-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm" />
                    </div>
                  </div>
                </div>

                <div>
                   <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Guests</label>
                   <div className="relative">
                       <Users className="absolute left-3 top-2.5 text-stone-400" size={16} />
                       <select name="guests" value={formData.guests} onChange={handleChange} className="w-full pl-10 pr-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm bg-white">
                         {[1,2,3,4,5,6,7,8,9,10].map(num => <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>)}
                       </select>
                   </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Name</label>
                  <input required type="text" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Email</label>
                    <input required type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Phone</label>
                    <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="(555) 000-0000" className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Special Requests</label>
                  <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} placeholder="Allergies, high chair needed, anniversary..." className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm resize-none"></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={status === 'submitting'}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 mt-4"
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
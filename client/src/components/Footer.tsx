import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Phone, MapPin, Instagram, Facebook, Twitter, Mail } from 'lucide-react';
import { subscribeNewsletter } from '../services/api';

// Toast notification helper
export const showToast = (message: string, type: 'success' | 'error') => {
  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white font-semibold z-50 animate-fade-in ${
    type === 'success' ? 'bg-green-600' : 'bg-red-600'
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
};

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      await subscribeNewsletter(email);
      showToast('Thank you for subscribing!', 'success');
      setEmail('');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to subscribe', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-gradient-to-b from-stone-900 to-stone-950 text-stone-300">
      {/* Newsletter Section */}
      <div className="bg-orange-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-serif font-bold mb-1">Subscribe to Our Newsletter</h3>
            <p className="text-orange-100 text-sm">Get exclusive offers and culinary tips delivered to your inbox</p>
          </div>
          <form className="flex gap-2 w-full md:w-auto" onSubmit={handleNewsletterSubmit}>
            <input 
              type="email" 
              placeholder="Enter your email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-2 rounded-lg text-stone-900 flex-1 md:flex-none w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-white"
              required
              disabled={isSubmitting}
            />
            <button 
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-700 text-white rounded-lg font-bold transition-colors"
            >
              {isSubmitting ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-white text-2xl font-serif font-bold mb-4">Savoria.</h3>
            <p className="text-sm leading-relaxed text-stone-400 mb-4">
              Experience the finest flavors in a warm, inviting atmosphere. Where tradition meets modern culinary art.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="bg-stone-800 hover:bg-orange-600 text-stone-300 hover:text-white p-2 rounded-lg transition-all"><Instagram size={18} /></a>
              <a href="#" className="bg-stone-800 hover:bg-orange-600 text-stone-300 hover:text-white p-2 rounded-lg transition-all"><Facebook size={18} /></a>
              <a href="#" className="bg-stone-800 hover:bg-orange-600 text-stone-300 hover:text-white p-2 rounded-lg transition-all"><Twitter size={18} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><NavLink to="/" className="text-stone-400 hover:text-orange-600 transition-colors">Home</NavLink></li>
              <li><NavLink to="/menu" className="text-stone-400 hover:text-orange-600 transition-colors">Menu</NavLink></li>
              <li><NavLink to="/gallery" className="text-stone-400 hover:text-orange-600 transition-colors">Gallery</NavLink></li>
              <li><NavLink to="/reviews" className="text-stone-400 hover:text-orange-600 transition-colors">Reviews</NavLink></li>
              <li><NavLink to="/reservation" className="text-stone-400 hover:text-orange-600 transition-colors">Reservations</NavLink></li>
              <li><NavLink to="/contact" className="text-stone-400 hover:text-orange-600 transition-colors">Contact</NavLink></li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Contact Info</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 text-orange-600 flex-shrink-0" />
                <span className="text-stone-400">123 Galle Road,<br />Colombo 03, Sri Lanka</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-orange-600" />
                <a href="tel:+94112345678" className="text-stone-400 hover:text-orange-600 transition-colors">+94 11 234 5678</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-orange-600" />
                <a href="mailto:info@savoriabistro.com" className="text-stone-400 hover:text-orange-600 transition-colors">info@savoriabistro.com</a>
              </li>
            </ul>
          </div>

          {/* Hours Section */}
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Hours</h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li className="flex justify-between gap-4">
                <span>Mon - Thu</span>
                <span className="text-orange-600">11 AM - 10 PM</span>
              </li>
              <li className="flex justify-between gap-4">
                <span>Fri - Sat</span>
                <span className="text-orange-600">11 AM - 11 PM</span>
              </li>
              <li className="flex justify-between gap-4">
                <span>Sunday</span>
                <span className="text-orange-600">10 AM - 9:30 PM</span>
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-stone-700">
              <p className="text-xs text-stone-500 flex items-center gap-1 mb-2">🟢 Currently Open</p>
              <p className="text-xs text-stone-400">Come visit us today!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-stone-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-stone-500">
          <span>&copy; {new Date().getFullYear()} Savoria Bistro. All rights reserved. | Crafted with ❤️</span>
          <div className="flex gap-4">
            <NavLink to="/privacy-policy" className="hover:text-orange-600 transition-colors">Privacy Policy</NavLink>
            <NavLink to="/terms-of-service" className="hover:text-orange-600 transition-colors">Terms of Service</NavLink>
          </div>
        </div>
      </div>
    </footer>
  );
};

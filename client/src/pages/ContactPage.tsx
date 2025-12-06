import React, { useState } from 'react';
import { Phone, Mail, MapPin, Calendar, CheckCircle } from 'lucide-react';
import { submitPrivateEventInquiry } from '../services/api';

const ContactPage: React.FC = () => {
  const initialFormState = {
    name: '',
    email: '',
    phone: '',
    eventType: 'wedding',
    guestCount: '',
    eventDate: '',
    message: ''
  };
  const [formData, setFormData] = useState(initialFormState);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      await submitPrivateEventInquiry({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        eventType: formData.eventType,
        guestCount: formData.guestCount ? Number(formData.guestCount) : undefined,
        eventDate: formData.eventDate || undefined,
        message: formData.message
      });
      setSubmitted(true);
      setFormData(initialFormState);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err: any) {
      setFormError(err.message || 'We could not submit your inquiry right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-24 pb-20 min-h-screen bg-gradient-to-b from-stone-50 to-orange-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-stone-900 via-orange-900 to-stone-900 text-white pt-16 pb-16 px-4 mb-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Get in Touch</h1>
          <p className="text-orange-100 text-lg">Contact us for reservations, private events, or any inquiries</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-serif font-bold text-stone-900 mb-6">Contact Information</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <MapPin className="text-orange-600 mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h4 className="font-bold text-stone-900 mb-1">Location</h4>
                    <p className="text-stone-600">123 Culinary Avenue</p>
                    <p className="text-stone-600">Food District, NY 10012</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Phone className="text-orange-600 mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h4 className="font-bold text-stone-900 mb-1">Phone</h4>
                    <p className="text-stone-600">(555) 123-4567</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Mail className="text-orange-600 mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h4 className="font-bold text-stone-900 mb-1">Email</h4>
                    <p className="text-stone-600">hello@savoria.com</p>
                    <p className="text-stone-600">events@savoria.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Calendar className="text-orange-600 mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h4 className="font-bold text-stone-900 mb-1">Opening Hours</h4>
                    <p className="text-stone-600 text-sm">Mon-Thu: 11am - 10pm</p>
                    <p className="text-stone-600 text-sm">Fri-Sat: 11am - 11pm</p>
                    <p className="text-stone-600 text-sm">Sun: 10am - 9:30pm</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="h-64 bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center">
                <MapPin size={48} className="text-stone-400" />
              </div>
            </div>
          </div>

          {/* Event Inquiry Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-serif font-bold text-stone-900 mb-6">Private Events Inquiry</h2>
            
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-stone-900 mb-2">Thank You!</h3>
                <p className="text-stone-600">We've received your inquiry and will be in touch soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {formError && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                    {formError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-bold text-stone-600 mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    placeholder="Your name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-stone-600 mb-2">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-600 mb-2">Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                      placeholder="(555) 000-0000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-stone-600 mb-2">Event Type *</label>
                    <select
                      name="eventType"
                      value={formData.eventType}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white"
                    >
                      <option value="wedding">Wedding</option>
                      <option value="birthday">Birthday Party</option>
                      <option value="corporate">Corporate Event</option>
                      <option value="anniversary">Anniversary</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-600 mb-2">Guest Count *</label>
                    <input
                      type="number"
                      name="guestCount"
                      value={formData.guestCount}
                      onChange={handleChange}
                      required
                      min="10"
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                      placeholder="e.g., 50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-600 mb-2">Preferred Date *</label>
                  <input
                    type="date"
                    name="eventDate"
                    value={formData.eventDate}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-600 mb-2">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none"
                    placeholder="Tell us about your event, dietary preferences, theme ideas, etc."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending…' : 'Submit Inquiry'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
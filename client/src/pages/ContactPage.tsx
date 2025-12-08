import React, { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, Calendar, CheckCircle, User as UserIcon } from 'lucide-react';
import { submitPrivateEventInquiry } from '../services/api';
import { User } from '../types';

interface ContactPageProps {
  user: User | null;
}

const buildInitialFormState = (user: User | null) => ({
  name: user?.name || '',
  email: user?.email || '',
  phone: user?.phone || '',
  eventType: 'wedding',
  guestCount: '',
  eventDate: '',
  message: ''
});

const ContactPage: React.FC<ContactPageProps> = ({ user }) => {
  const [formData, setFormData] = useState(buildInitialFormState(user));
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    eventDate?: string;
    guestCount?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const todayDateString = new Date().toISOString().split('T')[0];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Enforce name: letters, spaces, apostrophes, hyphens only
    if (name === 'name') {
      const filtered = value.replace(/[^a-zA-ZÀ-ž'\-\s]/g, '');
      setFormData({ ...formData, [name]: filtered });
      return;
    }
    
    // Enforce phone: digits and + only
    if (name === 'phone') {
      const filtered = value.replace(/[^0-9+]/g, '');
      setFormData({ ...formData, [name]: filtered });
      return;
    }
    
    // Enforce guestCount: digits only
    if (name === 'guestCount') {
      const filtered = value.replace(/[^0-9]/g, '');
      setFormData({ ...formData, [name]: filtered });
      return;
    }
    
    setFormData({ ...formData, [name]: value });
  };

  useEffect(() => {
    setFormData(buildInitialFormState(user));
  }, [user]);

  const validateForm = () => {
    const errors: typeof fieldErrors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Full name is required.';
    } else {
      const nameRegex = /^[a-zA-ZÀ-ž'\-\s]+$/;
      if (!nameRegex.test(formData.name.trim())) {
        errors.name = 'Name should contain only letters, spaces, apostrophes, or hyphens.';
      }
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address.';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required.';
    } else {
      const normalizedPhone = formData.phone.replace(/[^0-9+]/g, '');
      if (!/^[+]?[0-9]{8,15}$/.test(normalizedPhone)) {
        errors.phone = 'Phone number must contain 8–15 digits.';
      }
    }
    
    if (!formData.eventDate) {
      errors.eventDate = 'Preferred event date is required.';
    } else {
      const selectedDate = new Date(formData.eventDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        errors.eventDate = 'Please choose a future date for the event.';
      }
    }
    
    if (!formData.guestCount) {
      errors.guestCount = 'Guest count is required.';
    } else {
      const guestCountNumber = Number(formData.guestCount);
      if (Number.isNaN(guestCountNumber) || guestCountNumber < 10) {
        errors.guestCount = 'Guest count should be at least 10 guests.';
      }
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (validationErrors) {
      setFieldErrors(validationErrors);
      setFormError('');
      return;
    }
    setFieldErrors({});
    setFormError('');
    setIsSubmitting(true);
    try {
      await submitPrivateEventInquiry({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        eventType: formData.eventType as 'wedding' | 'birthday' | 'corporate' | 'anniversary' | 'other',
        guestCount: formData.guestCount ? Number(formData.guestCount) : undefined,
        eventDate: formData.eventDate || undefined,
        message: formData.message
      });
      setSubmitted(true);
      setFormData(buildInitialFormState(user));
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

            {/* Location Map with Locations Info */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col">
              <iframe
                title="Savoria Bistro Locations"
                className="w-full h-64"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024.2219901290355!2d-74.00601!3d40.71455!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25a2aabe4f6d7%3A0x1c9e8b8b8b8b8b8b!2s123%20Culinary%20Avenue%2C%20New%20York%2C%20NY%2010012!5e0!3m2!1sen!2sus!4v1639846800000!5m2!1sen!2sus"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              
              {/* Multiple Locations Info - Inside Map Card */}
              <div className="p-4 border-t border-stone-100 bg-gradient-to-br from-orange-50 to-stone-50">
                <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
                  <MapPin size={16} className="text-orange-600" />
                  Our Locations
                </h3>
                <div className="space-y-2">
                  <div className="text-xs">
                    <p className="font-semibold text-stone-900">Main Branch</p>
                    <p className="text-stone-600">123 Culinary Avenue, Food District, NY 10012</p>
                    <p className="text-orange-600 font-bold mt-0.5">📞 (555) 123-4567</p>
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-stone-900">Downtown Branch</p>
                    <p className="text-stone-600">456 Gourmet Street, Downtown, NY 10001</p>
                    <p className="text-orange-600 font-bold mt-0.5">📞 (555) 987-6543</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Event Inquiry Form */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col h-fit">
            <h2 className="text-xl font-serif font-bold text-stone-900 mb-4">Private Events Inquiry</h2>
            
            {submitted ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-stone-900 mb-2">Thank You!</h3>
                <p className="text-stone-600">We've received your inquiry and will be in touch soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-0">
                {user && (
                   <div className="bg-orange-50 border border-orange-200 p-3 rounded-xl text-xs text-orange-800 flex items-center gap-2 mb-4 shadow-sm">
                      <UserIcon size={16} className="flex-shrink-0" />
                      <span>Your profile information is pre-filled. Update any field before submitting.</span>
                   </div>
                )}
                {formError && (
                  <div className="p-2 bg-red-50 text-red-600 rounded-lg text-xs border border-red-100 mb-4">
                    {formError}
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-xs font-bold text-stone-600 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-orange-500 outline-none transition-all text-sm ${fieldErrors.name ? 'border-red-400 focus:ring-red-500' : 'border-stone-200 focus:ring-orange-500'}`}
                    placeholder="Your name"
                  />
                  {fieldErrors.name && <p className="text-red-600 text-xs mt-1 font-medium">{fieldErrors.name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1.5">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-orange-500 outline-none transition-all text-sm ${fieldErrors.email ? 'border-red-400 focus:ring-red-500' : 'border-stone-200 focus:ring-orange-500'}`}
                      placeholder="your@email.com"
                    />
                    {fieldErrors.email && <p className="text-red-600 text-xs mt-1 font-medium">{fieldErrors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1.5">Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-orange-500 outline-none transition-all text-sm ${fieldErrors.phone ? 'border-red-400 focus:ring-red-500' : 'border-stone-200 focus:ring-orange-500'}`}
                      placeholder="(555) 000-0000"
                    />
                    {fieldErrors.phone && <p className="text-red-600 text-xs mt-1 font-medium">{fieldErrors.phone}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1.5">Event Type *</label>
                    <select
                      name="eventType"
                      value={formData.eventType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white text-sm"
                    >
                      <option value="wedding">Wedding</option>
                      <option value="birthday">Birthday Party</option>
                      <option value="corporate">Corporate Event</option>
                      <option value="anniversary">Anniversary</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1.5">Guest Count *</label>
                    <input
                      type="text"
                      name="guestCount"
                      value={formData.guestCount}
                      onChange={handleChange}
                      onKeyPress={(e) => !/[0-9]/.test(e.key) && e.preventDefault()}
                      required
                      inputMode="numeric"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-orange-500 outline-none transition-all text-sm ${fieldErrors.guestCount ? 'border-red-400 focus:ring-red-500' : 'border-stone-200 focus:ring-orange-500'}`}
                      placeholder="e.g., 50"
                    />
                    {fieldErrors.guestCount && <p className="text-red-600 text-xs mt-1 font-medium">{fieldErrors.guestCount}</p>}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-bold text-stone-600 mb-1.5">Preferred Date *</label>
                    <input
                      type="date"
                      name="eventDate"
                      min={todayDateString}
                      value={formData.eventDate}
                      onChange={handleChange}
                      required
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-orange-500 outline-none transition-all text-sm ${fieldErrors.eventDate ? 'border-red-400 focus:ring-red-500' : 'border-stone-200 focus:ring-orange-500'}`}
                    />
                    {fieldErrors.eventDate && <p className="text-red-600 text-xs mt-1 font-medium">{fieldErrors.eventDate}</p>}
                </div>

                <div className="mb-4 flex-1">
                  <label className="block text-xs font-bold text-stone-600 mb-1.5">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none text-sm"
                    placeholder="Tell us about your event, dietary preferences, theme ideas, etc."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-auto pt-3 w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-2.5 rounded-lg transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed text-sm"
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
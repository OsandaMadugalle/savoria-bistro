import React from 'react';

const ContactPage: React.FC = () => (
  <div className="pt-24 pb-20 min-h-screen bg-stone-50">
     <div className="max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-4xl font-serif font-bold mb-8">Get in Touch</h1>
        <div className="grid md:grid-cols-2 gap-8 text-left">
           <div className="bg-white p-8 rounded-xl shadow-sm">
              <h3 className="font-bold text-xl mb-4">Visit Us</h3>
              <p className="text-stone-600 mb-4">123 Culinary Avenue, Food District, NY 10012</p>
              <div className="h-48 bg-stone-200 rounded-lg flex items-center justify-center text-stone-400">
                 Map Placeholder
              </div>
           </div>
           <div className="bg-white p-8 rounded-xl shadow-sm">
              <h3 className="font-bold text-xl mb-4">Hours & Contact</h3>
              <p className="mb-2"><strong>Phone:</strong> (555) 123-4567</p>
              <p className="mb-6"><strong>Email:</strong> hello@savoria.com</p>
              <h4 className="font-bold mb-2">Opening Hours</h4>
              <p className="text-stone-600 text-sm">Mon-Thu: 11am - 10pm</p>
              <p className="text-stone-600 text-sm">Fri-Sat: 11am - 11pm</p>
              <p className="text-stone-600 text-sm">Sun: 10am - 9:30pm</p>
           </div>
        </div>
     </div>
  </div>
);

export default ContactPage;
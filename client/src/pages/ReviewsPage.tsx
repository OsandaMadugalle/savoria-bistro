import React, { useState } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { REVIEWS } from '../constants';

const ReviewsPage: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const avgRating = REVIEWS.reduce((acc, r) => acc + r.rating, 0) / REVIEWS.length;

  return (
     <div className="pt-24 pb-20 min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-4">Guest Reviews</h1>
          <p className="text-stone-600 max-w-2xl mx-auto">See what our customers are saying about their Savoria experience.</p>
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-200 mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-6">
              <div className="text-center">
                 <span className="text-5xl font-bold text-stone-900 block">{avgRating.toFixed(1)}</span>
                 <div className="flex text-orange-500 justify-center my-2">
                    {[...Array(5)].map((_, i) => (
                       <Star key={i} fill={i < Math.round(avgRating) ? "currentColor" : "none"} size={20} className={i < Math.round(avgRating) ? "" : "text-stone-300"} />
                    ))}
                 </div>
                 <span className="text-xs text-stone-500 uppercase tracking-wide">{REVIEWS.length} Reviews</span>
              </div>
              <div className="h-16 w-px bg-stone-200 hidden md:block"></div>
              <div className="hidden md:block">
                 <p className="text-stone-900 font-medium italic">"An unforgettable culinary journey."</p>
              </div>
           </div>
           <button 
             onClick={() => setIsFormOpen(!isFormOpen)}
             className="bg-stone-900 hover:bg-stone-800 text-white px-6 py-3 rounded-full font-semibold transition-colors flex items-center gap-2"
           >
             <MessageSquare size={18} />
             {isFormOpen ? 'Close Form' : 'Write a Review'}
           </button>
        </div>

        {/* Review Form */}
        {isFormOpen && (
           <div className="bg-stone-100 p-6 rounded-xl mb-12 animate-in slide-in-from-top-4">
              <h3 className="font-bold text-lg mb-4">Share your experience</h3>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsFormOpen(false); alert('Thank you for your review! It has been submitted for moderation.'); }}>
                 <div className="grid grid-cols-2 gap-4">
                    <input required type="text" placeholder="Your Name" className="w-full px-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-orange-500" />
                    <input required type="email" placeholder="Email Address" className="w-full px-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-orange-500" />
                 </div>
                 <div className="flex items-center gap-2 text-stone-600">
                    <span>Rating:</span>
                    <div className="flex text-orange-400 cursor-pointer">
                       {[1,2,3,4,5].map(s => <Star key={s} size={24} className="hover:text-orange-600 transition-colors" />)}
                    </div>
                 </div>
                 <textarea required rows={4} placeholder="Tell us about your visit..." className="w-full px-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-orange-500"></textarea>
                 <div className="flex justify-end">
                    <button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded-lg">Submit Review</button>
                 </div>
              </form>
           </div>
        )}

        {/* Reviews List */}
        <div className="grid gap-6">
           {REVIEWS.map((review) => (
              <div key={review.id} className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
                 <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                          {review.author.charAt(0)}
                       </div>
                       <div>
                          <h4 className="font-bold text-stone-900">{review.author}</h4>
                          <span className="text-xs text-stone-400">{review.date}</span>
                       </div>
                    </div>
                    <div className="flex text-orange-500">
                       {[...Array(5)].map((_, i) => (
                          <Star key={i} fill={i < review.rating ? "currentColor" : "none"} size={16} className={i < review.rating ? "" : "text-stone-300"} />
                       ))}
                    </div>
                 </div>
                 <p className="text-stone-600 leading-relaxed">"{review.text}"</p>
              </div>
           ))}
        </div>
      </div>
     </div>
  );
};

export default ReviewsPage;
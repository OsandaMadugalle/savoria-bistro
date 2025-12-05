import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, AlertCircle } from 'lucide-react';
import { fetchApprovedReviews, submitReview, Review } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';

interface ReviewsPageProps {
  user: User | null;
}

const ReviewsPage: React.FC<ReviewsPageProps> = ({ user }) => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    rating: 5,
    text: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await fetchApprovedReviews();
      setReviews(data);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/');
      return;
    }

    if (!formData.title.trim() || !formData.text.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await submitReview({
        userId: user.id || '',
        userEmail: user.email,
        userName: user.name,
        rating: formData.rating,
        title: formData.title,
        text: formData.text,
        status: 'pending'
      });

      setSuccess('Thank you for your review! It will appear after admin approval.');
      setFormData({ title: '', rating: 5, text: '' });
      setIsFormOpen(false);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

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
              <span className="text-5xl font-bold text-stone-900 block">{avgRating}</span>
              <div className="flex text-orange-500 justify-center my-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} fill={i < Math.round(parseFloat(avgRating)) ? "currentColor" : "none"} size={20} className={i < Math.round(parseFloat(avgRating)) ? "" : "text-stone-300"} />
                ))}
              </div>
              <span className="text-xs text-stone-500 uppercase tracking-wide">{reviews.length} Reviews</span>
            </div>
            <div className="h-16 w-px bg-stone-200 hidden md:block"></div>
            <div className="hidden md:block">
              <p className="text-stone-900 font-medium italic">"An unforgettable culinary journey."</p>
            </div>
          </div>
          <button 
            onClick={() => {
              if (!user) {
                alert('Please sign in to write a review');
                navigate('/');
              } else {
                setIsFormOpen(!isFormOpen);
              }
            }}
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
            {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">{error}</div>}
            {success && <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4">{success}</div>}
            <form className="space-y-4" onSubmit={handleSubmitReview}>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Review Title</label>
                <input 
                  required 
                  type="text" 
                  placeholder="e.g., Amazing food and service!" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-orange-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFormData({...formData, rating})}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        size={32}
                        fill={rating <= formData.rating ? "currentColor" : "none"}
                        className={rating <= formData.rating ? "text-orange-500" : "text-stone-300"}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Your Review</label>
                <textarea 
                  required 
                  rows={4} 
                  placeholder="Tell us about your visit..." 
                  value={formData.text}
                  onChange={(e) => setFormData({...formData, text: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsFormOpen(false)}
                  className="bg-stone-300 hover:bg-stone-400 text-stone-900 font-bold py-2 px-6 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
              <p className="text-xs text-stone-600 mt-2">
                <AlertCircle size={14} className="inline mr-1" />
                Your review will be displayed after admin approval.
              </p>
            </form>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-stone-600">Loading reviews...</p>
          </div>
        )}

        {/* Reviews List */}
        {!loading && reviews.length > 0 ? (
          <div className="grid gap-6">
            {reviews.map((review) => (
              <div key={review._id} className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                      {review.userName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900">{review.userName}</h4>
                      <p className="text-sm font-semibold text-stone-700">{review.title}</p>
                      <span className="text-xs text-stone-400">
                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recently'}
                      </span>
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
        ) : !loading && (
          <div className="text-center py-12 bg-white rounded-xl border border-stone-200">
            <p className="text-stone-600">No reviews yet. Be the first to share your experience!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsPage;
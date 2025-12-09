import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, AlertCircle, Loader2, Calendar, Upload, X } from 'lucide-react';
import { Zap } from 'lucide-react';
import { fetchApprovedReviews, submitReview, Review } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';

interface ReviewsPageProps {
  user: User | null;
  onOpenSignIn?: () => void;
}

const ReviewsPage: React.FC<ReviewsPageProps> = ({ user, onOpenSignIn }) => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    rating: 5,
    text: '',
    image: null as File | null
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await fetchApprovedReviews();
      console.log('Loaded reviews:', data);
      console.log('Reviews with images:', data.filter(r => (r as any).image).length);
      setReviews(data);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFormData({ ...formData, image: e.target.files[0] });
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, image: null });
  };

  const openLightbox = (image: string) => {
    setLightboxImage(image);
    document.body.classList.add('overflow-hidden');
  };

  const closeLightbox = () => {
    setLightboxImage(null);
    document.body.classList.remove('overflow-hidden');
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
      let imageBase64 = '';
      if (formData.image) {
        imageBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve(event.target?.result as string);
          };
          reader.readAsDataURL(formData.image!);
        }) as string;
      }

      const reviewData: any = {
        userId: user.id || '',
        userEmail: user.email,
        userName: user.name,
        rating: formData.rating,
        title: formData.title,
        text: formData.text,
        status: 'pending'
      };

      if (imageBase64) {
        reviewData.image = imageBase64;
        console.log('Review image added, size:', imageBase64.length, 'bytes');
      }

      console.log('Submitting review:', reviewData);
      await submitReview(reviewData);

      setSuccess('Thank you for your review! It will appear after admin approval.');
      setFormData({ title: '', rating: 5, text: '', image: null });
      setIsFormOpen(false);
      
      // Reload reviews
      setTimeout(() => {
        loadReviews();
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  // Get rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length
  }));

  // Filter and sort reviews
  let filteredReviews = selectedRating ? reviews.filter(r => r.rating === selectedRating) : reviews;
  
  if (sortBy === 'highest') {
    filteredReviews = [...filteredReviews].sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'lowest') {
    filteredReviews = [...filteredReviews].sort((a, b) => a.rating - b.rating);
  } else {
    filteredReviews = [...filteredReviews].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-stone-900 via-orange-900 to-stone-800 text-white py-12 sm:py-16 px-4 pt-24 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl" />
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-2000"></div>
        </div>
        <div className="max-w-7xl mx-auto relative z-10 text-center px-2">
          <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
            <Zap size={18} className="text-yellow-300" />
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-orange-200">Guest Stories</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-3 sm:mb-4">Voices of Our Guests</h1>
          <p className="text-orange-100 max-w-2xl mx-auto text-sm sm:text-base md:text-lg">Discover what makes Savoria Bistro special through the experiences and stories of our valued customers.</p>
        </div>
      </div>

      <div className="pt-0 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Summary Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-4 sm:p-6 border border-white/50 mb-6 sm:mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Rating Summary */}
              <div className="flex flex-col items-center justify-center py-4 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-transparent rounded-xl opacity-30"></div>
                <div className="relative z-10 text-center">
                  <span className="text-4xl sm:text-6xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 block mb-2">{avgRating}</span>
                  <div className="flex text-orange-500 mb-2 justify-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} fill={i < Math.round(parseFloat(avgRating)) ? "currentColor" : "none"} size={18} className={i < Math.round(parseFloat(avgRating)) ? "" : "text-stone-200"} />
                    ))}
                  </div>
                  <span className="text-sm text-stone-600 font-semibold">{reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}</span>
                </div>
              </div>

              {/* Rating Breakdown */}
              <div className="space-y-2">
                {ratingDistribution.map(({ rating, count }) => (
                  <div key={rating} className="flex items-center gap-2 sm:gap-3">
                    <button
                      onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
                      className={`flex items-center justify-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg font-semibold text-xs transition-all w-14 sm:w-16 flex-shrink-0 ${
                        selectedRating === rating
                          ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-md'
                          : 'bg-stone-100 text-stone-700 hover:bg-orange-50'
                      }`}
                    >
                      {rating}
                      <span className="text-sm">★</span>
                    </button>
                    <div className="flex-1">
                      <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500" style={{ width: `${reviews.length > 0 ? (count / reviews.length) * 100 : 0}%` }} />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-stone-600 w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Controls: Sort and Write Review */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6 items-center justify-between bg-white/90 backdrop-blur-sm rounded-lg p-3 border border-white/50">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-stone-200 bg-white text-stone-700 font-medium text-sm focus:ring-1 focus:ring-orange-500 outline-none cursor-pointer hover:border-orange-400 transition-colors"
            >
              <option value="newest">📅 Newest First</option>
              <option value="highest">⭐ Highest Rated</option>
              <option value="lowest">★ Lowest Rated</option>
            </select>

            <button 
              onClick={() => {
                if (!user) {
                  onOpenSignIn?.();
                } else {
                  setIsFormOpen(!isFormOpen);
                }
              }}
              className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 shadow-md"
            >
              <MessageSquare size={16} />
              {isFormOpen ? 'Close' : 'Write Review'}
            </button>
          </div>

        {/* Review Form */}
        {isFormOpen && (
          <div className="bg-gradient-to-br from-orange-50 to-stone-50 p-5 sm:p-6 rounded-xl mb-8 border border-orange-200 shadow-md animate-in slide-in-from-top-4">
            <h3 className="font-serif font-bold text-xl mb-4 text-stone-900">Share Your Experience</h3>
            {error && (
              <div className="bg-red-100 border border-red-300 text-red-800 p-3 rounded-lg mb-3 flex items-start gap-2 text-sm">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="bg-green-100 border border-green-300 text-green-800 p-3 rounded-lg mb-3 flex items-start gap-2 text-sm">
                <Star size={16} className="mt-0.5 flex-shrink-0" fill="currentColor" />
                <span>{success}</span>
              </div>
            )}
            <form className="space-y-3" onSubmit={handleSubmitReview}>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Review Title</label>
                <input 
                  required 
                  type="text" 
                  placeholder="e.g., Amazing food and service!" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:ring-1 focus:ring-orange-500 text-sm" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFormData({...formData, rating})}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        size={24}
                        fill={rating <= formData.rating ? "currentColor" : "none"}
                        className={rating <= formData.rating ? "text-orange-500" : "text-stone-300"}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Your Review</label>
                <textarea 
                  required 
                  rows={3} 
                  placeholder="Tell us about your visit..." 
                  value={formData.text}
                  onChange={(e) => setFormData({...formData, text: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:ring-1 focus:ring-orange-500 text-sm"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Add Photo (Optional)</label>
                {formData.image ? (
                  <div className="relative inline-block">
                    <img 
                      src={URL.createObjectURL(formData.image)} 
                      alt="Preview" 
                      className="max-w-xs h-32 object-cover rounded-lg border-2 border-orange-300"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-stone-300 rounded-lg cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors">
                    <Upload size={20} className="text-stone-400" />
                    <span className="text-sm text-stone-600">Click to upload a photo</span>
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
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
          <div className="flex justify-center items-center py-20">
            <Loader2 size={40} className="animate-spin text-orange-600" />
          </div>
        )}

        {/* Reviews List */}
        {!loading && filteredReviews.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mb-12">
            {filteredReviews.map((review) => (
              <div key={review._id} className="bg-white rounded-2xl shadow-sm border-2 border-stone-100 overflow-hidden hover:shadow-2xl hover:border-orange-400 transition-all cursor-pointer group transform hover:scale-105 flex flex-col">
                {/* Review Image (if exists) */}
                {(review as any).image && (
                  <div className="relative overflow-hidden h-40 bg-gradient-to-br from-stone-300 to-stone-200">
                    <img 
                      src={(review as any).image} 
                      alt="Review" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onClick={() => openLightbox((review as any).image)}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                )}
                
                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  {/* Header with avatar and rating */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                      {review.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-stone-900 text-sm group-hover:text-orange-600 transition-colors truncate">{review.userName}</h4>
                      <div className="flex items-center gap-1 text-xs text-stone-500">
                        <Calendar size={12} />
                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                      </div>
                    </div>
                    <div className="flex text-orange-500 flex-shrink-0">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} fill={i < review.rating ? "currentColor" : "none"} size={14} className={i < review.rating ? "" : "text-stone-200"} />
                      ))}
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 className="font-serif font-bold text-base text-stone-900 mb-2 line-clamp-1">{review.title}</h3>
                  
                  {/* Review text */}
                  <p className="text-sm text-stone-600 leading-relaxed line-clamp-3 italic">"{review.text}"</p>
                  
                  {/* Spacer */}
                  <div className="flex-1" />
                  
                  {/* Footer */}
                  <div className="flex justify-end items-center pt-3 mt-3 border-t border-stone-100">
                    <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-600 font-semibold text-xs rounded-lg group-hover:bg-orange-100 transition-colors">
                      {review.rating}/5 Rating
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !loading && (
          <div className="text-center py-16 bg-stone-50 rounded-xl border border-dashed border-stone-300">
            <div className="inline-block p-4 bg-stone-100 rounded-full mb-4">
              <MessageSquare size={40} className="text-stone-400" />
            </div>
            <p className="text-stone-700 font-bold text-lg mb-2">{selectedRating ? 'No reviews with that rating' : 'No reviews yet'}</p>
            <p className="text-stone-600 text-sm mb-4">Be the first to share your dining experience with us!</p>
            <button 
              onClick={() => {
                if (!user) {
                  onOpenSignIn?.();
                } else {
                  setIsFormOpen(true);
                }
              }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-8 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
            >
              <MessageSquare size={18} />
              Write the First Review
            </button>
          </div>
        )}
        </div>

        {/* Image Lightbox */}
        {lightboxImage && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={closeLightbox}
          >
            <div 
              className="relative max-w-4xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeLightbox}
                className="absolute -top-10 right-0 text-white hover:text-orange-400 transition-colors"
              >
                <X size={32} />
              </button>
              <img 
                src={lightboxImage} 
                alt="Review fullscreen" 
                className="max-w-4xl max-h-[85vh] object-contain rounded-lg"
              />
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default ReviewsPage;
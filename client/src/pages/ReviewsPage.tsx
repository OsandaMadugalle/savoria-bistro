import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, AlertCircle, Loader2, Calendar, Upload, X } from 'lucide-react';
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
  const [userReviews, setUserReviews] = useState<Review[]>([]);

  useEffect(() => {
    loadReviews();
    if (user?.email) {
      loadUserReviews();
    }
  }, [user]);

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

  const loadUserReviews = async () => {
    if (!user?.email) return;
    try {
      const response = await fetch(`http://localhost:5000/api/reviews/user/${encodeURIComponent(user.email)}`);
      if (response.ok) {
        const data = await response.json();
        setUserReviews(data);
      }
    } catch (err) {
      console.error('Failed to load user reviews:', err);
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
      
      // Reload reviews and user reviews
      setTimeout(() => {
        loadReviews();
        loadUserReviews();
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
      <div className="bg-gradient-to-br from-stone-900 via-orange-900 to-stone-800 text-white py-16 px-4 pt-24 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl" />
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Guest Reviews</h1>
          <p className="text-orange-100 max-w-2xl mx-auto text-lg">See what our customers are saying about their Savoria experience.</p>
        </div>
      </div>

      <div className="pt-12 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          {/* Summary Card */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-200 mb-12">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Rating Summary */}
              <div className="flex flex-col items-center justify-center">
                <span className="text-6xl font-bold text-stone-900 block mb-2">{avgRating}</span>
                <div className="flex text-orange-500 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} fill={i < Math.round(parseFloat(avgRating)) ? "currentColor" : "none"} size={24} className={i < Math.round(parseFloat(avgRating)) ? "" : "text-stone-300"} />
                  ))}
                </div>
                <span className="text-sm text-stone-600 font-medium">{reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}</span>
              </div>

              {/* Rating Breakdown */}
              <div className="space-y-3">
                {ratingDistribution.map(({ rating, count }) => (
                  <div key={rating} className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all ${
                        selectedRating === rating
                          ? 'bg-orange-600 text-white'
                          : 'bg-stone-100 text-stone-700 hover:bg-orange-50'
                      }`}
                    >
                      <span className="text-sm font-semibold">{rating}★</span>
                      <span className="text-xs">{count}</span>
                    </button>
                    <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500" style={{ width: `${reviews.length > 0 ? (count / reviews.length) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Controls: Sort and Write Review */}
          <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 rounded-full border border-stone-200 bg-white text-stone-700 font-semibold shadow-sm focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="highest">Sort: Highest Rated</option>
              <option value="lowest">Sort: Lowest Rated</option>
            </select>

            <button 
              onClick={() => {
                if (!user) {
                  onOpenSignIn?.();
                } else {
                  setIsFormOpen(!isFormOpen);
                }
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-full font-semibold transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg"
            >
              <MessageSquare size={18} />
              {isFormOpen ? 'Close Form' : 'Write a Review'}
            </button>
          </div>

        {/* Review Form */}
        {isFormOpen && (
          <div className="bg-gradient-to-br from-orange-50 to-stone-50 p-8 rounded-2xl mb-12 border border-orange-200 shadow-lg animate-in slide-in-from-top-4">
            <h3 className="font-serif font-bold text-2xl mb-6 text-stone-900">Share Your Experience</h3>
            {error && (
              <div className="bg-red-100 border border-red-300 text-red-800 p-4 rounded-lg mb-4 flex items-start gap-3">
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="bg-green-100 border border-green-300 text-green-800 p-4 rounded-lg mb-4 flex items-start gap-3">
                <Star size={18} className="mt-0.5 flex-shrink-0" fill="currentColor" />
                <span>{success}</span>
              </div>
            )}
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

        {/* User's Reviews Section */}
        {user && userReviews.length > 0 && !loading && (
          <div className="mb-12 bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
            <h2 className="text-2xl font-serif font-bold text-stone-900 mb-4">Your Reviews</h2>
            <div className="space-y-4">
              {userReviews.map((review) => (
                <div key={review._id} className="bg-white p-4 rounded-xl border border-blue-100">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-stone-900">{review.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex text-orange-500">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} fill={i < review.rating ? "currentColor" : "none"} size={14} className={i < review.rating ? "" : "text-stone-300"} />
                          ))}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          review.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {review.status === 'approved' ? 'Approved' : 'Pending Review'}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-stone-500">
                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recently'}
                    </span>
                  </div>
                  <p className="text-sm text-stone-700">"{review.text}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews List */}
        {!loading && filteredReviews.length > 0 ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {filteredReviews.map((review) => (
              <div key={review._id} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 hover:shadow-lg hover:border-orange-200 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {review.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-stone-900 text-lg">{review.userName}</h4>
                      <p className="text-sm font-semibold text-stone-700 mb-1">{review.title}</p>
                      <div className="flex items-center gap-2 text-xs text-stone-500">
                        <Calendar size={14} />
                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recently'}
                      </div>
                    </div>
                  </div>
                  <div className="flex text-orange-500 flex-shrink-0">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} fill={i < review.rating ? "currentColor" : "none"} size={18} className={i < review.rating ? "" : "text-stone-300"} />
                    ))}
                  </div>
                </div>
                <p className="text-stone-700 leading-relaxed text-base">"{review.text}"</p>
                {(review as any).image && (
                  <div className="mt-4">
                    <img 
                      src={(review as any).image} 
                      alt="Review" 
                      className="max-w-xs h-48 object-cover rounded-lg border border-stone-200 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openLightbox((review as any).image)}
                      onError={(e) => {
                        console.error('Image failed to load:', (review as any).image);
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log('Image loaded successfully for review:', review._id);
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : !loading && (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-stone-200">
            <MessageSquare size={48} className="text-stone-300 mx-auto mb-4" />
            <p className="text-stone-600 font-medium text-lg">{selectedRating ? 'No reviews with that rating' : 'No reviews yet'}</p>
            <p className="text-stone-500">Be the first to share your experience!</p>
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
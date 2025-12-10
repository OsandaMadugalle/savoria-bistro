import React, { useState } from 'react';
import { Star, Send, Loader2 } from 'lucide-react';
import { Order, User } from '../types';
import { submitOrderFeedback } from '../services/api';

interface FeedbackFormProps {
  order: Order;
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ order, user, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [overallRating, setOverallRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [comment, setComment] = useState('');
  const [improvementSuggestions, setImprovementSuggestions] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [itemRatings, setItemRatings] = useState<{ [key: string]: number }>({});
  const [itemComments, setItemComments] = useState<{ [key: string]: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (overallRating === 0) {
      alert('Please provide an overall rating');
      return;
    }

    setLoading(true);
    try {
      const feedbackData = {
        orderId: order.orderId,
        userId: user?._id || user?.id,
        overallRating,
        items: order.items.map(item => ({
          itemId: (item as any).itemId || `item-${order.items.indexOf(item)}`,
          itemName: item.name,
          quantity: item.quantity,
          itemRating: itemRatings[item.name] || undefined,
          comment: itemComments[item.name] || undefined
        })),
        serviceRating: serviceRating || undefined,
        deliveryRating: deliveryRating || undefined,
        comment,
        wouldRecommend,
        improvementSuggestions
      };

      await submitOrderFeedback(feedbackData);
      alert('Thank you for your feedback!');
      onSuccess();
      onClose();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : 'Failed to submit feedback'
      );
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({
    rating,
    hoverRating,
    onHover,
    onLeave,
    onRate
  }: {
    rating: number;
    hoverRating: number;
    onHover: (value: number) => void;
    onLeave: () => void;
    onRate: (value: number) => void;
  }) => {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => onHover(star)}
            onMouseLeave={onLeave}
            onClick={() => onRate(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              size={28}
              className={`${
                star <= (hoverRating || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Order Feedback</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Order #{order.orderId}</h3>
            <div className="text-sm text-gray-600">
              {order.items.map((item, idx) => (
                <div key={idx}>
                  {item.name} x{item.quantity} - Rs {(item.price || 0).toFixed(2)}
                </div>
              ))}
            </div>
            <div className="mt-2 font-semibold text-gray-900">
              Total: Rs {order.total.toFixed(2)}
            </div>
          </div>

          {/* Overall Rating */}
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              Overall Experience *
            </label>
            <StarRating
              rating={overallRating}
              hoverRating={hoverRating}
              onHover={setHoverRating}
              onLeave={() => setHoverRating(0)}
              onRate={setOverallRating}
            />
          </div>

          {/* Item Ratings */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Rate Each Item</h3>
            <div className="space-y-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mb-3">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setItemRatings(prev => ({
                            ...prev,
                            [item.name]: prev[item.name] === star ? 0 : star
                          }))
                        }
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          size={24}
                          className={`${
                            star <= (itemRatings[item.name] || 0)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add a comment about this item (optional)"
                    value={itemComments[item.name] || ''}
                    onChange={e =>
                      setItemComments(prev => ({
                        ...prev,
                        [item.name]: e.target.value
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Service & Delivery Ratings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
            <div>
              <label className="block font-semibold text-gray-800 mb-2">
                Service Quality
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setServiceRating(serviceRating === star ? 0 : star)}
                  >
                    <Star
                      size={20}
                      className={`${
                        star <= (serviceRating || 0)
                          ? 'fill-blue-400 text-blue-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block font-semibold text-gray-800 mb-2">
                Delivery Experience
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setDeliveryRating(deliveryRating === star ? 0 : star)}
                  >
                    <Star
                      size={20}
                      className={`${
                        star <= (deliveryRating || 0)
                          ? 'fill-green-400 text-green-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="border-t pt-4">
            <label className="block font-semibold text-gray-800 mb-2">
              Overall Comments
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Share your thoughts about your order experience..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Improvement Suggestions */}
          <div>
            <label className="block font-semibold text-gray-800 mb-2">
              Suggestions for Improvement
            </label>
            <textarea
              value={improvementSuggestions}
              onChange={e => setImprovementSuggestions(e.target.value)}
              placeholder="Tell us what we can improve..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Recommendation */}
          <div className="border-t pt-4 flex items-center gap-3">
            <input
              type="checkbox"
              id="recommend"
              checked={wouldRecommend}
              onChange={e => setWouldRecommend(e.target.checked)}
              className="w-5 h-5 text-orange-500 rounded"
            />
            <label htmlFor="recommend" className="font-semibold text-gray-800">
              I would recommend Savoria Bistro to friends and family
            </label>
          </div>

          {/* Buttons */}
          <div className="border-t pt-4 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Submit Feedback
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackForm;

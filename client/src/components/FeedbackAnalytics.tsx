import React, { useState, useEffect } from 'react';
import { Star, TrendingUp, Users, Heart, AlertCircle, RefreshCw } from 'lucide-react';
import { getFeedbackStats } from '../services/api';

interface FeedbackAnalyticsProps {
  userEmail: string;
  userRole?: string;
}

const FeedbackAnalytics: React.FC<FeedbackAnalyticsProps> = ({ userEmail, userRole }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      setLoading(true);
      // Only fetch if user is admin or masterAdmin
      if (userRole === 'admin' || userRole === 'masterAdmin') {
        const data = await getFeedbackStats(userEmail, userRole);
        setStats(data);
      } else {
        setStats(null);
      }
    } catch (error) {
      console.error('Failed to load feedback statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [userEmail, userRole]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
        No feedback data available yet.
      </div>
    );
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-yellow-600';
    if (rating >= 2.5) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRatingBg = (rating: number) => {
    if (rating >= 4.5) return 'bg-green-100';
    if (rating >= 3.5) return 'bg-yellow-100';
    if (rating >= 2.5) return 'bg-orange-100';
    return 'bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Average Rating */}
        <div className={`${getRatingBg(stats.averageRating)} rounded-lg p-6 border-2 border-current`}>
          <div className="flex items-center gap-3 mb-2">
            <Star className={`${getRatingColor(stats.averageRating)}`} size={24} />
            <span className="text-gray-600 font-semibold">Average Rating</span>
          </div>
          <p className={`text-4xl font-bold ${getRatingColor(stats.averageRating)}`}>
            {stats.averageRating.toFixed(1)}
          </p>
          <p className="text-sm text-gray-600 mt-1">out of 5.0</p>
        </div>

        {/* Total Feedback */}
        <div className="bg-blue-100 rounded-lg p-6 border-2 border-blue-500">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-blue-600" size={24} />
            <span className="text-gray-600 font-semibold">Total Feedback</span>
          </div>
          <p className="text-4xl font-bold text-blue-600">{stats.totalFeedback}</p>
          <p className="text-sm text-gray-600 mt-1">Responses received</p>
        </div>

        {/* Recommendation Rate */}
        <div className="bg-pink-100 rounded-lg p-6 border-2 border-pink-500">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="text-pink-600" size={24} />
            <span className="text-gray-600 font-semibold">Would Recommend</span>
          </div>
          <p className="text-4xl font-bold text-pink-600">{stats.recommendationRate}%</p>
          <p className="text-sm text-gray-600 mt-1">{stats.wouldRecommendCount} customers</p>
        </div>

        {/* Top Rating Count */}
        <div className="bg-green-100 rounded-lg p-6 border-2 border-green-500">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-green-600" size={24} />
            <span className="text-gray-600 font-semibold">Excellent (5★)</span>
          </div>
          <p className="text-4xl font-bold text-green-600">{stats.ratingDistribution['5']}</p>
          <p className="text-sm text-gray-600 mt-1">
            {stats.totalFeedback > 0
              ? `${((stats.ratingDistribution['5'] / stats.totalFeedback) * 100).toFixed(0)}% of feedback`
              : 'No data'}
          </p>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">📊 Rating Distribution</h3>
        <div className="space-y-4">
          {[5, 4, 3, 2, 1].map(rating => {
            const count = stats.ratingDistribution[rating.toString()] || 0;
            const percentage =
              stats.totalFeedback > 0 ? (count / stats.totalFeedback) * 100 : 0;

            return (
              <div key={rating} className="flex items-center gap-4">
                <div className="w-12 text-center">
                  <div className="flex justify-center gap-0.5">
                    {[...Array(rating)].map((_, i) => (
                      <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="bg-gray-200 rounded-full h-8 relative overflow-hidden">
                    <div
                      className={`h-full ${
                        rating >= 4
                          ? 'bg-green-500'
                          : rating >= 3
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      } transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{count}</p>
                  <p className="text-sm text-gray-600">{percentage.toFixed(1)}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Rated Items */}
      {stats.topRatedItems && stats.topRatedItems.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">⭐ Top Rated Items</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.topRatedItems.slice(0, 6).map((item: any) => (
              <div
                key={item.id}
                className="flex items-start justify-between p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">{item.totalRatings} ratings</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end mb-1">
                    <span className="font-bold text-green-600">{item.rating.toFixed(1)}</span>
                    <Star size={16} className="fill-yellow-400 text-yellow-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items Needing Attention */}
      {stats.needsAttention && stats.needsAttention.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="text-red-600" size={24} />
            <h3 className="text-lg font-bold text-red-900">
              Items Needing Attention ({stats.needsAttention.length})
            </h3>
          </div>
          <div className="space-y-3">
            {stats.needsAttention.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">{item.totalRatings} customer ratings</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <span className="font-bold text-red-600 text-lg">
                      {item.rating.toFixed(1)}
                    </span>
                    <Star size={18} className="fill-red-400 text-red-400" />
                  </div>
                  <p className="text-xs text-red-600 font-semibold">Below Average</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-4">
            💡 Consider reviewing recipes, ingredients, or preparation methods for these items.
          </p>
        </div>
      )}

      {/* Refresh Button */}
      <div className="flex justify-center">
        <button
          onClick={loadStats}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold flex items-center gap-2"
        >
          <RefreshCw size={18} />
          Refresh Data
        </button>
      </div>
    </div>
  );
};

export default FeedbackAnalytics;

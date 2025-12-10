import { useState, useEffect } from 'react';
import { getAvailableRiders, assignRiderToOrder, type DeliveryRider } from '../services/deliveryApi';
import { Bike, Clock, Star, MapPin } from 'lucide-react';

interface RiderAssignmentProps {
  orderId: string;
  orderTotal: number;
  onAssigned: () => void;
  onCancel: () => void;
}

export default function RiderAssignment({ orderId, orderTotal, onAssigned, onCancel }: RiderAssignmentProps) {
  const [riders, setRiders] = useState<DeliveryRider[]>([]);
  const [selectedRider, setSelectedRider] = useState<string>('');
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAvailableRiders();
    
    // Set default estimated time (30 minutes from now)
    const defaultTime = new Date();
    defaultTime.setMinutes(defaultTime.getMinutes() + 30);
    setEstimatedTime(defaultTime.toISOString().slice(0, 16));
  }, []);

  const loadAvailableRiders = async () => {
    try {
      const data = await getAvailableRiders();
      setRiders(data);
    } catch (err: any) {
      setError('Failed to load available riders');
      console.error(err);
    }
  };

  const handleAssign = async () => {
    if (!selectedRider) {
      setError('Please select a rider');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await assignRiderToOrder(orderId, selectedRider, estimatedTime);
      onAssigned();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to assign rider');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-orange-600 text-white p-6 rounded-t-xl">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bike className="w-6 h-6" />
            Assign Delivery Rider
          </h2>
          <p className="text-orange-100 mt-1">Order #{orderId}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Estimated Delivery Time */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Estimated Delivery Time
            </label>
            <input
              type="datetime-local"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Available Riders */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-stone-700 mb-3">
              Available Riders ({riders.length})
            </h3>
            
            {riders.length === 0 ? (
              <div className="text-center py-8 text-stone-500">
                <Bike className="w-12 h-12 mx-auto mb-3 text-stone-300" />
                <p className="font-medium">No riders available at the moment</p>
                <p className="text-sm">Please try again later</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {riders.map((rider) => (
                  <div
                    key={rider._id}
                    onClick={() => setSelectedRider(rider._id)}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedRider === rider._id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-stone-200 hover:border-orange-300 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-bold text-stone-900">{rider.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            rider.status === 'Available' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {rider.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm text-stone-600">
                          <div className="flex items-center gap-1">
                            <Bike className="w-4 h-4" />
                            <span>{rider.vehicleType} • {rider.vehicleNumber}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span>{rider.rating.toFixed(1)} Rating</span>
                          </div>
                        </div>
                        
                        <div className="mt-2 text-xs text-stone-500">
                          {rider.completedDeliveries} completed deliveries • Rs {rider.earnings.toLocaleString()} earned
                        </div>
                        
                        {rider.currentLocation && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-stone-500">
                            <MapPin className="w-3 h-3" />
                            Location tracking active
                          </div>
                        )}
                      </div>
                      
                      {selectedRider === rider._id && (
                        <div className="ml-3">
                          <div className="w-6 h-6 rounded-full bg-orange-600 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Details */}
          <div className="bg-stone-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-stone-700 mb-2">Order Details</h4>
            <div className="flex justify-between text-sm">
              <span className="text-stone-600">Total Amount:</span>
              <span className="font-bold text-stone-900">Rs {orderTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-stone-600">Commission (10%):</span>
              <span className="font-medium text-green-600">Rs {Math.floor(orderTotal * 0.1).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-50 px-6 py-4 rounded-b-xl flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 border-2 border-stone-300 text-stone-700 font-bold rounded-lg hover:bg-stone-100 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={loading || !selectedRider || riders.length === 0}
            className="flex-1 px-6 py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Assigning...' : 'Assign Rider'}
          </button>
        </div>
      </div>
    </div>
  );
}

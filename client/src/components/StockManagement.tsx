import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  Package,
  Edit2,
  RefreshCw
} from 'lucide-react';
import { StockAlert } from '../types';
import {
  getActiveStockAlerts,
  getLowStockItems,
  getOutOfStockItems,
  getStockStats,
  updateItemStock,
  acknowledgeStockAlert
} from '../services/api';

interface StockManagementProps {
  userEmail: string;
  userRole: string;
}

interface StockUpdateForm {
  itemId: string;
  itemName: string;
  currentStock: number;
  quantity: number;
  reason: string;
}

const StockManagement: React.FC<StockManagementProps> = ({ userEmail, userRole }) => {
    const [activeTab, setActiveTab] = useState<'alerts' | 'low' | 'out'>('alerts');
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [outOfStockItems, setOutOfStockItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateForm, setUpdateForm] = useState<StockUpdateForm>({
    itemId: '',
    itemName: '',
    currentStock: 0,
    quantity: 0,
    reason: ''
  });
  const [updateError, setUpdateError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updatingAlertId, setUpdatingAlertId] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [alertsData, lowData, outData, statsData] = await Promise.all([
        getActiveStockAlerts(),
        getLowStockItems(),
        getOutOfStockItems(),
        getStockStats()
      ]);

      setAlerts(alertsData);
      setLowStockItems(lowData);
      setOutOfStockItems(outData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ===== VALIDATION FUNCTIONS =====
  const validateStockUpdate = (): boolean => {
    if (!updateForm.quantity || updateForm.quantity === 0) {
      setUpdateError('Quantity is required and must be greater than 0');
      return false;
    }
    if (!updateForm.reason?.trim()) {
      setUpdateError('Reason for stock update is required');
      return false;
    }
    if (updateForm.reason.trim().length < 3) {
      setUpdateError('Reason must be at least 3 characters');
      return false;
    }
    setUpdateError('');
    return true;
  };

  const openUpdateModal = (item: any) => {
    setUpdateForm({
      itemId: item.id,
      itemName: item.name,
      currentStock: item.stock,
      quantity: 0,
      reason: 'Restock'
    });
    setUpdateError('');
    setPermissionError(''); // Clear permission error when opening modal
    setShowUpdateModal(true);
  };

  const closeUpdateModal = () => {
    setShowUpdateModal(false);
    setUpdateForm({
      itemId: '',
      itemName: '',
      currentStock: 0,
      quantity: 0,
      reason: ''
    });
    setUpdateError('');
    setPermissionError(''); // Clear permission error when closing modal
  };

  const handleUpdateStock = async () => {
    const trimmedRole = (userRole || '').trim();
    // Check admin permission by role (trimmed)
    if (trimmedRole !== 'admin' && trimmedRole !== 'masterAdmin') {
      setPermissionError('Admin permission required to restock.');
      return;
    }
    setPermissionError('');
    if (!validateStockUpdate()) {
      return;
    }

    try {
      setUpdating(true);
      await updateItemStock(
        updateForm.itemId,
        updateForm.quantity,
        updateForm.reason,
        userEmail
      );
      closeUpdateModal();
      setPermissionError(''); // Clear permission error after successful update
      loadData(); // Restore real-time update after stock change
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : 'Failed to update stock');
    } finally {
      setUpdating(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      setUpdatingAlertId(alertId);
      await acknowledgeStockAlert(alertId, userEmail);
      loadData();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    } finally {
      setUpdatingAlertId(null);
    }
  };

  const getAlertColor = (type: string) => {
    if (type === 'OUT_OF_STOCK') return 'bg-red-100 border-red-300 text-red-800';
    if (type === 'LOW_STOCK') return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    return 'bg-green-100 border-green-300 text-green-800';
  };

  const getAlertIcon = (type: string) => {
    if (type === 'OUT_OF_STOCK') return <AlertTriangle className="text-red-600" />;
    if (type === 'LOW_STOCK') return <TrendingDown className="text-yellow-600" />;
    return <CheckCircle className="text-green-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview - moved back to top */}
      {/* Removed duplicate stats overview grid after refresh button */}

      {/* ...existing code... */}

      {/* Tabs for Alerts, Low Stock, Out of Stock - moved after stats overview */}
      <div className="flex gap-2 mb-4 mt-6">
        <button
          className={`px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'alerts' ? 'bg-orange-600 text-white' : 'bg-white text-orange-600 border border-orange-200'}`}
          onClick={() => setActiveTab('alerts')}
        >🚨 Active Alerts</button>
        <button
          className={`px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'low' ? 'bg-yellow-500 text-white' : 'bg-white text-yellow-700 border border-yellow-200'}`}
          onClick={() => setActiveTab('low')}
        >⚠️ Low Stock Items</button>
        <button
          className={`px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'out' ? 'bg-red-600 text-white' : 'bg-white text-red-700 border border-red-200'}`}
          onClick={() => setActiveTab('out')}
        >🛑 Out of Stock Items</button>
      </div>

      {/* Manual Refresh Button */}
      <div className="flex justify-end mb-2">
        <button
          onClick={loadData}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition-colors flex items-center gap-2"
          disabled={loading}
        >
          <RefreshCw size={16} /> {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      {/* Update Stock Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full mx-4 animate-in fade-in scale-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-stone-900">Update Stock</h3>
              <button 
                onClick={closeUpdateModal}
                className="text-stone-400 hover:text-stone-600 text-2xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateStock(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Item Name</label>
                <input 
                  type="text"
                  value={updateForm.itemName}
                  disabled
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 text-stone-600"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Current Stock</label>
                <input 
                  type="number"
                  value={updateForm.currentStock}
                  disabled
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 text-stone-600"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Quantity to Add *</label>
                <input 
                  type="number"
                  value={updateForm.quantity}
                  onChange={(e) => setUpdateForm({...updateForm, quantity: parseInt(e.target.value) || 0})}
                  placeholder="e.g., 10"
                  min="1"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

        {/* ...existing code... */}

              {updateError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                  {updateError}
                </div>
              )}

              {permissionError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium mb-2">
                  {permissionError}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button 
                  type="submit"
                  disabled={updating}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-stone-400 text-white rounded-lg font-bold transition-colors"
                >
                  {updating ? 'Updating...' : 'Update Stock'}
                </button>
                <button 
                  type="button"
                  onClick={closeUpdateModal}
                  className="flex-1 px-4 py-2 border border-stone-300 rounded-lg hover:bg-stone-50 font-bold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Total Items</p>
                <p className="text-3xl font-bold text-blue-900">{stats.totalItems}</p>
              </div>
              <Package className="text-blue-400" size={32} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Available</p>
                <p className="text-3xl font-bold text-green-900">{stats.availableItems}</p>
              </div>
              <CheckCircle className="text-green-400" size={32} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Low Stock</p>
                <p className="text-3xl font-bold text-yellow-900">{stats.lowStockItems}</p>
              </div>
              <TrendingDown className="text-yellow-400" size={32} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Out of Stock</p>
                <p className="text-3xl font-bold text-red-900">{stats.outOfStockItems}</p>
              </div>
              <AlertTriangle className="text-red-400" size={32} />
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'alerts' && alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">🚨 Active Alerts ({alerts.length})</h3>
          <div className="space-y-3">
            {alerts.map(alert => (
              <div key={alert._id} className={`flex items-center justify-between p-4 rounded-lg border ${getAlertColor(alert.alertType)}`}>
                <div className="flex items-center gap-3">
                  {getAlertIcon(alert.alertType)}
                  <div>
                    <p className="font-semibold">{alert.itemName}</p>
                    <p className="text-sm">
                      Stock: {alert.currentStock} / Threshold: {alert.lowStockThreshold}
                    </p>
                  </div>
                </div>
                {!alert.acknowledged && (
                  <button
                    onClick={() => handleAcknowledgeAlert(alert._id!)}
                    disabled={updatingAlertId === alert._id}
                    className="px-4 py-2 bg-white rounded-lg font-semibold hover:bg-gray-100 disabled:opacity-50 text-gray-700"
                  >
                    {updatingAlertId === alert._id ? 'Acknowledging...' : 'Acknowledge'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'low' && lowStockItems.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">⚠️ Low Stock Items ({lowStockItems.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 font-semibold text-gray-700">Item Name</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Stock</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Threshold</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Category</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map(item => (
                  <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{item.name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {item.stock} units
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.lowStockThreshold}</td>
                    <td className="px-4 py-3 text-gray-600">{item.category}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openUpdateModal(item)}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1 font-medium text-sm"
                      >
                        <Edit2 size={14} /> Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'out' && outOfStockItems.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-red-900 mb-4">🛑 Out of Stock Items ({outOfStockItems.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 font-semibold text-gray-700">Item Name</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Category</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Price</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {outOfStockItems.map(item => (
                  <tr key={item.id} className="border-b border-gray-200 hover:bg-red-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{item.name}</td>
                    <td className="px-4 py-3 text-gray-600">{item.category}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">Rs {item.price?.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openUpdateModal(item)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 font-medium text-sm"
                      >
                        Restock Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="flex justify-center">
        <button
          onClick={loadData}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold flex items-center gap-2"
        >
          <RefreshCw size={18} />
          Refresh Data
        </button>
      </div>
    </div>
  );
};

export default StockManagement;

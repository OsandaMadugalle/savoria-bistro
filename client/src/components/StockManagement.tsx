import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  Package,
  Edit2,
  Save,
  X,
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
}

const StockManagement: React.FC<StockManagementProps> = ({ userEmail }) => {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [outOfStockItems, setOutOfStockItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState(0);
  const [editReason, setEditReason] = useState('');
  const [updatingAlertId, setUpdatingAlertId] = useState<string | null>(null);

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

  const handleUpdateStock = async (itemId: string) => {
    if (editQuantity === 0) {
      alert('Please enter quantity to update');
      return;
    }

    try {
      await updateItemStock(itemId, editQuantity, editReason || 'Stock adjustment', userEmail);
      alert('Stock updated successfully');
      setEditingItemId(null);
      setEditQuantity(0);
      setEditReason('');
      loadData();
    } catch (error) {
      alert('Failed to update stock: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      setUpdatingAlertId(alertId);
      await acknowledgeStockAlert(alertId, userEmail);
      alert('Alert acknowledged');
      loadData();
    } catch (error) {
      alert('Failed to acknowledge alert: ' + (error instanceof Error ? error.message : 'Unknown error'));
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

      {/* Active Alerts */}
      {alerts.length > 0 && (
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

      {/* Low Stock Items */}
      {lowStockItems.length > 0 && (
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
                  <th className="px-4 py-3 font-semibold text-gray-700">Actions</th>
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
                      {editingItemId === item.id ? (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Qty"
                            value={editQuantity}
                            onChange={e => setEditQuantity(parseInt(e.target.value))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded"
                          />
                          <input
                            type="text"
                            placeholder="Reason"
                            value={editReason}
                            onChange={e => setEditReason(e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded"
                          />
                          <button
                            onClick={() => handleUpdateStock(item.id)}
                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={() => setEditingItemId(null)}
                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingItemId(item.id);
                            setEditQuantity(0);
                            setEditReason('Restock');
                          }}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1"
                        >
                          <Edit2 size={14} /> Update
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Out of Stock Items */}
      {outOfStockItems.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-red-900 mb-4">🛑 Out of Stock Items ({outOfStockItems.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 font-semibold text-gray-700">Item Name</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Category</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Price</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Restock</th>
                </tr>
              </thead>
              <tbody>
                {outOfStockItems.map(item => (
                  <tr key={item.id} className="border-b border-gray-200 hover:bg-red-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{item.name}</td>
                    <td className="px-4 py-3 text-gray-600">{item.category}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">${item.price?.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {editingItemId === item.id ? (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Qty"
                            value={editQuantity}
                            onChange={e => setEditQuantity(parseInt(e.target.value))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded"
                          />
                          <button
                            onClick={() => handleUpdateStock(item.id)}
                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={() => setEditingItemId(null)}
                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingItemId(item.id);
                            setEditQuantity(0);
                            setEditReason('Restock from vendor');
                          }}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Restock Now
                        </button>
                      )}
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

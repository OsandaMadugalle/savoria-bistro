import React, { useState, useEffect } from 'react';
import { fetchMenu, addMenuItem, deleteMenuItem, updateMenuItem, loginUser, fetchAllOrders } from '../services/api';
import { MenuItem, User, Order } from '../types';
import { LayoutDashboard, Plus, Trash2, Edit2, DollarSign, TrendingUp, Users, Lock, AlertTriangle, X, Check, ClipboardList, Utensils } from 'lucide-react';

interface AdminDashboardProps {
  user: User | null;
  onLogin: (user: User) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogin }) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'orders'>('menu');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '', description: '', price: 0, category: 'Main', tags: [], image: ''
  });

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    const [menuData, ordersData] = await Promise.all([fetchMenu(), fetchAllOrders()]);
    setMenuItems(menuData);
    setOrders(ordersData);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const loggedUser = await loginUser(email, password);
      if (loggedUser.role !== 'admin') {
        setLoginError('Access Denied: Admin access only.');
      } else {
        onLogin(loggedUser);
      }
    } catch (err) {
      setLoginError('Invalid credentials.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this dish?')) {
      await deleteMenuItem(id);
      loadData();
    }
  };

  const handleEdit = (item: MenuItem) => {
    setFormData({
      ...item,
      tags: item.tags // Keep as array, form will handle display
    });
        setEditingId(item._id || item.id || item.name);
    setIsFormOpen(true);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Process tags from string or array
    const processedTags = Array.isArray(formData.tags) 
      ? formData.tags 
      : (formData.tags as unknown as string).split(',').map(t => t.trim()).filter(Boolean);

    const itemPayload = {
        ...formData,
        tags: processedTags
    } as MenuItem;
    
    if (editingId) {
      // Update existing
      await updateMenuItem(editingId, itemPayload);
    } else {
      // Create new
      const newItem = {
        ...itemPayload,
        id: `m-${Date.now()}`
      };
      await addMenuItem(newItem);
    }
    
    // Reset
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ name: '', description: '', price: 0, category: 'Main', tags: [], image: 'https://picsum.photos/400/300' });
    loadData();
  };

  const cancelEdit = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ name: '', description: '', price: 0, category: 'Main', tags: [], image: 'https://picsum.photos/400/300' });
  };

  // Stats Calculations
  const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0);
  const activeOrdersCount = orders.filter(o => o.status !== 'Delivered').length;
  // Unique customers approx (using userId or just counting orders for demo)
  const totalOrdersCount = orders.length;

  // --- ACCESS CONTROL ---

  if (!user) {
    return (
      <div className="pt-32 pb-20 min-h-screen bg-stone-100 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-stone-200">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
              <Lock size={32} />
            </div>
            <h1 className="text-2xl font-bold text-stone-900">Admin Portal</h1>
            <p className="text-stone-500 text-sm mt-1">Authorized personnel only.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">{loginError}</div>}
            <input 
              type="email" 
              placeholder="Admin Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-orange-500 outline-none"
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-orange-500 outline-none"
            />
            <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl transition-colors">
              Access Dashboard
            </button>
          </form>
          <div className="mt-6 text-center text-xs text-stone-400">
            <p>Demo: admin@savoria.com / admin123</p>
          </div>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="pt-32 pb-20 min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
           <AlertTriangle size={64} className="text-red-500 mx-auto mb-4" />
           <h1 className="text-3xl font-bold text-stone-900 mb-2">Unauthorized</h1>
           <p className="text-stone-600 mb-6">Your account does not have administrator privileges.</p>
           <button onClick={() => window.location.href = '#/'} className="text-orange-600 font-bold hover:underline">Return to Home</button>
        </div>
      </div>
    );
  }

  // --- DASHBOARD ---

  return (
    <div className="pt-24 pb-20 min-h-screen bg-stone-100 px-4">
      <div className="max-w-7xl mx-auto">
         <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-3xl font-serif font-bold text-stone-900 flex items-center gap-3">
               <LayoutDashboard className="text-orange-600" /> Admin Dashboard
            </h1>
            <div className="bg-white p-1 rounded-lg border border-stone-200 flex">
                <button 
                  onClick={() => setActiveTab('menu')}
                  className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'menu' ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-500 hover:text-stone-900'}`}
                >
                    <Utensils size={16} /> Menu
                </button>
                <button 
                  onClick={() => setActiveTab('orders')}
                  className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'orders' ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-500 hover:text-stone-900'}`}
                >
                    <ClipboardList size={16} /> Orders
                </button>
            </div>
         </div>

         {/* Stats Row */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 flex items-center gap-4">
               <div className="bg-green-100 p-4 rounded-full text-green-600"><DollarSign /></div>
               <div>
                  <p className="text-sm text-stone-500 font-bold uppercase">Total Revenue</p>
                  <p className="text-2xl font-bold text-stone-900">${totalRevenue.toLocaleString()}</p>
               </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 flex items-center gap-4">
               <div className="bg-blue-100 p-4 rounded-full text-blue-600"><TrendingUp /></div>
               <div>
                  <p className="text-sm text-stone-500 font-bold uppercase">Active Orders</p>
                  <p className="text-2xl font-bold text-stone-900">{activeOrdersCount}</p>
               </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 flex items-center gap-4">
               <div className="bg-purple-100 p-4 rounded-full text-purple-600"><Users /></div>
               <div>
                  <p className="text-sm text-stone-500 font-bold uppercase">Total Orders</p>
                  <p className="text-2xl font-bold text-stone-900">{totalOrdersCount}</p>
               </div>
            </div>
         </div>

         {activeTab === 'menu' ? (
             /* --- MENU MANAGEMENT TAB --- */
             <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                   <h2 className="text-xl font-bold text-stone-900">Menu Management</h2>
                   <button 
                      onClick={() => setIsFormOpen(true)}
                      className="bg-stone-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-stone-800"
                   >
                      <Plus size={18} /> Add Dish
                   </button>
                </div>
                
                {/* Add/Edit Form */}
                {isFormOpen && (
                   <div className="p-6 bg-stone-50 border-b border-stone-200 animate-in slide-in-from-top-4">
                      <h3 className="font-bold mb-4 flex items-center gap-2">
                        {editingId ? <Edit2 size={18} className="text-orange-600" /> : <Plus size={18} className="text-green-600" />}
                        {editingId ? 'Edit Dish' : 'Add New Dish'}
                      </h3>
                      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <input required placeholder="Dish Name" className="p-3 rounded border border-stone-200" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                         <input required placeholder="Price" type="number" className="p-3 rounded border border-stone-200" value={formData.price || ''} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
                         <select className="p-3 rounded border border-stone-200" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}>
                            <option>Starter</option><option>Main</option><option>Dessert</option><option>Drink</option>
                         </select>
                         <input placeholder="Image URL" className="p-3 rounded border border-stone-200" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
                         <input placeholder="Tags (comma separated)" className="p-3 rounded border border-stone-200 md:col-span-2" value={Array.isArray(formData.tags) ? formData.tags.join(', ') : formData.tags} onChange={e => setFormData({...formData, tags: e.target.value as any})} />
                         <textarea placeholder="Description" rows={3} className="p-3 rounded border border-stone-200 md:col-span-2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                         <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                            <button type="button" onClick={cancelEdit} className="px-4 py-2 text-stone-600 hover:bg-stone-200 rounded-lg font-medium transition-colors flex items-center gap-1">
                               <X size={18} /> Cancel
                            </button>
                            <button type="submit" className="px-6 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition-colors flex items-center gap-1">
                               <Check size={18} /> {editingId ? 'Update Item' : 'Save Item'}
                            </button>
                         </div>
                      </form>
                   </div>
                )}

                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 text-xs uppercase font-bold tracking-wider">
                         <tr>
                            <th className="p-4">Image</th>
                            <th className="p-4">Name</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Price</th>
                            <th className="p-4">Actions</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-sm">
                         {menuItems.map(item => (
                            <tr key={item._id || item.id || item.name} className="hover:bg-stone-50 transition-colors">
                               <td className="p-4"><img src={item.image} className="w-12 h-12 rounded-lg object-cover bg-stone-200" alt="" /></td>
                               <td className="p-4 font-bold text-stone-900">{item.name}</td>
                               <td className="p-4"><span className="bg-stone-100 px-2 py-1 rounded text-xs uppercase font-bold text-stone-600">{item.category}</span></td>
                               <td className="p-4 font-mono font-medium">${item.price.toFixed(2)}</td>
                               <td className="p-4 flex gap-2">
                                  <button onClick={() => handleEdit(item)} className="p-2 text-stone-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors"><Edit2 size={18} /></button>
                                  <button onClick={() => handleDelete(item._id || item.id || item.name)} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={18} /></button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
         ) : (
             /* --- ORDER HISTORY TAB --- */
             <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                 <div className="p-6 border-b border-stone-100">
                     <h2 className="text-xl font-bold text-stone-900">Order History</h2>
                 </div>
                 <div className="overflow-x-auto">
                     <table className="w-full text-left">
                         <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 text-xs uppercase font-bold tracking-wider">
                             <tr>
                                 <th className="p-4">Order ID</th>
                                 <th className="p-4">Date</th>
                                 <th className="p-4">Items</th>
                                 <th className="p-4">Total</th>
                                 <th className="p-4">Status</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-stone-100 text-sm">
                             {orders.map(order => (
                                 <tr key={order.orderId} className="hover:bg-stone-50">
                                     <td className="p-4 font-mono font-bold text-stone-900">#{order.orderId}</td>
                                     <td className="p-4 text-stone-600">{new Date(order.createdAt).toLocaleDateString()} <span className="text-xs text-stone-400">{new Date(order.createdAt).toLocaleTimeString()}</span></td>
                                     <td className="p-4">
                                         <p className="text-stone-900 font-medium truncate max-w-xs">{order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</p>
                                     </td>
                                     <td className="p-4 font-bold text-stone-900">${order.total.toFixed(2)}</td>
                                     <td className="p-4">
                                         <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                                             order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                             order.status === 'Confirmed' ? 'bg-red-100 text-red-700' :
                                             'bg-orange-100 text-orange-700'
                                         }`}>
                                             {order.status}
                                         </span>
                                     </td>
                                 </tr>
                             ))}
                             {orders.length === 0 && (
                                 <tr>
                                     <td colSpan={5} className="p-8 text-center text-stone-500">No orders found.</td>
                                 </tr>
                             )}
                         </tbody>
                     </table>
                 </div>
             </div>
         )}
      </div>
    </div>
  );
};

export default AdminDashboard;
import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import { fetchMenu, fetchAllOrders, addAdmin, addStaff } from '../services/api';
import { MenuItem, User, Order } from '../types';
import { LayoutDashboard, Plus, Trash2, Edit2 } from 'lucide-react';

interface AdminDashboardProps {
  user: User | null;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
      // Utility: Export Staff as CSV
      const exportStaffCSV = () => {
        const staff = users.filter(u => u.role === 'staff');
        if (staff.length === 0) return;
        const headers = ['Name', 'Email', 'Phone'];
        const rows = staff.map(u => [u.name, u.email, u.phone || '-']);
        let csv = headers.join(',') + '\n';
        csv += rows.map(r => r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'staff.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };

      // Utility: Export Customers as CSV
      const exportCustomersCSV = () => {
        const customers = users.filter(u => u.role === 'customer');
        if (customers.length === 0) return;
        const headers = ['Name', 'Email', 'Phone', 'Loyalty Points', 'Tier', 'Member Since'];
        const rows = customers.map(u => [u.name, u.email, u.phone || '-', u.loyaltyPoints ?? 0, u.tier ?? '-', u.memberSince ?? '-']);
        let csv = headers.join(',') + '\n';
        csv += rows.map(r => r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'customers.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };

      // Utility: Export Orders as CSV
      const exportOrdersCSV = () => {
        if (orders.length === 0) return;
        const headers = ['Order ID', 'Date', 'Items', 'Total', 'Status'];
        const rows = orders.map(order => [
          order.orderId,
          new Date(order.createdAt).toLocaleString(),
          order.items.map(i => `${i.quantity}x ${i.name}`).join(', '),
          order.total.toFixed(2),
          order.status
        ]);
        let csv = headers.join(',') + '\n';
        csv += rows.map(r => r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'orders.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };

      // Utility: Export Activity Logs as CSV
      const exportLogsCSV = () => {
        if (activityLogs.length === 0) return;
        const headers = ['User Email', 'Action', 'Details', 'Timestamp'];
        const rows = activityLogs.map(log => [log.userEmail, log.action, log.details, new Date(log.timestamp).toLocaleString()]);
        let csv = headers.join(',') + '\n';
        csv += rows.map(r => r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'activity_logs.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };
    // Edit/Delete state and handlers
    const [editUser, setEditUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState<{ name: string; email: string; phone?: string; password?: string }>({ name: '', email: '' });
    const [editMsg, setEditMsg] = useState('');

    const handleEditUser = (u: User) => {
      setEditUser(u);
      setEditForm({ name: u.name, email: u.email, phone: u.phone || '', password: '' });
    };

    const handleEditFormChange = (field: string, value: string) => {
      setEditForm(f => ({ ...f, [field]: value }));
    };

    const handleEditFormSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setEditMsg('');
      try {
        const { updateUser } = await import('../services/userActionsApi');
        await updateUser(editForm.email, editForm);
        setEditMsg('User updated!');
        setEditUser(null);
        setEditForm({ name: '', email: '' });
        loadUsers();
      } catch (err: any) {
        setEditMsg(err.message || 'Failed to update user');
      }
    };

    const handleDeleteUser = async (u: User) => {
      if (window.confirm(`Are you sure you want to delete ${u.name}?`)) {
        try {
          const { deleteUser } = await import('../services/userActionsApi');
          await deleteUser(u.email);
          loadUsers();
        } catch (err: any) {
          alert(err.message || 'Failed to delete user');
        }
      }
    };
  // Removed unused password toggle states
  const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'addAdmin' | 'addStaff' | 'customers' | 'logs' | 'analytics'>('menu');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState('');
  
  // Login State

  // Form State

  // Admin/Staff add forms and messages
  const [adminForm, setAdminForm] = useState<{ name: string; email: string; password: string; phone?: string }>({ name: '', email: '', password: '', phone: '' });
  const [staffForm, setStaffForm] = useState<{ name: string; email: string; password: string; phone?: string }>({ name: '', email: '', password: '', phone: '' });
  const [adminMsg, setAdminMsg] = useState('');
  const [staffMsg, setStaffMsg] = useState('');

  // User filtering state
  const [userSearch, setUserSearch] = useState('');
  // Order filtering state
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderDateFilter, setOrderDateFilter] = useState('');
  // Log filtering state
  const [logSearch, setLogSearch] = useState('');
  const [logDateFilter, setLogDateFilter] = useState('');
  // Menu filtering state
  const [menuSearch, setMenuSearch] = useState('');
  // Customer filtering state
  const [customerSearch, setCustomerSearch] = useState('');
  // Staff filtering state
  const [staffSearch, setStaffSearch] = useState('');

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'staff' || user.role === 'masterAdmin')) {
      loadData();
      loadUsers();
    }
  }, [user]);

    const loadData = async () => {
      const [menuData, ordersData] = await Promise.all([fetchMenu(), fetchAllOrders()]);
      setMenuItems(menuData);
      setOrders(ordersData);
    };

    const loadUsers = async () => {
      try {
        const { fetchAllUsers } = await import('../services/usersApi');
        const allUsers = await fetchAllUsers();
        setUsers(allUsers);
      } catch (err) {
        // Optionally handle error
      }
    };

    async function handleAddAdmin(e: React.FormEvent) {
      e.preventDefault();
      setAdminMsg('');
      try {
        await addAdmin({ ...adminForm, requesterEmail: user?.email } as any);
        setAdminMsg('Admin added!');
        setAdminForm({ name: '', email: '', password: '', phone: '' });
        await loadUsers();
        setTimeout(() => setAdminMsg(''), 3000);
      } catch (err: any) {
        setAdminMsg(err.message || 'Failed to add admin');
      }
    }

    async function handleAddStaff(e: React.FormEvent) {
      e.preventDefault();
      setStaffMsg('');
      try {
        await addStaff({ ...staffForm, requesterEmail: user?.email } as any);
        setStaffMsg('Staff added!');
        setStaffForm({ name: '', email: '', password: '', phone: '' });
        await loadUsers();
        setTimeout(() => setStaffMsg(''), 3000);
      } catch (err: any) {
        setStaffMsg(err.message || 'Failed to add staff');
      }
    }

  useEffect(() => {
    if (user && user.role === 'masterAdmin' && activeTab === 'logs') {
      setLogsLoading(true);
      setLogsError('');
      import('../services/userActionsApi').then(({ fetchActivityLogs }) => {
        fetchActivityLogs(user.email)
          .then(setActivityLogs)
          .catch(err => setLogsError(err.message || 'Failed to fetch logs'))
          .finally(() => setLogsLoading(false));
      });
    }
  }, [user, activeTab]);

  return (
    <div>
      {/* Edit Modal (always rendered at top level) */}
      {editUser ? (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl min-w-[320px]">
            <h2 className="text-xl font-bold mb-4">Edit {editUser.role === 'admin' ? 'Admin' : 'Staff'}</h2>
            <form onSubmit={handleEditFormSubmit} className="flex flex-col gap-4">
              <input required placeholder="Name" className="p-3 rounded border border-stone-200" value={editForm.name} onChange={e => handleEditFormChange('name', e.target.value)} />
              <input required type="email" placeholder="Email" className="p-3 rounded border border-stone-200" value={editForm.email} onChange={e => handleEditFormChange('email', e.target.value)} />
              <input placeholder="Phone" className="p-3 rounded border border-stone-200" value={editForm.phone} onChange={e => handleEditFormChange('phone', e.target.value)} />
              <input type="password" placeholder="New Password (optional)" className="p-3 rounded border border-stone-200" value={editForm.password || ''} onChange={e => handleEditFormChange('password', e.target.value)} />
              <div className="flex gap-2 mt-2">
                <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-lg font-bold">Save</button>
                <button type="button" className="px-4 py-2 bg-stone-300 text-stone-900 rounded-lg font-bold" onClick={() => setEditUser(null)}>Cancel</button>
              </div>
              {editMsg && <span className="text-green-600 text-sm mt-2">{editMsg}</span>}
            </form>
          </div>
        </div>
      ) : null}
      {/* Master Admin Panel */}
      {user && user.role === 'masterAdmin' ? (
        <div className="pt-24 pb-20 min-h-screen bg-stone-100 px-4">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-serif font-bold text-stone-900 flex items-center gap-3 mb-8">
              <LayoutDashboard className="text-orange-600" /> Master Admin Panel
            </h1>
            <div className="mb-8 flex gap-4">
              <button className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'addAdmin' ? 'bg-orange-600 text-white' : 'bg-white text-orange-600 border border-orange-600'}`} onClick={() => setActiveTab('addAdmin')}>Admin</button>
              <button className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'addStaff' ? 'bg-orange-600 text-white' : 'bg-white text-orange-600 border border-orange-600'}`} onClick={() => setActiveTab('addStaff')}>Staff</button>
              <button className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'customers' ? 'bg-orange-600 text-white' : 'bg-white text-orange-600 border border-orange-600'}`} onClick={() => setActiveTab('customers')}>Customers</button>
              <button className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'menu' ? 'bg-orange-600 text-white' : 'bg-white text-orange-600 border border-orange-600'}`} onClick={() => setActiveTab('menu')}>Menu</button>
              <button className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'orders' ? 'bg-orange-600 text-white' : 'bg-white text-orange-600 border border-orange-600'}`} onClick={() => setActiveTab('orders')}>Orders</button>
              <button className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'analytics' ? 'bg-orange-600 text-white' : 'bg-white text-orange-600 border border-orange-600'}`} onClick={() => setActiveTab('analytics')}>Analytics</button>
              <button
                className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'logs' ? 'bg-orange-600 text-white' : 'bg-white text-orange-600 border border-orange-600'}`}
                onClick={() => setActiveTab('logs')}
              >
                Activity Logs
              </button>
            </div>
                {/* Analytics Tab: Summary Stats and Charts */}
                {activeTab === 'analytics' && (
                  <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm mb-6 animate-in fade-in slide-in-from-bottom-2">
                    <h2 className="text-xl font-bold mb-4">Analytics & Statistics</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-orange-50 p-4 rounded-lg text-center">
                        <div className="text-3xl font-bold text-orange-700">{users.length}</div>
                        <div className="text-stone-700 mt-1">Total Users</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg text-center">
                        <div className="text-3xl font-bold text-orange-700">{orders.length}</div>
                        <div className="text-stone-700 mt-1">Total Orders</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg text-center">
                        <div className="text-3xl font-bold text-orange-700">${orders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2)}</div>
                        <div className="text-stone-700 mt-1">Total Revenue</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg text-center">
                        <div className="text-3xl font-bold text-orange-700">{menuItems.length}</div>
                        <div className="text-stone-700 mt-1">Menu Items</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg text-center">
                        <div className="text-3xl font-bold text-orange-700">{users.filter(u => u.role === 'admin').length}</div>
                        <div className="text-stone-700 mt-1">Admins</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg text-center">
                        <div className="text-3xl font-bold text-orange-700">{users.filter(u => u.role === 'staff').length}</div>
                        <div className="text-stone-700 mt-1">Staff</div>
                      </div>
                    </div>

                    {/* Sales/Revenue by Day Chart */}
                    <div className="mb-8">
                      <h3 className="text-lg font-bold mb-2">Sales (Revenue) by Day</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={getRevenueByDay(orders)} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="revenue" fill="#ea580c" name="Revenue" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Orders by Day Chart */}
                    <div className="mb-8">
                      <h3 className="text-lg font-bold mb-2">Orders by Day</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={getOrdersByDay(orders)} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="orders" stroke="#ea580c" name="Orders" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* New Users by Day Chart */}
                    <div className="mb-8">
                      <h3 className="text-lg font-bold mb-2">New Users by Day</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={getUsersByDay(users)} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="users" stroke="#ea580c" name="New Users" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                          {/* Customers Tab: List Customers */}
                          {activeTab === 'customers' && (
                            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                              <h2 className="text-xl font-bold mb-2 flex items-center justify-between">
                                <span>Customers</span>
                                <button
                                  className="px-3 py-1 bg-orange-600 text-white rounded-lg font-bold text-sm hover:bg-orange-700"
                                  onClick={() => exportCustomersCSV()}
                                >
                                  Export CSV
                                </button>
                              </h2>
                              <div className="flex gap-2 mb-4 flex-wrap">
                                <input
                                  type="text"
                                  className="p-2 border rounded min-w-[160px]"
                                  placeholder="Search name, email, phone..."
                                  value={customerSearch}
                                  onChange={e => setCustomerSearch(e.target.value)}
                                />
                              </div>
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-stone-100">
                                    <th className="p-2">Name</th>
                                    <th className="p-2">Email</th>
                                    <th className="p-2">Phone</th>
                                    <th className="p-2">Loyalty Points</th>
                                    <th className="p-2">Tier</th>
                                    <th className="p-2">Member Since</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {users.filter(u => u.role === 'customer').filter(u =>
                                    [u.name, u.email, u.phone].join(' ').toLowerCase().includes(customerSearch.toLowerCase())
                                  ).map((u, idx) => (
                                    <tr key={u.email || idx} className="border-b">
                                      <td className="p-2">{u.name}</td>
                                      <td className="p-2">{u.email}</td>
                                      <td className="p-2">{u.phone || '-'}</td>
                                      <td className="p-2">{u.loyaltyPoints ?? 0}</td>
                                      <td className="p-2">{u.tier ?? '-'}</td>
                                      <td className="p-2">{u.memberSince ?? '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
            <div>
              {/* Admin Tab: Add Admin + List Admins */}
              {activeTab === 'addAdmin' && (
                <div>
                  <div className="mb-4 bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                    <h2 className="text-xl font-bold mb-2">Add Admin</h2>
                    <form onSubmit={handleAddAdmin} className="flex flex-wrap gap-4 items-end">
                      <input required placeholder="Name" className="p-3 rounded border border-stone-200 min-w-[140px]" value={adminForm.name} onChange={e => setAdminForm(f => ({...f, name: e.target.value}))} />
                      <input required type="email" placeholder="Email" className="p-3 rounded border border-stone-200 min-w-[180px]" value={adminForm.email} onChange={e => setAdminForm(f => ({...f, email: e.target.value}))} />
                      <input required type="password" placeholder="Password" className="p-3 rounded border border-stone-200 min-w-[180px]" value={adminForm.password} onChange={e => setAdminForm(f => ({...f, password: e.target.value}))} />
                      <input placeholder="Phone" className="p-3 rounded border border-stone-200 min-w-[140px]" value={adminForm.phone} onChange={e => setAdminForm(f => ({...f, phone: e.target.value}))} />
                      <button type="submit" className="px-6 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition-colors">Add Admin</button>
                    </form>
                    {adminMsg && (
                      <div className="w-full my-2 p-3 rounded-lg font-bold text-center" style={{ background: '#ffeaea', color: '#d32f2f', border: '2px solid #d32f2f' }}>
                        {adminMsg}
                      </div>
                    )}
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                    <h2 className="text-xl font-bold mb-2 flex items-center justify-between">
                      <span>Admins</span>
                    </h2>
                    <div className="flex gap-2 mb-4 flex-wrap">
                      <input
                        type="text"
                        className="p-2 border rounded min-w-[160px]"
                        placeholder="Search name, email, phone..."
                        value={userSearch}
                        onChange={e => setUserSearch(e.target.value)}
                      />
                    </div>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-stone-100">
                          <th className="p-2">Name</th>
                          <th className="p-2">Email</th>
                          <th className="p-2">Phone</th>
                          <th className="p-2">Role</th>
                          <th className="p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users
                          .filter(u => u.role === 'admin')
                          .filter(u =>
                            [u.name, u.email, u.phone].join(' ').toLowerCase().includes(userSearch.toLowerCase())
                          )
                          .map((u, idx) => (
                            <tr key={u.email || idx} className="border-b">
                              <td className="p-2">{u.name}</td>
                              <td className="p-2">{u.email}</td>
                              <td className="p-2">{u.phone || '-'}</td>
                              <td className="p-2">{u.role}</td>
                              <td className="p-2">
                                <button className="text-blue-600 mr-2" onClick={() => handleEditUser(u)}>Edit</button>
                                <button className="text-red-600" onClick={() => handleDeleteUser(u)}>Delete</button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {/* Staff Tab: Add Staff + List Staff */}
              {activeTab === 'addStaff' && (
                <div>
                  <div className="mb-4 bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                    <h2 className="text-xl font-bold mb-2">Add Staff</h2>
                    <form onSubmit={handleAddStaff} className="flex flex-wrap gap-4 items-end">
                      <input required placeholder="Name" className="p-3 rounded border border-stone-200 min-w-[140px]" value={staffForm.name} onChange={e => setStaffForm(f => ({...f, name: e.target.value}))} />
                      <input required type="email" placeholder="Email" className="p-3 rounded border border-stone-200 min-w-[180px]" value={staffForm.email} onChange={e => setStaffForm(f => ({...f, email: e.target.value}))} />
                      <input required type="password" placeholder="Password" className="p-3 rounded border border-stone-200 min-w-[180px]" value={staffForm.password} onChange={e => setStaffForm(f => ({...f, password: e.target.value}))} />
                      <input placeholder="Phone" className="p-3 rounded border border-stone-200 min-w-[140px]" value={staffForm.phone} onChange={e => setStaffForm(f => ({...f, phone: e.target.value}))} />
                      <button type="submit" className="px-6 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition-colors">Add Staff</button>
                    </form>
                    {staffMsg && (
                      <div className="w-full my-2 p-3 rounded-lg font-bold text-center" style={{ background: '#ffeaea', color: '#d32f2f', border: '2px solid #d32f2f' }}>
                        {staffMsg}
                      </div>
                    )}
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                    <h2 className="text-xl font-bold mb-2 flex items-center justify-between">
                      <span>Staff</span>
                      <button
                        className="px-3 py-1 bg-orange-600 text-white rounded-lg font-bold text-sm hover:bg-orange-700"
                        onClick={() => exportStaffCSV()}
                      >
                        Export CSV
                      </button>
                    </h2>
                    <div className="flex gap-2 mb-4 flex-wrap">
                      <input
                        type="text"
                        className="p-2 border rounded min-w-[160px]"
                        placeholder="Search name, email, phone..."
                        value={staffSearch}
                        onChange={e => setStaffSearch(e.target.value)}
                      />
                    </div>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-stone-100">
                          <th className="p-2">Name</th>
                          <th className="p-2">Email</th>
                          <th className="p-2">Phone</th>
                          <th className="p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.filter(u => u.role === 'staff').filter(u =>
                          [u.name, u.email, u.phone].join(' ').toLowerCase().includes(staffSearch.toLowerCase())
                        ).map((u, idx) => (
                          <tr key={u.email || idx} className="border-b">
                            <td className="p-2">{u.name}</td>
                            <td className="p-2">{u.email}</td>
                            <td className="p-2">{u.phone || '-'}</td>
                            <td className="p-2">
                              <button className="text-blue-600 mr-2" onClick={() => handleEditUser(u)}>Edit</button>
                              <button className="text-red-600" onClick={() => handleDeleteUser(u)}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {activeTab === 'menu' && (
                <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                  <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-stone-900">Menu Management</h2>
                    <button className="bg-stone-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-stone-800">
                      <Plus size={18} /> Add Dish
                    </button>
                  </div>
                  <div className="flex gap-2 mb-4 px-6 pt-4 flex-wrap">
                    <input
                      type="text"
                      className="p-2 border rounded min-w-[160px]"
                      placeholder="Search dish, category..."
                      value={menuSearch}
                      onChange={e => setMenuSearch(e.target.value)}
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-stone-200">
                      <thead className="bg-stone-50">
                        <tr>
                          <th className="p-4 text-left font-bold text-stone-700">Dish</th>
                          <th className="p-4 text-left font-bold text-stone-700">Category</th>
                          <th className="p-4 text-left font-bold text-stone-700">Price</th>
                          <th className="p-4 text-left font-bold text-stone-700">Tags</th>
                          <th className="p-4 text-left font-bold text-stone-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-sm">
                        {menuItems.filter(item =>
                          item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
                          item.category.toLowerCase().includes(menuSearch.toLowerCase())
                        ).map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-stone-50">
                            <td className="p-4 font-bold text-stone-900">{item.name}</td>
                            <td className="p-4 text-stone-600">{item.category}</td>
                            <td className="p-4 font-bold text-stone-900">${item.price}</td>
                            <td className="p-4 text-stone-600">{Array.isArray(item.tags) ? item.tags.join(', ') : item.tags}</td>
                            <td className="p-4 flex gap-2">
                              <button className="text-blue-600 hover:underline"><Edit2 size={16} /></button>
                              <button className="text-red-600 hover:underline"><Trash2 size={16} /></button>
                            </td>
                          </tr>
                        ))}
                        {menuItems.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-stone-500">No menu items found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {activeTab === 'orders' && (
                <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4">
                    <div className="flex gap-2 flex-wrap">
                      <input
                        type="text"
                        className="p-2 border rounded min-w-[140px]"
                        placeholder="Search order ID, item..."
                        value={orderSearch}
                        onChange={e => setOrderSearch(e.target.value)}
                      />
                      <input
                        type="date"
                        className="p-2 border rounded"
                        value={orderDateFilter}
                        onChange={e => setOrderDateFilter(e.target.value)}
                      />
                      <select
                        className="p-2 border rounded"
                        value={orderStatusFilter}
                        onChange={e => setOrderStatusFilter(e.target.value)}
                      >
                        <option value="all">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <button
                      className="px-3 py-1 bg-orange-600 text-white rounded-lg font-bold text-sm hover:bg-orange-700"
                      onClick={() => exportOrdersCSV()}
                    >
                      Export CSV
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-stone-200">
                      <thead className="bg-stone-50">
                        <tr>
                          <th className="p-4 text-left font-bold text-stone-700">Order ID</th>
                          <th className="p-4 text-left font-bold text-stone-700">Date</th>
                          <th className="p-4 text-left font-bold text-stone-700">Items</th>
                          <th className="p-4 text-left font-bold text-stone-700">Total</th>
                          <th className="p-4 text-left font-bold text-stone-700">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-sm">
                        {orders
                          .filter(order => {
                            // Status filter
                            if (orderStatusFilter !== 'all' && order.status !== orderStatusFilter) return false;
                            // Date filter
                            if (orderDateFilter) {
                              const orderDate = new Date(order.createdAt);
                              const filterDate = new Date(orderDateFilter);
                              if (
                                orderDate.getFullYear() !== filterDate.getFullYear() ||
                                orderDate.getMonth() !== filterDate.getMonth() ||
                                orderDate.getDate() !== filterDate.getDate()
                              ) return false;
                            }
                            // Search filter
                            const search = orderSearch.toLowerCase();
                            return (
                              String(order.orderId).toLowerCase().includes(search) ||
                              order.items.some(i => i.name.toLowerCase().includes(search))
                            );
                          })
                          .map((order, idx) => (
                            <tr key={order.orderId || idx} className="hover:bg-stone-50">
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
              {activeTab === 'logs' && user?.role === 'masterAdmin' && (
                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm mt-4">
                  <h2 className="text-xl font-bold mb-2 flex items-center justify-between">
                    <span>System Activity Logs</span>
                    <button
                      className="px-3 py-1 bg-orange-600 text-white rounded-lg font-bold text-sm hover:bg-orange-700"
                      onClick={() => exportLogsCSV()}
                    >
                      Export CSV
                    </button>
                  </h2>
                  <div className="flex gap-2 mb-4 flex-wrap">
                    <input
                      type="text"
                      className="p-2 border rounded min-w-[160px]"
                      placeholder="Search email, action, details..."
                      value={logSearch}
                      onChange={e => setLogSearch(e.target.value)}
                    />
                    <input
                      type="date"
                      className="p-2 border rounded"
                      value={logDateFilter}
                      onChange={e => setLogDateFilter(e.target.value)}
                    />
                  </div>
                  {logsLoading ? (
                    <div>Loading logs...</div>
                  ) : logsError ? (
                    <div style={{ color: 'red' }}>{logsError}</div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-stone-100">
                          <th className="p-2">User Email</th>
                          <th className="p-2">Action</th>
                          <th className="p-2">Details</th>
                          <th className="p-2">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activityLogs
                          .filter(log => {
                            // Date filter
                            if (logDateFilter) {
                              const logDate = new Date(log.timestamp);
                              const filterDate = new Date(logDateFilter);
                              if (
                                logDate.getFullYear() !== filterDate.getFullYear() ||
                                logDate.getMonth() !== filterDate.getMonth() ||
                                logDate.getDate() !== filterDate.getDate()
                              ) return false;
                            }
                            // Search filter
                            const search = logSearch.toLowerCase();
                            return (
                              log.userEmail?.toLowerCase().includes(search) ||
                              log.action?.toLowerCase().includes(search) ||
                              log.details?.toLowerCase().includes(search)
                            );
                          })
                          .map((log, idx) => (
                            <tr key={log._id || idx} className="border-b">
                              <td className="p-2">{log.userEmail}</td>
                              <td className="p-2">{log.action}</td>
                              <td className="p-2">{log.details}</td>
                              <td className="p-2">{new Date(log.timestamp).toLocaleString()}</td>
                            </tr>
                          ))}
                        {activityLogs.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-stone-500">No logs found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="pt-24 pb-20 min-h-screen bg-stone-100 px-4">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-serif font-bold text-stone-900 flex items-center gap-3 mb-8">
              <LayoutDashboard className="text-orange-600" /> Admin Panel
            </h1>
            <div className="mb-8 flex gap-4">
              <button className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'menu' ? 'bg-orange-600 text-white' : 'bg-white text-orange-600 border border-orange-600'}`} onClick={() => setActiveTab('menu')}>Menu</button>
              <button className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'orders' ? 'bg-orange-600 text-white' : 'bg-white text-orange-600 border border-orange-600'}`} onClick={() => setActiveTab('orders')}>Orders</button>
            </div>
            <div>
              {activeTab === 'menu' && (
                <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                  <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-stone-900">Menu Management</h2>
                    <button className="bg-stone-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-stone-800">
                      <Plus size={18} /> Add Dish
                    </button>
                  </div>
                  <div className="flex gap-2 mb-4 px-6 pt-4 flex-wrap">
                    <input
                      type="text"
                      className="p-2 border rounded min-w-[160px]"
                      placeholder="Search dish, category..."
                      value={menuSearch}
                      onChange={e => setMenuSearch(e.target.value)}
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-stone-200">
                      <thead className="bg-stone-50">
                        <tr>
                          <th className="p-4 text-left font-bold text-stone-700">Dish</th>
                          <th className="p-4 text-left font-bold text-stone-700">Category</th>
                          <th className="p-4 text-left font-bold text-stone-700">Price</th>
                          <th className="p-4 text-left font-bold text-stone-700">Tags</th>
                          <th className="p-4 text-left font-bold text-stone-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-sm">
                        {menuItems.filter(item =>
                          item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
                          item.category.toLowerCase().includes(menuSearch.toLowerCase())
                        ).map(item => (
                          <tr key={item.id} className="hover:bg-stone-50">
                            <td className="p-4 font-bold text-stone-900">{item.name}</td>
                            <td className="p-4 text-stone-600">{item.category}</td>
                            <td className="p-4 font-bold text-stone-900">${item.price}</td>
                            <td className="p-4 text-stone-600">{Array.isArray(item.tags) ? item.tags.join(', ') : item.tags}</td>
                            <td className="p-4 flex gap-2">
                              <button className="text-blue-600 hover:underline"><Edit2 size={16} /></button>
                              <button className="text-red-600 hover:underline"><Trash2 size={16} /></button>
                            </td>
                          </tr>
                        ))}
                        {menuItems.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-stone-500">No menu items found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {activeTab === 'orders' && (
                <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-stone-200">
                      <thead className="bg-stone-50">
                        <tr>
                          <th className="p-4 text-left font-bold text-stone-700">Order ID</th>
                          <th className="p-4 text-left font-bold text-stone-700">Date</th>
                          <th className="p-4 text-left font-bold text-stone-700">Items</th>
                          <th className="p-4 text-left font-bold text-stone-700">Total</th>
                          <th className="p-4 text-left font-bold text-stone-700">Status</th>
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
        </div>
      )}
    </div>
  );
}
export default AdminDashboard;

// --- Analytics Data Helpers ---
function getRevenueByDay(orders: any[]) {
  const map: Record<string, number> = {};
  orders.forEach(o => {
    const d = new Date(o.createdAt).toLocaleDateString();
    map[d] = (map[d] || 0) + (o.total || 0);
  });
  return Object.entries(map).map(([date, revenue]) => ({ date, revenue: Number(revenue) }));
}

function getOrdersByDay(orders: any[]) {
  const map: Record<string, number> = {};
  orders.forEach(o => {
    const d = new Date(o.createdAt).toLocaleDateString();
    map[d] = (map[d] || 0) + 1;
  });
  return Object.entries(map).map(([date, orders]) => ({ date, orders: Number(orders) }));
}

function getUsersByDay(users: any[]) {
  const map: Record<string, number> = {};
  users.forEach(u => {
    if (!u.memberSince) return;
    const d = new Date(u.memberSince).toLocaleDateString();
    map[d] = (map[d] || 0) + 1;
  });
  return Object.entries(map).map(([date, users]) => ({ date, users: Number(users) }));
}
import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Trophy, ChefHat, Gift, Phone, MessageSquare, Package, RefreshCcw, Calendar } from 'lucide-react';
import { User, Order, ReservationData } from '../types';
import { fetchUserProfile, updateUserProfile, fetchUserOrders, fetchUserReservations, fetchUserReviews } from '../services/api';
import { useNavigate } from 'react-router-dom';

const ProfilePage: React.FC = () => {

   // All hooks must be called unconditionally and at the top level
   const [user, setUser] = useState<User | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');
   const [editing, setEditing] = useState(false);
   const [editData, setEditData] = useState<{ name: string; email: string; phone: string; password: string; confirmPassword: string }>({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
   const [showPassword, setShowPassword] = useState(false);
   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
   const [editLoading, setEditLoading] = useState(false);
   const [editError, setEditError] = useState('');
   const [confirmTouched, setConfirmTouched] = useState(false);
   const [orders, setOrders] = useState<Order[]>([]);
   const [ordersLoading, setOrdersLoading] = useState(true);
   const [reservations, setReservations] = useState<ReservationData[]>([]);
   const [reservationsLoading, setReservationsLoading] = useState(true);
   const [reviews, setReviews] = useState<any[]>([]);
   const [reviewsLoading, setReviewsLoading] = useState(true);
   const navigate = useNavigate();

   useEffect(() => {
      if (editing) {
         document.body.classList.add('overflow-hidden');
      } else {
         document.body.classList.remove('overflow-hidden');
      }
      return () => {
         document.body.classList.remove('overflow-hidden');
      };
   }, [editing]);

   useEffect(() => {
      const email = localStorage.getItem('userEmail');
      if (!email) {
         setLoading(false);
         setUser(null);
         setOrdersLoading(false);
         return;
      }
      fetchUserProfile(email)
         .then(profile => {
            setUser(profile);
            setEditData({ name: profile.name, email: profile.email, phone: profile.phone, password: '', confirmPassword: '' });
            setLoading(false);
            // Fetch user's orders
            const userId = profile.id ? profile.id : (profile._id ? profile._id : '');
            if (userId) {
              fetchUserOrders(userId)
                .then(setOrders)
                .catch(() => setOrders([]))
                .finally(() => setOrdersLoading(false));
            } else {
              setOrders([]);
              setOrdersLoading(false);
            }
            // Fetch user's reservations
            fetchUserReservations(profile.email)
              .then(setReservations)
              .catch(() => setReservations([]))
              .finally(() => setReservationsLoading(false));
            
            // Fetch user's reviews
            fetchUserReviews(profile.email)
              .then(setReviews)
              .catch(() => setReviews([]))
              .finally(() => setReviewsLoading(false));
         })
         .catch(() => {
            setError('Could not load profile.');
            setLoading(false);
            setOrdersLoading(false);
            setReviewsLoading(false);
         });
   }, []);

   const nextRewardPoints = 1000;
   const progress = user ? (user.loyaltyPoints / nextRewardPoints) * 100 : 0;

   // Edit profile handlers
   const handleEditClick = () => {
      setEditing(true);
      setEditError('');
   };

   const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      if (name === 'password') {
         setEditData(prev => ({
            ...prev,
            password: value,
            confirmPassword: confirmTouched ? prev.confirmPassword : value
         }));
      } else if (name === 'confirmPassword') {
         setConfirmTouched(true);
         setEditData(prev => ({ ...prev, confirmPassword: value }));
      } else {
         setEditData(prev => ({ ...prev, [name]: value }));
      }
   };

   const handleEditCancel = () => {
      setEditing(false);
      setEditError('');
      if (user) setEditData({ name: user.name, email: user.email, phone: user.phone, password: '', confirmPassword: '' });
      setConfirmTouched(false);
   };

   const handleEditSave = async (e: React.FormEvent) => {
      e.preventDefault();
      setEditError('');
      if (editData.password && editData.password !== editData.confirmPassword) {
         setEditError('Passwords do not match.');
         return;
      }
      setEditLoading(true);
      try {
         const { confirmPassword, ...submitData } = editData;
         const updated = await updateUserProfile(user!.email, submitData);
         setUser(updated);
         setEditing(false);
      } catch (err) {
         setEditError('Failed to update profile.');
      } finally {
         setEditLoading(false);
      }
   };

   // Conditional rendering must use state, not hooks
   if (loading) {
      return <div className="pt-32 pb-20 min-h-screen bg-stone-50 flex items-center justify-center"><div>Loading profile...</div></div>;
   }
   if (error) {
      return <div className="pt-32 pb-20 min-h-screen bg-stone-50 flex items-center justify-center"><div>{error}</div></div>;
   }
   if (!user) {
      return (
         <div className="pt-32 pb-20 min-h-screen bg-stone-50 flex items-center justify-center">
             <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-stone-200">
                <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
                <p className="text-stone-600 mb-6">You need to be logged in to view your profile.</p>
                <NavLink to="/" className="text-orange-600 font-bold hover:underline">Go Home</NavLink>
             </div>
         </div>
      );
   }

  return (
    <div className="pt-24 pb-20 min-h-screen bg-stone-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
           <h1 className="text-4xl font-serif font-bold text-stone-900">Welcome, {user.name.split(' ')[0]}</h1>
           <p className="text-stone-500">Manage your rewards and past orders.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column: Loyalty Card */}
          <div className="md:col-span-1 space-y-6">
             {/* Loyalty Card */}
             <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <Trophy size={120} />
                </div>
                <div className="relative z-10">
                   <div className="flex justify-between items-start mb-8">
                      <div>
                         <p className="text-xs uppercase tracking-widest text-stone-400">Status</p>
                         <p className="text-2xl font-serif font-bold text-yellow-500">{user.tier} Member</p>
                      </div>
                      <ChefHat className="text-stone-500" />
                   </div>
                   
                   <div className="mb-2 flex justify-between items-end">
                      <span className="text-4xl font-bold">{user.loyaltyPoints}</span>
                      <span className="text-sm text-stone-400">/ {nextRewardPoints} pts</span>
                   </div>
                   
                   {/* Progress Bar */}
                   <div className="w-full h-2 bg-stone-700 rounded-full mb-4 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400" style={{ width: `${progress}%` }}></div>
                   </div>
                   
                   <p className="text-xs text-stone-400 flex items-center gap-1">
                      <Gift size={12} className="text-yellow-500" />
                      {nextRewardPoints - user.loyaltyPoints} points until Free Dessert!
                   </p>
                </div>
             </div>

             {/* Personal Info Snippet */}
                     <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
                        <h3 className="font-bold text-lg mb-4">Account Details</h3>
                        <div className="space-y-3 text-sm text-stone-600">
                           <div className="flex items-center gap-3">
                              <Phone size={16} className="text-orange-500" />
                              <span>{user.phone}</span>
                           </div>
                           <div className="flex items-center gap-3">
                              <MessageSquare size={16} className="text-orange-500" />
                              <span>{user.email}</span>
                           </div>
                        </div>
                        <button
                           onClick={handleEditClick}
                           className="mt-6 bg-orange-600 text-white px-6 py-2 rounded-xl font-bold w-full"
                        >
                           Edit Profile
                        </button>
                     </div>
                     {/* Modal for editing profile */}
                     {editing && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                           <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative">
                              <button
                                 onClick={handleEditCancel}
                                 className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 transition-colors z-10"
                              >
                                 ✕
                              </button>
                              <div className="p-8">
                                 <h2 className="text-2xl font-serif font-bold text-stone-900 mb-4">Edit Profile</h2>
                                 <form onSubmit={handleEditSave} className="space-y-4">
                                    <div>
                                       <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Name</label>
                                       <input name="name" value={editData.name} onChange={handleEditChange} className="w-full border rounded-xl px-3 py-2" required />
                                    </div>
                                    <div>
                                       <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Email</label>
                                       <input name="email" value={editData.email} onChange={handleEditChange} className="w-full border rounded-xl px-3 py-2" required />
                                    </div>
                                    <div>
                                       <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Phone</label>
                                       <input name="phone" value={editData.phone} onChange={handleEditChange} className="w-full border rounded-xl px-3 py-2" required />
                                    </div>
                                    <div>
                                       <label className="block text-xs font-bold uppercase text-stone-500 mb-1">New Password</label>
                                       <div className="relative">
                                          <input
                                             name="password"
                                             type={showPassword ? 'text' : 'password'}
                                             value={editData.password}
                                             onChange={handleEditChange}
                                             className="w-full border rounded-xl px-3 py-2 pr-10"
                                             placeholder="Leave blank to keep current password"
                                          />
                                          <button
                                             type="button"
                                             onClick={() => setShowPassword((prev) => !prev)}
                                             className="absolute right-3 top-2 text-stone-400 hover:text-orange-600 focus:outline-none"
                                             tabIndex={-1}
                                             aria-label={showPassword ? 'Hide password' : 'Show password'}
                                          >
                                             {showPassword ? '🙈' : '👁️'}
                                          </button>
                                       </div>
                                    </div>
                                    <div>
                                       <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Confirm Password</label>
                                       <div className="relative">
                                          <input
                                             name="confirmPassword"
                                             type={showConfirmPassword ? 'text' : 'password'}
                                             value={editData.confirmPassword}
                                             onChange={handleEditChange}
                                             className="w-full border rounded-xl px-3 py-2 pr-10"
                                             placeholder="Retype new password"
                                          />
                                          <button
                                             type="button"
                                             onClick={() => setShowConfirmPassword((prev) => !prev)}
                                             className="absolute right-3 top-2 text-stone-400 hover:text-orange-600 focus:outline-none"
                                             tabIndex={-1}
                                             aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                          >
                                             {showConfirmPassword ? '🙈' : '👁️'}
                                          </button>
                                       </div>
                                    </div>
                                    {editError && <div className="text-red-500 text-xs text-center">{editError}</div>}
                                    <div className="flex gap-2 mt-2 justify-center">
                                       <button type="submit" disabled={editLoading} className="bg-orange-600 text-white px-6 py-2 rounded-xl font-bold">{editLoading ? 'Saving...' : 'Save Changes'}</button>
                                       <button type="button" onClick={handleEditCancel} className="bg-stone-200 text-stone-700 px-6 py-2 rounded-xl font-bold">Cancel</button>
                                    </div>
                                 </form>
                              </div>
                           </div>
                        </div>
                     )}
          </div>

          {/* Right Column: Order History & Reservations */}
          <div className="md:col-span-2 space-y-8">
             <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                   <h3 className="font-bold text-xl text-stone-900">Recent Orders</h3>
                   <button className="text-sm text-orange-600 font-medium hover:underline">View All</button>
                </div>
                <div className="divide-y divide-stone-100">
                   {ordersLoading ? (
                     <div className="p-6 text-center text-stone-500">Loading orders...</div>
                   ) : orders.length === 0 ? (
                     <div className="p-6 text-center text-stone-500">No orders found.</div>
                   ) : (
                     orders.map(order => (
                       <div key={order._id || order.orderId} className="p-6 hover:bg-stone-50 transition-colors flex flex-col sm:flex-row gap-4 justify-between items-center">
                         <div className="flex items-start gap-4 flex-1">
                            <div className="bg-orange-50 p-3 rounded-full text-orange-600">
                               <Package size={20} />
                            </div>
                            <div>
                               <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-stone-900">Order {order.orderId}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{order.status}</span>
                               </div>
                               <p className="text-xs text-stone-500 mb-1">{new Date(order.createdAt).toLocaleString()}</p>
                               <p className="text-sm text-stone-600">{order.items.map(i => i.name).join(', ')}</p>
                            </div>
                         </div>
                         <div className="text-right flex flex-col items-end gap-2">
                            <span className="font-bold text-stone-900">${order.total.toFixed(2)}</span>
                            <button className="flex items-center gap-1 text-xs font-bold text-orange-600 border border-orange-200 px-3 py-1.5 rounded-full hover:bg-orange-50 transition-colors"
                              onClick={() => navigate(`/tracker?orderId=${order.orderId}`)}
                            >
                               <RefreshCcw size={12} /> Track
                            </button>
                         </div>
                       </div>
                     ))
                   )}
                </div>
             </div>

             <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                   <h3 className="font-bold text-xl text-stone-900">My Reservations</h3>
                </div>
                <div className="divide-y divide-stone-100">
                   {reservationsLoading ? (
                     <div className="p-6 text-center text-stone-500">Loading reservations...</div>
                   ) : reservations.length === 0 ? (
                     <div className="p-6 text-center text-stone-500">No reservations found.</div>
                   ) : (
                     reservations.map(res => (
                       <div key={res._id || res.date + res.time} className="p-6 hover:bg-stone-50 transition-colors flex flex-col sm:flex-row gap-4 justify-between items-center">
                         <div className="flex items-start gap-4 flex-1">
                            <div className="bg-orange-50 p-3 rounded-full text-orange-600">
                               <Calendar size={20} />
                            </div>
                            <div>
                               <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-stone-900">{res.date} at {res.time}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${res.status === 'Completed' ? 'bg-green-100 text-green-700' : res.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{res.status || 'Pending'}</span>
                               </div>
                               <p className="text-xs text-stone-500 mb-1">{res.name} • {res.guests} guests</p>
                               <p className="text-sm text-stone-600">{res.notes || 'No special requests.'}</p>
                            </div>
                         </div>
                         <div className="text-right flex flex-col items-end gap-2">
                            <span className="font-bold text-stone-900">{res.phone}</span>
                            <span className="text-xs text-stone-500">{res.email}</span>
                         </div>
                       </div>
                     ))
                   )}
                </div>
             </div>

             <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                   <h3 className="font-bold text-xl text-stone-900">My Reviews</h3>
                   <NavLink to="/reviews" className="text-orange-600 font-bold text-sm hover:underline">
                      Write a Review →
                   </NavLink>
                </div>
                <div className="divide-y divide-stone-100">
                   {reviewsLoading ? (
                     <div className="p-6 text-center text-stone-500">Loading reviews...</div>
                   ) : reviews.length === 0 ? (
                     <div className="p-6 text-center text-stone-500">
                        <p>You haven't written any reviews yet.</p>
                        <NavLink to="/reviews" className="text-orange-600 font-bold hover:underline mt-2 inline-block">
                           Share your experience
                        </NavLink>
                     </div>
                   ) : (
                     reviews.map(review => (
                       <div key={review._id} className="p-6 hover:bg-stone-50 transition-colors">
                         <div className="flex justify-between items-start mb-3">
                            <div>
                               <p className="text-sm font-semibold text-stone-700 mb-1">{review.title}</p>
                               <div className="flex text-orange-500 mb-2">
                                  {[...Array(5)].map((_, i) => (
                                    <span key={i}>
                                      {i < review.rating ? '⭐' : '☆'}
                                    </span>
                                  ))}
                               </div>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                              review.status === 'approved' ? 'bg-green-100 text-green-700' :
                              review.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {review.status}
                            </span>
                         </div>
                         <p className="text-stone-600 text-sm mb-2 line-clamp-2">"{review.text}"</p>
                         <p className="text-xs text-stone-400">
                           {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recently'}
                         </p>
                         {review.status === 'rejected' && review.adminNotes && (
                           <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                             <strong>Admin feedback:</strong> {review.adminNotes}
                           </div>
                         )}
                       </div>
                     ))
                   )}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
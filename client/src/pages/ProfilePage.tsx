import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Trophy, ChefHat, Gift, Phone, MessageSquare, Package, RefreshCcw, Calendar, MapPin, X, Bell, Heart } from 'lucide-react';
import { User, Order, ReservationData, PrivateEventInquiry } from '../types';
import { fetchUserProfile, updateUserProfile, fetchUserOrders, fetchUserReservations, fetchUserReviews, fetchPrivateEventInquiries, getUserFeedbackHistory } from '../services/api';

interface ProfilePageProps {
  initialUser?: User | null;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ initialUser }) => {
   const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';

   // All hooks must be called unconditionally and at the top level
   const [user, setUser] = useState<User | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');
   const [editing, setEditing] = useState(false);
   const [editData, setEditData] = useState<{
      name: string;
      email: string;
      phone: string;
      address?: string;
      birthday?: string;
      favoriteCuisine?: string;
      dietaryRestrictions?: string;
      preferredDiningTime?: string;
      specialRequests?: string;
      password: string;
      confirmPassword: string;
   }>({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
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
   const [eventInquiries, setEventInquiries] = useState<PrivateEventInquiry[]>([]);
   const [eventsLoading, setEventsLoading] = useState(true);
   const [lightboxImage, setLightboxImage] = useState<string | null>(null);
   const [profileTab, setProfileTab] = useState<'orders' | 'reservations' | 'reviews' | 'events' | 'loyalty' | 'feedback' | 'preferences'>('orders');
   const [feedback, setFeedback] = useState<any[]>([]);
   const [feedbackLoading, setFeedbackLoading] = useState(true);
   const navigate = useNavigate();

   // Handle tab parameter from URL
   useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['orders', 'reservations', 'reviews', 'events', 'loyalty', 'feedback', 'preferences'].includes(tabParam)) {
         setProfileTab(tabParam as any);
      }
   }, []);

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
      // If user is passed as prop and already loaded, use it directly
      if (initialUser) {
         const userWithDefaults: User = {
            ...initialUser,
            loyaltyPoints: initialUser.loyaltyPoints ?? 0,
            tier: initialUser.tier || 'Bronze',
            memberSince: initialUser.memberSince || new Date().getFullYear().toString(),
            name: initialUser.name || 'User',
            id: initialUser.id || String(initialUser._id || ''),
            phone: initialUser.phone || '',
            email: initialUser.email || '',
            address: initialUser.address || '',
            birthday: initialUser.birthday || '',
            history: initialUser.history || []
         };
         setUser(userWithDefaults);
         setEditData({
            name: userWithDefaults.name,
            email: userWithDefaults.email,
            phone: userWithDefaults.phone,
            address: userWithDefaults.address,
            birthday: userWithDefaults.birthday,
            favoriteCuisine: userWithDefaults.favoriteCuisine,
            dietaryRestrictions: userWithDefaults.dietaryRestrictions,
            preferredDiningTime: userWithDefaults.preferredDiningTime,
            specialRequests: userWithDefaults.specialRequests,
            password: '',
            confirmPassword: ''
         });
         setLoading(false);
         // Continue loading other data...
         const userIdInitial = initialUser.id || initialUser._id || initialUser.email;
         console.log('User ID for initial user:', userIdInitial, initialUser);
         if (userIdInitial && userIdInitial !== initialUser.email) {
           fetchUserOrders(userIdInitial)
             .then(setOrders)
             .catch(() => setOrders([]))
             .finally(() => setOrdersLoading(false));
           getUserFeedbackHistory(userIdInitial)
             .then(setFeedback)
             .catch(() => setFeedback([]))
             .finally(() => setFeedbackLoading(false));
         } else {
           setOrders([]);
           setOrdersLoading(false);
           setFeedback([]);
           setFeedbackLoading(false);
         }
         if (userIdInitial) {
           fetchUserReservations(userIdInitial)
             .then(setReservations)
             .catch(() => setReservations([]))
             .finally(() => setReservationsLoading(false));
         } else {
           setReservations([]);
           setReservationsLoading(false);
         }
         fetchUserReviews(initialUser.email)
           .then(setReviews)
           .catch(() => setReviews([]))
           .finally(() => setReviewsLoading(false));
         fetchPrivateEventInquiries()
           .then(allInquiries => {
             const userInquiries = allInquiries.filter(inq => inq.email === initialUser.email);
             setEventInquiries(userInquiries);
           })
           .catch(() => setEventInquiries([]))
           .finally(() => setEventsLoading(false));
         return;
      }

      const email = localStorage.getItem('userEmail');
      if (!email) {
         setLoading(false);
         setUser(null);
         setOrdersLoading(false);
         return;
      }
      fetchUserProfile(email)
         .then(profile => {
            const userWithDefaults: User = {
               ...profile,
               loyaltyPoints: profile.loyaltyPoints ?? 0,
               tier: profile.tier || 'Bronze',
               memberSince: profile.memberSince || new Date().getFullYear().toString(),
               name: profile.name || 'User',
               id: String(profile.id || profile._id || ''),
               phone: profile.phone || '',
               email: profile.email || '',
               address: profile.address || '',
               birthday: profile.birthday || '',
               history: profile.history || []
            };
            setUser(userWithDefaults);
                  setEditData({
                     name: userWithDefaults.name,
                     email: userWithDefaults.email,
                     phone: userWithDefaults.phone,
                     address: userWithDefaults.address,
                     birthday: userWithDefaults.birthday,
                     favoriteCuisine: userWithDefaults.favoriteCuisine,
                     dietaryRestrictions: userWithDefaults.dietaryRestrictions,
                     preferredDiningTime: userWithDefaults.preferredDiningTime,
                     specialRequests: userWithDefaults.specialRequests,
                     password: '',
                     confirmPassword: ''
                  });
            setLoading(false);
            // Fetch user's orders
            const userIdProfile = profile.id || profile._id || profile.email;
            console.log('User ID for profile:', userIdProfile, profile);
            if (userIdProfile && userIdProfile !== profile.email) {
              fetchUserOrders(userIdProfile)
                .then(setOrders)
                .catch(() => setOrders([]))
                .finally(() => setOrdersLoading(false));
              
              // Fetch user's feedback
              getUserFeedbackHistory(userIdProfile)
                .then(setFeedback)
                .catch(() => setFeedback([]))
                .finally(() => setFeedbackLoading(false));
            } else {
              setOrders([]);
              setOrdersLoading(false);
              setFeedback([]);
              setFeedbackLoading(false);
            }
            // Fetch user's reservations
            if (userIdProfile) {
              fetchUserReservations(userIdProfile)
                .then(setReservations)
                .catch(() => setReservations([]))
                .finally(() => setReservationsLoading(false));
            } else {
              setReservations([]);
              setReservationsLoading(false);
            }
            
            // Fetch user's reviews
            fetchUserReviews(profile.email)
              .then(setReviews)
              .catch(() => setReviews([]))
              .finally(() => setReviewsLoading(false));
            
            // Fetch user's private event inquiries
            fetchPrivateEventInquiries()
              .then(allInquiries => {
                const userInquiries = allInquiries.filter(inq => inq.email === profile.email);
                setEventInquiries(userInquiries);
              })
              .catch(() => setEventInquiries([]))
              .finally(() => setEventsLoading(false));
         })
         .catch(() => {
            setError('Could not load profile.');
            setLoading(false);
            setOrdersLoading(false);
            setReviewsLoading(false);
            setEventsLoading(false);
         });
   }, []);

   // Calculate next tier threshold based on current tier
   const getTierThresholds = () => {
      if (!user) return { current: 0, next: 500 };
      if (user.tier === 'Bronze') return { current: 0, next: 500 };
      if (user.tier === 'Silver') return { current: 500, next: 1500 };
      return { current: 1500, next: 3000 }; // Gold tier continues to 3000
   };
   
   const tiers = getTierThresholds();
   const userPoints = user?.loyaltyPoints || 0;
   const pointsTowardsTier = Math.max(0, userPoints - tiers.current);
   const pointsNeededForTier = Math.max(1, tiers.next - tiers.current);
   const progress = pointsNeededForTier > 0 ? Math.min((pointsTowardsTier / pointsNeededForTier) * 100, 100) : 0;

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
      if (user) setEditData({
         name: user.name,
         email: user.email,
         phone: user.phone,
         address: user.address,
         birthday: user.birthday,
         favoriteCuisine: user.favoriteCuisine,
         dietaryRestrictions: user.dietaryRestrictions,
         preferredDiningTime: user.preferredDiningTime,
         specialRequests: user.specialRequests,
         password: '',
         confirmPassword: ''
      });
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

   const openLightbox = (image: string) => {
      setLightboxImage(image);
      document.body.classList.add('overflow-hidden');
   };

   const closeLightbox = () => {
      setLightboxImage(null);
      document.body.classList.remove('overflow-hidden');
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
           <h1 className="text-4xl font-serif font-bold text-stone-900">Welcome, {user?.name?.split(' ')[0] || 'User'}</h1>
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
                         <div className="flex items-center gap-2">
                            <p className="text-2xl font-serif font-bold text-yellow-500">{user.tier} Member</p>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                              user.tier === 'Gold' ? 'bg-yellow-600' : 
                              user.tier === 'Silver' ? 'bg-gray-400' : 
                              'bg-amber-600'
                            }`}>
                              {user.tier === 'Gold' ? '⭐' : user.tier === 'Silver' ? '✨' : '🔥'} {user.tier}
                            </span>
                         </div>
                      </div>
                      <ChefHat className="text-stone-500" />
                   </div>
                   
                   <div className="mb-2 flex justify-between items-end">
                      <span className="text-4xl font-bold">{user.loyaltyPoints}</span>
                      <span className="text-sm text-stone-400">/ {tiers.next} pts</span>
                   </div>
                   
                   {/* Progress Bar */}
                   <div className="w-full h-3 bg-stone-700 rounded-full mb-4 overflow-hidden shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-300 rounded-full transition-all duration-500 ease-out shadow-lg"
                        style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }}
                      ></div>
                   </div>
                   
                   {/* Progress percentage text */}
                   <div className="text-right mb-2">
                      <p className="text-xs font-bold text-yellow-400">{Math.round(progress)}%</p>
                   </div>
                   
                   <p className="text-xs text-stone-400 flex items-center gap-1 mb-4">
                      <Gift size={12} className="text-yellow-500" />
                      {user.tier === 'Gold' ? 'You are at max tier! 🏆' : `${Math.max(0, tiers.next - user.loyaltyPoints)} points until next tier!`}
                   </p>

                   {/* Tier Benefits */}
                   <div className="border-t border-stone-700 pt-3 mt-3">
                      <p className="text-xs font-bold uppercase text-stone-300 mb-2">Your Benefits</p>
                      <div className="space-y-1 text-xs text-stone-300">
                        {user.tier === 'Gold' ? (
                          <>
                            <p>✓ Free dessert on special occasions</p>
                            <p>✓ 20% discount on all orders</p>
                            <p>✓ Priority reservations</p>
                          </>
                        ) : user.tier === 'Silver' ? (
                          <>
                            <p>✓ Free dessert at 1000 points</p>
                            <p>✓ 10% discount on all orders</p>
                            <p>✓ Early access to events</p>
                          </>
                        ) : (
                          <>
                            <p>✓ Earn points on every order</p>
                            <p>✓ Unlock rewards at 1000 points</p>
                            <p>✓ Exclusive offers via email</p>
                          </>
                        )}
                      </div>
                   </div>
                </div>
             </div>

             {/* Quick Stats */}
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-2xl border border-orange-200">
                   <p className="text-xs text-orange-600 font-bold uppercase mb-1">Total Spent</p>
                   <p className="text-2xl font-bold text-orange-900">Rs {(orders.reduce((sum, o) => sum + o.total, 0)).toFixed(0)}</p>
                   <p className="text-xs text-orange-600 mt-1">on {orders.length} orders</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-2xl border border-blue-200">
                   <p className="text-xs text-blue-600 font-bold uppercase mb-1">Member Since</p>
                   <p className="text-2xl font-bold text-blue-900">{new Date(user.memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                   <p className="text-xs text-blue-600 mt-1">loyal customer</p>
                </div>
             </div>

             {/* Personal Info Snippet */}
                     <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
                        <h3 className="font-bold text-lg mb-4">Account Details</h3>
                         <div className="space-y-2 text-sm text-stone-600">
                            <div className="flex items-center gap-3">
                               <Phone size={16} className="text-orange-500" />
                               <span>{user.phone || 'No phone saved'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                               <MessageSquare size={16} className="text-orange-500" />
                               <span>{user.email || 'No email on file'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                               <MapPin size={16} className="text-orange-500" />
                               <span>{user.address || 'Add your address'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                               <Calendar size={16} className="text-orange-500" />
                               <span>{user.birthday ? new Date(user.birthday).toLocaleDateString() : 'Birthday not set'}</span>
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
                                          <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Address</label>
                                          <input name="address" value={editData.address || ''} onChange={handleEditChange} className="w-full border rounded-xl px-3 py-2" placeholder="Street, city, etc." />
                                       </div>
                                       <div>
                                          <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Birthday</label>
                                          <input
                                             name="birthday"
                                             type="date"
                                             value={editData.birthday || ''}
                                             onChange={handleEditChange}
                                             className="w-full border rounded-xl px-3 py-2"
                                          />
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

               {/* Right Column: Tabbed Profile Activity */}
               <div className="md:col-span-2">
                  <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                     <div className="p-4 border-b border-stone-100">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                           {['loyalty', 'orders', 'reservations', 'reviews', 'events', 'feedback', 'preferences'].map(tab => (
                              <button
                                 key={tab}
                                 onClick={() => setProfileTab(tab as any)}
                                 className={`px-3 py-2 rounded-lg font-semibold text-xs transition-all whitespace-nowrap ${profileTab === tab ? 'bg-orange-600 text-white shadow-md' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                              >
                                 {tab === 'loyalty' ? '🏅 Loyalty' : tab === 'orders' ? '📦 Orders' : tab === 'reservations' ? '📅 Reservations' : tab === 'reviews' ? '⭐ Reviews' : tab === 'events' ? '🎉 Events' : tab === 'feedback' ? '💬 Feedback' : '❤️ Preferences'}
                              </button>
                           ))}
                        </div>
                     </div>
                     <div className="divide-y divide-stone-100 min-h-96">
                        {profileTab === 'orders' && (
                           <div>
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
                                           <span className="font-bold text-stone-900">Rs {order.total.toFixed(2)}</span>
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
                        )}
                        {profileTab === 'reservations' && (
                           <div>
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
                                                <p className="text-xs text-stone-500 mb-2">{res.name} • {res.guests} guests</p>
                                                {res.confirmationCode && (
                                                   <div className="mb-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
                                                      <p className="text-xs font-bold text-orange-700 mb-1">Confirmation Code</p>
                                                      <div className="flex items-center gap-2">
                                                         <span className="font-mono font-bold text-sm text-stone-900">{res.confirmationCode}</span>
                                                         <button
                                                            onClick={() => {
                                                               if (res.confirmationCode) {
                                                                  navigator.clipboard.writeText(res.confirmationCode);
                                                                  alert('Confirmation code copied!');
                                                               }
                                                            }}
                                                            className="p-1 text-orange-600 hover:bg-orange-100 rounded transition-colors"
                                                            title="Copy confirmation code"
                                                         >
                                                            📋
                                                         </button>
                                                      </div>
                                                   </div>
                                                )}
                                                <p className="text-sm text-stone-600">{res.notes || 'No special requests.'}</p>
                                           </div>
                                       </div>
                                       <div className="text-right flex flex-col items-end gap-2">
                                           <span className="font-bold text-stone-900">{res.phone}</span>
                                           <span className="text-xs text-stone-500">{res.email}</span>
                                           {res.status !== 'Cancelled' && res.status !== 'Completed' && (
                                              <button
                                                 onClick={async () => {
                                                    if (window.confirm('Are you sure you want to cancel this reservation?')) {
                                                       try {
                                                          const response = await fetch(`${API_URL}/reservations/${res.confirmationCode}`, {
                                                             method: 'DELETE'
                                                          });
                                                          if (response.ok) {
                                                             setReservations(prev => prev.filter(r => r._id !== res._id));
                                                             alert('Reservation cancelled successfully');
                                                          }
                                                       } catch (err) {
                                                          alert('Failed to cancel reservation');
                                                       }
                                                    }
                                                 }}
                                                 className="mt-2 px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                                              >
                                                 Cancel
                                              </button>
                                           )}
                                       </div>
                                    </div>
                                 ))
                              )}
                           </div>
                        )}
                        {profileTab === 'reviews' && (
                           <div>
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
                                                   <span key={i}>{i < review.rating ? '⭐' : '☆'}</span>
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
                                       {review.image && (
                                          <div className="my-3">
                                             <img
                                                src={review.image}
                                                alt="Review"
                                                className="max-w-xs h-32 object-cover rounded-lg border border-stone-200 cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => openLightbox(review.image)}
                                                onError={(e) => {
                                                   console.error('Image failed to load in profile:', review.image);
                                                   (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                                onLoad={() => {
                                                   console.log('Profile image loaded for review:', review._id);
                                                }}
                                             />
                                          </div>
                                       )}
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
                        )}
                        {profileTab === 'events' && (
                           <div>
                              {eventsLoading ? (
                                 <div className="p-6 text-center text-stone-500">Loading events...</div>
                              ) : eventInquiries.length === 0 ? (
                                 <div className="p-6 text-center text-stone-500">No private event inquiries yet.</div>
                              ) : (
                                 eventInquiries.map(inquiry => (
                                    <div key={inquiry._id} className="p-6 hover:bg-stone-50 transition-colors border-b border-stone-100 last:border-b-0">
                                       <div className="flex justify-between items-start mb-3">
                                          <div>
                                             <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-stone-900">{inquiry.eventType.charAt(0).toUpperCase() + inquiry.eventType.slice(1)} Event</span>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${inquiry.status === 'contacted' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{inquiry.status || 'new'}</span>
                                             </div>
                                             <p className="text-sm text-stone-500 mb-1">
                                                <Calendar size={14} className="inline mr-1" />
                                                {inquiry.eventDate ? new Date(inquiry.eventDate).toLocaleDateString() : 'Date TBD'} • {inquiry.guestCount} guests
                                             </p>
                                          </div>
                                          <p className="text-xs text-stone-400">{inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleDateString() : 'Recently'}</p>
                                       </div>
                                       {inquiry.message && (
                                          <p className="text-sm text-stone-600 mb-3 italic">"{inquiry.message}"</p>
                                       )}
                                       {inquiry.contactHistory && inquiry.contactHistory.length > 0 && (
                                          <div className="mt-4 p-3 bg-stone-50 rounded-lg border border-stone-200">
                                             <p className="text-xs font-semibold text-stone-600 mb-2">Staff Replies:</p>
                                             <div className="space-y-2">
                                                {inquiry.contactHistory.map((reply, idx) => (
                                                   <div key={idx} className="bg-white p-2 rounded text-xs border-l-2 border-orange-500">
                                                      <div className="font-semibold text-stone-900">{reply.subject || 'Follow-up'}</div>
                                                      <div className="text-stone-600 mt-1">{reply.body}</div>
                                                      <div className="text-[11px] text-stone-400 mt-1">{reply.staffName || 'Staff'} • {reply.sentAt ? new Date(reply.sentAt).toLocaleString() : 'Recently'}</div>
                                                   </div>
                                                ))}
                                             </div>
                                          </div>
                                       )}
                                    </div>
                                 ))
                              )}
                           </div>
                        )}

                        {/* Loyalty Dashboard Tab */}
                        {profileTab === 'loyalty' && user && (
                           <div className="p-6 space-y-6">
                              {/* Tier Overview */}
                              <div className="grid md:grid-cols-3 gap-4">
                                 <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-2xl border-2 border-amber-300">
                                    <p className="text-xs font-bold text-amber-700 uppercase mb-1">Bronze Tier</p>
                                    <p className="text-2xl font-bold text-amber-900">0</p>
                                    <p className="text-xs text-amber-700 mt-1">Entry Level</p>
                                 </div>
                                 <div className={`bg-gradient-to-br p-4 rounded-2xl border-2 transition-all ${user.tier === 'Silver' || (user.loyaltyPoints >= 500 && user.tier !== 'Gold') ? 'from-gray-100 to-gray-200 border-gray-400' : 'from-stone-50 to-stone-100 border-stone-300 opacity-60'}`}>
                                    <p className={`text-xs font-bold uppercase mb-1 ${user.tier === 'Silver' ? 'text-gray-700' : 'text-stone-600'}`}>Silver Tier</p>
                                    <p className={`text-2xl font-bold ${user.tier === 'Silver' ? 'text-gray-900' : 'text-stone-700'}`}>500+</p>
                                    <p className={`text-xs mt-1 ${user.tier === 'Silver' ? 'text-gray-700' : 'text-stone-600'}`}>Premium Member</p>
                                 </div>
                                 <div className={`bg-gradient-to-br p-4 rounded-2xl border-2 transition-all ${user.tier === 'Gold' ? 'from-yellow-100 to-yellow-200 border-yellow-400' : 'from-stone-50 to-stone-100 border-stone-300 opacity-60'}`}>
                                    <p className={`text-xs font-bold uppercase mb-1 ${user.tier === 'Gold' ? 'text-yellow-700' : 'text-stone-600'}`}>Gold Tier</p>
                                    <p className={`text-2xl font-bold ${user.tier === 'Gold' ? 'text-yellow-900' : 'text-stone-700'}`}>1500+</p>
                                    <p className={`text-xs mt-1 ${user.tier === 'Gold' ? 'text-yellow-700' : 'text-stone-600'}`}>VIP Member</p>
                                 </div>
                              </div>

                              {/* Current Status */}
                              <div className="bg-orange-50 p-6 rounded-2xl border-2 border-orange-300">
                                 <div className="flex items-center justify-between mb-4">
                                    <div>
                                       <p className="text-sm text-orange-700 font-semibold">Current Status</p>
                                       <p className="text-3xl font-bold text-orange-900 mt-1">{user.loyaltyPoints.toLocaleString()} Points</p>
                                    </div>
                                    <div className={`text-5xl ${user.tier === 'Gold' ? '⭐' : user.tier === 'Silver' ? '✨' : '🔥'}`}></div>
                                 </div>
                                 <p className="text-sm text-orange-700">{user.tier} Member • Member since {user.memberSince || new Date().getFullYear()}</p>
                              </div>

                              {/* Progress to Next Tier */}
                              {user.tier !== 'Gold' && (
                                 <div className="bg-white p-6 rounded-2xl border-2 border-orange-200">
                                    <p className="text-sm font-bold text-stone-900 mb-3">Progress to {user.tier === 'Silver' ? 'Gold' : 'Silver'} Tier</p>
                                    <div className="space-y-2">
                                       <div className="flex justify-between text-xs text-stone-600">
                                          <span>{user.loyaltyPoints} points</span>
                                          <span>{user.tier === 'Silver' ? '1500' : '500'} points</span>
                                       </div>
                                       <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden">
                                          <div 
                                             className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500"
                                             style={{ 
                                                width: `${user.tier === 'Silver' 
                                                   ? Math.min((user.loyaltyPoints / 1500) * 100, 100)
                                                   : Math.min((user.loyaltyPoints / 500) * 100, 100)
                                                }%`
                                             }}
                                          ></div>
                                       </div>
                                       <p className="text-xs text-orange-700 font-semibold">
                                          {user.tier === 'Silver' 
                                             ? `${1500 - user.loyaltyPoints} points until Gold`
                                             : `${500 - user.loyaltyPoints} points until Silver`
                                          }
                                       </p>
                                    </div>
                                 </div>
                              )}

                              {/* Tier Benefits */}
                              <div className="space-y-3">
                                 <h4 className="font-bold text-stone-900 text-lg">Your Benefits</h4>
                                 <div className="grid md:grid-cols-2 gap-4">
                                    <div className={`p-4 rounded-xl border-2 ${user.tier === 'Gold' || user.loyaltyPoints >= 500 ? 'border-orange-400 bg-orange-50' : 'border-stone-300 bg-stone-50'}`}>
                                       <p className={`font-bold text-sm mb-2 ${user.tier === 'Gold' || user.loyaltyPoints >= 500 ? 'text-orange-700' : 'text-stone-600'}`}>💰 10% Discount</p>
                                       <p className={`text-xs ${user.tier === 'Gold' || user.loyaltyPoints >= 500 ? 'text-orange-600' : 'text-stone-600'}`}>Available at Silver tier and above</p>
                                    </div>
                                    <div className={`p-4 rounded-xl border-2 ${user.tier === 'Silver' ? 'border-gray-400 bg-gray-50' : user.tier === 'Gold' ? 'border-yellow-400 bg-yellow-50' : 'border-stone-300 bg-stone-50'}`}>
                                       <p className={`font-bold text-sm mb-2 ${user.tier === 'Silver' ? 'text-gray-700' : user.tier === 'Gold' ? 'text-yellow-700' : 'text-stone-600'}`}>🎂 Free Dessert</p>
                                       <p className={`text-xs ${user.tier === 'Silver' ? 'text-gray-600' : user.tier === 'Gold' ? 'text-yellow-600' : 'text-stone-600'}`}>Unlock at {user.tier === 'Gold' ? 'Gold tier (current!)' : user.tier === 'Silver' ? 'Silver tier (current!)' : '1000 points'}</p>
                                    </div>
                                    <div className={`p-4 rounded-xl border-2 ${user.tier === 'Gold' ? 'border-yellow-400 bg-yellow-50' : 'border-stone-300 bg-stone-50'}`}>
                                       <p className={`font-bold text-sm mb-2 ${user.tier === 'Gold' ? 'text-yellow-700' : 'text-stone-600'}`}>🏅 Priority Support</p>
                                       <p className={`text-xs ${user.tier === 'Gold' ? 'text-yellow-600' : 'text-stone-600'}`}>Available at Gold tier{user.tier === 'Gold' ? ' (current!)' : ''}</p>
                                    </div>
                                    <div className="p-4 rounded-xl border-2 border-orange-400 bg-orange-50">
                                       <p className="font-bold text-sm mb-2 text-orange-700">⭐ Earn Points</p>
                                       <p className="text-xs text-orange-600">10 points per $1 spent on all orders</p>
                                    </div>
                                 </div>
                              </div>

                              {/* Quick Stats */}
                              <div className="grid md:grid-cols-3 gap-4 bg-stone-50 p-4 rounded-2xl">
                                 <div className="text-center">
                                    <p className="text-2xl font-bold text-orange-600">{orders.length}</p>
                                    <p className="text-xs text-stone-600 mt-1">Total Orders</p>
                                 </div>
                                 <div className="text-center">
                                    <p className="text-2xl font-bold text-orange-600">${orders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(0)}</p>
                                    <p className="text-xs text-stone-600 mt-1">Total Spent</p>
                                 </div>
                                 <div className="text-center">
                                    <p className="text-2xl font-bold text-orange-600">{(orders.reduce((sum, o) => sum + (o.total || 0), 0) * 10).toFixed(0)}</p>
                                    <p className="text-xs text-stone-600 mt-1">Points Earned</p>
                                 </div>
                              </div>
                           </div>
                        )}

                        {/* Feedback Tab */}
                        {profileTab === 'feedback' && (
                           <div>
                              {feedbackLoading ? (
                                 <div className="p-6 text-center text-stone-500">Loading feedback...</div>
                              ) : feedback.length === 0 ? (
                                 <div className="p-6 text-center text-stone-500">
                                    <p className="text-lg font-semibold mb-2">No feedback submitted yet</p>
                                    <p className="text-sm">Your order feedback will appear here after you submit it</p>
                                 </div>
                              ) : (
                                 <div className="space-y-4 p-6">
                                    {feedback.map((item, index) => (
                                       <div key={index} className="bg-stone-50 rounded-lg p-4 border border-stone-200">
                                          <div className="flex justify-between items-start mb-3">
                                             <div>
                                                <p className="font-semibold text-gray-900">Order #{item.orderId}</p>
                                                <p className="text-xs text-stone-600 mt-1">
                                                   {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recently'}
                                                </p>
                                             </div>
                                             <div className="text-right">
                                                <div className="text-2xl">{'⭐'.repeat(item.overallRating)}</div>
                                                <p className="text-sm font-bold text-orange-600 mt-1">{item.overallRating}/5</p>
                                             </div>
                                          </div>

                                          {/* Rating Summary */}
                                          <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                                             {item.serviceRating && (
                                                <div className="bg-white p-2 rounded border border-stone-200">
                                                   <p className="text-stone-600 font-semibold">Service</p>
                                                   <p className="font-bold text-orange-600">{item.serviceRating}★</p>
                                                </div>
                                             )}
                                             {item.deliveryRating && (
                                                <div className="bg-white p-2 rounded border border-stone-200">
                                                   <p className="text-stone-600 font-semibold">Delivery</p>
                                                   <p className="font-bold text-orange-600">{item.deliveryRating}★</p>
                                                </div>
                                             )}
                                             <div className="bg-white p-2 rounded border border-stone-200">
                                                <p className="text-stone-600 font-semibold">Recommend</p>
                                                <p className="font-bold text-green-600">{item.wouldRecommend ? '✅ Yes' : '❌ No'}</p>
                                             </div>
                                          </div>

                                          {/* Items Rated */}
                                          {item.items && item.items.length > 0 && (
                                             <div className="mb-3">
                                                <p className="text-xs font-semibold text-stone-700 mb-2">Items Rated:</p>
                                                <div className="space-y-1">
                                                   {item.items.map((menuItem: any, idx: number) => (
                                                      menuItem.itemRating && (
                                                         <div key={idx} className="flex justify-between items-center text-xs bg-white p-2 rounded border border-stone-200">
                                                            <span className="text-gray-700">{menuItem.itemName}</span>
                                                            <span className="text-orange-600 font-bold">{menuItem.itemRating}⭐</span>
                                                         </div>
                                                      )
                                                   ))}
                                                </div>
                                             </div>
                                          )}

                                          {/* Comment */}
                                          {item.comment && (
                                             <div className="bg-white p-3 rounded border-l-4 border-orange-500 mb-2">
                                                <p className="text-xs font-semibold text-stone-700 mb-1">Your Comment:</p>
                                                <p className="text-sm text-gray-700">{item.comment}</p>
                                             </div>
                                          )}

                                          {/* Suggestions */}
                                          {item.improvementSuggestions && (
                                             <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                                                <p className="text-xs font-semibold text-stone-700 mb-1">Suggestions for Improvement:</p>
                                                <p className="text-sm text-gray-700">{item.improvementSuggestions}</p>
                                             </div>
                                          )}
                                       </div>
                                    ))}
                                 </div>
                              )}
                           </div>
                        )}
                        {profileTab === 'preferences' && (
                           <div className="p-6 space-y-6">
                              {/* Dining Preferences */}
                              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl border-2 border-orange-300">
                                 <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <Heart size={20} className="text-orange-600" />
                                    Dining Preferences
                                 </h4>
                                 <div className="grid md:grid-cols-3 gap-4">
                                    <div className="bg-white p-4 rounded-xl shadow-sm">
                                       <p className="text-xs font-bold text-orange-600 uppercase mb-2">Favorite Cuisine</p>
                                       <p className="text-sm font-semibold text-stone-900">{user.favoriteCuisine || '—'}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl shadow-sm">
                                       <p className="text-xs font-bold text-orange-600 uppercase mb-2">Dietary Restrictions</p>
                                       <p className="text-sm font-semibold text-stone-900">{user.dietaryRestrictions || 'None'}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl shadow-sm">
                                       <p className="text-xs font-bold text-orange-600 uppercase mb-2">Dining Time</p>
                                       <p className="text-sm font-semibold text-stone-900">{user.preferredDiningTime || 'Anytime'}</p>
                                    </div>
                                 </div>
                              </div>

                              {/* Special Requests */}
                              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border-2 border-blue-300">
                                 <h4 className="font-bold text-lg mb-4">📝 Special Requests</h4>
                                 <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
                                    <p className="text-stone-700 text-sm leading-relaxed">{user.specialRequests || 'No special requests on file'}</p>
                                 </div>
                                 <button
                                    onClick={handleEditClick}
                                    className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-700 transition-colors"
                                 >
                                    Update Preferences
                                 </button>
                              </div>

                              {/* Notification Settings */}
                              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border-2 border-purple-300">
                                 <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <Bell size={20} className="text-purple-600" />
                                    Notification Settings
                                 </h4>
                                 <div className="space-y-3">
                                    <label className="flex items-center gap-3 p-4 bg-white rounded-xl cursor-pointer hover:shadow-md transition-all border border-purple-200">
                                       <input type="checkbox" defaultChecked className="w-5 h-5 accent-purple-600" />
                                       <div>
                                          <p className="text-sm font-semibold text-stone-900">📦 Order Updates</p>
                                          <p className="text-xs text-stone-600">Get notified about order status changes</p>
                                       </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-4 bg-white rounded-xl cursor-pointer hover:shadow-md transition-all border border-purple-200">
                                       <input type="checkbox" defaultChecked className="w-5 h-5 accent-purple-600" />
                                       <div>
                                          <p className="text-sm font-semibold text-stone-900">🔔 Reservation Reminders</p>
                                          <p className="text-xs text-stone-600">Receive reminders before your reservations</p>
                                       </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-4 bg-white rounded-xl cursor-pointer hover:shadow-md transition-all border border-purple-200">
                                       <input type="checkbox" defaultChecked className="w-5 h-5 accent-purple-600" />
                                       <div>
                                          <p className="text-sm font-semibold text-stone-900">🎉 Special Offers</p>
                                          <p className="text-xs text-stone-600">Promotional deals and member-only offers</p>
                                       </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-4 bg-white rounded-xl cursor-pointer hover:shadow-md transition-all border border-purple-200">
                                       <input type="checkbox" className="w-5 h-5 accent-purple-600" />
                                       <div>
                                          <p className="text-sm font-semibold text-stone-900">✨ New Dishes</p>
                                          <p className="text-xs text-stone-600">News about new menu items and specials</p>
                                       </div>
                                    </label>
                                 </div>
                              </div>

                              {/* Membership Perks */}
                              <div>
                                 <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <Gift size={20} className="text-orange-600" />
                                    Your Membership Perks ({user.tier})
                                 </h4>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {user.tier === 'Gold' ? (
                                       <>
                                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                             <p className="font-semibold text-yellow-900 mb-1">20% Discount</p>
                                             <p className="text-xs text-yellow-700">All orders and reservations</p>
                                          </div>
                                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                             <p className="font-semibold text-yellow-900 mb-1">Priority Support</p>
                                             <p className="text-xs text-yellow-700">Fast-tracked customer service</p>
                                          </div>
                                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                             <p className="font-semibold text-yellow-900 mb-1">Free Dessert</p>
                                             <p className="text-xs text-yellow-700">On your birthday month</p>
                                          </div>
                                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                             <p className="font-semibold text-yellow-900 mb-1">Early Access</p>
                                             <p className="text-xs text-yellow-700">VIP events & new menu launches</p>
                                          </div>
                                       </>
                                    ) : user.tier === 'Silver' ? (
                                       <>
                                          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                                             <p className="font-semibold text-gray-900 mb-1">10% Discount</p>
                                             <p className="text-xs text-gray-700">All orders and reservations</p>
                                          </div>
                                          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                                             <p className="font-semibold text-gray-900 mb-1">Birthday Bonus</p>
                                             <p className="text-xs text-gray-700">50 extra loyalty points</p>
                                          </div>
                                          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                                             <p className="font-semibold text-gray-900 mb-1">Event Access</p>
                                             <p className="text-xs text-gray-700">Invitation to special events</p>
                                          </div>
                                          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                                             <p className="font-semibold text-gray-900 mb-1">Exclusive Menu</p>
                                             <p className="text-xs text-gray-700">Limited items for members only</p>
                                          </div>
                                       </>
                                    ) : (
                                       <>
                                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                             <p className="font-semibold text-amber-900 mb-1">Earn Points</p>
                                             <p className="text-xs text-amber-700">1 point per $1 spent</p>
                                          </div>
                                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                             <p className="font-semibold text-amber-900 mb-1">Special Offers</p>
                                             <p className="text-xs text-amber-700">Exclusive deals via email</p>
                                          </div>
                                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                             <p className="font-semibold text-amber-900 mb-1">Fast Checkout</p>
                                             <p className="text-xs text-amber-700">Saved preferences & address</p>
                                          </div>
                                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                             <p className="font-semibold text-amber-900 mb-1">Unlock Rewards</p>
                                             <p className="text-xs text-amber-700">Free items at 1000 points</p>
                                          </div>
                                       </>
                                    )}
                                 </div>
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
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

export default ProfilePage;
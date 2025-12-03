import React from 'react';
import { NavLink } from 'react-router-dom';
import { Trophy, ChefHat, Gift, Phone, MessageSquare, Calendar, Package, RefreshCcw } from 'lucide-react';
import { User } from '../types';

interface ProfilePageProps {
  user: User | null;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user }) => {
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

  const nextRewardPoints = 1000;
  const progress = (user.loyaltyPoints / nextRewardPoints) * 100;

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
                   <div className="flex items-center gap-3">
                      <Calendar size={16} className="text-orange-500" />
                      <span>Member since {user.memberSince}</span>
                   </div>
                </div>
             </div>
          </div>

          {/* Right Column: Order History */}
          <div className="md:col-span-2">
             <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                   <h3 className="font-bold text-xl text-stone-900">Recent Orders</h3>
                   <button className="text-sm text-orange-600 font-medium hover:underline">View All</button>
                </div>
                <div className="divide-y divide-stone-100">
                   {user.history.map(order => (
                      <div key={order.id} className="p-6 hover:bg-stone-50 transition-colors flex flex-col sm:flex-row gap-4 justify-between items-center">
                         <div className="flex items-start gap-4 flex-1">
                            <div className="bg-orange-50 p-3 rounded-full text-orange-600">
                               <Package size={20} />
                            </div>
                            <div>
                               <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-stone-900">Order {order.id}</span>
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] uppercase font-bold rounded-full">{order.status}</span>
                               </div>
                               <p className="text-xs text-stone-500 mb-1">{order.date}</p>
                               <p className="text-sm text-stone-600">{order.items.join(', ')}</p>
                            </div>
                         </div>
                         <div className="text-right flex flex-col items-end gap-2">
                            <span className="font-bold text-stone-900">${order.total.toFixed(2)}</span>
                            <button className="flex items-center gap-1 text-xs font-bold text-orange-600 border border-orange-200 px-3 py-1.5 rounded-full hover:bg-orange-50 transition-colors">
                               <RefreshCcw size={12} /> Reorder
                            </button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
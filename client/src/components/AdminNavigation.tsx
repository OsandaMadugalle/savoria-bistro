import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChefHat } from 'lucide-react';
import { User } from '../types';

interface AdminNavigationProps {
  user: User | null;
  onLogout: () => void;
}

const AdminNavigation: React.FC<AdminNavigationProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 w-full bg-gradient-to-r from-stone-900 to-orange-900 border-b border-orange-700 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center shadow-lg">
              <ChefHat size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold text-white tracking-tight">
                {(user?.role === 'admin' || user?.role === 'masterAdmin') ? 'Savoria Admin' : 'Staff Portal'}
              </h1>
              <p className="text-xs text-orange-200">
                {(user?.role === 'admin' || user?.role === 'masterAdmin') ? 'Management System' : 'Kitchen Management System'}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-2">
            {(user?.role === 'admin' || user?.role === 'masterAdmin') ? (
              <>
                <button
                  onClick={() => navigate('/admin')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    isActive('/admin') 
                      ? 'bg-orange-600 text-white' 
                      : 'text-orange-100 hover:bg-stone-800'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate('/staff')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    isActive('/staff') 
                      ? 'bg-orange-600 text-white' 
                      : 'text-orange-100 hover:bg-stone-800'
                  }`}
                >
                  Staff Portal
                </button>
                <button
                  onClick={() => navigate('/delivery')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    isActive('/delivery') 
                      ? 'bg-orange-600 text-white' 
                      : 'text-orange-100 hover:bg-stone-800'
                  }`}
                >
                  Delivery
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/staff')}
                className="px-4 py-2 rounded-lg font-medium transition-all bg-orange-600 text-white"
              >
                Staff Portal
              </button>
            )}
          </div>

          {/* Right Side - User Menu */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-stone-800 bg-opacity-50 px-4 py-2 rounded-lg border border-orange-700">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-white">{user?.name}</p>
                <p className="text-xs text-orange-200 capitalize">{user?.role}</p>
              </div>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem('userEmail');
                onLogout();
                navigate('/');
              }}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-sm transition-colors shadow-md"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavigation;

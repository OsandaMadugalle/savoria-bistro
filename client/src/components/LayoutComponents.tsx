import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingBag, Phone, MapPin, Instagram, Facebook, Twitter, User as UserIcon, LogIn, LogOut, Mail, Lock, Shield, ChefHat, Eye, EyeOff } from 'lucide-react';
import { CartItem, User } from '../types';
import { loginUser } from '../services/api';

interface NavbarProps {
  cart: CartItem[];
  user: User | null;
  onLogin: (user: User) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ cart, user, onLogin, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Auth Modal State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isLoginModalOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    // Clean up on unmount
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isLoginModalOpen]);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  
  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Signup Form State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [signupError, setSignupError] = useState('');
  // Removed duplicate showSignupPassword declaration

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/menu', label: 'Menu' },
    { path: '/gallery', label: 'Gallery' },
    { path: '/reservation', label: 'Reservations' },
    { path: '/tracker', label: 'Track Order' },
  ];

  const closeMenu = () => setIsMobileMenuOpen(false);

  const openAuthModal = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setLoginError('');
    setIsLoginModalOpen(true);
    closeMenu();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail || !loginPassword) {
      setLoginError('Email and password are required.');
      return;
    }
    setIsLoggingIn(true);
    try {
      const loggedInUser = await loginUser(loginEmail, loginPassword);
      onLogin(loggedInUser);
      localStorage.setItem('userEmail', loggedInUser.email);
      setIsLoginModalOpen(false);
      // Role-based Redirect
      if (loggedInUser.role === 'admin') {
        navigate('/admin');
      } else if (loggedInUser.role === 'staff') {
        navigate('/staff');
      } else {
        // Redirect customer to Home page after signin
        navigate('/');
      }
    } catch (err) {
      setLoginError('Invalid email or password.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    if (!signupPassword || !signupConfirmPassword) {
      setSignupError('Please enter and confirm your password.');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match.');
      return;
    }
    try {
      const newUser = await import('../services/api').then(mod => mod.registerUser({
        name: signupName,
        email: signupEmail,
        phone: signupPhone,
        password: signupPassword
      }));
      onLogin(newUser);
      setIsLoginModalOpen(false);
      navigate('/profile');
    } catch (err) {
      setSignupError('Signup failed. Please try again.');
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md border-b border-stone-200 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <NavLink to="/" className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
                Savoria<span className="text-orange-600">.</span>
              </NavLink>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-6 xl:space-x-8">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) => 
                    `text-sm font-medium transition-colors hover:text-orange-600 ${isActive ? 'text-orange-600' : 'text-stone-600'}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}

              <div className="h-6 w-px bg-stone-300 mx-2"></div>
              
              {/* User Actions */}
              {user ? (
                <div className="relative">
                  <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 text-sm font-medium text-stone-700 hover:text-orange-600 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <span className="hidden lg:block">{user.name.split(' ')[0]}</span>
                  </button>
                  
                  {isUserMenuOpen && (
                     <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-stone-100 py-2 animate-in fade-in slide-in-from-top-2">
                        <NavLink 
                          to="/profile" 
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
                        >
                           <UserIcon size={16} /> My Profile
                        </NavLink>
                        
                        {/* Role Based Links */}
                        {user.role === 'admin' && (
                             <NavLink to="/admin" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"><Shield size={16} /> Admin Dashboard</NavLink>
                        )}
                        {(user.role === 'staff' || user.role === 'admin') && (
                             <NavLink to="/staff" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"><ChefHat size={16} /> Staff Portal</NavLink>
                        )}

                        <button 
                          onClick={() => { onLogout(); setIsUserMenuOpen(false); navigate('/'); }}
                          className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                           <LogOut size={16} /> Sign Out
                        </button>
                     </div>
                  )}
                </div>
              ) : (
                <button 
                  onClick={() => openAuthModal('signin')}
                  className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-orange-600 transition-colors"
                >
                  <LogIn size={18} /> Sign In
                </button>
              )}
              
              <NavLink to="/order" className="relative p-2 text-stone-600 hover:text-orange-600 transition-colors">
                <ShoppingBag size={22} />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-orange-600 rounded-full">
                    {cartCount}
                  </span>
                )}
              </NavLink>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-4">
              <NavLink to="/order" className="relative p-2 text-stone-600 hover:text-orange-600 transition-colors">
                <ShoppingBag size={22} />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-orange-600 rounded-full">
                    {cartCount}
                  </span>
                )}
              </NavLink>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-stone-600 hover:text-orange-600 focus:outline-none"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-stone-100 absolute w-full shadow-lg h-screen">
            <div className="px-4 pt-2 pb-6 space-y-2">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={closeMenu}
                  className={({ isActive }) => 
                    `block px-3 py-3 rounded-md text-base font-medium ${isActive ? 'bg-orange-50 text-orange-600' : 'text-stone-700 hover:bg-stone-50'}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="border-t border-stone-100 my-4 pt-4">
                {user ? (
                  <>
                     <NavLink to="/profile" onClick={closeMenu} className="block px-3 py-3 rounded-md text-base font-medium text-stone-700 hover:bg-stone-50">My Profile ({user.name})</NavLink>
                     {user.role === 'admin' && <NavLink to="/admin" onClick={closeMenu} className="block px-3 py-3 rounded-md text-base font-medium text-stone-700 hover:bg-stone-50">Admin Dashboard</NavLink>}
                     {(user.role === 'staff' || user.role === 'admin') && <NavLink to="/staff" onClick={closeMenu} className="block px-3 py-3 rounded-md text-base font-medium text-stone-700 hover:bg-stone-50">Staff Portal</NavLink>}
                     <button onClick={() => { onLogout(); closeMenu(); }} className="block w-full text-left px-3 py-3 rounded-md text-base font-medium text-red-600 hover:bg-red-50">Sign Out</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => openAuthModal('signin')} className="block w-full text-left px-3 py-3 rounded-md text-base font-medium text-stone-700 hover:bg-stone-50">Sign In</button>
                    <button onClick={() => openAuthModal('signup')} className="block w-full text-left px-3 py-3 rounded-md text-base font-bold text-orange-600 hover:bg-orange-50">Create Account</button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Auth Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 transition-colors z-10"
            >
              <X size={20} />
            </button>
            
            <div className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-serif font-bold text-stone-900">
                  {authMode === 'signin' ? 'Welcome Back' : 'Join Savoria'}
                </h2>
                <p className="text-stone-500 text-sm mt-1">
                  {authMode === 'signin' ? 'Sign in to access your rewards.' : 'Create an account to start earning points.'}
                </p>
              </div>

              {authMode === 'signin' ? (
                /* SIGN IN FORM */
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {loginError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">{loginError}</div>}
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 text-stone-400" size={18} />
                      <input 
                        type="email" 
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 text-stone-400" size={18} />
                      <input 
                        type={showPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-3 text-stone-400 hover:text-orange-600 focus:outline-none"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={isLoggingIn}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-orange-200 mt-2 disabled:opacity-70"
                  >
                    {isLoggingIn ? 'Signing In...' : 'Sign In'}
                  </button>
                  
                  {/* Quick Login Helpers for Demo */}
                  <div className="mt-4 p-3 bg-stone-50 rounded-lg border border-stone-100 text-xs text-stone-500">
                     <p className="font-bold mb-1">Demo Credentials:</p>
                     <p>Staff: <code className="bg-white px-1 rounded">staff@savoria.com</code> / <code className="bg-white px-1 rounded">staff123</code></p>
                     <p>Admin: <code className="bg-white px-1 rounded">admin@savoria.com</code> / <code className="bg-white px-1 rounded">admin123</code></p>
                  </div>
                </form>
              ) : (
                /* SIGN UP FORM */
                <form onSubmit={handleSignupSubmit} className="space-y-4">
                  {signupError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">{signupError}</div>}
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Full Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-3 text-stone-400" size={18} />
                      <input 
                        required
                        type="text" 
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 text-stone-400" size={18} />
                      <input 
                        required
                        type="email" 
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 text-stone-400" size={18} />
                      <input 
                        required
                        type="tel" 
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        placeholder="(555) 000-0000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Create Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 text-stone-400" size={18} />
                      <input 
                        required
                        type={showSignupPassword ? "text" : "password"}
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        placeholder="Create a password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword((prev) => !prev)}
                        className="absolute right-3 top-3 text-stone-400 hover:text-orange-600 focus:outline-none"
                        tabIndex={-1}
                        aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                      >
                        {showSignupPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 text-stone-400" size={18} />
                      <input 
                        required
                        type={showSignupConfirmPassword ? "text" : "password"}
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupConfirmPassword((prev) => !prev)}
                        className="absolute right-3 top-3 text-stone-400 hover:text-orange-600 focus:outline-none"
                        tabIndex={-1}
                        aria-label={showSignupConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showSignupConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3.5 rounded-xl transition-colors mt-2"
                  >
                    Create Account
                  </button>
                </form>
              )}
            </div>
            
            <div className="bg-stone-50 p-4 text-center text-sm text-stone-600 border-t border-stone-100">
               {authMode === 'signin' ? (
                  <>Don't have an account? <button onClick={() => setAuthMode('signup')} className="text-orange-600 font-bold hover:underline">Join Savoria Rewards</button></>
               ) : (
                  <>Already have an account? <button onClick={() => setAuthMode('signin')} className="text-orange-600 font-bold hover:underline">Sign In</button></>
               )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const Footer: React.FC = () => {
  return (
    <footer className="bg-stone-900 text-stone-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-white text-xl font-serif font-bold mb-4">Savoria.</h3>
          <p className="mb-4 text-sm leading-relaxed max-w-xs">
            Experience the finest flavors in a warm, inviting atmosphere. 
            Where tradition meets modern culinary art.
          </p>
          <div className="flex space-x-4 mb-6">
            <a href="#" className="hover:text-white transition-colors"><Instagram size={20} /></a>
            <a href="#" className="hover:text-white transition-colors"><Facebook size={20} /></a>
            <a href="#" className="hover:text-white transition-colors"><Twitter size={20} /></a>
          </div>
          <div className="flex flex-col gap-2">
            <NavLink to="/reviews" className="text-sm text-orange-600 hover:text-orange-500 font-medium">
              Read Customer Reviews &rarr;
            </NavLink>
            <NavLink to="/contact" className="text-sm text-stone-500 hover:text-white transition-colors">
              Contact Support
            </NavLink>
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Contact</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 text-orange-600" />
              <span>123 Culinary Avenue,<br />Food District, NY 10012</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={18} className="text-orange-600" />
              <span>(555) 123-4567</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Opening Hours</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between max-w-[200px]">
              <span>Mon - Thu</span>
              <span>11:00 AM - 10:00 PM</span>
            </li>
            <li className="flex justify-between max-w-[200px]">
              <span>Fri - Sat</span>
              <span>11:00 AM - 11:00 PM</span>
            </li>
            <li className="flex justify-between max-w-[200px]">
              <span>Sunday</span>
              <span>10:00 AM - 9:30 PM</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="mt-12 border-t border-stone-800 pt-8 text-center text-xs flex justify-between items-center">
        <span>&copy; {new Date().getFullYear()} Savoria Bistro. All rights reserved.</span>
        <NavLink to="/staff" className="text-stone-600 hover:text-stone-300 transition-colors">Staff Login</NavLink>
      </div>
    </footer>
  );
};
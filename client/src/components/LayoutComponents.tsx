import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingBag, Phone, MapPin, Instagram, Facebook, Twitter, User as UserIcon, LogIn, LogOut, Mail, Lock, ChefHat, Eye, EyeOff, Calendar } from 'lucide-react';
import { CartItem, User } from '../types';
import { loginUser, subscribeNewsletter } from '../services/api';

// Toast notification helper
const showToast = (message: string, type: 'success' | 'error') => {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-semibold z-50 animate-fade-in ${
    type === 'success' ? 'bg-green-600' : 'bg-red-600'
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
};

interface NavbarProps {
  cart: CartItem[];
  user: User | null;
  onLogin: (user: User) => void;
  onLogout: () => void;
  isLoginModalOpen?: boolean;
  setIsLoginModalOpen?: (value: boolean) => void;
  authMode?: 'signin' | 'signup';
  setAuthMode?: (mode: 'signin' | 'signup') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ cart, user, onLogin, onLogout, isLoginModalOpen: externalIsLoginModalOpen, setIsLoginModalOpen: externalSetIsLoginModalOpen, authMode: externalAuthMode, setAuthMode: externalSetAuthMode }) => {
  // Auth Modal State - use external state if provided, otherwise use internal
  const [internalIsLoginModalOpen, setInternalIsLoginModalOpen] = useState(false);
  const isLoginModalOpen = externalIsLoginModalOpen !== undefined ? externalIsLoginModalOpen : internalIsLoginModalOpen;
  const setIsLoginModalOpen = externalSetIsLoginModalOpen || setInternalIsLoginModalOpen;
  
  const [internalAuthMode, setInternalAuthMode] = useState<'signin' | 'signup'>('signin');
  const authMode = externalAuthMode !== undefined ? externalAuthMode : internalAuthMode;
  const setAuthMode = externalSetAuthMode || setInternalAuthMode;

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

  const navigate = useNavigate();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    // Basic validation
    if (!loginEmail || !loginPassword) {
      setLoginError('Email and password are required.');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(loginEmail)) {
      setLoginError('Please enter a valid email address.');
      return;
    }
    // Strong password validation
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!strongPasswordRegex.test(loginPassword)) {
      setLoginError('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
      return;
    }
    setIsLoggingIn(true);
    try {
      const loggedInUser = await loginUser(loginEmail, loginPassword);
      const userWithId = { ...loggedInUser, id: String(loggedInUser._id || loggedInUser.id) };
      onLogin(userWithId);
      localStorage.setItem('userEmail', userWithId.email);
      setIsLoginModalOpen(false);
      if (userWithId.role === 'masterAdmin') {
        navigate('/admin');
      } else if (userWithId.role === 'admin') {
        navigate('/admin');
      } else if (userWithId.role === 'staff') {
        navigate('/staff');
      } else {
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
    // Basic validation
    if (!signupName.trim()) {
      setSignupError('Full name is required.');
      return;
    }
    if (!signupEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(signupEmail)) {
      setSignupError('Please enter a valid email address.');
      return;
    }
    if (!signupPhone || !/^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(signupPhone)) {
      setSignupError('Please enter a valid phone number.');
      return;
    }
    if (!signupPassword || !signupConfirmPassword) {
      setSignupError('Please enter and confirm your password.');
      return;
    }
    // Strong password validation
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!strongPasswordRegex.test(signupPassword)) {
      setSignupError('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match.');
      return;
    }
    try {
      await import('../services/api').then(mod => mod.registerUser({
        name: signupName,
        email: signupEmail,
        phone: signupPhone,
        password: signupPassword
      }));
      setIsLoginModalOpen(false);
      navigate('/profile');
    } catch (err) {
      setSignupError('Signup failed. Please try again.');
    }
  };

  return (
    <>
      {/* Show Admin Navbar for Master Admin and Admin */}
      {user && (user.role === 'masterAdmin' || user.role === 'admin') ? (
        <AdminNavbar user={user} onLogout={onLogout} />
      ) : (
        /* Show Regular Customer Navbar */
        <CustomerNavbar 
          cart={cart} 
          user={user} 
          onLogout={onLogout} 
          isLoginModalOpen={isLoginModalOpen}
          setIsLoginModalOpen={setIsLoginModalOpen}
          authMode={authMode}
          setAuthMode={setAuthMode}
          loginEmail={loginEmail}
          setLoginEmail={setLoginEmail}
          loginPassword={loginPassword}
          setLoginPassword={setLoginPassword}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          loginError={loginError}
          setLoginError={setLoginError}
          isLoggingIn={isLoggingIn}
          signupName={signupName}
          setSignupName={setSignupName}
          signupEmail={signupEmail}
          setSignupEmail={setSignupEmail}
          signupPhone={signupPhone}
          setSignupPhone={setSignupPhone}
          signupPassword={signupPassword}
          setSignupPassword={setSignupPassword}
          signupConfirmPassword={signupConfirmPassword}
          setSignupConfirmPassword={setSignupConfirmPassword}
          showSignupPassword={showSignupPassword}
          setShowSignupPassword={setShowSignupPassword}
          showSignupConfirmPassword={showSignupConfirmPassword}
          setShowSignupConfirmPassword={setShowSignupConfirmPassword}
          signupError={signupError}
          handleLoginSubmit={handleLoginSubmit}
          handleSignupSubmit={handleSignupSubmit}
        />
      )}
    </>
  );
};

// Admin Navbar Component - For Master Admin and Admin users
const AdminNavbar: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
    navigate('/');
    setIsUserMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-gradient-to-r from-stone-900 to-orange-900 border-b border-orange-700 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <NavLink to="/" className="text-2xl font-serif font-bold text-white tracking-tight">
              Savoria<span className="text-orange-400">.</span>
            </NavLink>
            <span className="ml-3 px-3 py-1 bg-orange-600 text-white text-xs font-bold rounded-full">
              {user.role === 'masterAdmin' ? 'Master Admin' : 'Admin'}
            </span>
          </div>

          {/* Admin Nav Links */}
          <div className="hidden md:flex items-center space-x-2">
            <NavLink
              to="/admin"
              className={({ isActive }) => `px-4 py-2 rounded-lg font-medium transition-all ${isActive ? 'bg-orange-600 text-white' : 'text-orange-100 hover:bg-stone-800'}`}
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/staff"
              className={({ isActive }) => `px-4 py-2 rounded-lg font-medium transition-all ${isActive ? 'bg-orange-600 text-white' : 'text-orange-100 hover:bg-stone-800'}`}
            >
              Staff Portal
            </NavLink>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-orange-200 flex items-center justify-center text-orange-900 font-bold text-sm">
                  {user.name.charAt(0)}
                </div>
                <span className="hidden sm:block text-sm">{user.name.split(' ')[0]}</span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-stone-200 py-2 animate-in fade-in slide-in-from-top-2 z-50">
                  <div className="px-4 py-3 border-b border-stone-100">
                    <p className="text-sm font-bold text-stone-900">{user.name}</p>
                    <p className="text-xs text-stone-500">{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Customer Navbar Component - For regular customers and staff
interface CustomerNavbarProps {
  cart: CartItem[];
  user: User | null;
  onLogout: () => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (value: boolean) => void;
  authMode: 'signin' | 'signup';
  setAuthMode: (mode: 'signin' | 'signup') => void;
  loginEmail: string;
  setLoginEmail: (value: string) => void;
  loginPassword: string;
  setLoginPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  loginError: string;
  setLoginError: (value: string) => void;
  isLoggingIn: boolean;
  signupName: string;
  setSignupName: (value: string) => void;
  signupEmail: string;
  setSignupEmail: (value: string) => void;
  signupPhone: string;
  setSignupPhone: (value: string) => void;
  signupPassword: string;
  setSignupPassword: (value: string) => void;
  signupConfirmPassword: string;
  setSignupConfirmPassword: (value: string) => void;
  showSignupPassword: boolean;
  setShowSignupPassword: (value: boolean) => void;
  showSignupConfirmPassword: boolean;
  setShowSignupConfirmPassword: (value: boolean) => void;
  signupError: string;
  handleLoginSubmit: (e: React.FormEvent) => Promise<void>;
  handleSignupSubmit: (e: React.FormEvent) => Promise<void>;
}

const CustomerNavbar: React.FC<CustomerNavbarProps> = ({
  cart,
  user,
  onLogout,
  isLoginModalOpen,
  setIsLoginModalOpen,
  authMode,
  setAuthMode,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  showPassword,
  setShowPassword,
  loginError,
  setLoginError,
  isLoggingIn,
  signupName,
  setSignupName,
  signupEmail,
  setSignupEmail,
  signupPhone,
  setSignupPhone,
  signupPassword,
  setSignupPassword,
  signupConfirmPassword,
  setSignupConfirmPassword,
  showSignupPassword,
  setShowSignupPassword,
  showSignupConfirmPassword,
  setShowSignupConfirmPassword,
  signupError,
  handleLoginSubmit,
  handleSignupSubmit,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isLoginModalOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isLoginModalOpen]);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const navLinks = [
    { path: '/', label: 'Home', icon: null, highlight: false },
    { path: '/menu', label: 'Menu', icon: null, highlight: false },
    { path: '/gallery', label: 'Gallery', icon: null, highlight: false },
    { path: '/tracker', label: 'Track Order', icon: null, highlight: false },
    { path: '/reservation', label: 'Book a Table', icon: Calendar, highlight: true },
    { path: '/reviews', label: 'Reviews', icon: null, highlight: false },
  ];

  const closeMenu = () => setIsMobileMenuOpen(false);

  const openAuthModal = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setLoginError('');
    setIsLoginModalOpen(true);
    closeMenu();
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
            <div className="hidden md:flex items-center space-x-1 xl:space-x-2">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) => {
                    if (link.highlight) {
                      return `flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isActive ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`;
                    }
                    return `px-1 py-2 text-sm font-medium transition-colors hover:text-orange-600 ${isActive ? 'text-orange-600' : 'text-stone-600'}`;
                  }}
                >
                  {link.icon && <link.icon size={18} />}
                  {link.label}
                </NavLink>
              ))}

              <div className="h-6 w-px bg-stone-200 mx-4"></div>
              
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
                            {(user.role === 'staff') && (
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
                  className={({ isActive }) => {
                    if (link.highlight) {
                      return `flex items-center gap-2 px-4 py-3 rounded-lg text-base font-semibold transition-all ${isActive ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`;
                    }
                    return `block px-4 py-3 rounded-lg text-base font-medium transition-colors ${isActive ? 'bg-orange-50 text-orange-600' : 'text-stone-700 hover:bg-stone-50'}`;
                  }}
                >
                  {link.icon && <link.icon size={20} />}
                  {link.label}
                </NavLink>
              ))}
              <div className="border-t border-stone-100 my-4 pt-4">
                {user ? (
                  <>
                     <NavLink to="/profile" onClick={closeMenu} className="block px-3 py-3 rounded-md text-base font-medium text-stone-700 hover:bg-stone-50">My Profile ({user.name})</NavLink>
                     {(user.role === 'staff') && <NavLink to="/staff" onClick={closeMenu} className="block px-3 py-3 rounded-md text-base font-medium text-stone-700 hover:bg-stone-50">Staff Portal</NavLink>}
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
                        onClick={() => setShowPassword(!showPassword)}
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
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
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
                        onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
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
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      await subscribeNewsletter(email);
      showToast('Thank you for subscribing!', 'success');
      setEmail('');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to subscribe', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-gradient-to-b from-stone-900 to-stone-950 text-stone-300">
      {/* Newsletter Section */}
      <div className="bg-orange-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-serif font-bold mb-1">Subscribe to Our Newsletter</h3>
            <p className="text-orange-100 text-sm">Get exclusive offers and culinary tips delivered to your inbox</p>
          </div>
          <form className="flex gap-2 w-full md:w-auto" onSubmit={handleNewsletterSubmit}>
            <input 
              type="email" 
              placeholder="Enter your email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-2 rounded-lg text-stone-900 flex-1 md:flex-none w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-white"
              required
              disabled={isSubmitting}
            />
            <button 
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-700 text-white rounded-lg font-bold transition-colors"
            >
              {isSubmitting ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-white text-2xl font-serif font-bold mb-4">Savoria.</h3>
            <p className="text-sm leading-relaxed text-stone-400 mb-4">
              Experience the finest flavors in a warm, inviting atmosphere. Where tradition meets modern culinary art.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="bg-stone-800 hover:bg-orange-600 text-stone-300 hover:text-white p-2 rounded-lg transition-all"><Instagram size={18} /></a>
              <a href="#" className="bg-stone-800 hover:bg-orange-600 text-stone-300 hover:text-white p-2 rounded-lg transition-all"><Facebook size={18} /></a>
              <a href="#" className="bg-stone-800 hover:bg-orange-600 text-stone-300 hover:text-white p-2 rounded-lg transition-all"><Twitter size={18} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><NavLink to="/" className="text-stone-400 hover:text-orange-600 transition-colors">Home</NavLink></li>
              <li><NavLink to="/menu" className="text-stone-400 hover:text-orange-600 transition-colors">Menu</NavLink></li>
              <li><NavLink to="/gallery" className="text-stone-400 hover:text-orange-600 transition-colors">Gallery</NavLink></li>
              <li><NavLink to="/reviews" className="text-stone-400 hover:text-orange-600 transition-colors">Reviews</NavLink></li>
              <li><NavLink to="/reservation" className="text-stone-400 hover:text-orange-600 transition-colors">Reservations</NavLink></li>
              <li><NavLink to="/contact" className="text-stone-400 hover:text-orange-600 transition-colors">Contact</NavLink></li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Contact Info</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 text-orange-600 flex-shrink-0" />
                <span className="text-stone-400">123 Culinary Avenue,<br />Food District, NY 10012</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-orange-600" />
                <a href="tel:(555)123-4567" className="text-stone-400 hover:text-orange-600 transition-colors">(555) 123-4567</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-orange-600" />
                <a href="mailto:info@savoria.com" className="text-stone-400 hover:text-orange-600 transition-colors">info@savoria.com</a>
              </li>
            </ul>
          </div>

          {/* Hours Section */}
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Hours</h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li className="flex justify-between gap-4">
                <span>Mon - Thu</span>
                <span className="text-orange-600">11 AM - 10 PM</span>
              </li>
              <li className="flex justify-between gap-4">
                <span>Fri - Sat</span>
                <span className="text-orange-600">11 AM - 11 PM</span>
              </li>
              <li className="flex justify-between gap-4">
                <span>Sunday</span>
                <span className="text-orange-600">10 AM - 9:30 PM</span>
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-stone-700">
              <p className="text-xs text-stone-500 flex items-center gap-1 mb-2">🟢 Currently Open</p>
              <p className="text-xs text-stone-400">Come visit us today!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-stone-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-stone-500">
          <span>&copy; {new Date().getFullYear()} Savoria Bistro. All rights reserved. | Crafted with ❤️</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-orange-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-orange-600 transition-colors">Terms of Service</a>
            <NavLink to="/staff" className="hover:text-orange-600 transition-colors">Staff Portal</NavLink>
          </div>
        </div>
      </div>
    </footer>
  );
};
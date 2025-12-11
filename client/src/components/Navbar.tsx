import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingBag, User as UserIcon, LogIn, LogOut, Mail, Lock, ChefHat, Eye, EyeOff, Calendar, AlertCircle, Phone, MapPin } from 'lucide-react';
import { CartItem, User } from '../types';
import { loginUser } from '../services/api';

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
  const [signupAddress, setSignupAddress] = useState('');
  const [signupBirthday, setSignupBirthday] = useState('');
  
  // Email verification state
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  // Field-specific error states
  const [signupFieldErrors, setSignupFieldErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [loginFieldErrors, setLoginFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const navigate = useNavigate();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const errors: typeof loginFieldErrors = {};
    
    // Field validation
    if (!loginEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(loginEmail)) {
      errors.email = 'Email is invalid.';
    }
    
    if (!loginPassword) {
      errors.password = 'Password is required.';
    }
    
    // If there are field errors, display them and return
    if (Object.keys(errors).length > 0) {
      setLoginFieldErrors(errors);
      return;
    }
    
    setLoginFieldErrors({});
    setIsLoggingIn(true);
    try {
      const loggedInUser = await loginUser(loginEmail, loginPassword);
      console.log('Logged in user from API:', loggedInUser);
      
      // Extract only user properties, not token/refreshToken/expiresIn
      const cleanUser = {
        _id: loggedInUser._id,
        email: loggedInUser.email,
        name: loggedInUser.name,
        phone: loggedInUser.phone,
        address: loggedInUser.address,
        birthday: loggedInUser.birthday,
        role: loggedInUser.role,
        tier: loggedInUser.tier,
        loyaltyPoints: loggedInUser.loyaltyPoints,
        memberSince: loggedInUser.memberSince,
        favoriteCuisine: loggedInUser.favoriteCuisine,
        dietaryRestrictions: loggedInUser.dietaryRestrictions,
        preferredDiningTime: loggedInUser.preferredDiningTime,
        specialRequests: loggedInUser.specialRequests
      };
      
      const userWithDefaults: User = { 
        ...cleanUser,
        id: String(cleanUser._id || ''),
        loyaltyPoints: cleanUser.loyaltyPoints ?? 0,
        tier: cleanUser.tier || 'Bronze',
        memberSince: cleanUser.memberSince || new Date().getFullYear().toString(),
        name: cleanUser.name || 'User',
        phone: cleanUser.phone || '',
        email: cleanUser.email || '',
        address: cleanUser.address || '',
        birthday: cleanUser.birthday || '',
        history: []
      };
      
      console.log('User with defaults:', userWithDefaults);
      
      onLogin(userWithDefaults);
      localStorage.setItem('userEmail', userWithDefaults.email);
      setIsLoginModalOpen(false);
      if (userWithDefaults.role === 'masterAdmin') {
        navigate('/admin');
      } else if (userWithDefaults.role === 'admin') {
        navigate('/admin');
      } else if (userWithDefaults.role === 'staff') {
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
    const errors: typeof signupFieldErrors = {};
    
    // Field validation
    if (!signupName.trim()) {
      errors.name = 'Full name is required.';
    }
    
    if (!signupEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(signupEmail)) {
      errors.email = 'Please enter a valid email address.';
    }
    
    // Sri Lankan phone number validation: +94 XX XXX XXXX or 0XX XXX XXXX
    if (!signupPhone || !/^(\+94|0)?[1-9]\d{8}$/.test(signupPhone.replace(/[\s\-]/g, ''))) {
      errors.phone = 'Please enter a valid Sri Lankan phone number (e.g., +94 11 234 5678 or 011 234 5678).';
    }
    
    // Strong password validation
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!signupPassword) {
      errors.password = 'Password is required.';
    } else if (!strongPasswordRegex.test(signupPassword)) {
      errors.password = 'Password must be 8+ chars with uppercase, lowercase, number & special character.';
    }
    
    if (!signupConfirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (signupPassword !== signupConfirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    
    // If there are field errors, display them and return
    if (Object.keys(errors).length > 0) {
      setSignupFieldErrors(errors);
      return;
    }
    
    setSignupFieldErrors({});
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          phone: signupPhone,
          password: signupPassword,
          address: signupAddress,
          birthday: signupBirthday,
          role: 'customer'
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      // Show verification form
      setVerificationEmail(signupEmail);
      setNeedsVerification(true);
      setSignupError('');
    } catch (err: any) {
      setSignupError(err.message || 'Signup failed. Please try again.');
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    try {
      const response = await fetch(`${API_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: verificationEmail, 
          code: verificationCode.toUpperCase() 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      // Email verified - show login form
      setNeedsVerification(false);
      setAuthMode('signin');
      setVerificationCode('');
      setLoginEmail(verificationEmail);
      setSignupName('');
      setSignupEmail('');
      setSignupPhone('');
      setSignupPassword('');
      setSignupConfirmPassword('');
      setSignupAddress('');
      setSignupBirthday('');
      setSignupError('');
      setLoginError('Email verified! Please sign in with your credentials.');
    } catch (err: any) {
      setSignupError(err.message || 'Verification failed. Please try again.');
    }
  };

  const handleResendVerification = async () => {
    setSignupError('');

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    try {
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend verification');
      }

      alert('Verification code sent! Please check your email.');
    } catch (err: any) {
      setSignupError(err.message || 'Failed to resend verification code.');
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
          signupAddress={signupAddress}
          setSignupAddress={setSignupAddress}
          signupBirthday={signupBirthday}
          setSignupBirthday={setSignupBirthday}
          showSignupPassword={showSignupPassword}
          setShowSignupPassword={setShowSignupPassword}
          showSignupConfirmPassword={showSignupConfirmPassword}
          setShowSignupConfirmPassword={setShowSignupConfirmPassword}
          signupError={signupError}
          setSignupError={setSignupError}
          signupFieldErrors={signupFieldErrors}
          setSignupFieldErrors={setSignupFieldErrors}
          loginFieldErrors={loginFieldErrors}
          setLoginFieldErrors={setLoginFieldErrors}
          handleLoginSubmit={handleLoginSubmit}
          handleSignupSubmit={handleSignupSubmit}
          needsVerification={needsVerification}
          setNeedsVerification={setNeedsVerification}
          verificationCode={verificationCode}
          setVerificationCode={setVerificationCode}
          verificationEmail={verificationEmail}
          setVerificationEmail={setVerificationEmail}
          handleVerification={handleVerification}
          handleResendVerification={handleResendVerification}
        />
      )}
    </>
  );
};

// Admin Navbar Component - For Master Admin and Admin users
const AdminNavbar: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    localStorage.removeItem('userEmail');
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-gradient-to-r from-stone-900 to-orange-900 border-b border-orange-700 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <div className="text-2xl font-serif font-bold text-white tracking-tight cursor-default">
              Savoria<span className="text-orange-400">.</span>
            </div>
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
            <NavLink
              to="/delivery"
              className={({ isActive }) => `px-4 py-2 rounded-lg font-medium transition-all ${isActive ? 'bg-orange-600 text-white' : 'text-orange-100 hover:bg-stone-800'}`}
            >
              Delivery
            </NavLink>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-stone-800 bg-opacity-50 px-4 py-2 rounded-lg border border-orange-700">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center font-bold text-white">
                {user.name.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-white">{user.name}</p>
                <p className="text-xs text-orange-200 capitalize">{user.role}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
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
  setSignupError: (value: string) => void;
  signupAddress: string;
  setSignupAddress: (value: string) => void;
  signupBirthday: string;
  setSignupBirthday: (value: string) => void;
  signupFieldErrors: { name?: string; email?: string; phone?: string; password?: string; confirmPassword?: string };
  setSignupFieldErrors: (errors: { name?: string; email?: string; phone?: string; password?: string; confirmPassword?: string }) => void;
  loginFieldErrors: { email?: string; password?: string };
  setLoginFieldErrors: (errors: { email?: string; password?: string }) => void;
  handleLoginSubmit: (e: React.FormEvent) => Promise<void>;
  handleSignupSubmit: (e: React.FormEvent) => Promise<void>;
  needsVerification: boolean;
  setNeedsVerification: (value: boolean) => void;
  verificationCode: string;
  setVerificationCode: (value: string) => void;
  verificationEmail: string;
  setVerificationEmail: (value: string) => void;
  handleVerification: (e: React.FormEvent) => Promise<void>;
  handleResendVerification: () => Promise<void>;
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
  signupAddress,
  setSignupAddress,
  signupBirthday,
  setSignupBirthday,
  showSignupPassword,
  setShowSignupPassword,
  showSignupConfirmPassword,
  setShowSignupConfirmPassword,
  signupError,
  setSignupError,
  signupFieldErrors,
  setSignupFieldErrors,
  loginFieldErrors,
  setLoginFieldErrors,
  handleLoginSubmit,
  handleSignupSubmit,
  needsVerification,
  setNeedsVerification,
  verificationCode,
  setVerificationCode,
  verificationEmail,
  // setVerificationEmail is intentionally not used in this component
  handleVerification,
  handleResendVerification,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const navLinks = [
    { path: '/', label: 'Home', icon: null, highlight: false },
    { path: '/menu', label: 'Menu', icon: null, highlight: false },
    { path: '/gallery', label: 'Gallery', icon: null, highlight: false },
    { path: '/tracker', label: 'Track Order', icon: null, highlight: false },
    { path: '/reservation', label: 'Book a Table', icon: Calendar, highlight: true },
    { path: '/reviews', label: 'Reviews', icon: null, highlight: false },
    { path: '/contact', label: 'Contact', icon: null, highlight: false },
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
      <nav className="fixed top-0 left-0 w-full bg-gradient-to-r from-white via-stone-50 to-white/95 backdrop-blur-md shadow-lg border-b-2 border-orange-200 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center group">
              <NavLink to="/" className="text-3xl font-serif font-bold text-stone-900 tracking-tight hover:text-orange-600 transition-colors duration-300">
                Savoria<span className="text-orange-600">.</span>
              </NavLink>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-0.5 xl:space-x-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) => {
                    if (link.highlight) {
                      return `flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all transform hover:scale-105 ${isActive ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-600/40' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`;
                    }
                    return `px-3 py-2.5 text-sm font-semibold transition-all duration-300 hover:text-orange-600 border-b-2 border-transparent hover:border-orange-300 ${isActive ? 'text-orange-600 border-orange-600' : 'text-stone-600'}`;
                  }}
                >
                  {link.icon && <link.icon size={18} />}
                  {link.label}
                </NavLink>
              ))}

              <div className="h-6 w-px bg-stone-200 mx-4"></div>
              
              {/* User Actions */}
              {user ? (
                <div className="relative ml-4" ref={userMenuRef}>
                  <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-700 hover:bg-orange-50 transition-all duration-300 border border-stone-200 hover:border-orange-300"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold shadow-md">
                      {user.name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="hidden lg:block text-stone-700">{user.name?.split(' ')[0] || 'User'}</span>
                    <span className="text-orange-600">▼</span>
                  </button>
                  
                  {isUserMenuOpen && (
                     <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-orange-200 py-3 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                        {/* User Info Header */}
                        <div className="px-4 py-3 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-orange-100">
                           <p className="font-bold text-stone-900">{user.name || 'User'}</p>
                           <p className="text-xs text-stone-600">{user.email}</p>
                           <p className="text-xs mt-1 px-2 py-1 bg-orange-200 text-orange-900 rounded-full inline-block font-semibold">{user.tier || 'Bronze'} Member</p>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                           <NavLink 
                             to="/profile" 
                             onClick={() => setIsUserMenuOpen(false)}
                             className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-orange-50 transition-colors border-l-3 border-transparent hover:border-orange-500"
                           >
                              <UserIcon size={18} className="text-orange-600" /> My Profile
                           </NavLink>
                           {/* Role Based Links */}
                           {(user.role === 'staff') && (
                              <>
                                 <div className="border-t border-orange-100 my-2"></div>
                                 <NavLink 
                                    to="/staff" 
                                    onClick={() => setIsUserMenuOpen(false)} 
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-blue-700 hover:bg-blue-50 transition-colors border-l-3 border-transparent hover:border-blue-500"
                                 >
                                    <ChefHat size={18} /> Staff Portal
                                 </NavLink>
                              </>
                           )}

                           <div className="border-t border-orange-100 my-2"></div>
                           <button 
                             onClick={() => { onLogout(); setIsUserMenuOpen(false); navigate('/'); }}
                             className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-l-3 border-transparent hover:border-red-500"
                           >
                              <LogOut size={18} /> Sign Out
                           </button>
                        </div>
                     </div>
                  )}
                </div>
              ) : (
                <button 
                  onClick={() => openAuthModal('signin')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-lg hover:scale-105 transition-all duration-300 ml-4"
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
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200 max-h-[90vh]">
            <button 
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 transition-colors z-10"
            >
              <X size={20} />
            </button>
            
            <div className="p-8 max-h-[82vh] overflow-auto">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-serif font-bold text-stone-900">
                  {needsVerification ? 'Verify Your Email' : authMode === 'signin' ? 'Welcome Back' : 'Join Savoria'}
                </h2>
                <p className="text-stone-500 text-sm mt-1">
                  {needsVerification 
                    ? `We've sent a verification code to ${verificationEmail}` 
                    : authMode === 'signin' 
                    ? 'Sign in to access your rewards.' 
                    : 'Create an account to start earning points.'}
                </p>
              </div>

              {needsVerification ? (
                /* EMAIL VERIFICATION FORM */
                <form onSubmit={handleVerification} className="space-y-4">
                  {signupError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium flex items-start gap-2">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <div>{signupError}</div>
                  </div>}
                  
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-2 text-center">Verification Code</label>
                    <div className="flex justify-center gap-2 mb-2">
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <input
                          key={index}
                          type="text"
                          maxLength={1}
                          value={verificationCode[index] || ''}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase();
                            if (value.match(/^[A-Z0-9]$/)) {
                              const newCode = verificationCode.split('');
                              newCode[index] = value;
                              setVerificationCode(newCode.join(''));
                              // Auto-focus next input
                              if (index < 5) {
                                const nextInput = (e.target.parentElement as HTMLElement)?.children[index + 1] as HTMLInputElement;
                                nextInput?.focus();
                              }
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
                              // Move to previous input on backspace if current is empty
                              const prevInput = ((e.target as HTMLElement).parentElement as HTMLElement)?.children[index - 1] as HTMLInputElement;
                              prevInput?.focus();
                            }
                          }}
                          onPaste={(e) => {
                            e.preventDefault();
                            const pastedData = e.clipboardData.getData('text').toUpperCase().slice(0, 6);
                            setVerificationCode(pastedData);
                            // Focus last filled input or first empty
                            const focusIndex = Math.min(pastedData.length, 5);
                            const targetInput = ((e.target as HTMLElement).parentElement as HTMLElement)?.children[focusIndex] as HTMLInputElement;
                            targetInput?.focus();
                          }}
                          className="w-12 h-14 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-center font-mono text-xl font-bold uppercase"
                          required
                        />
                      ))}
                    </div>
                    <p className="text-xs text-stone-500 mt-1 text-center">Check your email for the verification code</p>
                  </div>

                  <button 
                    type="submit" 
                    disabled={verificationCode.length !== 6}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Verify Email
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      className="text-sm text-orange-600 hover:text-orange-700 font-semibold"
                    >
                      Resend verification code
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setNeedsVerification(false);
                      setAuthMode('signin');
                      setVerificationCode('');
                      setSignupError('');
                    }}
                    className="w-full bg-stone-100 hover:bg-stone-200 text-stone-900 font-semibold py-3 rounded-xl transition-colors"
                  >
                    Back to Sign In
                  </button>
                </form>
              ) : authMode === 'signin' ? (
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
                        onChange={(e) => { setLoginEmail(e.target.value); if (loginFieldErrors.email) setLoginFieldErrors({ ...loginFieldErrors, email: undefined }); }}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all outline-none focus:ring-2 ${loginFieldErrors.email ? 'border-red-400 focus:ring-red-500' : 'border-stone-200 focus:ring-orange-500'}`}
                        placeholder="your@email.com"
                      />
                    </div>
                    {loginFieldErrors.email && <p className="text-red-600 text-xs mt-1 font-medium">{loginFieldErrors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 text-stone-400" size={18} />
                      <input 
                        type={showPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => { setLoginPassword(e.target.value); if (loginFieldErrors.password) setLoginFieldErrors({ ...loginFieldErrors, password: undefined }); }}
                        className={`w-full pl-10 pr-10 py-3 rounded-xl border transition-all outline-none focus:ring-2 ${loginFieldErrors.password ? 'border-red-400 focus:ring-red-500' : 'border-stone-200 focus:ring-orange-500'}`}
                        placeholder="Your password"
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
                    {loginFieldErrors.password && <p className="text-red-600 text-xs mt-1 font-medium">{loginFieldErrors.password}</p>}
                  </div>
                  <button 
                    type="submit" 
                    disabled={isLoggingIn}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-orange-200 mt-2 disabled:opacity-70"
                  >
                    {isLoggingIn ? 'Signing In...' : 'Sign In'}
                  </button>
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
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all outline-none focus:ring-2 ${(signupFieldErrors as any).name ? 'border-red-400 focus:ring-red-500' : 'border-stone-200 focus:ring-orange-500'}`}
                        placeholder="Your name"
                      />
                    </div>
                    {(signupFieldErrors as any).name && <p className="text-red-600 text-xs mt-1 font-medium">{(signupFieldErrors as any).name}</p>}
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
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all outline-none focus:ring-2 ${(signupFieldErrors as any).email ? 'border-red-400 focus:ring-red-500' : 'border-stone-200 focus:ring-orange-500'}`}
                        placeholder="your@email.com"
                      />
                    </div>
                    {(signupFieldErrors as any).email && <p className="text-red-600 text-xs mt-1 font-medium">{(signupFieldErrors as any).email}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 text-stone-400" size={18} />
                      <input 
                        required
                        type="tel" 
                        value={signupPhone}
                        onChange={(e) => { const phoneValue = e.target.value.replace(/[^0-9()\s\-]/g, ''); setSignupPhone(phoneValue); if (signupFieldErrors.phone) setSignupFieldErrors({ ...signupFieldErrors, phone: undefined }); }}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all outline-none focus:ring-2 ${signupFieldErrors.phone ? 'border-red-400 focus:ring-red-500' : 'border-stone-200 focus:ring-orange-500'}`}
                        placeholder="07X XXX XXXX or +94 XX XXX XXXX"
                      />
                    </div>
                    {signupFieldErrors.phone && <p className="text-red-600 text-xs mt-1 font-medium">{signupFieldErrors.phone}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-stone-400" size={18} />
                      <input 
                        type="text"
                        value={signupAddress}
                        onChange={(e) => setSignupAddress(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        placeholder="Apartment, Street, City, District"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Birthday</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 text-stone-400" size={18} />
                      <input 
                        type="date"
                        value={signupBirthday}
                        onChange={(e) => setSignupBirthday(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        placeholder="MM/DD/YYYY"
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
                        onChange={(e) => { setSignupPassword(e.target.value); if (signupFieldErrors.password) setSignupFieldErrors({ ...signupFieldErrors, password: undefined }); }}
                        className={`w-full pl-10 pr-10 py-3 rounded-xl border transition-all outline-none focus:ring-2 ${signupFieldErrors.password ? 'border-red-400 focus:ring-red-500' : 'border-stone-200 focus:ring-orange-500'}`}
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
                    {signupFieldErrors.password && <p className="text-red-600 text-xs mt-1 font-medium">{signupFieldErrors.password}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 text-stone-400" size={18} />
                      <input 
                        required
                        type={showSignupConfirmPassword ? "text" : "password"}
                        value={signupConfirmPassword}
                        onChange={(e) => { setSignupConfirmPassword(e.target.value); if (signupFieldErrors.confirmPassword) setSignupFieldErrors({ ...signupFieldErrors, confirmPassword: undefined }); }}
                        className={`w-full pl-10 pr-10 py-3 rounded-xl border transition-all outline-none focus:ring-2 ${signupFieldErrors.confirmPassword ? 'border-red-400 focus:ring-red-500' : 'border-stone-200 focus:ring-orange-500'}`}
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
                    {signupFieldErrors.confirmPassword && <p className="text-red-600 text-xs mt-1 font-medium">{signupFieldErrors.confirmPassword}</p>}
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
            
            {!needsVerification && (
              <div className="bg-stone-50 p-4 text-center text-sm text-stone-600 border-t border-stone-100">
                 {authMode === 'signin' ? (
                    <>Don't have an account? <button onClick={() => setAuthMode('signup')} className="text-orange-600 font-bold hover:underline">Join Savoria Rewards</button></>
                 ) : (
                    <>Already have an account? <button onClick={() => setAuthMode('signin')} className="text-orange-600 font-bold hover:underline">Sign In</button></>
                 )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

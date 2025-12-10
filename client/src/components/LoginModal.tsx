import React, { useState, useEffect } from 'react';
import { X, Loader, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '', phone: '' });
  const [signupError, setSignupError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');

  useEffect(() => {
    console.log('📊 State changed:', { needsVerification, isSignup, verificationEmail, isOpen });
  }, [needsVerification, isSignup, verificationEmail, isOpen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token
      localStorage.setItem('token', data.token);
      localStorage.setItem('accessToken', data.token); // Store as accessToken as well for compatibility
      localStorage.setItem('user', JSON.stringify(data.user));

      // Small delay to ensure localStorage is written before reload
      await new Promise(resolve => setTimeout(resolve, 100));

      // Reload page to update user context
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSignupError('');

    if (!signupData.name || !signupData.email || !signupData.password) {
      setSignupError('All fields are required');
      setLoading(false);
      return;
    }

    if (signupData.password.length < 8) {
      setSignupError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(signupData.password)) {
      setSignupError('Password must contain uppercase, lowercase, and number');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupData.name,
          email: signupData.email,
          password: signupData.password,
          phone: signupData.phone,
          role: 'customer'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      // Registration successful - show verification screen
      console.log('✅ Signup successful, showing verification form');
      console.log('Setting verificationEmail to:', signupData.email);
      console.log('Setting needsVerification to: true');
      
      setVerificationEmail(signupData.email);
      setNeedsVerification(true);
      setSignupError('');
      setLoading(false);
      
      console.log('State should be updated now');
    } catch (err: any) {
      console.error('❌ Signup error:', err);
      setSignupError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSignupError('');

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

      // Email verified successfully - show login form
      setNeedsVerification(false);
      setIsSignup(false);
      setVerificationCode('');
      setEmail(verificationEmail);
      setPassword('');
      setSignupError('');
      setError('Email verified! Please sign in with your credentials.');
      setLoading(false);
    } catch (err: any) {
      setSignupError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    setSignupError('');

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

      setSignupError('');
      alert('Verification code sent! Please check your email.');
    } catch (err: any) {
      setSignupError(err.message || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  console.log('🔍 Render state:', { needsVerification, isSignup, verificationEmail });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-in fade-in scale-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors"
        >
          <X size={24} />
        </button>

        {needsVerification ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-bold text-stone-900 mb-2">Verify Your Email</h2>
              <p className="text-stone-600">We've sent a verification code to <strong>{verificationEmail}</strong></p>
            </div>

            {signupError && (
              <div className="bg-red-50 border border-red-300 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <div>{signupError}</div>
              </div>
            )}

            <form onSubmit={handleVerification} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 mb-2">Verification Code</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character code"
                  maxLength={6}
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm uppercase tracking-wider text-center font-mono text-lg"
                  required
                />
                <p className="text-xs text-stone-500 mt-1">Check your email for the verification code</p>
              </div>

              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Email'
                )}
              </button>
            </form>

            <div className="text-center">
              <button
                onClick={handleResendVerification}
                disabled={loading}
                className="text-sm text-orange-600 hover:text-orange-700 font-semibold disabled:opacity-50"
              >
                Resend verification code
              </button>
            </div>

            <button
              onClick={() => {
                setNeedsVerification(false);
                setIsSignup(false);
                setVerificationCode('');
                setSignupError('');
              }}
              className="w-full bg-stone-100 hover:bg-stone-200 text-stone-900 font-semibold py-2.5 rounded-lg transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        ) : !isSignup ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-bold text-stone-900 mb-2">Welcome Back</h2>
              <p className="text-stone-600">Sign in to your account to make a reservation</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-stone-600">Or</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsSignup(true);
                setError('');
                setEmail('');
                setPassword('');
                setNeedsVerification(false);
              }}
              className="w-full bg-stone-100 hover:bg-stone-200 text-stone-900 font-semibold py-2.5 rounded-lg transition-colors"
            >
              Create New Account
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-bold text-stone-900 mb-2">Create Account</h2>
              <p className="text-stone-600">Join Savoria Bistro to make your first reservation</p>
            </div>

            {signupError && (
              <div className="bg-red-50 border border-red-300 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <div>{signupError}</div>
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 mb-2">Full Name</label>
                <input
                  type="text"
                  value={signupData.name}
                  onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 mb-2">Email Address</label>
                <input
                  type="email"
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 mb-2">Password</label>
                <input
                  type="password"
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
                  required
                />
                <p className="text-xs text-stone-500 mt-1">Min. 8 characters with uppercase, lowercase, and number</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 mb-2">Phone (Optional)</label>
                <input
                  type="tel"
                  value={signupData.phone}
                  onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                  placeholder="(555) 000-0000"
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <button
              onClick={() => {
                setIsSignup(false);
                setSignupError('');
                setSignupData({ name: '', email: '', password: '', phone: '' });
              }}
              className="w-full bg-stone-100 hover:bg-stone-200 text-stone-900 font-semibold py-2.5 rounded-lg transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginModal;

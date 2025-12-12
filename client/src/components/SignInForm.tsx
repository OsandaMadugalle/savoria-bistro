import React from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

interface SignInFormProps {
  loginEmail: string;
  setLoginEmail: (value: string) => void;
  loginPassword: string;
  setLoginPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  loginError: string;
  setLoginError: (value: string) => void;
  isLoggingIn: boolean;
  loginFieldErrors: { email?: string; password?: string };
  setLoginFieldErrors: (errors: { email?: string; password?: string }) => void;
  handleLoginSubmit: (e: React.FormEvent) => Promise<void>;
  setAuthMode: (mode: 'signin' | 'signup' | 'forgot') => void;
  setForgotEmail: (value: string) => void;
  setForgotMessage: (value: string) => void;
  setForgotError: (value: string) => void;
}

const SignInForm: React.FC<SignInFormProps> = ({
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  showPassword,
  setShowPassword,
  loginError,
  isLoggingIn,
  loginFieldErrors,
  setLoginFieldErrors,
  handleLoginSubmit,
  setAuthMode,
  setForgotEmail,
  setForgotMessage,
  setForgotError,
}) => (
  <form onSubmit={handleLoginSubmit} className="space-y-4">
    {loginError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">{loginError}</div>}
    <div>
      <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Email</label>
      <div className="relative">
        <Mail className="absolute left-3 top-3 text-stone-400" size={18} />
        <input
          type="email"
          value={loginEmail}
          onChange={e => { setLoginEmail(e.target.value); if (loginFieldErrors.email) setLoginFieldErrors({ ...loginFieldErrors, email: undefined }); }}
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
          type={showPassword ? 'text' : 'password'}
          value={loginPassword}
          onChange={e => { setLoginPassword(e.target.value); if (loginFieldErrors.password) setLoginFieldErrors({ ...loginFieldErrors, password: undefined }); }}
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
    <div className="text-center mt-3">
      <button
        type="button"
        className="text-sm text-orange-600 hover:underline font-semibold"
        onClick={() => {
          setAuthMode('forgot');
          setForgotEmail(loginEmail);
          setForgotMessage('');
          setForgotError('');
        }}
      >
        Forgot Password?
      </button>
    </div>
  </form>
);

export default SignInForm;

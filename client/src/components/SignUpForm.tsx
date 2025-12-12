import React from 'react';
import { User as UserIcon, Mail, Phone, MapPin, Calendar, Lock, Eye, EyeOff } from 'lucide-react';

interface SignUpFormProps {
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
  handleSignupSubmit: (e: React.FormEvent) => Promise<void>;
  setAuthMode: (mode: 'signin' | 'signup' | 'forgot') => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({
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
  signupAddress,
  setSignupAddress,
  signupBirthday,
  setSignupBirthday,
  signupFieldErrors,
  setSignupFieldErrors,
  handleSignupSubmit,
}) => (
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
          className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all outline-none focus:ring-2 ${signupFieldErrors.name ? 'border-red-400 focus:ring-red-500' : 'border-stone-200 focus:ring-orange-500'}`}
          placeholder="Your name"
        />
      </div>
      {signupFieldErrors.name && <p className="text-red-600 text-xs mt-1 font-medium">{signupFieldErrors.name}</p>}
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
          className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all outline-none focus:ring-2 ${signupFieldErrors.email ? 'border-red-400 focus:ring-red-500' : 'border-stone-200 focus:ring-orange-500'}`}
          placeholder="your@email.com"
        />
      </div>
      {signupFieldErrors.email && <p className="text-red-600 text-xs mt-1 font-medium">{signupFieldErrors.email}</p>}
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
);

export default SignUpForm;

import React from 'react';

interface ForgotPasswordFormProps {
  forgotEmail: string;
  setForgotEmail: (value: string) => void;
  forgotMessage: string;
  forgotError: string;
  isForgotLoading: boolean;
  handleForgotPassword: (e: React.FormEvent) => Promise<void>;
  setAuthMode: (mode: 'signin' | 'signup' | 'forgot') => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  forgotEmail,
  setForgotEmail,
  forgotMessage,
  forgotError,
  isForgotLoading,
  handleForgotPassword,
  setAuthMode,
}) => (
  <form onSubmit={handleForgotPassword} className="space-y-4">
    <p className="text-sm text-stone-500 text-center mb-2">Enter your email to receive a password reset link.</p>
    <input
      type="email"
      className="w-full border border-stone-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
      placeholder="Email address"
      value={forgotEmail}
      onChange={e => setForgotEmail(e.target.value)}
      required
    />
    <button
      type="submit"
      className="w-full bg-orange-600 text-white py-2 rounded font-semibold hover:bg-orange-700 transition"
      disabled={isForgotLoading}
    >
      {isForgotLoading ? 'Sending...' : 'Send Reset Link'}
    </button>
    {forgotMessage && <div className="text-green-600 text-center">{forgotMessage}</div>}
    {forgotError && <div className="text-red-600 text-center">{forgotError}</div>}
    <div className="text-center mt-2">
      <button
        type="button"
        className="text-sm text-orange-600 hover:underline font-semibold"
        onClick={() => setAuthMode('signin')}
      >
        Back to Sign In
      </button>
    </div>
  </form>
);

export default ForgotPasswordForm;

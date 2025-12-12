import React from 'react';
import { AlertCircle } from 'lucide-react';

interface EmailVerificationFormProps {
  verificationCode: string;
  setVerificationCode: (value: string) => void;
  handleVerification: (e: React.FormEvent) => Promise<void>;
  signupError: string;
  handleResendVerification: () => Promise<void>;
  setNeedsVerification: (value: boolean) => void;
  setAuthMode: (mode: 'signin' | 'signup' | 'forgot') => void;
  setSignupError: (value: string) => void;
}

const EmailVerificationForm: React.FC<EmailVerificationFormProps> = ({
  verificationCode,
  setVerificationCode,
  handleVerification,
  signupError,
  handleResendVerification,
  setNeedsVerification,
  setAuthMode,
  setSignupError,
}) => (
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
);

export default EmailVerificationForm;

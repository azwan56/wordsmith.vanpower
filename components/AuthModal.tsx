import React, { useState, useEffect } from 'react';
import { signInWithGoogle, sendPhoneCode, verifyPhoneCode, clearRecaptcha } from '../services/firebaseService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [phoneStep, setPhoneStep] = useState<1 | 2>(1);
  const [phoneCode, setPhoneCode] = useState('+86');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when closed
      setPhoneStep(1);
      setPhoneNumber('');
      setVerificationCode('');
      setError(null);
      setLoading(false);
      clearRecaptcha(); // Clean up Recaptcha
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      setError("Google Sign-In Failed: " + err.message);
    }
  };

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      setError("Please enter a phone number");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const fullNumber = phoneCode + phoneNumber.trim();
      await sendPhoneCode(fullNumber, 'recaptcha-container');
      setPhoneStep(2);
    } catch (err: any) {
      setError(err.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) return;
    setError(null);
    setLoading(true);
    try {
      await verifyPhoneCode(verificationCode.trim());
      onClose();
    } catch (err: any) {
      setError("Invalid Code: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8 relative border-4 border-white transition-all scale-100 opacity-100">
        <button 
          onClick={handleClose} 
          className="absolute top-4 right-4 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-orange-600 font-fredoka mb-2">Welcome Back!</h2>
          <p className="text-slate-500">Join Vanpower and sync your progress.</p>
        </div>
        
        <div id="recaptcha-container" className="mb-4 flex justify-center"></div>

        <div className="space-y-4">
          <button 
            onClick={handleGoogleSignIn} 
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 text-slate-700 px-6 py-4 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
            Continue with Gmail
          </button>
          
          <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">Or use Phone</span>
              <div className="flex-grow border-t border-slate-200"></div>
          </div>
          
          {phoneStep === 1 ? (
            <div id="phone-auth-step-1">
              <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
              <div className="flex gap-2">
                  <select 
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value)}
                    className="bg-slate-50 border-2 border-slate-200 text-slate-700 rounded-xl px-2 py-3 w-24 font-bold outline-none focus:border-orange-500"
                  >
                      <option value="+86">+86</option>
                      <option value="+1">+1</option>
                      <option value="+852">+852</option>
                  </select>
                  <input 
                    type="tel" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Phone" 
                    className="flex-1 w-full bg-slate-50 border-2 border-slate-200 text-slate-700 rounded-xl px-4 py-3 font-bold outline-none focus:border-orange-500 transition-colors" 
                  />
              </div>
              <button 
                onClick={handleSendCode} 
                disabled={loading}
                className="w-full mt-4 bg-orange-500 text-white px-6 py-4 rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-lg active:scale-95 flex justify-center items-center gap-2 disabled:opacity-50"
              >
                  {loading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </div>
          ) : (
            <div id="phone-auth-step-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Verification Code</label>
              <input 
                type="text" 
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="123456" 
                className="w-full bg-slate-50 border-2 border-slate-200 text-slate-700 rounded-xl px-4 py-3 font-bold outline-none focus:border-orange-500 transition-colors text-center text-xl tracking-widest mb-4" 
              />
              <button 
                onClick={handleVerifyCode} 
                disabled={loading}
                className="w-full bg-green-500 text-white px-6 py-4 rounded-xl font-bold hover:bg-green-600 transition-colors shadow-lg active:scale-95 flex justify-center items-center gap-2 disabled:opacity-50"
              >
                  {loading ? 'Verifying...' : 'Sign In'}
              </button>
              <button 
                onClick={() => setPhoneStep(1)} 
                className="w-full mt-3 text-slate-500 font-bold hover:text-slate-700 text-sm"
              >
                Cancel & Back
              </button>
            </div>
          )}

          {error && <p className="text-red-500 text-sm font-bold text-center mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;

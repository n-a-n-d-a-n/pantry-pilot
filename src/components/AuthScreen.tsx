import React, { useState } from 'react';
import { Leaf, Sparkles, Mail, Lock, User as UserIcon, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthScreen: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, error, clearError } = useAuth();

  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!email.trim() || !password.trim()) {
      setFormError('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      // Error handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setFormError(null);
    clearError();
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      // Handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = formError || error;

  return (
    <div className="min-h-screen bg-[#FFFBF5] dark:bg-[#181614] text-[#2D2926] dark:text-[#F5F3EF] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden transition-colors">
      {/* Decorative subtle background elements */}
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-[#F27D26]/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-[#166534]/5 blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md bg-white/90 dark:bg-[#262320]/90 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl shadow-xl p-6 sm:p-8 relative z-10 transition-colors">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#F27D26] flex items-center justify-center text-white shadow-sm">
              <Leaf className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-[#2D2926] dark:text-[#F5F3EF]">PantryPilot</span>
          </div>

          {/* 100% Vegetarian badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F0FDF4] dark:bg-[#142E1F] border border-[#DCFCE7] dark:border-[#1E4D2B] text-[#166534] dark:text-[#86EFAC] text-xs font-semibold mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% Vegetarian Kitchen</span>
          </div>

          <p className="text-xs text-[#6B635B] dark:text-[#A8A29E] max-w-xs">
            Zero-waste pantry intelligence for vegetarian food. Photo-to-inventory & smart rescue recipes.
          </p>
        </div>

        {/* Tab Toggle: Sign In vs Sign Up */}
        <div className="flex bg-[#FFFBF5] dark:bg-[#181614] border border-[#F0EAD6] dark:border-[#3D3833] rounded-xl p-1 mb-6">
          <button
            type="button"
            id="tab-sign-in"
            onClick={() => {
              setIsSignUp(false);
              setFormError(null);
              clearError();
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              !isSignUp
                ? 'bg-white dark:bg-[#262320] text-[#2D2926] dark:text-[#F5F3EF] shadow-xs border border-[#F0EAD6] dark:border-[#3D3833]'
                : 'text-[#6B635B] dark:text-[#A8A29E] hover:text-[#2D2926] dark:hover:text-[#F5F3EF]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            id="tab-sign-up"
            onClick={() => {
              setIsSignUp(true);
              setFormError(null);
              clearError();
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              isSignUp
                ? 'bg-white dark:bg-[#262320] text-[#2D2926] dark:text-[#F5F3EF] shadow-xs border border-[#F0EAD6] dark:border-[#3D3833]'
                : 'text-[#6B635B] dark:text-[#A8A29E] hover:text-[#2D2926] dark:hover:text-[#F5F3EF]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error message */}
        {displayError && (
          <div className="mb-4 p-3 rounded-xl bg-[#FEF2F2] dark:bg-[#331515] border border-[#FEE2E2] dark:border-[#5C2323] text-[#991B1B] dark:text-[#FCA5A5] text-xs flex items-start gap-2">
            <span className="font-bold">•</span>
            <span>{displayError}</span>
          </div>
        )}

        {/* Google Sign-in Button */}
        <button
          type="button"
          id="btn-google-auth"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 bg-white dark:bg-[#181614] hover:bg-[#FFFBF5] dark:hover:bg-[#262320] border border-[#E5E1D8] dark:border-[#3D3833] hover:border-[#D5D0C5] text-[#2D2926] dark:text-[#F5F3EF] rounded-xl font-medium text-xs flex items-center justify-center gap-2.5 transition-all shadow-xs disabled:opacity-60 mb-5"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-[#F0EAD6] dark:bg-[#3D3833]" />
          <span className="text-[11px] font-medium text-[#8C8279] dark:text-[#A8A29E] uppercase tracking-wider">or with email</span>
          <div className="flex-1 h-px bg-[#F0EAD6] dark:bg-[#3D3833]" />
        </div>

        {/* Email / Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-[#2D2926] dark:text-[#F5F3EF] mb-1">Your Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8C8279] dark:text-[#A8A29E]">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="input-name"
                  placeholder="e.g. Maya Lin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#FFFBF5] dark:bg-[#181614] border border-[#E5E1D8] dark:border-[#3D3833] text-[#2D2926] dark:text-[#F5F3EF] focus:border-[#F27D26] focus:bg-white dark:focus:bg-[#181614] rounded-xl outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#2D2926] dark:text-[#F5F3EF] mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8C8279] dark:text-[#A8A29E]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                id="input-email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#FFFBF5] dark:bg-[#181614] border border-[#E5E1D8] dark:border-[#3D3833] text-[#2D2926] dark:text-[#F5F3EF] focus:border-[#F27D26] focus:bg-white dark:focus:bg-[#181614] rounded-xl outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2D2926] dark:text-[#F5F3EF] mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8C8279] dark:text-[#A8A29E]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="input-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2 text-xs bg-[#FFFBF5] dark:bg-[#181614] border border-[#E5E1D8] dark:border-[#3D3833] text-[#2D2926] dark:text-[#F5F3EF] focus:border-[#F27D26] focus:bg-white dark:focus:bg-[#181614] rounded-xl outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8C8279] dark:text-[#A8A29E] hover:text-[#2D2926] dark:hover:text-[#F5F3EF]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {isSignUp && <p className="text-[10px] text-[#8C8279] dark:text-[#A8A29E] mt-1">Must be at least 6 characters</p>}
          </div>

          <button
            type="submit"
            id="btn-submit-auth"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-[#F27D26] hover:bg-[#E06D19] active:scale-[0.99] text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-60 mt-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? 'Create Vegetarian Pantry' : 'Sign In to Pantry'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-[#F0EAD6] dark:border-[#3D3833] text-center">
          <p className="text-[11px] text-[#8C8279] dark:text-[#A8A29E]">
            {isSignUp ? 'Already tracking your kitchen?' : "New to zero-waste cooking?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setFormError(null);
                clearError();
              }}
              className="text-[#F27D26] font-semibold hover:underline"
            >
              {isSignUp ? 'Sign in here' : 'Create free account'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

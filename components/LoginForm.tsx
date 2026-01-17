import React, { useState, useRef, useEffect } from 'react';
import { startLogin, verifyCode, AuthState } from '../services/sesameAuth';
import { supabase } from '../services/supabase';
import Button from './Button';
import { IconLockClosed } from './Icons';

interface LoginFormProps {
  onLoginSuccess: (email: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '']);
  const [authState, setAuthState] = useState<AuthState>('idle');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const codeInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Focus first code input when entering code verification step
  useEffect(() => {
    if (authState === 'awaiting_code') {
      codeInputRefs[0].current?.focus();
    }
  }, [authState]);

  // Step 1: Submit email
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError('');
    setLoading(true);

    const result = await startLogin(email);

    if (result.state === 'awaiting_code') {
      setAuthState('awaiting_code');
    } else if (result.state === 'authenticated') {
      // Immediate auth (shouldn't happen normally)
      await handleAuthSuccess(result.email!);
    } else {
      setError(result.error || 'Login failed');
    }

    setLoading(false);
  };

  // Step 2: Handle code input
  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);

    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    // Auto-focus next input
    if (digit && index < 3) {
      codeInputRefs[index + 1].current?.focus();
    }

    // Auto-submit when all 4 digits entered
    if (digit && index === 3) {
      const fullCode = newCode.join('');
      if (fullCode.length === 4) {
        handleCodeSubmit(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeInputRefs[index - 1].current?.focus();
    }
  };

  // Verify code
  const handleCodeSubmit = async (fullCode?: string) => {
    const codeToVerify = fullCode || code.join('');
    if (codeToVerify.length !== 4) return;

    setError('');
    setLoading(true);

    const result = await verifyCode(codeToVerify);

    if (result.state === 'authenticated') {
      await handleAuthSuccess(result.email!);
    } else {
      setError(result.error || 'Verification failed');
      // Clear code on error
      setCode(['', '', '', '']);
      codeInputRefs[0].current?.focus();
    }

    setLoading(false);
  };

  // After SESAME auth success, create/link Supabase user
  const handleAuthSuccess = async (sesameEmail: string) => {
    // Use deterministic password based on email for Supabase auth
    const deterministicPassword = `sesame_${sesameEmail}_auth_v1`;

    try {
      // Try sign in first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: sesameEmail,
        password: deterministicPassword,
      });

      if (signInError) {
        console.log('Supabase sign in failed, trying signup:', signInError.message);

        // User doesn't exist, create one
        const { error: signUpError } = await supabase.auth.signUp({
          email: sesameEmail,
          password: deterministicPassword,
          options: {
            data: {
              sesame_authenticated: true,
            },
          },
        });

        if (signUpError) {
          console.error('Supabase signup error:', signUpError);
          // Even if Supabase fails, SESAME auth succeeded
        } else {
          // Auto sign in after signup
          await supabase.auth.signInWithPassword({
            email: sesameEmail,
            password: deterministicPassword,
          });
        }
      }

      onLoginSuccess(sesameEmail);
    } catch (err) {
      console.error('Supabase linking error:', err);
      // Still call success since SESAME auth worked
      onLoginSuccess(sesameEmail);
    }
  };

  // Go back to email input
  const handleBack = () => {
    setAuthState('idle');
    setCode(['', '', '', '']);
    setError('');
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-surface border border-border rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <IconLockClosed className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">Sesame Control</h1>
          <p className="text-gray-400 text-sm mt-2">
            {authState === 'awaiting_code'
              ? 'Enter the code sent to your email'
              : 'Sign in with your SESAME account'}
          </p>
        </div>

        {authState === 'idle' ? (
          // Step 1: Email input
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded-lg bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-sm placeholder-gray-300"
              placeholder="SESAME account email"
              autoComplete="email"
              required
            />

            {error && (
              <div className="text-red-500 text-xs text-center py-2">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full justify-center mt-2" isLoading={loading}>
              Continue
            </Button>

            <p className="text-[10px] text-gray-400 text-center mt-4">
              Use the same email as your SESAME app account
            </p>
          </form>
        ) : (
          // Step 2: Code verification
          <div className="space-y-6">
            <div className="text-center text-sm text-gray-500 mb-2">
              {email}
            </div>

            <div className="flex justify-center gap-3">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={codeInputRefs[index]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-14 h-14 text-center text-2xl font-bold rounded-lg bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                  disabled={loading}
                />
              ))}
            </div>

            {error && (
              <div className="text-red-500 text-xs text-center py-2">
                {error}
              </div>
            )}

            <Button
              onClick={() => handleCodeSubmit()}
              className="w-full justify-center"
              isLoading={loading}
              disabled={code.join('').length !== 4}
            >
              Verify
            </Button>

            <button
              type="button"
              onClick={handleBack}
              className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading}
            >
              Use different email
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginForm;

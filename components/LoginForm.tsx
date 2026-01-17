import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import Button from './Button';
import { IconLockClosed } from './Icons';

interface LoginFormProps {
  onLoginSuccess: (email: string) => void;
}

type FormMode = 'login' | 'register';

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mode, setMode] = useState<FormMode>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        // Registration
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }

        if (data.user) {
          onLoginSuccess(email);
        }
      } else {
        // Login
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message);
          setLoading(false);
          return;
        }

        if (data.user) {
          onLoginSuccess(email);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    }

    setLoading(false);
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setConfirmPassword('');
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
            {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3.5 rounded-lg bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-sm placeholder-gray-300"
            placeholder="Email"
            autoComplete="email"
            required
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3.5 rounded-lg bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-sm placeholder-gray-300"
            placeholder="Password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
          />

          {mode === 'register' && (
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3.5 rounded-lg bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-sm placeholder-gray-300"
              placeholder="Confirm Password"
              autoComplete="new-password"
              required
            />
          )}

          {error && (
            <div className="text-red-500 text-xs text-center py-2">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full justify-center mt-2" isLoading={loading}>
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>

          <button
            type="button"
            onClick={toggleMode}
            className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors mt-4"
          >
            {mode === 'login'
              ? "Don't have an account? Register"
              : 'Already have an account? Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;

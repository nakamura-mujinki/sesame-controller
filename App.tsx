import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from './services/supabase';
import LoginForm from './components/LoginForm';
import NavBar from './components/NavBar';
import Dashboard from './views/Dashboard';
import Schedule from './views/Schedule';
import Logs from './views/Logs';
import Settings from './views/Settings';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLoginSuccess = async (_email: string) => {
    // User state will be updated via onAuthStateChange
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <HashRouter>
      <div className="app-container bg-background shadow-2xl border-x border-border">
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard onLogout={handleLogout} />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <div className="bottom-nav">
          <NavBar />
        </div>
      </div>
    </HashRouter>
  );
};

export default App;

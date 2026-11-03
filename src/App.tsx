import React, { useState, useEffect } from 'react';
import { Usuario } from './types';
import { USER_KEY, TOKEN_KEY } from './api';
import Navbar from './components/Navbar';
import AuthScreen from './components/AuthScreen';
import DashboardNutri from './components/DashboardNutri';
import DashboardPaciente from './components/DashboardPaciente';

export default function App() {
  const [user, setUser] = useState<Usuario | null>(null);

  // Check if session can be restored from client localStorage (simple state persistence)
  useEffect(() => {
    const cached = localStorage.getItem(USER_KEY);
    if (cached && localStorage.getItem(TOKEN_KEY)) {
      try {
        setUser(JSON.parse(cached));
      } catch (e) {
        localStorage.removeItem(USER_KEY);
      }
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, []);

  const handleLoginSuccess = (authenticatedUser: Usuario, token: string) => {
    setUser(authenticatedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(authenticatedUser));
    localStorage.setItem(TOKEN_KEY, token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-neutral-950" id="app-root">
      {/* If not authenticated, render Auth screen */}
      {!user ? (
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Header Navbar */}
          <Navbar user={user} onLogout={handleLogout} />
          
          {/* Main Workspace Frame container */}
          <main className="flex-1 bg-neutral-950">
            {user.rol === 'Nutricionista' ? (
              <DashboardNutri />
            ) : (
              <DashboardPaciente user={user} />
            )}
          </main>
          
          <footer className="bg-neutral-950 border-t border-neutral-900 py-4 mt-auto">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <p className="text-[11px] text-neutral-500 font-medium">
                Nutri Count &bull; Taller Integrador III &bull; 2026
              </p>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}


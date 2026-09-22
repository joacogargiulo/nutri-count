/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Usuario } from './types';
import Navbar from './components/Navbar';
import AuthScreen from './components/AuthScreen';
import DashboardNutri from './components/DashboardNutri';
import DashboardPaciente from './components/DashboardPaciente';

export default function App() {
  const [user, setUser] = useState<Usuario | null>(null);

  // Check if session can be restored from client localStorage (simple state persistence)
  useEffect(() => {
    const cached = localStorage.getItem('nutricount_user');
    if (cached) {
      try {
        setUser(JSON.parse(cached));
      } catch (e) {
        localStorage.removeItem('nutricount_user');
      }
    }
  }, []);

  const handleLoginSuccess = (authenticatedUser: Usuario) => {
    setUser(authenticatedUser);
    localStorage.setItem('nutricount_user', JSON.stringify(authenticatedUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('nutricount_user');
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
              <DashboardNutri user={user} />
            ) : (
              <DashboardPaciente user={user} />
            )}
          </main>
          
          {/* Dynamic humble corporate info-bar as requested by anti-slop guidelines */}
          <footer className="bg-neutral-950 border-t border-neutral-900 py-4 mt-auto">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <p className="text-[11px] text-neutral-500 font-medium">
                &copy; 2026 Nutri Count &bull; Plataforma Premium de Gestión Nutricional Integrada
              </p>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}


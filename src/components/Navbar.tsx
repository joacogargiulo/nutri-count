/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LogOut, User, Activity, ShieldCheck } from 'lucide-react';
import { Usuario } from '../types';

interface NavbarProps {
  user: Usuario | null;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  if (!user) return null;

  return (
    <nav className="bg-neutral-950 border-b border-neutral-800 sticky top-0 z-50 shadow-md" id="main-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Brand */}
          <div className="flex items-center space-x-2">
            <div className="bg-emerald-500 text-neutral-950 p-2 rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">
                Nutri<span className="text-emerald-400">Count</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] bg-neutral-900 text-emerald-400 border border-neutral-800 px-2.5 py-0.5 rounded-full font-semibold">
                Pro
              </span>
            </div>
          </div>

          {/* User actions */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-neutral-300 bg-neutral-900/50 px-3 py-1.5 rounded-xl border border-neutral-800">
              <User className="h-4 w-4 text-emerald-400" />
              <div className="text-left leading-none">
                <p className="font-semibold text-neutral-100 text-xs sm:text-sm">
                  {user.persona?.nombre} {user.persona?.apellido}
                </p>
                <div className="flex items-center space-x-1 mt-0.5">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  <span className="text-[10px] text-neutral-500 font-semibold tracking-wide uppercase">
                    {user.rol === 'Nutricionista' ? 'Nutricionista' : 'Paciente'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="inline-flex items-center justify-center p-2 rounded-xl text-neutral-400 hover:text-rose-450 hover:bg-neutral-900 transition-colors focus:outline-none"
              title="Cerrar Sesión"
              id="btn-logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

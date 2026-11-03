import React, { useState } from 'react';
import { Activity, ShieldCheck, User, Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import { Usuario, UserRole } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (user: Usuario, token: string) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  
  // Login states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register states
  const [regNombre, setRegNombre] = useState('');
  const [regApellido, setRegApellido] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRol, setRegRol] = useState<UserRole>(UserRole.PACIENTE);
  const [regFechaNacimiento, setRegFechaNacimiento] = useState('');
  const [regGenero, setRegGenero] = useState('Masculino');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setError('Por favor complete todos los campos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim().toLowerCase(), password: loginPassword })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Credenciales incorrectas');
      }

      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Error al conectar');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNombre || !regApellido || !regEmail || !regPassword || !regFechaNacimiento || !regGenero) {
      setError('Por favor complete todos los campos obligatorios (Fecha de nacimiento y Género son requeridos)');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(regEmail.trim())) {
      setError('Por favor ingrese un correo electrónico válido (ej: nombre@dominio.com)');
      return;
    }

    if (regPassword.length < 8 || !/[A-Za-z]/.test(regPassword) || !/\d/.test(regPassword)) {
      setError('La contraseña debe tener al menos 8 caracteres e incluir letras y números');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: regNombre,
          apellido: regApellido,
          email: regEmail.trim().toLowerCase(),
          password: regPassword,
          rol: regRol,
          fecha_nacimiento: regFechaNacimiento,
          genero: regGenero
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar la cuenta');
      }

      setSuccessMsg('¡Cuenta registrada exitosamente! Iniciando sesión...');
      setTimeout(() => {
        onLoginSuccess(data.user, data.token);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Upper header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto h-12 w-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-neutral-950 shadow-xl shadow-emerald-500/20 animate-pulse">
          <Activity className="h-7 w-7" />
        </div>
        <h2 className="mt-6 text-3xl font-extrabold text-white tracking-tight">
          Nutri<span className="text-emerald-400">Count</span>
        </h2>
        <p className="mt-2 text-sm text-neutral-500 font-medium">
          Seguimiento nutricional entre nutricionista y paciente
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-neutral-900/50 py-8 px-4 shadow-2xl rounded-3xl sm:px-10 border border-neutral-800">
          
          {/* Tab Selector */}
          <div className="flex bg-neutral-950 p-1.5 rounded-2xl mb-8 border border-neutral-800/60">
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 ${
                isLogin 
                  ? 'bg-neutral-900 text-emerald-400 border border-neutral-850 shadow-md' 
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              id="tab-login"
            >
              <LogIn className="h-4 w-4" />
              <span>Ingresar</span>
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 ${
                !isLogin 
                  ? 'bg-neutral-900 text-emerald-400 border border-neutral-850 shadow-md' 
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              id="tab-register"
            >
              <UserPlus className="h-4 w-4" />
              <span>Registrarse</span>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-950/30 border-l-4 border-rose-500 text-rose-200 rounded-r-xl text-sm font-medium" id="auth-error">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-950/30 border-l-4 border-emerald-500 text-emerald-200 rounded-r-xl text-sm font-medium">
              {successMsg}
            </div>
          )}

          {isLogin ? (
            /* ============ LOGIN FORM ============ */
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-neutral-600" />
                  </div>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    placeholder="ejemplo@nutricount.com"
                    className="block w-full pl-10 pr-3 py-3 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all text-white placeholder-neutral-600"
                    id="input-login-email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Contraseña
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-neutral-600" />
                  </div>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3 py-3 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all text-white placeholder-neutral-600"
                    id="input-login-pass"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-500/10 text-sm font-bold text-neutral-950 bg-emerald-500 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-50"
                  id="btn-login-submit"
                >
                  {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                </button>
              </div>
            </form>
          ) : (
            /* ============ REGISTER FORM ============ */
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={regNombre}
                    onChange={(e) => setRegNombre(e.target.value)}
                    required
                    placeholder="Agustin"
                    className="block w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all text-white placeholder-neutral-600"
                    id="input-reg-nombre"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                    Apellido
                  </label>
                  <input
                    type="text"
                    value={regApellido}
                    onChange={(e) => setRegApellido(e.target.value)}
                    required
                    placeholder="Posse"
                    className="block w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all text-white placeholder-neutral-600"
                    id="input-reg-apellido"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-neutral-600" />
                  </div>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    placeholder="paciente@correo.com"
                    className="block w-full pl-10 pr-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all text-white placeholder-neutral-600"
                    id="input-reg-email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Contraseña
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-neutral-600" />
                  </div>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    placeholder="Mínimo 8 caracteres, con letras y números"
                    className="block w-full pl-10 pr-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all text-white placeholder-neutral-600"
                    id="input-reg-pass"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  value={regFechaNacimiento}
                  onChange={(e) => setRegFechaNacimiento(e.target.value)}
                  required
                  className="block w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all text-white placeholder-neutral-600"
                  id="input-reg-nacimiento"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Género
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRegGenero('Masculino')}
                    className={`py-2.5 px-3 text-xs font-bold rounded-xl border flex items-center justify-center space-x-1 transition-all ${
                      regGenero === 'Masculino'
                        ? 'border-emerald-500 bg-emerald-950/30 text-emerald-400 ring-2 ring-emerald-500/20'
                        : 'border-neutral-800 text-neutral-400 hover:text-neutral-200 bg-neutral-950'
                    }`}
                    id="btn-genero-masculino"
                  >
                    <span>Masculino</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegGenero('Femenino')}
                    className={`py-2.5 px-3 text-xs font-bold rounded-xl border flex items-center justify-center space-x-1 transition-all ${
                      regGenero === 'Femenino'
                        ? 'border-emerald-500 bg-emerald-950/30 text-emerald-400 ring-2 ring-emerald-500/20'
                        : 'border-neutral-800 text-neutral-400 hover:text-neutral-200 bg-neutral-950'
                    }`}
                    id="btn-genero-femenino"
                  >
                    <span>Femenino</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Rol del Usuario
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRegRol(UserRole.PACIENTE)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center space-x-1 transition-all ${
                      regRol === UserRole.PACIENTE
                        ? 'border-emerald-500 bg-emerald-950/30 text-emerald-400 ring-2 ring-emerald-500/20'
                        : 'border-neutral-800 text-neutral-400 hover:text-neutral-200 bg-neutral-950'
                    }`}
                    id="btn-role-paciente"
                  >
                    <User className="h-3.5 w-3.5" />
                    <span>Soy Paciente</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRol(UserRole.NUTRICIONISTA)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center space-x-1 transition-all ${
                      regRol === UserRole.NUTRICIONISTA
                        ? 'border-emerald-500 bg-emerald-950/30 text-emerald-400 ring-2 ring-emerald-500/20'
                        : 'border-neutral-800 text-neutral-400 hover:text-neutral-200 bg-neutral-950'
                    }`}
                    id="btn-role-nutricionista"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Soy Nutricionista</span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-500/25 text-sm font-bold text-neutral-950 bg-emerald-500 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-50"
                  id="btn-register-submit"
                >
                  {loading ? 'Creando Cuenta...' : 'Registrar Cuenta'}
                </button>
              </div>
            </form>
          )}



        </div>
      </div>
    </div>
  );
}

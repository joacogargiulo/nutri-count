/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const USER_KEY = 'nutricount_user';
export const TOKEN_KEY = 'nutricount_token';

// fetch que agrega el token de sesion. Si el servidor responde 401 (token vencido o invalido)
// se limpia la sesion local y se recarga para volver a la pantalla de login.
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(input, { ...init, headers });
  if (response.status === 401 && token) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.reload();
  }
  return response;
}

// URL de ingestas de un dia local. `tz` permite que el servidor calcule el dia en la zona del usuario.
export const ingestasUrl = (patientId: number | string, date: string) =>
  `/api/ingestas?patientId=${patientId}&date=${date}&tz=${new Date().getTimezoneOffset()}`;

// Instante ISO (UTC) correspondiente a "ahora" (hora local) pero en el dia local `dateStr` (AAAA-MM-DD).
export function consumoISO(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const now = new Date();
  return new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds()).toISOString();
}

export function todayLocal(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

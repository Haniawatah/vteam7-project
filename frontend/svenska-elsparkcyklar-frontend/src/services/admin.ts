import axios from 'axios';
import api from './api';

const tokenHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { 'x-access-token': token } : {};
};

async function tryGet(paths: string[]) {
  let lastErr: any = null;

  for (const p of paths) {
    try {
      const res = await api.get(p, {
        headers: { 'Content-Type': 'application/json', ...tokenHeader() },
      });
      return res.data;
    } catch (e) {
      lastErr = e;
      if (axios.isAxiosError(e) && e.response?.status === 404) continue;
      throw e;
    }
  }

  throw lastErr ?? new Error('No endpoint matched');
}

// Users (admin)
export async function fetchUsersAdmin() {
  return await tryGet(['/users', '/admin/users', '/user']);
}

// Optional admin actions (requires backend support)
export async function updateUserRoleAdmin(userId: string, role: 'admin' | 'user') {
  const res = await api.patch(
    `/users/${encodeURIComponent(userId)}`,
    { role },
    { headers: { 'Content-Type': 'application/json', ...tokenHeader() } }
  );
  return res.data;
}

export async function deleteUserAdmin(userId: string) {
  const res = await api.delete(`/users/${encodeURIComponent(userId)}`, {
    headers: { 'Content-Type': 'application/json', ...tokenHeader() },
  });
  return res.data;
}

// Stations
export async function fetchStationsAdmin() {
  return await tryGet(['/stations', '/cities']);
}

// Logs / ride history
export async function fetchLogsAdmin() {
  return await tryGet(['/rides/history', '/logs']);
}
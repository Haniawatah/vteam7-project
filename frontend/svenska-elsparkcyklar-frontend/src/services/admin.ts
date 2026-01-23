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
  return await tryGet(['/admin/users', '/users', '/user']);
}

// Optional admin actions (requires backend support)
export async function updateUserRoleAdmin(userId: string, role: 'admin' | 'user') {
  const res = await api.patch(
    `/user/role/${encodeURIComponent(userId)}`,
    { role },
    { headers: { 'Content-Type': 'application/json', ...tokenHeader() } }
  );
  return res.data;
}

export async function deleteUserAdmin(userId: string) {
  const res = await api.delete(`/user/delete/${encodeURIComponent(userId)}`, {
    headers: { 'Content-Type': 'application/json', ...tokenHeader() },
  });
  return res.data;
}

// Stations
export async function fetchParkingStationsAdmin() {
  const res = await api.get(`/parking/stations`, {
    headers: { 'Content-Type': 'application/json', ...tokenHeader() },
  });
  console.log(res.data, "--------------")
  return res.data;
}


// Stations
export async function fetchChargingStationsAdmin() {
  const res = await api.get(`/charging/stations`, {
    headers: { 'Content-Type': 'application/json', ...tokenHeader() },
  });
  console.log(res.data, "--------------")
  return res.data;
}

// Stations
export async function fetchChargingAdmin() {
  const res = await api.get(`/charging/stations`, {
    headers: { 'Content-Type': 'application/json', ...tokenHeader() },
  });
  console.log(res.data, "--------------")
  return res.data;
}


// Logs / ride history
export async function fetchLogsAdmin() {
  return await tryGet(['/ride/all/history', '/logs']);
}

export async function fetchSubscriptionsAdmin() {
  const res = await api.get(`/logs/subs`, {
    headers: { 'Content-Type': 'application/json', ...tokenHeader() },
  });
  console.log(res.data, "---------s-----")
  return res.data;
}

export async function fetchInvoicesAdmin() {
  const res = await api.get(`/invoices/all`, {
    headers: { 'Content-Type': 'application/json', ...tokenHeader() },
  });
  console.log(res.data, "--------------")
  return res.data;
}




//For the admin that changes the scooter status
export const adminChangesScooter = async (scooterId: string, newStatus: string) => {
  const res = await api.put( `/scooters/${scooterId}`,{ status: newStatus },
    {
      headers: {
        'Content-Type': 'application/json',
        ...tokenHeader(),
      },
    }
  );

  return res.data;
};





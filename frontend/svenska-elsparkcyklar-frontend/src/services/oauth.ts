import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types';

const toMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

type AuthResponse = { token: string; user: User };

const storeAuth = (data: AuthResponse) => {
    localStorage.setItem('token', data.token);

    const decoded = decodeJwtPayload(data.token) ?? {};
    console.log(decoded, "decode-----------------------------------------------")
    const role = data.user?.role ?? decoded.role ?? decoded.roll; // prefer backend user.role

    // Store a real user object (JSON), not just JWT payload.
    // Keeps compatibility with ProtectedRoute/Navbar which reads user.role.
    localStorage.setItem(
        'user',
        JSON.stringify({
            ...decoded,       // optional extra claims
            ...data.user,     // authoritative user fields from backend
            role,             // normalized role
        })
    );
};


function decodeJwtPayload(token: string): any {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

const OAuthSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const token = queryParams.get('token');

    if (!token) {
      navigate('/auth/login', { replace: true });
      return;
    }

    //storeAuth(data);
    localStorage.setItem('token', token);
    const decoded = decodeJwtPayload(token) ?? {};

    console.log(decoded, "dekod")
    const role = decoded.role ?? decoded.roll ?? 'user';

    localStorage.setItem('user', JSON.stringify({ ...decoded, role }));

    console.log(localStorage.getItem('user'), "test")

    navigate(role === 'admin' ? '/admin' : '/', { replace: true });
  }, [navigate]);

  return null;
};

export default OAuthSuccess;

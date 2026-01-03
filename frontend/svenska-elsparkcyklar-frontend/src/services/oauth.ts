import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

    localStorage.setItem('token', token);

    const decoded = decodeJwtPayload(token) ?? {};
    const role = decoded.role ?? decoded.roll ?? 'user';

    localStorage.setItem('user', JSON.stringify({ ...decoded, role }));

    navigate(role === 'admin' ? '/admin' : '/', { replace: true });
  }, [navigate]);

  return null;
};

export default OAuthSuccess;

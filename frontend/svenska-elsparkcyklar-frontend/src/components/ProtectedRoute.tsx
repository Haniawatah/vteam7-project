import React from 'react';
import { Navigate } from 'react-router-dom';
import { getStoredUser, isAuthenticated } from '../services/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin }) => {
  if (!isAuthenticated()) return <Navigate to="/auth/login" replace />;

  if (requireAdmin) {
    const user = getStoredUser();
    if (user?.role !== 'admin') return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
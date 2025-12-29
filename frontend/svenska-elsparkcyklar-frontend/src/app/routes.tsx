import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import Home from '../pages/Home';
import RentScooter from '../pages/Rent/RentScooter';
import ActiveRide from '../pages/Rent/ActiveRide';
import RideHistory from '../pages/Rent/RideHistory';
import Dashboard from '../pages/Admin/Dashboard';
import Scooters from '../pages/Admin/Scooters';
import Users from '../pages/Admin/Users';
import Reports from '../pages/Admin/Reports';
import Profile from '../pages/Profile/Profile';
import Payment from '../pages/Profile/Payment';
import Settings from '../pages/Profile/Settings';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import NotFound from '../pages/NotFound';
import ProtectedRoute from '../components/ProtectedRoute';

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<PublicLayout />}>
                <Route index element={<Home />} />
                <Route path="rent" element={<RentScooter />} />
                <Route path="rent/active/:rideId" element={<ProtectedRoute><ActiveRide /></ProtectedRoute>} />
                <Route path="rent/history" element={<ProtectedRoute><RideHistory /></ProtectedRoute>} />

                <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="profile/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
                <Route path="profile/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

                <Route path="auth/login" element={<Login />} />
                <Route path="auth/register" element={<Register />} />
                <Route path="*" element={<NotFound />} />
            </Route>

            <Route
                path="/admin"
                element={
                    <ProtectedRoute requireAdmin>
                        <AdminLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Dashboard />} />
                <Route path="scooters" element={<Scooters />} />
                <Route path="users" element={<Users />} />
                <Route path="reports" element={<Reports />} />
            </Route>
        </Routes>
    );
};

export default AppRoutes;
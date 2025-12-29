import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../../components/Navbar';

const AdminLayout: React.FC = () => {
    return (
        <div>
            <Navbar />
            <div className="admin-layout">
                <Outlet />
            </div>
        </div>
    );
};

export default AdminLayout;
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { getStoredUser, isAuthenticated, logout } from '../services/auth';

const Navbar = () => {
    const navigate = useNavigate();
    const authed = isAuthenticated();
    const user = getStoredUser();
    const admin = user?.role === 'admin';

    const onLogout = async () => {
        await logout();
        navigate('/auth/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/">Svenska Elsparkcyklar AB</Link>
            </div>
            <ul className="navbar-links">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/rent">Rent a Scooter</Link></li>

                {authed ? (
                    <>
                        <li><Link to="/profile">Profile</Link></li>
                        {admin && <li><Link to="/admin">Admin Dashboard</Link></li>}
                        <li><button type="button" onClick={onLogout}>Logout</button></li>
                    </>
                ) : (
                    <>
                        <li><Link to="/auth/login">Login</Link></li>
                        <li><Link to="/auth/register">Register</Link></li>
                    </>
                )}
            </ul>
        </nav>
    );
};

export default Navbar;
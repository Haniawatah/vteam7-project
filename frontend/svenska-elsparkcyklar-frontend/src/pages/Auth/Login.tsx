import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/auth';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const googleAuthUrl = 'http://localhost:3000/v1/auth/google';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const { user } = await login(email, password);
            navigate(user?.role === 'admin' ? '/admin' : '/');
        } catch {
            setError('Invalid email or password');
        }
    };

    const googleLogin = () => {
        window.location.href = googleAuthUrl;
    };

    return (
        <div className="login-container">
            <h2>Login</h2>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Login</button>

            <button onClick={googleLogin}>
                Continue with Google
            </button>
            </form>
        </div>
    );
};

export default Login;
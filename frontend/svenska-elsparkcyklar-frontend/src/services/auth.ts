import api from './api';
import type { User } from '../types';

const toMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

type AuthResponse = { token: string; user: User };

function decodeJwtPayload(token: string): any {
    const [, payload] = token.split('.');
    if (!payload) return null;

    // base64url -> base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    return JSON.parse(json);
}

export const getStoredUser = (): User | null => {
    try {
        const raw = localStorage.getItem('user');
        return raw ? (JSON.parse(raw) as User) : null;
    } catch {
        return null;
    }
};

export const isAuthenticated = () => Boolean(localStorage.getItem('token'));
export const isAdmin = () => getStoredUser()?.role === 'admin';

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

export const login = async (email: string, password: string) => {
    try {
        const res = await api.post('/login', { email, password });
        const data = res.data as AuthResponse;
        storeAuth(data);
        return data;
    } catch (error) {
        throw new Error(toMessage(error));
    }
};

export const register = async (userData: { email: string; password: string; name?: string }) => {
    try {
        const res = await api.post('/register', userData);
        const data = res.data as AuthResponse;
        storeAuth(data);
        return data;
    } catch (error) {
        throw new Error(toMessage(error));
    }
};

// Alias to match existing page import
export const registerUser = register;

export const getUsers = async (): Promise<User[]> => {
    try {
        const res = await api.get('/users');
        return res.data as User[];
    } catch (error) {
        throw new Error(toMessage(error));
    }
};

export const logout = async () => {
    try {
        await api.post('/auth/logout');
    } catch {
        // ignore
    } finally {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
};
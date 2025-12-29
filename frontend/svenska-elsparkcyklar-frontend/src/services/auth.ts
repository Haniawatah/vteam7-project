import api from './api';
import type { User } from '../types';

const toMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

type AuthResponse = { token: string; user: User };

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
    console.log(data.token);
    
    // Decode the token and store the payload directly as user
    const decodedToken = JSON.parse(atob(data.token.split('.')[1]));

    console.log("-----------");
    console.log(decodedToken);
    
    localStorage.setItem('user', JSON.stringify(decodedToken));
};

export const login = async (email: string, password: string) => {
    try {
        const data = (await api.post('/login', { email, password })) as AuthResponse;
        storeAuth(data);
        console.log(data);
        console.log("test")
        console.log(localStorage.getItem('user'))
        return data;
    } catch (error) {
        throw new Error(toMessage(error));
    }
};

export const register = async (userData: { email: string; password: string; name?: string }) => {
    try {
        console.log("-------------------")
        console.log(userData)
        console.log("userdata")
        const data = (await api.post('/register', userData)) as AuthResponse;
        storeAuth(data);
        return data;
    } catch (error) {
        throw new Error(toMessage(error));
    }
};

// Alias to match existing page import
export const registerUser = register;

export const getUsers = async () => {
    try {
        const data = await api.get('/users');
        return { data };
    } catch (error) {
        throw new Error(toMessage(error));
    }
};

export const logout = async () => {
    // optional backend call exists, but frontend can stay stateless
    try {
        await api.post('/auth/logout');
    } catch {
        // ignore
    } finally {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
};
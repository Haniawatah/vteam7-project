import axios from 'axios';

// Force '/v1' (your Vite proxy is configured for '/v1' -> backend:3000)
const api = axios.create({
    baseURL: '/v1',
});

const getToken = () => localStorage.getItem('token') || '';

api.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers = config.headers ?? {};
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Revert: keep standard axios response shape (callers use response.data)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        if (status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/profile')) {
                window.location.href = '/auth/login';
            }
        }
        console.error('API Error:', error);
        return Promise.reject(error);
    }
);

export const fetchReports = async () => (await api.get('/reports')).data;

export default api;
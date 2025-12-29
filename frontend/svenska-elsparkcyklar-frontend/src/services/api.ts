import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/v1',
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

// Response interceptor: callers receive already-unwrapped data
api.interceptors.response.use(
    (response) => response.data,
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

export const fetchReports = async () => api.get('/reports');

export const getUserPaymentInfo = async () => api.get('/users/me/payment');
export const updatePaymentInfo = async (paymentInfo: unknown) =>
    api.put('/users/me/payment', paymentInfo);

export default api;
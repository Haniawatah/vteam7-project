import axios from 'axios';

const api = axios.create({
    baseURL: (import.meta.env.VITE_API_URL ?? '/v1').replace(/\/+$/, ''),
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

export const getUserPaymentInfo = async () => (await api.get('/users/me/payment')).data;
export const updatePaymentInfo = async (paymentInfo: unknown) =>
    (await api.put('/users/me/payment', paymentInfo)).data;

export default api;
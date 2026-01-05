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


const tokenHeader = () => {
    const token = localStorage.getItem('token');
    console.log(token, "token")
    return token ? { 'x-access-token': token } : {};
};

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



export const fetchProfile = async () => {
    let token = localStorage.getItem("token");  // Fetch the token

    try {
        const response = await api.get('/user/profile', {
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token,  // Attach token here in the header
            }
        });

        console.log(response.data.data, "----------------------")

        return response.data.data;
    } catch (error) {
        throw new Error('Error fetching scooters: ' + toMessage(error));
    }
};





export const addMoney = async (amount: number) => {
    let token = localStorage.getItem("token");  // Fetch the token

    try {
        const response = await api.put(
            '/user/wallet/add',
            { amount },
            {
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token,  // Attach token here in the header
            }
        });

        console.log(response)


        return response; // return updated user object for frontend state
    } catch (error) {
        throw new Error('Error fetching scooters: ' + toMessage(error));
    }
};



export const getUserPaymentInfo = async () => {
    let token = localStorage.getItem("token");

    try {
        const response = await api.get('/user/payment', {
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token,
            }
        });
        console.log(response, "responfw")

        return response.data;
    } catch (error) {
        throw new Error('Error fetching scooters: ' + toMessage(error));
    }
};


export const updatePaymentInfo = async (paymentData: {
    cardNumber: string;
    expiryDate: string;
    cvv?: string;
}) => {

    try {
        const response = await api.put(
                '/user/payment', 
                paymentData,
            {
            headers: {
                'Content-Type': 'application/json',
                ...tokenHeader(),
            }
        });

        console.log(response)

        return response.data;
    } catch (error) {
        throw new Error('Error fetching scooters: ' + toMessage(error));
    }
};





// Start a monthly subscription
export const startSubscription = async (monthlyFee: number) => {
    const token = localStorage.getItem("token");

    try {
        const response = await api.post(
            '/user/subscription/start',
            { monthlyFee },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': token
                }
            }
        );
        return response.data;
    } catch (error) {
        throw new Error('Error starting subscription: ' + toMessage(error));
    }
};

// Cancel a subscription
export const cancelSubscription = async () => {
    const token = localStorage.getItem("token");

    try {
        const response = await api.put(
            '/user/subscription/cancel',
            {},
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': token
                }
            }
        );
        return response.data;
    } catch (error) {
        throw new Error('Error cancelling subscription: ' + toMessage(error));
    }
};

// Reactivate a subscription
export const reactivateSubscription = async () => {
    const token = localStorage.getItem("token");

    try {
        const response = await api.put(
            '/user/subscription/reactivate',
            {},
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': token
                }
            }
        );
        return response.data;
    } catch (error) {
        throw new Error('Error reactivating subscription: ' + toMessage(error));
    }
};

// Get subscription info
export const getSubscription = async () => {
    const token = localStorage.getItem("token");

    try {
        const response = await api.get('/user/subscription', {
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token
            }
        });

        console.log(response, "test")
        return response.data;
    } catch (error) {
        throw new Error('Error fetching subscription: ' + toMessage(error));
    }
};

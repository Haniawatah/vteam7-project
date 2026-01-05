import api from './api';

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
    return token ? { 'x-access-token': token } : {};
};

const storeAuth = (data: AuthResponse) => {
    localStorage.setItem('token', data.token);

    const decoded = decodeJwtPayload(data.token) ?? {};
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



function unwrapProfilePayload(payload: any) {
  // supports: { data: {...} } OR { user: {...} } OR direct {...}
  return payload?.data ?? payload?.user ?? payload;
}

function normalizeProfile(raw: any) {
  const u = unwrapProfilePayload(raw) ?? {};
  return {
    id: String(u.id ?? u._id ?? ''),
    name: String(u.name ?? u.username ?? ''),
    email: String(u.email ?? ''),
    role: (u.role === 'admin' ? 'admin' : 'user') as 'admin' | 'user',
    wallet: Number.isFinite(Number(u.wallet)) ? Number(u.wallet) : 0,
    enabled: Boolean(u.enabled),
    last4: u.last4 ?? null,
    exp_date: u.exp_date ?? null,
    subscription: u.subscription ?? { status: 'inactive', nextBillingDate: null, monthlyFee: 0 },
    rides: Array.isArray(u.rides) ? u.rides : [],
  };
}

export const fetchProfile = async () => {
  const token = localStorage.getItem('token');

  try {
    const response = await api.get('/user/profile', {
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token,
      },
    });

    // Before: return response.data.data;
    return normalizeProfile(response.data);
  } catch (error) {
    throw new Error('Error fetching profile: ' + (error instanceof Error ? error.message : String(error)));
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


        return response; // return updated user object for frontend state
    } catch (error) {
        throw new Error('Error fetching scooters: ' + toMessage(error));
    }
};



export const getUserPaymentInfo = async () => {
    const token = localStorage.getItem("token");

    try {
        const response = await api.get('/user/payment', {
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token,
            }
        });

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


        return response.data;
    } catch (error) {
        throw new Error('Error fetching subscription: ' + toMessage(error));
    }
};

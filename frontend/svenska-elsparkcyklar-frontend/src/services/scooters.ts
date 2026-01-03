import api from './api';

const toMessage = (error: unknown) =>
    error instanceof Error ? error.message : String(error);

const tokenHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { 'x-access-token': token } : {};
};

export const fetchScooters = async () => {
    try {
        const res = await api.get('/scooters', {
            headers: {
                'Content-Type': 'application/json',
                ...tokenHeader(),
            },
        });
        return res.data;
    } catch (error) {
        throw new Error('Error fetching scooters: ' + toMessage(error));
    }
};

export const fetchScooterData = fetchScooters;

export const fetchScooterById = async (id: string) => {
    try {
        const res = await api.get(`/scooters/${id}`, {
            headers: {
                'Content-Type': 'application/json',
                ...tokenHeader(),
            },
        });
        return res.data;
    } catch (error) {
        throw new Error('Error fetching scooter by ID: ' + toMessage(error));
    }
};

export const createScooter = async (scooterData: unknown) => {
    try {
        const res = await api.post('/scooters', scooterData, {
            headers: {
                'Content-Type': 'application/json',
                ...tokenHeader(),
            },
        });
        return res.data;
    } catch (error) {
        throw new Error('Error creating scooter: ' + toMessage(error));
    }
};

export const updateScooter = async (id: string, scooterData: unknown) => {
    try {
        const res = await api.put(`/scooters/${id}`, scooterData, {
            headers: {
                'Content-Type': 'application/json',
                ...tokenHeader(),
            },
        });
        return res.data;
    } catch (error) {
        throw new Error('Error updating scooter: ' + toMessage(error));
    }
};

export const deleteScooter = async (id: string) => {
    try {
        const res = await api.delete(`/scooters/${id}`, {
            headers: {
                'Content-Type': 'application/json',
                ...tokenHeader(),
            },
        });
        return res.data;
    } catch (error) {
        throw new Error('Error deleting scooter: ' + toMessage(error));
    }
};

export const rentScooter = async (scooterId: string) => {
    try {
        const res = await api.post(
            '/rides',
            { scooterId },
            {
                headers: {
                    'Content-Type': 'application/json',
                    ...tokenHeader(),
                },
            }
        );
        return res.data;
    } catch (error) {
        throw new Error('Error renting scooter: ' + toMessage(error));
    }
};

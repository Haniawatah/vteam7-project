import api from './api';

export const fetchScooters = async () => api.get('/scooters');
export const fetchScooterData = fetchScooters;

export const fetchScooterById = async (id: string) => api.get(`/scooters/${id}`);

export const createScooter = async (scooterData: unknown) => api.post('/scooters', scooterData);

export const updateScooter = async (id: string, scooterData: unknown) =>
    api.put(`/scooters/${id}`, scooterData);

export const deleteScooter = async (id: string) => api.delete(`/scooters/${id}`);

// Used by RentScooter page
export const rentScooter = async (scooterId: string) =>
    api.post('/rides', { scooterId });
// Hookar för rent-sidan (t.ex. "availableScooters").
// Håller polling/filtrering för scooters som går att hyra.

import { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import type { Scooter, ScooterStatus } from '../types';

function coerceStatus(value: unknown): ScooterStatus {
    switch (value) {
        case 'Available':
        case 'InUse':
        case 'Maintenance':
        case 'Off':
        return value;
        default:
        return 'Off';
    }
}

function coerceNumber(value: unknown, fallback = 0): number {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function coerceLocation(raw: any): { lat: number; lng: number } {
    // Accepts a few common location formats.
    if (raw && typeof raw === 'object' && typeof raw.lat === 'number' && typeof raw.lng === 'number') {
        return { lat: raw.lat, lng: raw.lng };
    }
    if (Array.isArray(raw) && raw.length >= 2) {
        return { lat: coerceNumber(raw[0]), lng: coerceNumber(raw[1]) };
    }
    if (raw && typeof raw === 'object' && Array.isArray(raw.coordinates) && raw.coordinates.length >= 2) {
        return { lng: coerceNumber(raw.coordinates[0]), lat: coerceNumber(raw.coordinates[1]) };
    }
    return { lat: 0, lng: 0 };
}

function normalizeScooter(raw: any): Scooter {
    const id = String(raw?.id ?? raw?._id ?? '');
    const batteryLevel = coerceNumber(raw?.batteryLevel ?? raw?.battery ?? 0, 0);
    const status = coerceStatus(raw?.status);
    const location = coerceLocation(raw?.location ?? raw?.position);
    const city = String(raw?.city ?? raw?.stad ?? raw?.cityName ?? '');

    return { id, batteryLevel, status, location, city };
}

function extractList(data: any): any[] {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.scooters)) return data.scooters;
    if (Array.isArray(data?.data?.scooters)) return data.data.scooters;
    return [];
}

type HookState = {
    scooters: Scooter[];
    loading: boolean;
    error: string | null;
};

export function availableScooters(pollMs = 5000) {
    const [{ scooters, loading, error }, setState] = useState<HookState>({
        scooters: [],
        loading: true,
        error: null,
    });

    const intervalRef = useRef<number | null>(null);

    const load = async (showLoading: boolean) => {
        setState((s) => ({ ...s, loading: showLoading || s.scooters.length === 0, error: null }));
        try {
        const res = await api.get('/scooters/available');
        const list = extractList(res.data);
        const normalized = list.map(normalizeScooter).filter((s) => s.id);
        setState({ scooters: normalized, loading: false, error: null });
        } catch (e: any) {
        setState((s) => ({
            ...s,
            loading: false,
            error: e?.message ?? 'Failed to load scooters',
        }));
        }
    };

    useEffect(() => {
        void load(true);

        if (intervalRef.current) window.clearInterval(intervalRef.current);
        intervalRef.current = window.setInterval(() => void load(false), pollMs);

        return () => {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
        intervalRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pollMs]);

    const refreshScooters = async () => {
        await load(true);
    };

    return { scooters, loading, error, refreshScooters };
}

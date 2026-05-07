import React, { useEffect, useState } from 'react';
import { fetchScooters, deleteScooter } from '../../services/scooters';

const Scooters = () => {
    const [scooters, setScooters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadScooters = async () => {
            try {
                const data = await fetchScooters();
                setScooters(data);
            } catch (error) {
                console.error('Failed to fetch scooters:', error);
            } finally {
                setLoading(false);
            }
        };

        loadScooters();
    }, []);

    const handleDelete = async (id: string) => {
        try {
            await deleteScooter(id);
            setScooters((prev) => prev.filter((s) => s.id !== id));
        } catch (error) {
            console.error('Failed to delete scooter:', error);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h1>Scooter Management</h1>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Model</th>
                        <th>Status</th>
                        <th />
                    </tr>
                </thead>
                <tbody>
                    {scooters.map((scooter) => (
                        <tr key={scooter.id}>
                            <td>{scooter.id}</td>
                            <td>{scooter.model}</td>
                            <td>{scooter.status}</td>
                            <td>
                                <button onClick={() => handleDelete(scooter.id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Scooters;
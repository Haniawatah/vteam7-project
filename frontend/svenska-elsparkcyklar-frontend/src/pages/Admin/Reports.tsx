import React, { useEffect, useState } from 'react';
import { fetchReports } from '../../services/api';
import { Report } from '../../types/index';

const Reports: React.FC = () => {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getReports = async () => {
            try {
                const data = await fetchReports();
                setReports(data);
            } catch (err) {
                setError('Failed to fetch reports');
            } finally {
                setLoading(false);
            }
        };

        getReports();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <h1>Reports</h1>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>User</th>
                        <th>Ride Duration</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    {reports.map((report: any) => {
                        const user = report.user ?? report.userId ?? '—';
                        const dur = Number(report.rideDuration ?? report.duration ?? 0);
                        const date = report.date ? new Date(report.date).toLocaleString() : '—';

                        return (
                            <tr key={report.id}>
                                <td>{report.id}</td>
                                <td>{user}</td>
                                <td>{dur} min</td>
                                <td>{date}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default Reports;
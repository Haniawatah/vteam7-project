import React, { useState, useEffect } from 'react';
import { getSubscription, startSubscription, cancelSubscription, reactivateSubscription } from '../../services/user';
import './Payment.css';

const money = 1000;

const MonthlySubscription = () => {
    const [subscription, setSubscription] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchSubscription = async () => {
            try {
                const data = await getSubscription();
                console.log(data, "data")
                setSubscription(data.subscription);
            } catch (e) {
                setMessage('Failed to load subscription info.');
            } finally {
                setLoading(false);
            }
        };

        fetchSubscription();
    }, []);

    const handleStart = async () => {
        try {
            const data = await startSubscription(money);
            console.log(data, "2sssasda")
            setSubscription(data.subscription);
            setMessage('Subscription started successfully!');
        } catch {
            setMessage('Failed to start subscription.');
        }
    };

    const handleCancel = async () => {
        try {
            const data = await cancelSubscription();
            console.log(data, "cancelled")
            setSubscription(data.subscription);
            let lastBilling = new Date(data.subscription.nextBillingDate).toLocaleDateString()
            setMessage(`Subscription cancelled. It will remain active until ${lastBilling}.`);
        } catch {
            setMessage('Failed to cancel subscription.');
        }
    };

    const handleReactivate = async () => {
        try {
            const data = await reactivateSubscription();
            console.log(data, "test")
            setSubscription(data.subscription);
            setMessage('Subscription reactivated.');
        } catch {
            setMessage('Failed to reactivate subscription.');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="payment-container">
            <h2>Monthly Subscription</h2>
            {message && <p className="error">{message}</p>}

            <div>
                <p>Status: {subscription?.status || 'inactive'}</p>
                <p>Monthly Fee: ${money}</p>
                <p>Next Billing: {subscription?.nextBillingDate ? new Date(subscription.nextBillingDate).toLocaleDateString() : 'N/A'}</p>
            </div>

            {subscription?.status === 'inactive' && (
                <button onClick={handleStart}>Start Subscription</button>
            )}

            {subscription?.status === 'active' && (
                <button onClick={handleCancel}>Cancel Subscription</button>
            )}

            {subscription?.status === 'stopping' && (
                <button onClick={handleReactivate}>Reactivate Subscription</button>
            )}
        </div>
    );
};

export default MonthlySubscription;

import React, { useState, useEffect } from 'react';
import { getUserPaymentInfo, updatePaymentInfo } from '../../services/api';
import './Payment.css';

type PaymentInfo = {
    cardNumber: string;
    expiryDate: string;
    cvv?: string;
};

const Payment = () => {
    const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPaymentInfo = async () => {
            try {
                const data = (await getUserPaymentInfo()) as PaymentInfo;
                setPaymentInfo(data);
            } catch {
                setError('Failed to fetch payment information.');
            } finally {
                setLoading(false);
            }
        };

        fetchPaymentInfo();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPaymentInfo((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await updatePaymentInfo({ cardNumber: paymentInfo.cardNumber, expiryDate: paymentInfo.expiryDate });
            alert('Payment information updated successfully!');
        } catch {
            setError('Failed to update payment information.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="payment-container">
            <h2>Payment Information</h2>
            {error && <p className="error">{error}</p>}

            <form className="payment-form" onSubmit={handleSubmit}>
                <label>
                    Card Number:
                    <input
                        type="text"
                        name="cardNumber"
                        value={paymentInfo.cardNumber}
                        onChange={handleChange}
                        required
                    />
                </label>

                <label>
                    Expiry Date:
                    <input
                        type="text"
                        name="expiryDate"
                        value={paymentInfo.expiryDate}
                        onChange={handleChange}
                        required
                    />
                </label>

                <label>
                    CVV:
                    <input
                        type="password"
                        name="cvv"
                        value={paymentInfo.cvv || ''}
                        onChange={handleChange}
                        placeholder="Optional"
                    />
                </label>

                <div className="payment-actions">
                    <button type="submit">Update Payment Info</button>
                </div>
            </form>
        </div>
    );
};

export default Payment;
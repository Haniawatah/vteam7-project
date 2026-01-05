import React, { useState } from 'react';
import { updatePaymentInfo } from '../../services/user';
import './Payment.css';

type PaymentInfo = {
    cardNumber: string;
    exp_date: string;
    cvv: string;
};

const Payment = () => {
    const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
        cardNumber: '',
        exp_date: '',
        cvv: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPaymentInfo((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await updatePaymentInfo({
                cardNumber: paymentInfo.cardNumber,
                expiryDate: paymentInfo.exp_date,
                cvv: paymentInfo.cvv,
            });
            alert('Payment information updated successfully!');
            // Optionally clear the form
            setPaymentInfo({ cardNumber: '', exp_date: '', cvv: '' });
        } catch {
            setError('Failed to update payment information.');
        } finally {
            setLoading(false);
        }
    };

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
                        maxLength={16}
                        pattern="\d*"
                        required
                    />
                </label>

                <label>
                    Expiry Date:
                    <input
                        type="text"
                        name="exp_date"
                        value={paymentInfo.exp_date}
                        onChange={handleChange}
                        placeholder="MM/YY"
                        maxLength={5}
                        required
                    />
                </label>

                <label>
                    CVV:
                    <input
                        type="text"
                        name="cvv"
                        value={paymentInfo.cvv}
                        onChange={handleChange}
                        maxLength={3}
                        pattern="\d*"
                        required
                    />
                </label>

                <div className="payment-actions">
                    <button type="submit" disabled={loading}>
                        {loading ? 'Saving...' : 'Update Payment Info'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Payment;

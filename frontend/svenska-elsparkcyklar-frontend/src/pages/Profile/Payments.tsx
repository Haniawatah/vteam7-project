import React, { useState, useEffect } from 'react';
import { getUserPaymentInfo, addMoney } from '../../services/user';
import { useNavigate } from 'react-router-dom';
import './Payment.css';

type PaymentInfo = {
    cardNumber: string;
    exp_date: string;
    cvv?: string;
};

const Payments = () => {
    const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
    const [wallet, setWallet] = useState(0);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getUserPaymentInfo();

                console.log(data.data, "dwwwwwwwwwwwwwwwww")
    
                setPaymentInfo(data.data);
            } catch {
                setMessage('Failed to load payment info.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleAddMoney = async () => {
        const amt = parseFloat(amount);
        if (!amt || amt <= 0) return setMessage('Enter a valid amount.');
        try {
            await addMoney(amt);
            navigate('/profile/');
        } catch {
            setMessage('Failed to add money.');
        }
    };



    if (loading) return <div>Loading...</div>;

    return (
        <div className="payment-container">
            <h2>Payment Methods</h2>
            {paymentInfo ? (
                <div>
                    <p>Card: **** **** **** {paymentInfo.last4}</p>
                    <p>Exp: {paymentInfo.exp_date}</p>
                </div>
            ) : (
                <p>No card info found.</p>
            )}

            <div className="wallet-actions">

                <input
                    type="number"
                    placeholder="Amount to add"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
                <button onClick={handleAddMoney}>Add Money (Prepaid)</button>

            </div>
        </div>
    );
};

export default Payments;

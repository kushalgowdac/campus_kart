import React, { useState } from 'react';
import { verifyOtp, cancelReservation } from '../api';

const SellerOTPInput = ({ product, onUpdate }) => {
    const [otpInput, setOtpInput] = useState('');
    const [error, setError] = useState('');
    const [status, setStatus] = useState(''); // 'success' or error message
    const [loading, setLoading] = useState(false);

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        setStatus('');
        setLoading(true);

        try {
            await verifyOtp(product.pid, otpInput);
            setStatus('success');
            setOtpInput('');
            if (onUpdate) {
                await onUpdate();
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!window.confirm("Cancel this transaction? The item will become available for others.")) return;
        setLoading(true);
        try {
            await cancelReservation(product.pid);
            if (onUpdate) onUpdate();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (status === 'success') {
        return (
            <div className="card" style={{ marginTop: '1rem', border: '2px solid #4CAF50', backgroundColor: '#f9fff9' }}>
                <h3 style={{ color: '#4CAF50', textAlign: 'center' }}>✅ Verification Successful</h3>
                <p style={{ textAlign: 'center' }}>Item marked as SOLD.</p>
            </div>
        );
    }

    return (
        <div className="card" style={{ marginTop: '1rem', border: '1px solid #2196F3' }}>
            <h3>Verify Buyer</h3>
            <p>Ask the buyer for the 6-digit OTP code to complete the sale.</p>
            <div className="status warning" style={{ marginTop: '0.75rem' }}>
                Enter the OTP only after you have handed over the product.
            </div>

            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    style={{ fontSize: '1.5rem', textAlign: 'center', letterSpacing: '5px' }}
                    required
                />

                <button type="submit" disabled={loading || otpInput.length !== 6} className="primary">
                    {loading ? 'Verifying...' : 'Verify & Mark Sold'}
                </button>
            </form>

            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <button onClick={handleCancel} className="ghost" style={{ color: '#666' }}>
                    Cancel Transaction
                </button>
            </div>

            {error && <div className="error" style={{ marginTop: '10px' }}>{error}</div>}
        </div>
    );
};

export default SellerOTPInput;

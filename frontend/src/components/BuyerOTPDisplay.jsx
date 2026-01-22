import React, { useState, useEffect } from 'react';
import { confirmMeet, cancelReservation } from '../api';

const BuyerOTPDisplay = ({ product, onUpdate }) => {
    const [otp, setOtp] = useState(null);
    const [expiresIn, setExpiresIn] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // If product is already meet_confirmed, we might need to re-fetch OTP or just show state
    // But confirmMeet endpoint is idempotent (returns existing if valid), so we can call it to get OTP again
    // OR we can just show "Ready to Verify" if we don't have OTP stored.
    // Ideally, we should fetch OTP if state is meet_confirmed. 
    // Let's rely on user clicking "Show OTP" if getting it automatically is hard without storage.
    // Actually, confirmMeet returns existing OTP info if active.

    const handleConfirmMeet = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await confirmMeet(product.pid);
            if (data.otp) {
                setOtp(data.otp);
                setExpiresIn(data.expiresIn);
            } else {
                // Should not happen with corrected backend logic unless error
                setError(data.message || 'Failed to generate OTP');
            }
            if (onUpdate) onUpdate();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!window.confirm('Are you sure you want to cancel the reservation?')) return;
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

    // Countdown timer
    useEffect(() => {
        if (!expiresIn || expiresIn <= 0) return;
        const timer = setInterval(() => {
            setExpiresIn(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [expiresIn]);

    if (product.status === 'location_selected') {
        return (
            <div className="card" style={{ marginTop: '1rem', border: '1px solid #e0e0e0' }}>
                <h3>Step 3: Generate OTP</h3>
                <p>Location confirmed! Click below to generate your verification code.</p>
                <div className="actions">
                    <button
                        onClick={handleConfirmMeet}
                        disabled={loading}
                        className="primary"
                    >
                        {loading ? 'Processing...' : 'Generate OTP for Exchange'}
                    </button>
                    <button
                        onClick={handleCancel}
                        disabled={loading}
                        className="ghost"
                        style={{ color: 'red' }}
                    >
                        Cancel Reservation
                    </button>
                </div>
                {error && <div className="error">{error}</div>}
            </div>
        );
    }

    if (product.status === 'otp_generated') {
        return (
            <div className="card" style={{ marginTop: '1rem', border: '2px solid #4CAF50', textAlign: 'center' }}>
                <h3 style={{ color: '#4CAF50' }}>Exchange OTP</h3>
                <p>Show this code to the seller to complete the purchase</p>

                {otp ? (
                    <div style={{ margin: '1.5rem 0' }}>
                        <div style={{ fontSize: '3rem', fontWeight: 'bold', letterSpacing: '5px' }}>
                            {otp}
                        </div>
                        {expiresIn > 0 ? (
                            <p className="muted">Expires in: {Math.floor(expiresIn / 60)}:{(expiresIn % 60).toString().padStart(2, '0')}</p>
                        ) : (
                            <p style={{ color: 'red' }}>OTP Expired. Please refresh.</p>
                        )}
                    </div>
                ) : (
                    <div style={{ margin: '1rem' }}>
                        <button onClick={handleConfirmMeet} className="secondary">
                            Reveal OTP
                        </button>
                    </div>
                )}

                <div className="actions" style={{ justifyContent: 'center' }}>
                    <button
                        onClick={handleCancel}
                        className="ghost"
                        style={{ color: '#666' }}
                    >
                        Cancel Exchange
                    </button>
                </div>
                {error && <div className="error">{error}</div>}
            </div>
        );
    }

    return null;
};

export default BuyerOTPDisplay;

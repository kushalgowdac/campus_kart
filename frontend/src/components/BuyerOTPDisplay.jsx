import React, { useState, useEffect, useMemo } from 'react';
import { confirmMeet, cancelReservation } from '../api';

const BuyerOTPDisplay = ({ product, onUpdate }) => {
    const [otp, setOtp] = useState(null);
    const [expiresIn, setExpiresIn] = useState(null);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [loading, setLoading] = useState(false);
    const [showOtp, setShowOtp] = useState(false);
    const [readyToGenerate, setReadyToGenerate] = useState(false);
    const [acknowledgeReceipt, setAcknowledgeReceipt] = useState(false);
    const isLocationSelected = product.status === 'location_selected';
    const isOtpGenerated = product.status === 'otp_generated';
    const storageKey = useMemo(() => product?.pid ? `campuskart_otp_${product.pid}` : null, [product?.pid]);

    // If product is already meet_confirmed, we might need to re-fetch OTP or just show state
    // But confirmMeet endpoint is idempotent (returns existing if valid), so we can call it to get OTP again
    // OR we can just show "Ready to Verify" if we don't have OTP stored.
    // Ideally, we should fetch OTP if state is meet_confirmed. 
    // Let's rely on user clicking "Show OTP" if getting it automatically is hard without storage.
    // Actually, confirmMeet returns existing OTP info if active.

    const persistOtp = (code, ttlSeconds) => {
        if (!storageKey) return;
        try {
            const expiresAt = Date.now() + (ttlSeconds ?? 0) * 1000;
            localStorage.setItem(storageKey, JSON.stringify({ otp: code, expiresAt }));
        } catch (err) {
            console.warn('Failed to persist OTP', err);
        }
    };

    const clearStoredOtp = () => {
        if (!storageKey) return;
        try {
            localStorage.removeItem(storageKey);
        } catch (err) {
            console.warn('Failed to clear OTP', err);
        }
    };

    const loadStoredOtp = () => {
        if (!storageKey) return false;
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) return false;
            const parsed = JSON.parse(raw);
            if (!parsed?.otp || !parsed?.expiresAt) {
                localStorage.removeItem(storageKey);
                return false;
            }
            const remaining = Math.floor((parsed.expiresAt - Date.now()) / 1000);
            if (remaining <= 0) {
                localStorage.removeItem(storageKey);
                return false;
            }
            setOtp(parsed.otp);
            setExpiresIn(remaining);
            return true;
        } catch (err) {
            console.warn('Failed to load stored OTP', err);
            localStorage.removeItem(storageKey);
            return false;
        }
    };

    const handleConfirmMeet = async () => {
        if (!readyToGenerate) {
            setError('Please confirm you are at the meeting location and ready to exchange.');
            return;
        }
        setLoading(true);
        setError('');
        setNotice('');
        try {
            const data = await confirmMeet(product.pid);
            if (data.otp) {
                setOtp(data.otp);
                setExpiresIn(data.expiresIn);
                persistOtp(data.otp, data.expiresIn);
                setShowOtp(false);
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

    const getCancelReason = () => {
        const choice = window.prompt(
            "Why are you cancelling?\n1) Changed mind\n2) Bad product condition\n3) Seller late / no show\n\nEnter 1, 2, or 3"
        );
        if (!choice) return null;
        if (choice.trim() === "2") return "bad_condition";
        if (choice.trim() === "3") return "seller_late";
        return "changed_mind";
    };

    const handleCancel = async () => {
        if (!window.confirm('Are you sure you want to cancel this transaction?')) return;
        const reason = getCancelReason();
        if (!reason) return;
        setLoading(true);
        setNotice('');
        try {
            await cancelReservation(product.pid, { reason });
            clearStoredOtp();
            setOtp(null);
            setShowOtp(false);
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

    // Load stored OTP whenever product/status changes to otp_generated
    useEffect(() => {
        if (!isOtpGenerated) {
            setShowOtp(false);
            setOtp(null);
            setExpiresIn(null);
            setAcknowledgeReceipt(false);
            if (!isLocationSelected) {
                clearStoredOtp();
            }
            return;
        }
        loadStoredOtp();
    }, [isOtpGenerated, isLocationSelected, storageKey]);

    useEffect(() => {
        if (!isLocationSelected) {
            setReadyToGenerate(false);
        }
    }, [isLocationSelected]);

    useEffect(() => {
        if (expiresIn !== null && expiresIn <= 0) {
            clearStoredOtp();
        }
    }, [expiresIn]);

    const handleRevealOtp = () => {
        if (!acknowledgeReceipt) {
            setError('Please confirm you received and verified the product before revealing the OTP.');
            return;
        }
        if (!otp) {
            setError('OTP unavailable on this device. Please use the code you copied earlier or wait for it to expire.');
            return;
        }
        setShowOtp(true);
    };

    if (!isLocationSelected && !isOtpGenerated) {
        return null;
    }

    return (
        <div className="card" style={{ marginTop: '1rem', border: isOtpGenerated ? '2px solid #4CAF50' : '1px solid #e0e0e0', textAlign: isOtpGenerated ? 'center' : 'left' }}>
            {isLocationSelected && (
                <>
                    <h3>Step 3: Generate OTP</h3>
                    <p>Location confirmed. Generate the OTP only when you are physically at the meeting point.</p>
                    <div className="status warning" style={{ marginTop: '0.75rem' }}>
                        ⚠️ Only generate the OTP when you are ready to exchange and have verified the item.
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <input
                            type="checkbox"
                            checked={readyToGenerate}
                            onChange={(e) => setReadyToGenerate(e.target.checked)}
                        />
                        <span className="muted">I am at the meeting location and ready to exchange.</span>
                    </label>
                    <div className="actions">
                        <button
                            onClick={handleConfirmMeet}
                            disabled={loading || !readyToGenerate}
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
                            Cancel Transaction
                        </button>
                    </div>
                    <p className="muted" style={{ marginTop: '0.5rem' }}>
                        Cancelling releases the item back to the marketplace.
                    </p>
                </>
            )}

            {isOtpGenerated && (
                <>
                    <h3 style={{ color: '#4CAF50' }}>Exchange OTP</h3>
                    <p>Share this code only after you receive and verify the product.</p>

                    <div className="status warning" style={{ marginTop: '0.75rem' }}>
                        Never share the OTP before receiving the product. Sharing it finalizes the sale.
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <input
                            type="checkbox"
                            checked={acknowledgeReceipt}
                            onChange={(e) => setAcknowledgeReceipt(e.target.checked)}
                        />
                        <span className="muted">I have received and verified the product.</span>
                    </label>

                    {showOtp && otp ? (
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
                                <button onClick={handleRevealOtp} className="secondary" disabled={!otp || !acknowledgeReceipt}>
                                Reveal OTP
                            </button>
                            {!otp && (
                                <p className="muted" style={{ marginTop: '0.5rem' }}>
                                    OTP can only be viewed on the device where it was generated until it expires (10 minutes).
                                </p>
                            )}
                        </div>
                    )}

                    <div className="actions" style={{ justifyContent: 'center' }}>
                        <span className="muted" style={{ fontSize: '0.9rem' }}>
                            If there is a problem, use the Report Issue button in the transaction section.
                        </span>
                    </div>
                </>
            )}

            {notice && <div className="status info" style={{ marginTop: '0.75rem' }}>{notice}</div>}
            {error && <div className="error">{error}</div>}
        </div>
    );
};

export default BuyerOTPDisplay;

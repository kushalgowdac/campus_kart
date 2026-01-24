
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchProductById, addWishlist, reserveProduct, getLocations, rescheduleProduct, rejectReschedule, cancelReservation } from "../api";
import { useAuth } from "../context/AuthContext";
import BuyerOTPDisplay from "../components/BuyerOTPDisplay";
import SellerOTPInput from "../components/SellerOTPInput";
import SellerLocationProposal from "../components/SellerLocationProposal";
import BuyerLocationSelector from "../components/BuyerLocationSelector";

export default function ProductDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [status, setStatus] = useState({ type: "", message: "" });
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchProductById(id);
                setProduct(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const refreshProduct = async () => {
        try {
            const updated = await fetchProductById(id);
            setProduct(updated);

            // Fetch selected location if product is in location_selected or otp_generated state
            if (['location_selected', 'otp_generated'].includes(updated.status)) {
                try {
                    const locs = await getLocations(updated.pid);
                    const selected = locs.find(l => l.is_selected);
                    if (selected) {
                        setSelectedLocation(selected.location);
                        setSelectedTime(selected.meeting_time);
                    }
                } catch (err) {
                    console.error('Failed to fetch selected location', err);
                }
            }
        } catch (err) {
            console.error("Failed to refresh product", err);
        }
    };

    useEffect(() => {
        const intervalId = setInterval(() => {
            refreshProduct();
        }, 3000);

        return () => clearInterval(intervalId);
    }, [id]);

    const handleWishlist = async () => {
        try {
            await addWishlist({ uid: currentUser.uid, pid: product.pid });
            setStatus({ type: "success", message: "Added to wishlist" });
        } catch (err) {
            setStatus({ type: "error", message: err.message });
        }
    };

    const handleReserve = async () => {
        if (!currentUser) {
            alert("Please login to reserve products.");
            return;
        }
        if (!window.confirm(`Reserve ${product.pname}? You will need to meet the seller to complete the purchase.`)) return;

        try {
            await reserveProduct(product.pid);
            setStatus({ type: "success", message: "Product reserved! Proceed to meet the seller." });
            refreshProduct();
        } catch (err) {
            setStatus({ type: "error", message: err.message });
        }
    };

    const handleReschedule = async () => {
        // Safe string comparison for IDs
        const currentUserIdStr = String(currentUser.uid);
        const requestUserIdStr = product.reschedule_requested_by ? String(product.reschedule_requested_by) : null;

        // If request exists AND it is NOT from me -> It's an Accept action
        const isAccepting = requestUserIdStr && requestUserIdStr !== currentUserIdStr;

        const message = isAccepting
            ? "Accept reschedule request? This will reset the meeting."
            : "Request to reschedule? This will be sent to the other party for approval.";

        if (!window.confirm(message)) return;

        try {
            await rescheduleProduct(product.pid);
            if (isAccepting) {
                setStatus({ type: "success", message: "Reschedule accepted! Meeting reset." });
            } else {
                setStatus({ type: "success", message: "Reschedule requested! Waiting for approval." });
            }
            refreshProduct();
        } catch (err) {
            setStatus({ type: "error", message: err.message });
        }
    };

    const handleRejectReschedule = async () => {
        // Safe check for warning
        const currentUserIdStr = String(currentUser.uid);
        const requestUserIdStr = product.reschedule_requested_by ? String(product.reschedule_requested_by) : null;
        const sellerIdStr = String(product.sellerid);
        const reservedByStr = String(product.reserved_by);

        const isBuyer = currentUserIdStr === reservedByStr;
        const requestFromSeller = requestUserIdStr === sellerIdStr;

        let confirmMsg = "Reject/Cancel the reschedule request?";
        if (isBuyer && requestFromSeller) {
            confirmMsg = "⚠️ WARNING: Rejecting the Seller's request will CANCEL the entire transaction and make the product available to everyone. Are you sure?";
        }

        if (!window.confirm(confirmMsg)) return;

        try {
            const res = await rejectReschedule(product.pid);
            if (res.action === 'cancelled') {
                setStatus({ type: "info", message: "Transaction Cancelled. Product is now available." });
                navigate("/"); // Redirect to home as they lost the reservation
            } else {
                setStatus({ type: "info", message: "Reschedule request cancelled." });
                refreshProduct();
            }
        } catch (err) {
            setStatus({ type: "error", message: err.message });
        }
    };

    const handleCancelReservation = async () => {
        if (!window.confirm("Are you sure you want to CANCEL this entire reservation? This cannot be undone.")) return;
        try {
            await cancelReservation(product.pid);
            setStatus({ type: "success", message: "Reservation cancelled." });
            refreshProduct();
        } catch (err) {
            setStatus({ type: "error", message: err.message });
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="error">Error: {error}</div>;
    if (!product) return <div>Product not found</div>;

    const user = currentUser;
    const isBuyer = user?.uid === product?.reserved_by;
    const isSeller = user?.uid === product?.sellerid;

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <button onClick={() => navigate(-1)} className="ghost" style={{ marginBottom: '1rem' }}>
                &larr; Back
            </button>

            {status.message && (
                <div className={`status ${status.type}`}>{status.message}</div>
            )}

            <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                    {product.img_url ? (
                        <img src={product.img_url} alt={product.pname} style={{ width: '100%', borderRadius: '8px' }} />
                    ) : (
                        <div className="thumb placeholder" style={{ width: '100%', height: '300px' }}>No Image</div>
                    )}
                </div>
                <div>
                    <h1>{product.pname}</h1>
                    <div className="badge-row" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span className={`badge ${product.status}`}>{product.status}</span>
                        <h2 style={{ margin: 0 }}>₹ {product.price}</h2>
                    </div>
                    <p className="muted" style={{ marginTop: '0.5rem' }}>
                        Only 1 unit available per listing.
                    </p>

                    <p className="muted" style={{ marginTop: '1rem' }}>
                        Category: {product.category}
                    </p>
                    <p className="muted">
                        Seller: {product.seller_name}
                    </p>
                    <p className="muted">
                        Preferred Year: {product.preferred_for}
                    </p>

                    {/* Specs would ideally be a separate fetch or included. productController currently joins simple props but not full specs list.
               The current controller does: LEFT JOIN (SELECT pid, MIN(img_url)...) but NOT specs.
               So we might not see specs here yet unless we update the controller.
           */}

                    <div style={{ marginTop: '2rem' }}>
                        {/* Action Buttons Area */}

                        {/* 1. Available State */}
                        {product.status === 'available' && (
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                {currentUser && product.sellerid !== currentUser.uid ? (
                                    <button onClick={handleReserve} className="primary">Reserve to Buy</button>
                                ) : (
                                    product.sellerid === currentUser?.uid && <span className="muted">Your listed product</span>
                                )}
                                <button className="secondary" onClick={handleWishlist}>Add to Wishlist</button>
                            </div>
                        )}

                        {/* 2. Reserved State - Seller proposes locations */}
                        {product.status === 'reserved' && currentUser && product.sellerid === currentUser.uid && !product.reschedule_requested_by && (
                            <SellerLocationProposal product={product} onUpdate={refreshProduct} />
                        )}

                        {/* 3. Location Proposed - Buyer selects location */}
                        {product.status === 'location_proposed' && currentUser && product.reserved_by === currentUser.uid && !product.reschedule_requested_by && (
                            <BuyerLocationSelector product={product} onUpdate={refreshProduct} />
                        )}

                        {/* 4. Location Selected - Show selected location */}
                        {product.status === 'location_selected' && selectedLocation && (
                            <div className="card" style={{ marginTop: '1rem', border: '1px solid #4CAF50' }}>
                                <h3>✓ Meeting Location Confirmed</h3>
                                <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}><strong>{selectedLocation}</strong></p>
                                {selectedTime && (
                                    <p style={{ fontSize: '1.1rem', color: '#555', marginBottom: '0.5rem' }}>
                                        🕒 {selectedTime}
                                    </p>
                                )}
                                {currentUser && product.reserved_by === currentUser.uid && (
                                    <p className="muted">Ready to generate OTP below</p>
                                )}
                            </div>
                        )}

                        {/* 5. Location Selected / OTP Generated - Buyer and Seller Views */}
                        {(['location_selected', 'otp_generated'].includes(product.status) && !product.reschedule_requested_by) && (
                            <>
                                {/* Buyer View - OTP Flow */}
                                {isBuyer && (
                                    <BuyerOTPDisplay product={product} onUpdate={refreshProduct} />
                                )}

                                {/* Seller View - OTP Input */}
                                {product.status === 'otp_generated' && isSeller && (
                                    <SellerOTPInput product={product} onUpdate={refreshProduct} />
                                )}

                                {/* Seller waiting message */}
                                {isSeller && product.status === 'location_selected' && (
                                    <div className="card" style={{ border: '1px dashed #ffa500', marginTop: '1rem' }}>
                                        <h4>Location Confirmed</h4>
                                        <p>Waiting for buyer to generate OTP...</p>
                                    </div>
                                )}

                            </>
                        )}

                        {/* Reschedule Logic - Separated from OTP flow to ensure visibility during pending requests */}
                        {(['location_selected', 'otp_generated'].includes(product.status) && currentUser && (product.sellerid === currentUser.uid || product.reserved_by === currentUser.uid)) && (
                            <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                                {(() => {
                                    // Safe String Comparison
                                    const currentUserIdStr = String(currentUser.uid);
                                    const requestUserIdStr = product.reschedule_requested_by ? String(product.reschedule_requested_by) : null;

                                    const isPending = requestUserIdStr !== null;
                                    const isRequester = isPending && requestUserIdStr === currentUserIdStr;
                                    const isOtherPartyRequest = isPending && !isRequester;

                                    return (
                                        <>
                                            {/* State A: No Request -> Show Request Button */}
                                            {!isPending && (
                                                <>
                                                    <button
                                                        onClick={handleReschedule}
                                                        className="secondary"
                                                        style={{ width: '100%' }}
                                                    >
                                                        🔄 Request Reschedule
                                                    </button>
                                                    <p className="muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem', textAlign: 'center' }}>
                                                        Requires mutual agreement
                                                    </p>
                                                </>
                                            )}

                                            {/* State B: My Request -> Show Waiting */}
                                            {isRequester && (
                                                <div style={{ textAlign: 'center' }}>
                                                    <p style={{ color: '#666', marginBottom: '0.5rem' }}>⏳ Waiting for other party approval...</p>
                                                    <button
                                                        onClick={handleRejectReschedule}
                                                        className="outline"
                                                        style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}
                                                    >
                                                        Cancel Request
                                                    </button>
                                                </div>
                                            )}

                                            {/* State C: Their Request -> Show Accept/Reject */}
                                            {isOtherPartyRequest && (
                                                <div className="card" style={{ background: '#fff8e1', border: '1px solid #ffcc00' }}>
                                                    <p style={{ fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'center' }}>
                                                        ⚠️ Other user requested to reschedule
                                                    </p>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button
                                                            onClick={handleReschedule}
                                                            style={{ flex: 1, background: '#4CAF50', color: 'white', border: 'none' }}
                                                        >
                                                            ✅ Accept
                                                        </button>
                                                        <button
                                                            onClick={handleRejectReschedule}
                                                            style={{ flex: 1, background: '#f44336', color: 'white', border: 'none' }}
                                                        >
                                                            ❌ Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        )}

                        {/* 🔴 Cancel Transaction Option (Buyer Only) */}
                        {product.reserved_by === currentUser.uid && (
                            <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                                <button
                                    onClick={handleCancelReservation}
                                    className="outline"
                                    style={{ color: '#d32f2f', borderColor: '#d32f2f', fontSize: '0.9rem' }}
                                >
                                    🚫 Cancel Entire Transaction
                                </button>
                            </div>
                        )}


                        {/* 6. Sold State */}
                        {product.status === 'sold' && (
                            <button disabled>Sold Out</button>
                        )}
                    </div>
                </div>
            </div>

        </div >
    );
}


import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchProductById, addWishlist, reserveProduct, getLocations, rescheduleProduct, rejectReschedule, cancelReservation, fetchTransactions, createRating, fetchUserGamification, checkRatingStatus, fetchProductSpecs, fetchWishlist, removeWishlistItem, createDispute } from "../api";
import { useAuth } from "../context/AuthContext";
import BuyerOTPDisplay from "../components/BuyerOTPDisplay";
import SellerOTPInput from "../components/SellerOTPInput";
import SellerLocationProposal from "../components/SellerLocationProposal";
import BuyerLocationSelector from "../components/BuyerLocationSelector";
import BadgesRow from "../components/BadgesRow";
import TransactionTimeline from "../components/TransactionTimeline";
import { resolveImageUrl } from "../utils/images";
import productPlaceholder from "../assets/product-placeholder.svg";

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
    const [tradeInfo, setTradeInfo] = useState(null);
    const [sellerGamification, setSellerGamification] = useState(null);
    const [productSpecs, setProductSpecs] = useState([]);
    const [ratingForm, setRatingForm] = useState({ rating: 5, comment: "" });
    const [ratingSubmitting, setRatingSubmitting] = useState(false);
    const [alreadyRated, setAlreadyRated] = useState(false);
    const [existingRating, setExistingRating] = useState(null);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const previousStatusRef = useRef(null);
    const [heroImage, setHeroImage] = useState(productPlaceholder);

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

    const user = currentUser;
    const isBuyer = user?.uid === product?.reserved_by;
    const isSeller = user?.uid === product?.sellerid;

    useEffect(() => {
        if (!product) return;

        if (product.status === "sold") {
            setStatus({ type: "success", message: "Transaction complete. Item sold." });
            return;
        }

        if (status.message && product.status !== "reserved" && status.message.startsWith("Product reserved!")) {
            setStatus({ type: "", message: "" });
            return;
        }

        if (status.message && !product.reschedule_requested_by && status.message.startsWith("Reschedule requested!")) {
            setStatus({ type: "", message: "" });
        }
    }, [product, status.message]);

    useEffect(() => {
        if (!product) return;
        const previousStatus = previousStatusRef.current;
        const previousInProgress = ["reserved", "location_proposed", "location_selected", "otp_generated"].includes(previousStatus);
        const nowAvailable = product.status === "available" && !product.reserved_by;

        if (isSeller && previousInProgress && nowAvailable) {
            setStatus({ type: "info", message: "Reservation cancelled. The item is available again." });
        }

        previousStatusRef.current = product.status;
    }, [product, isSeller]);

    useEffect(() => {
        const loadSpecs = async () => {
            if (!product?.pid) return;
            try {
                const specs = await fetchProductSpecs(product.pid);
                setProductSpecs(Array.isArray(specs) ? specs : []);
            } catch {
                setProductSpecs([]);
            }
        };
        loadSpecs();
    }, [product?.pid]);

    useEffect(() => {
        if (product?.img_url) {
            setHeroImage(resolveImageUrl(product.img_url));
        } else {
            setHeroImage(productPlaceholder);
        }
    }, [product?.img_url]);

    useEffect(() => {
        const loadWishlistStatus = async () => {
            if (!currentUser?.uid || !product?.pid) {
                setIsInWishlist(false);
                return;
            }
            try {
                const items = await fetchWishlist(currentUser.uid);
                const exists = Array.isArray(items) && items.some((item) => Number(item.pid) === Number(product.pid));
                setIsInWishlist(exists);
            } catch {
                setIsInWishlist(false);
            }
        };
        loadWishlistStatus();
    }, [currentUser?.uid, product?.pid]);

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

    useEffect(() => {
        const loadTradeInfo = async () => {
            if (!product?.pid) return;
            if (product.status !== "sold") {
                setTradeInfo(null);
                return;
            }
            try {
                const tx = await fetchTransactions(`?pid=${encodeURIComponent(product.pid)}&status=completed`);
                setTradeInfo(tx?.[0] || null);
            } catch {
                setTradeInfo(null);
            }
        };
        loadTradeInfo();
    }, [product?.pid, product?.status]);

    // Fetch seller's gamification data
    useEffect(() => {
        const loadSellerGamification = async () => {
            if (!product?.sellerid) return;
            try {
                const data = await fetchUserGamification(product.sellerid);
                setSellerGamification(data);
            } catch (err) {
                console.error('Failed to load seller gamification:', err);
                setSellerGamification(null);
            }
        };
        loadSellerGamification();
    }, [product?.sellerid]);

    // Check if current user has already rated this product
    useEffect(() => {
        const checkRating = async () => {
            if (!product?.pid || !currentUser?.uid || product.status !== 'sold') {
                setAlreadyRated(false);
                setExistingRating(null);
                return;
            }

            try {
                const response = await checkRatingStatus(product.pid);
                console.log('📊 Rating status check:', response);

                if (response.alreadyRated) {
                    setAlreadyRated(true);
                    setExistingRating({
                        rating: response.rating,
                        comment: response.comment,
                        ratedAt: response.ratedAt
                    });
                    console.log('✅ User already rated this product:', response.rating, '/5');
                } else {
                    setAlreadyRated(false);
                    setExistingRating(null);
                    console.log('⭐ User has not rated this product yet');
                }
            } catch (err) {
                console.error('Failed to check rating status:', err);
                // On error, assume not rated to allow user to try
                setAlreadyRated(false);
                setExistingRating(null);
            }
        };
        checkRating();
    }, [product?.pid, product?.status, currentUser?.uid]);

    const handleWishlist = async () => {
        if (!currentUser?.uid) {
            alert("Please login to manage your wishlist.");
            return;
        }
        if (!product?.pid) return;
        if (wishlistLoading) return;
        setWishlistLoading(true);
        try {
            if (isInWishlist) {
                await removeWishlistItem(currentUser.uid, product.pid);
                setIsInWishlist(false);
                setStatus({ type: "success", message: "Removed from wishlist" });
            } else {
                await addWishlist({ uid: currentUser.uid, pid: product.pid });
                setIsInWishlist(true);
                setStatus({ type: "success", message: "Added to wishlist" });
            }
        } catch (err) {
            setStatus({ type: "error", message: err.message });
        } finally {
            setWishlistLoading(false);
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
            setStatus({ type: "success", message: "Product reserved! Waiting for the seller to propose meeting locations." });
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

    const getCancelReason = () => {
        const choice = window.prompt(
            "Why are you cancelling?\n1) Changed mind\n2) Bad product condition\n3) Seller late / no show\n\nEnter 1, 2, or 3"
        );
        if (!choice) return null;
        if (choice.trim() === "2") return "bad_condition";
        if (choice.trim() === "3") return "seller_late";
        return "changed_mind";
    };

    const handleCancelReservation = async () => {
        if (!window.confirm("Are you sure you want to cancel this transaction? This cannot be undone.")) return;
        const reason = getCancelReason();
        if (!reason) return;
        try {
            await cancelReservation(product.pid, { reason });
            setStatus({ type: "success", message: "Transaction cancelled." });
            refreshProduct();
        } catch (err) {
            setStatus({ type: "error", message: err.message });
        }
    };

    const handleReportIssue = async () => {
        if (!currentUser || !product) return;
        const isBuyer = product.reserved_by === currentUser.uid;
        const isSeller = product.sellerid === currentUser.uid;
        if (!isBuyer && !isSeller) return;
        if (!['location_selected', 'otp_generated'].includes(product.status)) {
            setStatus({ type: "error", message: "Reports can only be raised after the meeting is scheduled." });
            return;
        }

        const promptText = isSeller
            ? "What is the issue?\n1) Buyer late / no show\n2) Buyer unresponsive\n3) Other\n\nEnter 1, 2, or 3"
            : "What is the issue?\n1) Bad product condition\n2) Seller late / no show\n3) Other\n\nEnter 1, 2, or 3";

        const choice = window.prompt(promptText);
        if (!choice) return;

        let reason = "other";
        if (isSeller) {
            if (choice.trim() === "1") reason = "buyer_no_show";
            else if (choice.trim() === "2") reason = "buyer_unresponsive";
        } else {
            if (choice.trim() === "1") reason = "bad_condition";
            else if (choice.trim() === "2") reason = "seller_no_show";
        }

        const details = window.prompt("Add details (optional)") || "";
        try {
            await createDispute(product.pid, { reason, details });
            setStatus({ type: "info", message: "Report submitted. Our team will review it." });
        } catch (err) {
            setStatus({ type: "error", message: err.message });
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="error">Error: {error}</div>;
    if (!product) return <div>Product not found</div>;

    const completedBuyerId = tradeInfo?.buyerid;
    const completedSellerId = tradeInfo?.sellerid;
    const isCompletedBuyer = currentUser?.uid && Number(currentUser.uid) === Number(completedBuyerId);
    const isCompletedSeller = currentUser?.uid && Number(currentUser.uid) === Number(completedSellerId);
    const canRate = Boolean(product?.status === "sold" && (isCompletedBuyer || isCompletedSeller));
    const rateeUid = isCompletedBuyer ? completedSellerId : isCompletedSeller ? completedBuyerId : null;

    const submitRating = async (e) => {
        e.preventDefault();
        setStatus({ type: "", message: "" });
        if (!rateeUid) {
            setStatus({ type: "error", message: "Unable to determine who to rate for this trade." });
            return;
        }
        setRatingSubmitting(true);
        try {
            await createRating({
                pid: product.pid,
                rateeUid,
                rating: Number(ratingForm.rating),
                comment: ratingForm.comment,
            });

            // Mark as already rated and save the rating
            setAlreadyRated(true);
            setExistingRating({
                rating: Number(ratingForm.rating),
                comment: ratingForm.comment,
                ratedAt: new Date().toISOString()
            });

            console.log('✅ Rating submitted successfully:', ratingForm.rating, '/5');
            setStatus({ type: "success", message: "Thanks! Your rating was submitted." });
            setRatingForm({ rating: 5, comment: "" });
        } catch (err) {
            setStatus({ type: "error", message: err.message });
        } finally {
            setRatingSubmitting(false);
        }
    };

    const showTimeline = ["reserved", "location_proposed", "location_selected", "otp_generated", "sold"].includes(product.status);

    return (
        <div className="page-content">
            <header className="page-header">
                <div>
                    <button onClick={() => navigate(-1)} className="ghost" style={{ marginBottom: '1rem' }}>
                        &larr; Back
                    </button>
                    <h1>Product Details</h1>
                    <p className="subtext">Review listing details and complete your trade.</p>
                </div>
            </header>

            {status.message && (
                <div className={`status ${status.type}`}>{status.message}</div>
            )}
            {!status.message && product?.status === "reserved" && isBuyer && (
                <div className="status info">
                    Reservation confirmed. Waiting for the seller to propose locations.
                </div>
            )}
            {!status.message && product?.status === "reserved" && isSeller && (
                <div className="status info">
                    Buyer reserved this item. Please propose meeting locations.
                </div>
            )}
            {!status.message && product?.status === "location_proposed" && isBuyer && (
                <div className="status info">
                    Locations are ready. Please choose one to continue.
                </div>
            )}
            {!status.message && product?.status === "location_proposed" && isSeller && (
                <div className="status info">
                    Waiting for buyer to choose a location and time.
                </div>
            )}
            {!status.message && product?.status === "location_selected" && isBuyer && (
                <div className="status info">
                    Location confirmed. Generate OTP only at the meeting point.
                </div>
            )}
            {!status.message && product?.status === "location_selected" && isSeller && (
                <div className="status info">
                    Location confirmed. Wait for the buyer to generate the OTP.
                </div>
            )}
            {!status.message && product?.status === "otp_generated" && isBuyer && (
                <div className="status warning">
                    OTP is active. Share it only after receiving the product.
                </div>
            )}
            {!status.message && product?.status === "otp_generated" && isSeller && (
                <div className="status info">
                    OTP generated. Verify it after handing over the product.
                </div>
            )}
            {!status.message && product?.status === "sold" && (
                <div className="status success">Transaction complete. Item sold.</div>
            )}

            {showTimeline && (isBuyer || isSeller) && (
                <div className="card" style={{ marginBottom: "1.5rem" }}>
                    <h3 style={{ marginTop: 0 }}>Transaction Progress</h3>
                    <p className="muted" style={{ marginTop: "0.25rem" }}>
                        Follow the steps to complete your trade securely.
                    </p>
                    <TransactionTimeline status={product.status} />
                </div>
            )}

            <div className="card detail-layout">
                <div>
                    <img
                        src={heroImage}
                        alt={product.pname}
                        style={{ width: '100%', borderRadius: '8px' }}
                        onError={() => {
                            if (heroImage !== productPlaceholder) {
                                setHeroImage(productPlaceholder);
                            }
                        }}
                    />
                </div>
                <div>
                    <h1>{product.pname}</h1>
                    <div className="badge-row" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span className={`badge ${product.status}`}>{product.status}</span>
                        <h2 style={{ margin: 0 }}>₹ {product.price}</h2>
                    </div>
                    {currentUser && String(product.sellerid) === String(currentUser.uid) && product.verification_status && product.verification_status !== "approved" && (
                        <div
                            className={`status ${product.verification_status === "rejected" ? "error" : product.verification_status === "flagged" ? "warning" : "info"}`}
                            style={{ marginTop: '1rem' }}
                        >
                            {product.verification_status === "pending" && "⏳ This listing is waiting for admin approval. You'll be notified once it's approved."}
                            {product.verification_status === "flagged" && "⚠️ This listing was flagged for review by admin. Please wait for an update."}
                            {product.verification_status === "rejected" && "❌ This listing was rejected by admin. Please update the details and resubmit."}
                        </div>
                    )}
                    <p className="muted" style={{ marginTop: '0.5rem' }}>
                        Only 1 unit available per listing.
                    </p>

                    <p className="muted" style={{ marginTop: '1rem' }}>
                        Category: {product.category}
                    </p>
                    <p className="muted">
                        Seller: {product.seller_name}
                    </p>
                    {isSeller && product.reserved_by && (
                        <div className="status info" style={{ marginTop: '0.75rem' }}>
                            Buyer: {product.buyer_name || "Buyer"}
                            {product.buyer_trust_points != null && (
                                <span style={{ marginLeft: '0.5rem' }}>
                                    • Trust Score: {product.buyer_trust_points}
                                </span>
                            )}
                        </div>
                    )}
                    {sellerGamification && (
                        <div className="seller-score">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.9rem', color: '#4CAF50', fontWeight: 600 }}>🏆 Trust Score:</span>
                                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--rvce-navy)' }}>{sellerGamification.trustPoints}</span>
                                <span style={{ fontSize: '0.85rem', color: '#666' }}>points</span>
                            </div>
                            {sellerGamification.badges && sellerGamification.badges.length > 0 && (
                                <BadgesRow badges={sellerGamification.badges} />
                            )}
                        </div>
                    )}
                    <p className="muted">
                        Preferred Year: {product.preferred_for}
                    </p>

                    {productSpecs.length > 0 && (
                        <div style={{ marginTop: '1rem' }}>
                            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Specifications</p>
                            <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                                {productSpecs.map((spec) => (
                                    <li key={`${spec.pid}-${spec.spec_name}`} className="muted" style={{ marginBottom: '0.25rem' }}>
                                        <strong>{spec.spec_name}:</strong> {spec.spec_value}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

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
                                {product.sellerid !== currentUser?.uid && (
                                    <button className="secondary" onClick={handleWishlist} disabled={wishlistLoading}>
                                        {isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                                    </button>
                                )}
                                {currentUser && product.sellerid !== currentUser.uid && (
                                    <p className="muted" style={{ margin: 0, alignSelf: "center" }}>
                                        Reserving holds the item and starts the meetup flow.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* 2. Reserved State - Seller proposes locations */}
                        {product.status === 'reserved' && currentUser && product.sellerid === currentUser.uid && !product.reschedule_requested_by && (
                            <>
                                <div className="status info" style={{ marginBottom: '1rem' }}>
                                    Reservation received from {product.buyer_name || `Buyer ${product.reserved_by}`} for {product.pname}. Propose meeting locations below.
                                </div>
                                <SellerLocationProposal product={product} onUpdate={refreshProduct} />
                            </>
                        )}

                        {/* 3. Location Proposed - Buyer selects location */}
                        {product.status === 'location_proposed' && currentUser && product.reserved_by === currentUser.uid && !product.reschedule_requested_by && (
                            <>
                                <div className="status info" style={{ marginBottom: '1rem' }}>
                                    Seller proposed meeting locations. Please choose one to continue.
                                </div>
                                <BuyerLocationSelector product={product} onUpdate={refreshProduct} />
                            </>
                        )}

                        {product.status === 'location_proposed' && isSeller && !product.reschedule_requested_by && (
                            <div className="status info" style={{ marginBottom: '1rem' }}>
                                Waiting for buyer to choose a location and time.
                            </div>
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
                                {isSeller && (
                                    <div className="status info" style={{ marginTop: '0.75rem' }}>
                                        Buyer confirmed the location. Please arrive on time and wait for the OTP.
                                    </div>
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

                        {/* Report Issue (Buyer or Seller) */}
                        {(['location_selected', 'otp_generated'].includes(product.status) && currentUser && (product.sellerid === currentUser.uid || product.reserved_by === currentUser.uid)) && (
                            <div className="card" style={{ marginTop: '1rem', border: '1px dashed #ef4444' }}>
                                <h4 style={{ marginTop: 0 }}>Report an Issue</h4>
                                <p className="muted" style={{ marginBottom: '0.75rem' }}>
                                    Use this if someone is late/no‑show or the item condition is not as described.
                                </p>
                                <button onClick={handleReportIssue} className="outline" style={{ color: '#ef4444', borderColor: '#ef4444' }}>
                                    Report Issue
                                </button>
                            </div>
                        )}

                        {/* 🔴 Cancel Transaction Option (Buyer Only, pre‑OTP) */}
                        {product.reserved_by === currentUser.uid && product.status !== 'otp_generated' && (
                            <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                                <button
                                    onClick={handleCancelReservation}
                                    className="outline"
                                    style={{ color: '#d32f2f', borderColor: '#d32f2f', fontSize: '0.9rem' }}
                                >
                                    🚫 Cancel Transaction (pre‑OTP)
                                </button>
                            </div>
                        )}


                        {/* 6. Sold State */}
                        {product.status === 'sold' && (
                            <>
                                <button disabled>Sold Out</button>

                                {canRate && (
                                    <div className="card" style={{ marginTop: '1rem' }}>
                                        {alreadyRated ? (
                                            // Show confirmation message if already rated
                                            <>
                                                <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span>⭐</span> You rated this trade
                                                </h3>
                                                <div style={{
                                                    background: '#f0f9ff',
                                                    border: '2px solid #0ea5e9',
                                                    borderRadius: '8px',
                                                    padding: '1rem',
                                                    marginTop: '0.5rem'
                                                }}>
                                                    <p style={{
                                                        margin: 0,
                                                        fontSize: '1.5rem',
                                                        fontWeight: 'bold',
                                                        color: '#0284c7'
                                                    }}>
                                                        {existingRating?.rating} / 5
                                                    </p>
                                                    {existingRating?.comment && (
                                                        <p style={{
                                                            margin: '0.5rem 0 0',
                                                            fontStyle: 'italic',
                                                            color: '#64748b'
                                                        }}>
                                                            "{existingRating.comment}"
                                                        </p>
                                                    )}
                                                    <p className="muted" style={{ margin: '0.75rem 0 0', fontSize: '0.85rem' }}>
                                                        ✅ Your rating has been recorded. Thank you for helping build trust in the community!
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            // Show rating form if not yet rated
                                            <>
                                                <h3 style={{ marginTop: 0 }}>Rate this trade</h3>
                                                <p className="muted" style={{ marginTop: 0 }}>
                                                    Help build trust in the CampusKart community.
                                                </p>

                                                <form onSubmit={submitRating} className="form">
                                                    <label className="field">
                                                        <span className="label">Rating (1 to 5)</span>
                                                        <select
                                                            value={ratingForm.rating}
                                                            onChange={(e) => setRatingForm((p) => ({ ...p, rating: Number(e.target.value) }))}
                                                        >
                                                            <option value={5}>5 - Excellent</option>
                                                            <option value={4}>4 - Good</option>
                                                            <option value={3}>3 - Okay</option>
                                                            <option value={2}>2 - Poor</option>
                                                            <option value={1}>1 - Bad</option>
                                                        </select>
                                                    </label>

                                                    <label className="field">
                                                        <span className="label">Comment (optional)</span>
                                                        <input
                                                            value={ratingForm.comment}
                                                            onChange={(e) => setRatingForm((p) => ({ ...p, comment: e.target.value }))}
                                                            placeholder="Quick feedback (optional)"
                                                        />
                                                    </label>

                                                    <button type="submit" disabled={ratingSubmitting}>
                                                        {ratingSubmitting ? "Submitting…" : "Submit rating"}
                                                    </button>
                                                </form>
                                            </>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}


import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchProductById, addWishlist, createTransaction } from "../api";
import { useAuth } from "../context/AuthContext";

export default function ProductDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [status, setStatus] = useState({ type: "", message: "" });

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

    const handleWishlist = async () => {
        try {
            await addWishlist({ uid: currentUser.uid, pid: product.pid });
            setStatus({ type: "success", message: "Added to wishlist" });
        } catch (err) {
            setStatus({ type: "error", message: err.message });
        }
    };

    const handleBuy = async () => {
        if (!window.confirm(`Buy ${product.pname} for ₹${product.price}?`)) return;
        try {
            await createTransaction({
                buyerid: currentUser.uid,
                pid: product.pid,
                quantity: 1,
                status: "completed",
            });
            setStatus({ type: "success", message: "Purchase successful!" });
            // Refresh product to see status change? or navigate back?
            // navigate('/');
            const updated = await fetchProductById(id);
            setProduct(updated);
        } catch (err) {
            setStatus({ type: "error", message: err.message });
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="error">Error: {error}</div>;
    if (!product) return <div>Product not found</div>;

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

                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                        {product.status === 'available' ? (
                            <>
                                <button onClick={handleBuy}>Buy Now</button>
                                <button className="secondary" onClick={handleWishlist}>Add to Wishlist</button>
                            </>
                        ) : (
                            <button disabled>Sold Out</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

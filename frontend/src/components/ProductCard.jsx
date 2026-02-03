import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { resolveImageUrl } from "../utils/images";
import productPlaceholder from "../assets/product-placeholder.svg";

export default function ProductCard({ product, isInWishlist, onToggleWishlist, marketFilter, isOwner = false, highlight = false }) {
    const initialSrc = product.img_url ? resolveImageUrl(product.img_url) : productPlaceholder;
    const [imgSrc, setImgSrc] = useState(initialSrc);

    useEffect(() => {
        setImgSrc(initialSrc);
    }, [initialSrc]);

    return (
        <article className={`product-card ${highlight ? "product-card--highlight" : ""}`}>
            <Link to={`/product/${product.pid}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <img
                    src={imgSrc}
                    alt={product.pname}
                    className="product-card__image"
                    onError={() => {
                        if (imgSrc !== productPlaceholder) {
                            setImgSrc(productPlaceholder);
                        }
                    }}
                />
            </Link>

            <div className="product-card__body">
                <Link to={`/product/${product.pid}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="product-card__badges">
                        <span className={`badge ${product.status}`}>{product.status || "available"}</span>
                        {isOwner && <span className="badge owner">Your Product</span>}
                    </div>
                    <h3 className=" product-card__title">{product.pname}</h3>
                    <div className="product-card__info">
                        <span>Category: {product.category || "—"}</span>
                        <span>Seller: {product.seller_name || "Unknown"}</span>
                        {product.preferred_for && (
                            <span>Preferred for: {product.preferred_for}</span>
                        )}
                    </div>
                    <p className="product-card__price">₹ {Number(product.price).toLocaleString('en-IN')}</p>
                </Link>
            </div>

            <div className="product-card__footer">
                {marketFilter === "available" && !isOwner && (
                    <button
                        type="button"
                        className={`wishlist-btn ${isInWishlist ? 'active' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onToggleWishlist();
                        }}
                        aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                        title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                    >
                        {isInWishlist ? '❤' : '♡'}
                    </button>
                )}
                <Link
                    to={`/product/${product.pid}`}
                    className="ghost"
                    style={{
                        textDecoration: 'none',
                        padding: '0.65rem 1.2rem',
                        display: 'inline-block',
                        flex: 1,
                        textAlign: 'center',
                        borderRadius: '12px'
                    }}
                >
                    {marketFilter === "cart" ? "Manage" : "View Details"}
                </Link>
            </div>
        </article>
    );
}

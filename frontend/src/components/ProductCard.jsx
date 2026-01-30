import React from "react";
import { Link } from "react-router-dom";

export default function ProductCard({ product, isInWishlist, onToggleWishlist, marketFilter }) {
    return (
        <article className="product-card">
            <Link to={`/product/${product.pid}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                {product.img_url ? (
                    <img
                        src={product.img_url}
                        alt={product.pname}
                        className="product-card__image"
                    />
                ) : (
                    <div className="product-card__placeholder">No image</div>
                )}
            </Link>

            <div className="product-card__body">
                <Link to={`/product/${product.pid}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h3 className=" product-card__title">{product.pname}</h3>
                    <div className="product-card__info">
                        <span>Category: {product.category || "—"}</span>
                        <span>Seller: {product.seller_name || "Unknown"}</span>
                    </div>
                    <p className="product-card__price">₹ {Number(product.price).toLocaleString('en-IN')}</p>
                </Link>
            </div>

            <div className="product-card__footer">
                {marketFilter === "available" && (
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

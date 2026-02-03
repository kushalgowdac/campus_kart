import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { approveProduct, rejectProduct, getPendingProducts, getFlaggedProducts, getVerificationHistory, fetchProductById, fetchProductSpecs } from "../../api";
import { resolveImageUrl } from "../../utils/images";
import productPlaceholder from "../../assets/product-placeholder.svg";

/**
 * @typedef {Object} ProductVerificationProps
 */

const TABS = ["pending", "flagged", "history"];

export default function ProductVerification() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "pending";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [pending, setPending] = useState([]);
  const [flagged, setFlagged] = useState([]);
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalProduct, setModalProduct] = useState(null);
  const [modalSpecs, setModalSpecs] = useState([]);
  const [rejectReason, setRejectReason] = useState("");
  const [working, setWorking] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    if (!TABS.includes(activeTab)) setActiveTab("pending");
  }, [activeTab]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [pendingData, flaggedData, historyData] = await Promise.all([
          getPendingProducts(),
          getFlaggedProducts(),
          getVerificationHistory(),
        ]);
        setPending(pendingData.items || []);
        setFlagged(flaggedData.items || []);
        setHistory(historyData.items || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

  const handleSelect = (pid) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });
  };

  const selectAll = (items) => {
    setSelected(new Set(items.map((item) => item.pid)));
  };

  const clearSelection = () => setSelected(new Set());

  const handleBatchApprove = async () => {
    if (selected.size === 0) return;
    setWorking(true);
    try {
      await Promise.all(Array.from(selected).map((pid) => approveProduct(pid)));
      const updated = await getPendingProducts();
      setPending(updated.items || []);
      clearSelection();
      toast.success(`Approved ${selected.size} products`);
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Failed to approve products");
    } finally {
      setWorking(false);
    }
  };

  const openModal = async (product) => {
    setModalProduct(product);
    setRejectReason("");
    setModalSpecs([]);

    try {
      const [productResult, specsResult] = await Promise.allSettled([
        fetchProductById(product.pid),
        fetchProductSpecs(product.pid),
      ]);

      if (productResult.status === "fulfilled") {
        setModalProduct({ ...product, ...productResult.value });
      }

      if (specsResult.status === "fulfilled") {
        setModalSpecs(Array.isArray(specsResult.value) ? specsResult.value : []);
      }
    } catch {
      // keep basic info and specs
    }
  };

  const closeModal = () => {
    setModalProduct(null);
    setRejectReason("");
    setModalSpecs([]);
    setConfirmAction(null);
  };

  const handleReject = async () => {
    if (!modalProduct) return;
    setWorking(true);
    try {
      await rejectProduct(modalProduct.pid, rejectReason || "Rejected by admin");
      const updated = await getPendingProducts();
      setPending(updated.items || []);
      closeModal();
      toast.success("Product rejected");
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Failed to reject product");
    } finally {
      setWorking(false);
    }
  };

  const handleApprove = async (pid) => {
    setWorking(true);
    try {
      await approveProduct(pid);
      const updated = await getPendingProducts();
      setPending(updated.items || []);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(pid);
        return next;
      });
      if (modalProduct?.pid === pid) closeModal();
      toast.success("Product approved");
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Failed to approve product");
    } finally {
      setWorking(false);
    }
  };

  const filteredPending = useMemo(() => {
    if (categoryFilter === "all") return pending;
    return pending.filter((item) => item.category === categoryFilter);
  }, [pending, categoryFilter]);

  const categories = useMemo(() => {
    const set = new Set(pending.map((item) => item.category).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [pending]);

  return (
    <div className="admin-stack">
      {error && <p className="error">{error}</p>}

      <div className="admin-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "pending" && (
        <div className="admin-card">
          <div className="admin-table__toolbar">
            <div>
              <label className="field">
                <span className="label">Category</span>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === "all" ? "All" : cat}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="admin-actions">
              <button className="secondary" onClick={() => selectAll(filteredPending)} disabled={filteredPending.length === 0}>
                Select All
              </button>
              <button className="ghost" onClick={clearSelection} disabled={selected.size === 0}>
                Clear
              </button>
              <button className="primary" onClick={handleBatchApprove} disabled={selected.size === 0 || working}>
                {working ? (
                  <span className="admin-btn__loading"><span className="admin-spinner" /> Approving...</span>
                ) : (
                  `Approve (${selected.size})`
                )}
              </button>
            </div>
          </div>

          {loading ? (
            <p className="muted">Loading pending products...</p>
          ) : filteredPending.length === 0 ? (
            <div className="admin-empty">
              <span className="admin-empty__icon">🎉</span>
              <h4>All caught up!</h4>
              <p className="muted">No products awaiting verification.</p>
            </div>
          ) : (
            <div className="admin-table admin-table--pending">
              <div className="admin-table__head">
                <span />
                <span>Image</span>
                <span>Product</span>
                <span>Category</span>
                <span>Price</span>
                <span>Seller</span>
                <span>Submitted</span>
                <span>Actions</span>
              </div>
              {filteredPending.map((item) => (
                <div key={item.pid} className="admin-table__row">
                  <span>
                    <input type="checkbox" checked={selected.has(item.pid)} onChange={() => handleSelect(item.pid)} />
                  </span>
                  <span>
                    <div className="admin-thumb">
                      <span>{item.pname?.charAt(0) || "P"}</span>
                    </div>
                  </span>
                  <span>{item.pname}</span>
                  <span>{item.category || "--"}</span>
                  <span>₹ {item.price}</span>
                  <span>{item.seller_name}</span>
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  <span className="admin-actions">
                    <button className="primary" onClick={() => handleApprove(item.pid)} disabled={working}>
                      {working ? <span className="admin-spinner" /> : "Approve"}
                    </button>
                    <button className="ghost" onClick={() => openModal(item)}>View</button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "flagged" && (
        <div className="admin-card">
          {loading ? (
            <p className="muted">Loading flagged products...</p>
          ) : flagged.length === 0 ? (
            <div className="admin-empty">
              <span className="admin-empty__icon">✨</span>
              <h4>Clean slate</h4>
              <p className="muted">No flagged products right now.</p>
            </div>
          ) : (
            <div className="admin-table admin-table--flagged">
              <div className="admin-table__head">
                <span>Product</span>
                <span>Category</span>
                <span>Price</span>
                <span>Seller</span>
                <span>Reason</span>
              </div>
              {flagged.map((item) => (
                <div key={item.pid} className="admin-table__row">
                  <span>{item.pname}</span>
                  <span>{item.category || "--"}</span>
                  <span>₹ {item.price}</span>
                  <span>{item.seller_name}</span>
                  <span>{item.admin_notes || "Auto-flagged"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div className="admin-card">
          {loading ? (
            <p className="muted">Loading verification history...</p>
          ) : history.length === 0 ? (
            <div className="admin-empty">
              <span className="admin-empty__icon">📦</span>
              <h4>No verification history</h4>
              <p className="muted">Approved and rejected products will appear here.</p>
            </div>
          ) : (
            <div className="admin-table admin-table--history">
              <div className="admin-table__head">
                <span>Product</span>
                <span>Status</span>
                <span>Seller</span>
                <span>Admin</span>
                <span>Updated</span>
              </div>
              {history.map((item) => (
                <div key={`${item.product_id}-${item.verified_at}`} className="admin-table__row">
                  <span>{item.pname}</span>
                  <span className={`admin-pill admin-pill--${item.status}`}>{item.status}</span>
                  <span>{item.seller_name}</span>
                  <span>{item.verified_by_name || "--"}</span>
                  <span>{item.verified_at ? new Date(item.verified_at).toLocaleDateString() : "--"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {modalProduct && (
        <div className="admin-modal">
          <div className="admin-modal__content">
            <div className="admin-modal__header">
              <h3>{modalProduct.pname}</h3>
              <button className="ghost" onClick={closeModal}>Close</button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-modal__media">
                <img
                  src={modalProduct.img_url ? resolveImageUrl(modalProduct.img_url) : productPlaceholder}
                  alt={modalProduct.pname}
                  onError={(e) => {
                    if (e.currentTarget.src !== productPlaceholder) {
                      e.currentTarget.src = productPlaceholder;
                    }
                  }}
                />
              </div>
              <div className="admin-modal__info">
                <p className="muted"><strong>Category:</strong> {modalProduct.category || "--"}</p>
                <p className="muted"><strong>Price:</strong> ₹ {modalProduct.price}</p>
                <p className="muted"><strong>Seller:</strong> {modalProduct.seller_name}</p>
                <p className="muted"><strong>Trust Score:</strong> {modalProduct.trust_points ?? "--"}</p>

                {modalSpecs.length > 0 && (
                  <div className="admin-specs">
                    <p className="label">Specifications</p>
                    <ul className="admin-specs__list">
                      {modalSpecs.map((spec) => (
                        <li key={`${spec.pid}-${spec.spec_name}`} className="admin-specs__item">
                          <span className="admin-specs__label ">{spec.spec_name}:</span>
                          <span className="admin-specs__value ">{spec.spec_value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="admin-modal__footer">
              <textarea
                className="admin-textarea"
                placeholder="Reject reason (required for rejection)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div className="admin-actions">
                <button className="secondary" onClick={() => handleApprove(modalProduct.pid)} disabled={working}>
                  {working ? <span className="admin-spinner" /> : "Approve"}
                </button>
                <button
                  className="outline"
                  onClick={() => setConfirmAction({ type: "reject" })}
                  disabled={working || !rejectReason}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmAction?.type === "reject" && (
        <div className="admin-modal">
          <div className="admin-modal__content admin-modal__content--compact">
            <div className="admin-modal__header">
              <h3>Confirm rejection</h3>
              <button className="ghost" onClick={() => setConfirmAction(null)}>Close</button>
            </div>
            <div className="admin-modal__body admin-modal__body--stack">
              <p>Are you sure you want to reject this product? This action cannot be undone.</p>
              <p className="muted">Reason: {rejectReason || "Rejected by admin"}</p>
            </div>
            <div className="admin-modal__footer admin-modal__footer--row">
              <button className="ghost" onClick={() => setConfirmAction(null)}>Cancel</button>
              <button className="outline" onClick={handleReject} disabled={working}>
                {working ? <span className="admin-spinner" /> : "Yes, Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sample Data (Mock)
        pending item: { pid: 12, pname: "Calculator", category: "Electronics", price: 500, seller_name: "Asha", created_at: "2026-02-02" }
      */}
    </div>
  );
}

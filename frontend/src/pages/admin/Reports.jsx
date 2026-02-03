import React, { useState } from "react";
import toast from "react-hot-toast";
import { downloadTransactionsReport, downloadUsersReport, getFlaggedActivityReport } from "../../api";

/**
 * @typedef {Object} AdminReportsProps
 */

export default function Reports() {
  const [flagged, setFlagged] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const downloadReport = async (type) => {
    setLoading(true);
    setError("");
    try {
      if (type === "transactions") {
        await downloadTransactionsReport();
        toast.success("Transactions report downloaded");
      }
      if (type === "users") {
        await downloadUsersReport();
        toast.success("Users report downloaded");
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Failed to download report");
    } finally {
      setLoading(false);
    }
  };

  const loadFlagged = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getFlaggedActivityReport();
      setFlagged(data.items || []);
      toast.success("Flagged activity refreshed");
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Failed to load flagged activity");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-stack">
      {error && <p className="error">{error}</p>}

      <div className="admin-card admin-card--action">
        <h4>Exports</h4>
        <p className="muted">Download CSV summaries for auditing.</p>
        <div className="admin-actions">
          <button className="primary" onClick={() => downloadReport("transactions")} disabled={loading}>
            {loading ? <span className="admin-spinner" /> : "Transactions CSV"}
          </button>
          <button className="secondary" onClick={() => downloadReport("users")} disabled={loading}>
            {loading ? <span className="admin-spinner" /> : "Users CSV"}
          </button>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-row admin-row--space">
          <div>
            <h4>Flagged Activity</h4>
            <p className="muted">Accounts with repeated flagged listings.</p>
          </div>
          <button className="ghost" onClick={loadFlagged} disabled={loading}>Refresh</button>
        </div>
        {flagged.length === 0 ? (
          <div className="admin-empty">
            <span className="admin-empty__icon">✅</span>
            <h4>No flagged activity</h4>
            <p className="muted">No suspicious patterns detected yet.</p>
          </div>
        ) : (
          <div className="admin-table admin-table--reports">
            <div className="admin-table__head">
              <span>User</span>
              <span>Email</span>
              <span>Flagged Count</span>
            </div>
            {flagged.map((item) => (
              <div key={item.uid} className="admin-table__row">
                <span>{item.name}</span>
                <span>{item.email}</span>
                <span>{item.flaggedCount}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

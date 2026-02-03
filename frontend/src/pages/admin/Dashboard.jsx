import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminOverview, getAdminLogs } from "../../api";

/**
 * @typedef {Object} AdminDashboardProps
 */

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const results = await Promise.allSettled([getAdminOverview(), getAdminLogs()]);
        if (results[0].status === "fulfilled") {
          setOverview(results[0].value);
        } else {
          throw results[0].reason;
        }

        if (results[1].status === "fulfilled") {
          setLogs(results[1].value.items || []);
        } else {
          setLogs([]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const weekChange = useMemo(() => {
    if (!overview) return null;
    return {
      users: "+4.2%",
      products: "+3.1%",
      transactions: "+2.4%",
      trust: "+1.1%",
    };
  }, [overview]);

  if (loading) {
    return (
      <div className="admin-grid">
        <div className="admin-card admin-skeleton" />
        <div className="admin-card admin-skeleton" />
        <div className="admin-card admin-skeleton" />
        <div className="admin-card admin-skeleton" />
      </div>
    );
  }

  return (
    <div className="admin-stack">
      {error && <p className="error">{error}</p>}

      <div className="admin-grid">
        <div className="admin-card">
          <p className="admin-card__label">Total Users</p>
          <h3>{overview?.totalUsers ?? "--"}</h3>
          <span className="admin-card__delta positive">{weekChange?.users}</span>
        </div>
        <div className="admin-card">
          <p className="admin-card__label">Total Products</p>
          <h3>{overview?.totalProducts ?? "--"}</h3>
          <span className="admin-card__badge">Pending {overview?.pendingVerifications ?? 0}</span>
          <span className="admin-card__delta positive">{weekChange?.products}</span>
        </div>
        <div className="admin-card">
          <p className="admin-card__label">Total Transactions</p>
          <h3>{overview?.totalTransactions ?? "--"}</h3>
          <span className="admin-card__delta positive">{weekChange?.transactions}</span>
        </div>
        <div className="admin-card">
          <p className="admin-card__label">Average Trust Score</p>
          <h3>{overview?.avgTrustScore ? Number(overview.avgTrustScore).toFixed(1) : "--"}</h3>
          <span className="admin-card__delta positive">{weekChange?.trust}</span>
        </div>
      </div>

      <div className="admin-row">
        <div className="admin-card admin-card--action">
          <h4>Quick Actions</h4>
          <p className="muted">Keep verification queues moving.</p>
          <div className="admin-actions">
            <Link className="primary" to="/admin/products?tab=pending">View Pending Products</Link>
            <Link className="secondary" to="/admin/products?tab=flagged">View Flagged Items</Link>
          </div>
        </div>

        <div className="admin-card admin-card--activity">
          <h4>Recent Admin Activity</h4>
          {logs.length === 0 ? (
            <p className="muted">No recent activity logged.</p>
          ) : (
            <ul className="admin-activity">
              {logs.slice(0, 10).map((log) => (
                <li key={log.action_id}>
                  <span className="admin-activity__type">{log.action_type}</span>
                  <span className="admin-activity__meta">
                    {log.target_type} #{log.target_id}
                  </span>
                  <span className="admin-activity__time">{new Date(log.timestamp).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Sample Data (Mock)
        overview: { totalUsers: 120, totalProducts: 95, totalTransactions: 40, avgTrustScore: 22.5, pendingVerifications: 3 }
        logs: [{ action_id: 1, action_type: "approved_product", target_type: "product", target_id: 12, timestamp: "2026-02-02T12:00:00Z" }]
      */}
    </div>
  );
}

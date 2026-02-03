import React, { useEffect, useMemo, useState } from "react";
import {
  getAnalyticsTrends,
  getAnalyticsCategories,
  getAnalyticsLocations,
  getAnalyticsTrustDistribution,
  getAnalyticsAbandonment,
} from "../../api";

/**
 * @typedef {Object} AdminAnalyticsProps
 */

const formatDateInput = (date) => date.toISOString().slice(0, 10);

export default function Analytics() {
  const today = new Date();
  const startDefault = new Date();
  startDefault.setDate(today.getDate() - 30);

  const [start, setStart] = useState(formatDateInput(startDefault));
  const [end, setEnd] = useState(formatDateInput(today));
  const [trends, setTrends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [trustBuckets, setTrustBuckets] = useState([]);
  const [funnel, setFunnel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [trendsData, categoriesData, locationsData, trustData, funnelData] = await Promise.all([
          getAnalyticsTrends(start, end),
          getAnalyticsCategories(),
          getAnalyticsLocations(),
          getAnalyticsTrustDistribution(),
          getAnalyticsAbandonment(),
        ]);

        setTrends(trendsData.items || []);
        setCategories(categoriesData.items || []);
        setLocations(locationsData.items || []);
        setTrustBuckets(trustData.items || []);
        setFunnel(funnelData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [start, end]);

  const maxTrendValue = useMemo(() => {
    return Math.max(1, ...trends.map((item) => Math.max(item.newProducts, item.completedTransactions)));
  }, [trends]);

  return (
    <div className="admin-stack">
      {error && <p className="error">{error}</p>}

      <div className="admin-card admin-card--filters">
        <label className="field">
          <span className="label">Start</span>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label className="field">
          <span className="label">End</span>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>
      </div>

      {loading ? (
        <p className="muted">Loading analytics...</p>
      ) : (
        <>
          <div className="admin-card">
            <h4>Trends (Last 30 Days)</h4>
            {trends.length === 0 ? (
              <div className="admin-empty">
                <span className="admin-empty__icon">📊</span>
                <h4>No trend data</h4>
                <p className="muted">Try a wider date range.</p>
              </div>
            ) : (
              <div className="admin-chart">
                {trends.map((item) => (
                  <div key={item.day} className="admin-chart__row">
                    <span className="admin-chart__label">{item.day}</span>
                    <div className="admin-chart__bars">
                      <span className="admin-chart__bar admin-chart__bar--primary" style={{ width: `${(item.newProducts / maxTrendValue) * 100}%` }}>
                        Products {item.newProducts}
                      </span>
                      <span className="admin-chart__bar admin-chart__bar--secondary" style={{ width: `${(item.completedTransactions / maxTrendValue) * 100}%` }}>
                        Transactions {item.completedTransactions}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="admin-row">
            <div className="admin-card">
              <h4>Category Distribution</h4>
              {categories.length === 0 ? (
                <div className="admin-empty">
                  <span className="admin-empty__icon">📦</span>
                  <h4>No category data</h4>
                  <p className="muted">Category stats will appear once data is available.</p>
                </div>
              ) : (
                <div className="admin-table admin-table--analytics">
                  <div className="admin-table__head">
                    <span>Category</span>
                    <span>Count</span>
                    <span>Avg Price</span>
                  </div>
                  {categories.map((row) => (
                    <div key={row.category} className="admin-table__row">
                      <span>{row.category || "Uncategorized"}</span>
                      <span>{row.productCount}</span>
                      <span>₹ {Number(row.avgPrice || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="admin-card">
              <h4>Location Heatmap</h4>
              {locations.length === 0 ? (
                <div className="admin-empty">
                  <span className="admin-empty__icon">📍</span>
                  <h4>No location data</h4>
                  <p className="muted">Location stats will appear once data is available.</p>
                </div>
              ) : (
                <div className="admin-table admin-table--analytics">
                  <div className="admin-table__head">
                    <span>Location</span>
                    <span>Frequency</span>
                    <span>Completion Rate</span>
                  </div>
                  {locations.map((row) => (
                    <div key={row.location} className="admin-table__row">
                      <span>{row.location}</span>
                      <span>{row.frequency}</span>
                      <span>--</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="admin-row">
            <div className="admin-card">
              <h4>Trust Score Distribution</h4>
              {trustBuckets.length === 0 ? (
                <div className="admin-empty">
                  <span className="admin-empty__icon">⭐</span>
                  <h4>No trust data</h4>
                  <p className="muted">Trust distribution will appear once users have scores.</p>
                </div>
              ) : (
                <div className="admin-chart">
                  {trustBuckets.map((bucket) => (
                    <div key={bucket.bucket} className="admin-chart__row">
                      <span className="admin-chart__label">{bucket.bucket}</span>
                      <div className="admin-chart__bars">
                        <span className="admin-chart__bar" style={{ width: `${bucket.userCount * 4}px` }}>
                          {bucket.userCount} users
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="admin-card">
              <h4>Transaction Funnel</h4>
              {funnel ? (
                <ul className="admin-funnel">
                  <li>Products Created: {funnel.created}</li>
                  <li>Reserved: {funnel.reserved}</li>
                  <li>Location Selected: {funnel.locationSelected}</li>
                  <li>OTP Generated: {funnel.otpGenerated}</li>
                  <li>Completed: {funnel.completed}</li>
                </ul>
              ) : (
                <p className="muted">No funnel data available.</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Sample Data (Mock)
        trends: [{ day: "2026-02-01", newProducts: 4, completedTransactions: 2 }]
        categories: [{ category: "Books", productCount: 12, avgPrice: 250 }]
      */}
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchLeaderboard, fetchBadgesCatalog } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Community() {
  const { gamification } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [leaderboardError, setLeaderboardError] = useState("");
  const [badgesError, setBadgesError] = useState("");
  const [activeTab, setActiveTab] = useState("leaderboard");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      setLeaderboardError("");
      setBadgesError("");
      try {
        const results = await Promise.allSettled([
          fetchLeaderboard(20),
          fetchBadgesCatalog(),
        ]);
        const lb = results[0].status === "fulfilled" ? results[0].value : [];
        const bc = results[1].status === "fulfilled" ? results[1].value : [];
        setLeaderboard(Array.isArray(lb) ? lb : []);
        setBadges(Array.isArray(bc) ? bc : []);
        if (results[0].status === "rejected") {
          setLeaderboardError("Leaderboard failed to load.");
        }
        if (results[1].status === "rejected") {
          setBadgesError("Badges catalog failed to load.");
        }
      } catch (err) {
        setError(err.message || "Failed to load community data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <h1>Community</h1>
          <p className="subtext">Compete, earn badges, and climb the trust leaderboard.</p>
        </div>
      </header>

      {error && <div className="status error">{error}</div>}

      {loading ? (
        <div className="card">Loading...</div>
      ) : (
        <div>
          <div className="tab-row" style={{ marginBottom: 16 }}>
            <button
              type="button"
              className={activeTab === "leaderboard" ? "tab active" : "tab"}
              onClick={() => setActiveTab("leaderboard")}
            >
              Leaderboard
            </button>
            <button
              type="button"
              className={activeTab === "badges" ? "tab active" : "tab"}
              onClick={() => setActiveTab("badges")}
            >
              Badges Catalog
            </button>
          </div>

          {activeTab === "leaderboard" && (
            <section className="card">
              <div className="list-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <h2 style={{ margin: 0 }}>Leaderboard</h2>
                <span className="muted" style={{ fontSize: 12 }}>Top users by trust</span>
              </div>
              {leaderboardError ? (
                <p className="muted">{leaderboardError}</p>
              ) : leaderboard.length === 0 ? (
                <p className="muted">No leaderboard data yet.</p>
              ) : (
                <div className="leaderboard-list">
                  {leaderboard.map((u, idx) => (
                    <Link key={u.uid} to={`/seller/${u.uid}`} className="leaderboard-item">
                      <div className="leaderboard-rank">#{idx + 1}</div>
                      <div>
                        <div className="leaderboard-name">{u.name}</div>
                        <div className="muted" style={{ fontSize: 12 }}>{u.email}</div>
                      </div>
                      <div className="leaderboard-score">{u.trustPoints} pts</div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === "badges" && (
            <section className="card">
              <div className="list-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <h2 style={{ margin: 0 }}>Badges Catalog</h2>
                <span className="muted" style={{ fontSize: 12 }}>All available achievements</span>
              </div>
              {badgesError ? (
                <p className="muted">{badgesError}</p>
              ) : badges.length === 0 ? (
                <p className="muted">No badges configured yet.</p>
              ) : (
                <div className="badge-grid">
                  {badges.map((badge) => (
                    <div
                      key={badge.key}
                      className={`badge-card ${gamification?.badges?.some((b) => b.key === badge.key) ? "" : "locked"}`}
                    >
                      <span className="badge-icon" aria-hidden="true">{badge.icon}</span>
                      <div>
                        <div className="badge-title">{badge.name}</div>
                        {badge.category && (
                          <div className="muted" style={{ fontSize: 11, textTransform: "capitalize" }}>
                            {badge.category} badge
                          </div>
                        )}
                        <div className="muted" style={{ fontSize: 12 }}>{badge.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

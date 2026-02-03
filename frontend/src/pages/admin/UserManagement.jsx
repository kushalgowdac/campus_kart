import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getAllUsers, getUserDetails, getUserActivity, suspendUser, unsuspendUser } from "../../api";

/**
 * @typedef {Object} UserManagementProps
 */

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ status: "all", trustMin: "", trustMax: "", search: "" });
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [reason, setReason] = useState("");
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const query = {
        suspended: filters.status === "all" ? undefined : filters.status,
        trust_min: filters.trustMin || undefined,
        trust_max: filters.trustMax || undefined,
      };
      const data = await getAllUsers(query);
      setUsers(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [filters.status, filters.trustMin, filters.trustMax]);

  const filteredUsers = useMemo(() => {
    const term = filters.search.toLowerCase();
    if (!term) return users;
    return users.filter((user) =>
      user.name?.toLowerCase().includes(term) || user.email?.toLowerCase().includes(term)
    );
  }, [users, filters.search]);

  const openUser = async (user) => {
    setSelectedUser(user);
    setReason("");
    setUserDetails(null);
    setActivity(null);
    try {
      const [details, activityData] = await Promise.all([
        getUserDetails(user.uid),
        getUserActivity(user.uid),
      ]);
      setUserDetails(details);
      setActivity(activityData);
    } catch (err) {
      setError(err.message);
    }
  };

  const closeModal = () => {
    setSelectedUser(null);
    setUserDetails(null);
    setActivity(null);
    setConfirmAction(null);
  };

  const handleSuspend = async () => {
    if (!selectedUser) return;
    setWorking(true);
    try {
      await suspendUser(selectedUser.uid, reason, 7);
      await loadUsers();
      closeModal();
      toast.success("User suspended");
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Failed to suspend user");
    } finally {
      setWorking(false);
    }
  };

  const handleUnsuspend = async () => {
    if (!selectedUser) return;
    setWorking(true);
    try {
      await unsuspendUser(selectedUser.uid, reason);
      await loadUsers();
      closeModal();
      toast.success("User unsuspended");
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Failed to unsuspend user");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="admin-stack">
      {error && <p className="error">{error}</p>}

      <div className="admin-card admin-filters">
        <label className="field">
          <span className="label">Status</span>
          <select value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
            <option value="all">All</option>
            <option value="false">Active</option>
            <option value="true">Suspended</option>
          </select>
        </label>
        <label className="field">
          <span className="label">Trust Min</span>
          <input
            type="number"
            value={filters.trustMin}
            onChange={(e) => setFilters((prev) => ({ ...prev, trustMin: e.target.value }))}
          />
        </label>
        <label className="field">
          <span className="label">Trust Max</span>
          <input
            type="number"
            value={filters.trustMax}
            onChange={(e) => setFilters((prev) => ({ ...prev, trustMax: e.target.value }))}
          />
        </label>
        <label className="field">
          <span className="label">Search</span>
          <input
            type="text"
            placeholder="Search name or email"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          />
        </label>
      </div>

      <div className="admin-card">
        {loading ? (
          <p className="muted">Loading users...</p>
        ) : filteredUsers.length === 0 ? (
          <div className="admin-empty">
            <span className="admin-empty__icon">👥</span>
            <h4>No users found</h4>
            <p className="muted">Try adjusting your filters or search.</p>
          </div>
        ) : (
          <div className="admin-table admin-table--users">
            <div className="admin-table__head">
              <span>Name</span>
              <span>Email</span>
              <span>Department</span>
              <span>Trust Score</span>
              <span>Status</span>
              <span>Joined</span>
            </div>
            {filteredUsers.map((user) => (
              <div key={user.uid} className="admin-table__row admin-table__row--click" onClick={() => openUser(user)}>
                <span>{user.name}</span>
                <span>{user.email}</span>
                <span>--</span>
                <span>{user.trust_points ?? 0}</span>
                <span className={`admin-pill ${user.is_suspended ? "admin-pill--danger" : "admin-pill--success"}`}>
                  {user.is_suspended ? "Suspended" : "Active"}
                </span>
                <span>--</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="admin-modal">
          <div className="admin-modal__content">
            <div className="admin-modal__header">
              <h3>{selectedUser.name}</h3>
              <button className="ghost" onClick={closeModal}>Close</button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-modal__info">
                <p className="muted">Email: {selectedUser.email}</p>
                <p className="muted">Trust Score: {selectedUser.trust_points ?? 0}</p>
                <p className="muted">Status: {selectedUser.is_suspended ? "Suspended" : "Active"}</p>
              </div>
              <div className="admin-modal__info">
                <p className="label">Recent Listings</p>
                <ul>
                  {(activity?.listings || []).slice(0, 10).map((item) => (
                    <li key={item.pid}>{item.pname} — {item.status}</li>
                  ))}
                </ul>
              </div>
              <div className="admin-modal__info">
                <p className="label">Recent Purchases</p>
                <ul>
                  {(userDetails?.purchases || []).slice(0, 10).map((item) => (
                    <li key={item.tid}>{item.pname} — ₹{item.price}</li>
                  ))}
                </ul>
              </div>
              <div className="admin-modal__info">
                <p className="label">Recent Sales</p>
                <ul>
                  {(userDetails?.sales || []).slice(0, 10).map((item) => (
                    <li key={item.tid}>{item.pname} — ₹{item.price}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="admin-modal__footer">
              <textarea
                className="admin-textarea"
                placeholder="Reason for suspension / lifting"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <div className="admin-actions">
                {selectedUser.is_suspended ? (
                  <button
                    className="secondary"
                    onClick={() => setConfirmAction({ type: "unsuspend" })}
                    disabled={working}
                  >
                    Unsuspend
                  </button>
                ) : (
                  <button
                    className="outline"
                    onClick={() => setConfirmAction({ type: "suspend" })}
                    disabled={working || !reason}
                  >
                    Suspend
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedUser && confirmAction?.type === "suspend" && (
        <div className="admin-modal">
          <div className="admin-modal__content admin-modal__content--compact">
            <div className="admin-modal__header">
              <h3>Confirm suspension</h3>
              <button className="ghost" onClick={() => setConfirmAction(null)}>Close</button>
            </div>
            <div className="admin-modal__body admin-modal__body--stack">
              <p>Suspend {selectedUser.email} for 7 days?</p>
              <p className="muted">Reason: {reason}</p>
            </div>
            <div className="admin-modal__footer admin-modal__footer--row">
              <button className="ghost" onClick={() => setConfirmAction(null)}>Cancel</button>
              <button className="outline" onClick={handleSuspend} disabled={working}>
                {working ? <span className="admin-spinner" /> : "Yes, Suspend"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedUser && confirmAction?.type === "unsuspend" && (
        <div className="admin-modal">
          <div className="admin-modal__content admin-modal__content--compact">
            <div className="admin-modal__header">
              <h3>Confirm unsuspend</h3>
              <button className="ghost" onClick={() => setConfirmAction(null)}>Close</button>
            </div>
            <div className="admin-modal__body admin-modal__body--stack">
              <p>Unsuspend {selectedUser.email}?</p>
              <p className="muted">Reason: {reason || "Lifting suspension"}</p>
            </div>
            <div className="admin-modal__footer admin-modal__footer--row">
              <button className="ghost" onClick={() => setConfirmAction(null)}>Cancel</button>
              <button className="secondary" onClick={handleUnsuspend} disabled={working}>
                {working ? <span className="admin-spinner" /> : "Yes, Unsuspend"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sample Data (Mock)
        user: { uid: 5, name: "Asha", email: "asha@rvce.edu.in", trust_points: 25, is_suspended: 0 }
      */}
    </div>
  );
}

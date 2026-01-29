import React from "react";

// Small, reusable badge strip.
// Expects badge objects from GET /api/gamification/me.
export default function BadgesRow({ badges = [] }) {
  if (!badges || badges.length === 0) return null;

  return (
    <div className="badges" aria-label="Badges">
      {badges.map((b) => (
        <span
          key={b.key}
          className="badge-pill"
          title={`${b.name}: ${b.description}`}
          aria-label={b.name}
        >
          <span className="badge-pill__icon" aria-hidden="true">{b.icon}</span>
          <span className="badge-pill__text">{b.name}</span>
        </span>
      ))}
    </div>
  );
}

import React, { useEffect } from "react";

export default function Toast({ message, type = "success", onClose, duration = 3000 }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icon = type === "success" ? "✓" : "✕";

    return (
        <div className={`toast ${type}`}>
            <span className="toast__icon">{icon}</span>
            <span className="toast__message">{message}</span>
        </div>
    );
}

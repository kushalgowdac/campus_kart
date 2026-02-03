import React from "react";

const STATUS_TO_STEP = {
    reserved: 0,
    location_proposed: 1,
    location_selected: 2,
    otp_generated: 3,
    sold: 4,
};

const DEFAULT_STEPS = [
    "Reserved",
    "Locations",
    "Confirm",
    "OTP",
    "Complete",
];

const TransactionTimeline = ({ status, steps = DEFAULT_STEPS }) => {
    const currentStep = STATUS_TO_STEP[status] ?? -1;
    if (currentStep < 0) return null;

    return (
        <div className="timeline">
            {steps.map((label, index) => {
                const isCompleted = index < currentStep;
                const isActive = index === currentStep;
                return (
                    <div
                        key={label}
                        className={`timeline-step${isCompleted ? " completed" : ""}${isActive ? " active" : ""}`}
                    >
                        <div className="timeline-dot" />
                        <span className="timeline-label">{label}</span>
                    </div>
                );
            })}
        </div>
    );
};

export default TransactionTimeline;

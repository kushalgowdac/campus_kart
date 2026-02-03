import React, { useState } from 'react';
import { createLocations } from '../api';

const AVAILABLE_LOCATIONS = ['Kriyakalpa', 'Mingos', 'CS ground'];

const SellerLocationProposal = ({ product, onUpdate }) => {
    // State stores map of location -> time string. If key missing, location not selected.
    const [selections, setSelections] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCheckboxChange = (location) => {
        setSelections(prev => {
            const newSelections = { ...prev };
            if (newSelections[location] !== undefined) {
                // Was selected, now deselect (remove)
                delete newSelections[location];
            } else {
                // Was not selected, add with empty time
                newSelections[location] = '';
            }
            return newSelections;
        });
    };

    const handleTimeChange = (location, time) => {
        setSelections(prev => ({
            ...prev,
            [location]: time
        }));
    };

    const handleSubmit = async () => {
        const locationsToSubmit = Object.entries(selections).map(([loc, time]) => ({
            location: loc,
            time: time || 'Flexible' // Default to Flexible if empty
        }));

        if (locationsToSubmit.length === 0) {
            setError('Please select at least one location');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await createLocations(product.pid, locationsToSubmit);
            if (onUpdate) onUpdate();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ marginTop: '1rem', border: '1px solid #FF9800' }}>
            <h3>Propose Meeting Locations & Times</h3>
            <p>Select locations and specify a time (e.g. "2:00 PM today"):</p>
            <p className="muted" style={{ marginTop: '0.5rem' }}>
                Keep it public, well-lit, and easy to find for a quick handover.
            </p>

            <div style={{ marginTop: '1rem' }}>
                {AVAILABLE_LOCATIONS.map(location => {
                    const isSelected = selections[location] !== undefined;
                    return (
                        <div key={location} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', minWidth: '150px' }}>
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleCheckboxChange(location)}
                                    style={{ marginRight: '0.5rem' }}
                                />
                                <strong>{location}</strong>
                            </label>

                            {isSelected && (
                                <input
                                    type="text"
                                    placeholder="Time (e.g. 2:30 PM)"
                                    value={selections[location]}
                                    onChange={(e) => handleTimeChange(location, e.target.value)}
                                    style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', flex: 1 }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="actions" style={{ marginTop: '1rem' }}>
                <button
                    onClick={handleSubmit}
                    disabled={loading || Object.keys(selections).length === 0}
                    className="primary"
                >
                    {loading ? 'Proposing...' : 'Propose Locations'}
                </button>
            </div>

            {error && <div className="error" style={{ marginTop: '10px' }}>{error}</div>}
        </div>
    );
};

export default SellerLocationProposal;

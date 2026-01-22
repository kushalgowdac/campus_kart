import React, { useState, useEffect } from 'react';
import { getLocations, selectLocation } from '../api';

const BuyerLocationSelector = ({ product, onUpdate }) => {
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchLocations();
    }, [product.pid]);

    const fetchLocations = async () => {
        try {
            const locs = await getLocations(product.pid);
            setLocations(locs);
        } catch (err) {
            setError(`Failed to load locations: ${err.message}`);
        }
    };

    const handleSubmit = async () => {
        if (!selectedLocation) {
            setError('Please select a location');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await selectLocation(product.pid, selectedLocation);
            if (onUpdate) onUpdate();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (locations.length === 0) {
        return (
            <div className="card" style={{ marginTop: '1rem', border: '1px solid #e0e0e0' }}>
                <h3>Select Meeting Location</h3>
                <p className="muted">Waiting for seller to propose locations...</p>
            </div>
        );
    }

    return (
        <div className="card" style={{ marginTop: '1rem', border: '1px solid #2196F3' }}>
            <h3>Select Meeting Location</h3>
            <p>Choose where you'd like to meet the seller:</p>

            <div style={{ marginTop: '1rem' }}>
                {locations.map(loc => (
                    <label key={loc.location} style={{ display: 'block', marginBottom: '0.5rem', cursor: 'pointer', padding: '10px', border: selectedLocation === loc.location ? '1px solid #2196F3' : '1px solid #eee', borderRadius: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <input
                                type="radio"
                                name="location"
                                value={loc.location}
                                checked={selectedLocation === loc.location}
                                onChange={(e) => setSelectedLocation(e.target.value)}
                                style={{ marginRight: '0.5rem' }}
                            />
                            <div>
                                <span style={{ fontWeight: 'bold' }}>{loc.location}</span>
                                {loc.meeting_time && (
                                    <span className="muted" style={{ marginLeft: '10px', fontSize: '0.9em' }}>
                                        🕒 {loc.meeting_time}
                                    </span>
                                )}
                            </div>
                        </div>
                    </label>
                ))}
            </div>

            <div className="actions" style={{ marginTop: '1rem' }}>
                <button
                    onClick={handleSubmit}
                    disabled={loading || !selectedLocation}
                    className="primary"
                >
                    {loading ? 'Selecting...' : 'Confirm Location'}
                </button>
            </div>

            {error && <div className="error" style={{ marginTop: '10px' }}>{error}</div>}
        </div>
    );
};

export default BuyerLocationSelector;

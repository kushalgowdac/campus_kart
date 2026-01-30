import React, { useState } from "react";

export default function SearchFilters({ onFilterChange, onClear }) {
    const [filters, setFilters] = useState({
        category: "",
        sortPrice: ""
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const newFilters = {
            ...filters,
            [name]: value
        };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const handleClearFilters = () => {
        const clearedFilters = {
            category: "",
            sortPrice: ""
        };
        setFilters(clearedFilters);
        onClear();
    };

    return (
        <div className="search-filters">
            <div className="filter-row">
                {/* Category Dropdown */}
                <div className="filter-group">
                    <label htmlFor="category-select">Category</label>
                    <select
                        id="category-select"
                        name="category"
                        className="filter-select"
                        value={filters.category}
                        onChange={handleInputChange}
                    >
                        <option value="">All Categories</option>
                        <option value="Books">Books</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Furniture">Furniture</option>
                        <option value="Clothing">Clothing</option>
                        <option value="Sports">Sports</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                {/* Price Sort */}
                <div className="filter-group">
                    <label htmlFor="sort-price">Sort by Price</label>
                    <select
                        id="sort-price"
                        name="sortPrice"
                        className="filter-select"
                        value={filters.sortPrice}
                        onChange={handleInputChange}
                    >
                        <option value="">Default</option>
                        <option value="asc">Price: Low to High</option>
                        <option value="desc">Price: High to Low</option>
                    </select>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="filter-actions">
                <button className="btn-secondary" onClick={handleClearFilters}>
                    Clear Filters
                </button>
            </div>
        </div>
    );
}

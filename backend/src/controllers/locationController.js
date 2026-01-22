import { pool } from "../db/index.js";

/**
 * Location Selection Controller
 * Handles seller location proposal and buyer location selection
 */

// Valid location values from ENUM
const VALID_LOCATIONS = ['Kriyakalpa', 'Mingos', 'CS ground'];

/**
 * Seller proposes multiple locations for buyer to choose from
 * POST /api/locations/:pid
 * Body: { locations: ['Kriyakalpa', { location: 'Mingos', time: '2 PM' }] }
 */
export const createLocations = async (req, res, next) => {
    const { pid } = req.params;
    const { locations } = req.body;
    const sellerId = req.user?.uid;

    if (!sellerId) return res.status(401).json({ error: "Authentication required" });
    if (!locations || !Array.isArray(locations) || locations.length === 0) {
        return res.status(400).json({ error: "At least one location is required" });
    }

    // Connect to DB
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // 1. Verify product ownership and status
        const [product] = await conn.query(
            "SELECT p.*, ps.sellerid FROM products p LEFT JOIN product_seller ps ON p.pid = ps.pid WHERE p.pid = ? FOR UPDATE",
            [pid]
        );

        if (product.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: "Product not found" });
        }

        console.log(`[Debug] Checking ownership: User(${sellerId}) vs ProductSeller(${product[0].sellerid})`);

        // Compare as strings to avoid type mismatches (int vs string)
        if (String(product[0].sellerid) !== String(sellerId)) {
            await conn.rollback();
            return res.status(403).json({
                error: `Unauthorized: You are not the seller. User: ${sellerId}, Seller: ${product[0].sellerid}`
            });
        }

        if (product[0].status !== 'reserved') {
            await conn.rollback();
            return res.status(400).json({
                error: `Invalid status: ${product[0].status}. Product must be 'reserved' to propose locations.`
            });
        }

        // 2. Delete existing locations if any (reset)
        await conn.query("DELETE FROM prod_loc WHERE pid = ?", [pid]);

        // 3. Insert new locations with times
        for (const locItem of locations) {
            // Handle both simple string (old) and object (new) formats for backward compatibility
            const locationName = typeof locItem === 'string' ? locItem : locItem.location;
            const meetingTime = typeof locItem === 'object' ? locItem.time : null;

            await conn.query(
                "INSERT INTO prod_loc (pid, location, meeting_time) VALUES (?, ?, ?)",
                [pid, locationName, meetingTime]
            );
        }

        // 4. Update product status
        await conn.query(
            "UPDATE products SET status = 'location_proposed' WHERE pid = ?",
            [pid]
        );

        await conn.commit();

        res.json({
            success: true,
            status: 'location_proposed',
            message: "Locations proposed successfully"
        });

    } catch (err) {
        await conn.rollback();
        next(err);
    } finally {
        conn.release();
    }
};

/**
 * Get all proposed locations for a product
 * GET /api/locations/:pid
 */
export const getLocations = async (req, res, next) => {
    const { pid } = req.params;

    try {
        const [locations] = await pool.query(
            'SELECT location, meeting_time, is_selected FROM prod_loc WHERE pid = ? ORDER BY location',
            [pid]
        );

        // Convert 1/0 buffers to booleans if needed (mysql2 handles this usually but safe to cast)
        const formattedLocations = locations.map(loc => ({
            ...loc,
            is_selected: !!loc.is_selected
        }));

        res.json(formattedLocations);

    } catch (err) {
        console.error('[Location Get Error]:', err);
        next(err);
    }
};

/**
 * Buyer selects one location from proposed options
 * POST /api/locations/:pid/select
 * Body: { location: 'Kriyakalpa' }
 */
export const selectLocation = async (req, res, next) => {
    const { pid } = req.params;
    const { location } = req.body;
    const buyerId = req.user?.uid;

    if (!buyerId) {
        return res.status(401).json({ error: "Authentication required" });
    }

    if (!location) {
        return res.status(400).json({ error: "location is required" });
    }

    if (!VALID_LOCATIONS.includes(location)) {
        return res.status(400).json({
            error: `Invalid location: ${location}`,
            validLocations: VALID_LOCATIONS
        });
    }

    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // Lock and verify product
        const [product] = await conn.query(
            'SELECT pid, status, reserved_by FROM products WHERE pid = ? FOR UPDATE',
            [pid]
        );

        if (product.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: "Product not found" });
        }

        // Verify buyer authorization
        if (product[0].reserved_by !== buyerId) {
            await conn.rollback();
            return res.status(403).json({ error: "Unauthorized: Only buyer who reserved can select location" });
        }

        // Verify product is in location_proposed state
        if (product[0].status !== 'location_proposed') {
            await conn.rollback();
            return res.status(400).json({
                error: `Locations must be proposed first. Current status: ${product[0].status}`
            });
        }

        // Verify the selected location exists in prod_loc
        const [locationExists] = await conn.query(
            'SELECT location FROM prod_loc WHERE pid = ? AND location = ?',
            [pid, location]
        );

        if (locationExists.length === 0) {
            await conn.rollback();
            return res.status(400).json({
                error: `Location '${location}' is not among proposed locations`
            });
        }

        // Atomically update: set all to false, then selected one to true
        await conn.query(
            'UPDATE prod_loc SET is_selected = false WHERE pid = ?',
            [pid]
        );

        await conn.query(
            'UPDATE prod_loc SET is_selected = true WHERE pid = ? AND location = ?',
            [pid, location]
        );

        // Update product status to location_selected
        await conn.query(
            "UPDATE products SET status = 'location_selected' WHERE pid = ?",
            [pid]
        );

        await conn.commit();

        res.json({
            success: true,
            message: "Location selected successfully",
            selectedLocation: location,
            status: 'location_selected'
        });

    } catch (err) {
        await conn.rollback();
        console.error('[Location Select Error]:', err);
        next(err);
    } finally {
        conn.release();
    }
};

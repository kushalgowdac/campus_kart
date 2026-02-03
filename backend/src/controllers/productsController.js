import { pool } from "../db/index.js";
import bcrypt from "bcrypt";
import { TRUST_POINTS, addTrustPoints, computeAndAwardBadges } from "../services/gamificationService.js";



export const listProducts = async (req, res, next) => {
  try {
    const { category, sellerid, status, q } = req.query;
    const viewerId = req.headers["x-user-id"];
    const isSellerView = sellerid && viewerId && String(sellerid) === String(viewerId);

    let sql =
      "SELECT p.pid, p.pname, p.category, p.price, p.status, p.bought_year, p.preferred_for, p.no_of_copies, p.reserved_by, p.reserved_at, ps.sellerid, u.name AS seller_name, bu.name AS buyer_name, pv.status AS verification_status, pi.img_url FROM products p INNER JOIN product_seller ps ON p.pid = ps.pid INNER JOIN users u ON ps.sellerid = u.uid LEFT JOIN users bu ON p.reserved_by = bu.uid LEFT JOIN product_verification pv ON p.pid = pv.product_id LEFT JOIN (SELECT pid, MIN(img_url) AS img_url FROM prod_img GROUP BY pid) pi ON p.pid = pi.pid WHERE 1=1";
    const params = [];

    if (!isSellerView) {
      sql += " AND (pv.status = 'approved' OR pv.status IS NULL)";
    }

    if (category) {
      sql += " AND p.category = ?";
      params.push(category);
    }
    if (sellerid) {
      sql += " AND ps.sellerid = ?";
      params.push(sellerid);
    }
    if (status) {
      sql += " AND p.status = ?";
      params.push(status);
    }
    if (q) {
      sql += " AND p.pname LIKE ?";
      params.push(`%${q}%`);
    }

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

export const searchProducts = async (req, res, next) => {
  try {
    const { category, sortPrice, q } = req.query;

    // Validate sortPrice if provided
    if (sortPrice && !['asc', 'desc'].includes(sortPrice)) {
      return res.status(400).json({ error: "sortPrice must be 'asc' or 'desc'" });
    }

    // Build dynamic SQL query with JOINs
    let sql = `
      SELECT 
        p.pid, 
        p.pname, 
        p.category, 
        p.price, 
        p.status, 
        p.bought_year, 
        p.preferred_for, 
        p.no_of_copies, 
        p.reserved_by, 
        p.reserved_at, 
        ps.sellerid, 
        u.name AS seller_name,
        u.email AS seller_email,
        u.trust_points,
        pv.status AS verification_status,
        pi.img_url 
      FROM products p
      INNER JOIN product_seller ps ON p.pid = ps.pid
      INNER JOIN users u ON ps.sellerid = u.uid
      LEFT JOIN product_verification pv ON p.pid = pv.product_id
      LEFT JOIN (SELECT pid, MIN(img_url) AS img_url FROM prod_img GROUP BY pid) pi ON p.pid = pi.pid
      WHERE (pv.status = 'approved' OR pv.status IS NULL)
    `;

    const params = [];

    // Apply category filter if provided
    if (category) {
      sql += " AND p.category = ?";
      params.push(category);
    }
    if (q) {
      sql += " AND p.pname LIKE ?";
      params.push(`%${q}%`);
    }

    // Apply sorting
    if (sortPrice === 'asc') {
      sql += " ORDER BY p.price ASC";
    } else if (sortPrice === 'desc') {
      sql += " ORDER BY p.price DESC";
    } else {
      sql += " ORDER BY p.pid DESC"; // Default: newest first by ID
    }

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const viewerId = req.headers["x-user-id"];
    let sql = "SELECT p.pid, p.pname, p.category, p.price, p.status, p.bought_year, p.preferred_for, p.no_of_copies, p.reserved_by, p.reserved_at, p.reschedule_requested_by, ps.sellerid, u.name AS seller_name, bu.name AS buyer_name, bu.trust_points AS buyer_trust_points, pv.status AS verification_status, pi.img_url FROM products p LEFT JOIN product_seller ps ON p.pid = ps.pid LEFT JOIN users u ON ps.sellerid = u.uid LEFT JOIN users bu ON p.reserved_by = bu.uid LEFT JOIN product_verification pv ON p.pid = pv.product_id LEFT JOIN (SELECT pid, MIN(img_url) AS img_url FROM prod_img GROUP BY pid) pi ON p.pid = pi.pid WHERE p.pid = ?";
    const params = [id];

    if (viewerId) {
      sql += " AND (pv.status = 'approved' OR pv.status IS NULL OR ps.sellerid = ?)";
      params.push(viewerId);
    } else {
      sql += " AND (pv.status = 'approved' OR pv.status IS NULL)";
    }

    const [rows] = await pool.query(sql, params);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// CampusKart intentionally models each product row as a single physical unit.
// Keeping listings single-quantity avoids race conditions in the reservation/OTP flow
// and guarantees that we never oversell when multiple buyers act at the same time.
export const createProduct = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const {
      pname,
      category,
      price,
      status,
      bought_year,
      preferred_for,
      no_of_copies,
      sellerid,
      image_url,
    } = req.body;
    if (!pname || price == null) {
      return res.status(400).json({ error: "pname, price required" });
    }

    await connection.beginTransaction();

    const [result] = await connection.query(
      "INSERT INTO products (pname, category, price, status, bought_year, preferred_for, no_of_copies) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        pname,
        category || null,
        price,
        status || "available",
        bought_year || null,
        preferred_for || null,
        no_of_copies ?? 1,
      ]
    );

    if (sellerid) {
      await connection.query(
        "INSERT INTO product_seller (pid, sellerid) VALUES (?, ?)",
        [result.insertId, sellerid]
      );
    }

    if (image_url) {
      await connection.query(
        "INSERT INTO prod_img (pid, img_url) VALUES (?, ?)",
        [result.insertId, image_url]
      );
    }

    await connection.query(
      "INSERT INTO product_verification (product_id, status, seller_trust_score) VALUES (?, 'pending', (SELECT trust_points FROM users WHERE uid = ?))",
      [result.insertId, sellerid]
    );

    await connection.commit();

    // Best-effort trust score update for the seller.
    // We do this after the DB commit so listing creation cannot be blocked by gamification.
    if (sellerid) {
      const sellerUid = Number(sellerid);
      if (Number.isFinite(sellerUid)) {
        try {
          await addTrustPoints({ uid: sellerUid, delta: TRUST_POINTS.LISTING_CREATE });
          await computeAndAwardBadges({ uid: sellerUid });
        } catch (err) {
          console.warn("[createProduct] Gamification award failed", err?.message || err);
        }
      }
    }

    res.status(201).json({
      pid: result.insertId,
      pname,
      category: category || null,
      price,
      status: status || "available",
      bought_year: bought_year || null,
      preferred_for: preferred_for || null,
      no_of_copies: no_of_copies ?? 1,
      sellerid: sellerid || null,
      image_url: image_url || null,
      verification_status: "pending",
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

export const updateProduct = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const {
      pname,
      category,
      price,
      status,
      bought_year,
      preferred_for,
      no_of_copies,
      sellerid,
      image_url,
    } = req.body;

    console.log("[ProductsController] updateProduct", {
      id,
      body: req.body,
    });

    await connection.beginTransaction();

    const [result] = await connection.query(
      "UPDATE products SET pname = COALESCE(?, pname), category = COALESCE(?, category), price = COALESCE(?, price), status = COALESCE(?, status), bought_year = COALESCE(?, bought_year), preferred_for = COALESCE(?, preferred_for), no_of_copies = COALESCE(?, no_of_copies) WHERE pid = ?",
      [
        pname,
        category,
        price,
        status,
        bought_year,
        preferred_for,
        no_of_copies,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Product not found" });
    }

    if (sellerid) {
      await connection.query(
        "INSERT INTO product_seller (pid, sellerid) VALUES (?, ?) ON DUPLICATE KEY UPDATE sellerid = VALUES(sellerid)",
        [id, sellerid]
      );
    }

    if (image_url !== undefined) {
      const normalizedImage =
        typeof image_url === "string"
          ? image_url.trim() || null
          : image_url ?? null;

      await connection.query("DELETE FROM prod_img WHERE pid = ?", [id]);

      if (normalizedImage) {
        await connection.query(
          "INSERT INTO prod_img (pid, img_url) VALUES (?, ?)",
          [id, normalizedImage]
        );
      }
    }

    await connection.commit();

    res.json({ message: "Product updated" });
  } catch (err) {
    await connection.rollback();
    console.error("[ProductsController] updateProduct error", err);
    next(err);
  } finally {
    connection.release();
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if product has any transactions
    const [transactions] = await pool.query(
      "SELECT COUNT(*) as count FROM `transaction` WHERE pid = ?",
      [id]
    );

    if (transactions[0].count > 0) {
      return res.status(400).json({
        error: "Cannot delete product with existing transactions. Please contact support if you need to remove this listing."
      });
    }

    const [result] = await pool.query("DELETE FROM products WHERE pid = ?", [
      id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ message: "Product deleted" });
  } catch (err) {
    next(err);
  }
};

// OTP Flow Methods

export const reserveProduct = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const buyerId = req.user?.uid;

    if (!buyerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    await connection.beginTransaction();

    const [product] = await connection.query(
      "SELECT * FROM products WHERE pid = ? FOR UPDATE",
      [id]
    );

    if (product.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Product not found" });
    }

    const [sellerRows] = await connection.query(
      "SELECT sellerid FROM product_seller WHERE pid = ?",
      [id]
    );

    if (sellerRows.length > 0 && Number(sellerRows[0].sellerid) === Number(buyerId)) {
      await connection.rollback();
      return res
        .status(400)
        .json({ error: "You cannot reserve your own product" });
    }

    if (product[0].status !== "available") {
      await connection.rollback();
      return res.status(400).json({
        error: `Product not available (current status: ${product[0].status})`
      });
    }

    // Update status to reserved
    await connection.query(
      "UPDATE products SET status = 'reserved', reserved_by = ?, reserved_at = NOW() WHERE pid = ?",
      [buyerId, id]
    );

    await connection.commit();
    res.json({
      status: "reserved",
      reserved_by: buyerId,
      message: "Product reserved. Please meet seller to confirm."
    });

  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

export const confirmMeet = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const buyerId = req.user?.uid;

    if (!buyerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    await connection.beginTransaction();

    // Lock product
    const [product] = await connection.query(
      "SELECT * FROM products WHERE pid = ? FOR UPDATE",
      [id]
    );

    if (product.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Product not found" });
    }

    const currentStatus = product[0].status;

    if (!["location_selected", "otp_generated"].includes(currentStatus)) {
      await connection.rollback();
      return res.status(400).json({
        error: `OTP generation requires location selection. Current status: ${product[0].status}`
      });
    }

    // 🔴 GLOBAL BLOCKING RULE: No actions if reschedule requested
    if (product[0].reschedule_requested_by) {
      await connection.rollback();
      return res.status(400).json({
        error: "Action blocked: Reschedule requested. Please accept or reject the request."
      });
    }

    if (product[0].reserved_by !== buyerId) {
      await connection.rollback();
      return res.status(403).json({ error: "Unauthorized: Only buyer who reserved can confirm meet" });
    }

    // Double validation: Verify a location has been selected (relevant even after OTP generated)
    const [selectedLocation] = await connection.query(
      "SELECT location FROM prod_loc WHERE pid = ? AND is_selected = true",
      [id]
    );

    if (selectedLocation.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        error: "No location selected. Please select a meeting location first."
      });
    }

    // SINGLE ACTIVE OTP ENFORCEMENT / fetch existing OTP for reuse
    const [existingOTP] = await connection.query(
      "SELECT otp_id, expires_at FROM otp_tokens WHERE product_id = ? AND used = false AND expires_at > NOW()",
      [id]
    );

    if (existingOTP.length > 0) {
      const timeRemaining = Math.floor((new Date(existingOTP[0].expires_at) - new Date()) / 1000);
      await connection.commit();
      return res.json({
        message: "OTP already generated",
        expiresIn: timeRemaining,
        note: "Use existing OTP or wait for expiration"
      });
    }

    if (currentStatus === "otp_generated") {
      await connection.rollback();
      return res.status(400).json({ error: "Active OTP missing. Please contact support." });
    }

    // Generate and Hash OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    // Get seller ID from product_seller
    const [seller] = await connection.query(
      "SELECT sellerid FROM product_seller WHERE pid = ?",
      [id]
    );

    if (seller.length === 0) {
      await connection.rollback();
      return res.status(500).json({ error: "Product has no seller" });
    }

    // Store OTP
    await connection.query(
      "INSERT INTO otp_tokens (product_id, buyer_id, seller_id, otp_hash, expires_at) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))",
      [id, buyerId, seller[0].sellerid, otpHash]
    );

    // Update status to otp_generated
    await connection.query(
      "UPDATE products SET status = 'otp_generated' WHERE pid = ?",
      [id]
    );

    await connection.commit();
    res.json({ otp, expiresIn: 600 });

  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

export const cancelReservation = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    const { reason } = req.body || {};

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check authorization (Buyer OR Seller) without locking initially
    const [authCheck] = await pool.query(
      "SELECT p.status, p.reserved_by, ps.sellerid FROM products p LEFT JOIN product_seller ps ON p.pid = ps.pid WHERE p.pid = ?",
      [id]
    );

    if (authCheck.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const { status, reserved_by, sellerid } = authCheck[0];
    if (status === 'sold') {
      return res.status(400).json({ error: "Product already sold. Reservation cannot be cancelled." });
    }

    if (status === 'otp_generated') {
      return res.status(400).json({ error: "OTP already generated. Please raise a dispute if there is an issue." });
    }

    if (userId !== reserved_by && userId !== sellerid) {
      return res.status(403).json({ error: "Unauthorized: Only buyer or seller can cancel" });
    }

    await connection.beginTransaction();

    const isBuyer = userId === reserved_by;
    const isSeller = userId === sellerid;
    const preOtpStages = ['reserved', 'location_proposed', 'location_selected'];
    const isPreOtpCancel = preOtpStages.includes(status);

    const normalizedReason = String(reason || "").trim() || (isBuyer ? "changed_mind" : "seller_cancelled");
    const sellerFaultReasons = new Set(["bad_condition", "seller_late", "seller_no_show"]);
    const isSellerFault = isBuyer && sellerFaultReasons.has(normalizedReason);

    // Track cancellation before resetting state
    await connection.query(
      "INSERT INTO reservation_cancellations (pid, buyer_id, seller_id, cancelled_by, stage, is_pre_otp, reason) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, reserved_by, sellerid, userId, status, isPreOtpCancel ? 1 : 0, normalizedReason]
    );

    // Apply penalty to the at-fault party (buyer cancels for own reason, or seller at fault)
    let penaltyAppliedTo = null;
    if (isBuyer && !isSellerFault) {
      await addTrustPoints({ uid: reserved_by, delta: TRUST_POINTS.RESERVATION_CANCEL_PENALTY, db: connection });
      penaltyAppliedTo = "buyer";
    } else if (isSellerFault || isSeller) {
      await addTrustPoints({ uid: sellerid, delta: TRUST_POINTS.RESERVATION_CANCEL_PENALTY, db: connection });
      penaltyAppliedTo = "seller";
    }

    // Mark active OTPs as used/invalid
    await connection.query(
      "UPDATE otp_tokens SET used = true WHERE product_id = ? AND used = false",
      [id]
    );

    // Reset location selection flags
    await connection.query(
      "UPDATE prod_loc SET is_selected = false WHERE pid = ?",
      [id]
    );

    // Reset product
    const [productReset] = await connection.query(
      "UPDATE products SET status = 'available', reserved_by = NULL, reserved_at = NULL, reschedule_requested_by = NULL WHERE pid = ? AND status <> 'sold'",
      [id]
    );

    if (productReset.affectedRows === 0) {
      await connection.rollback();
      return res.status(400).json({ error: "Unable to cancel reservation after product was sold." });
    }

    await connection.commit();
    res.json({
      message: "Transaction cancelled",
      penaltyAppliedTo,
      reason: normalizedReason,
    });

  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

export const rescheduleProduct = async (req, res, next) => {
  const connection = await pool.getConnection();
  console.log(`[Reschedule] Request for pid: ${req.params.id}, User: ${req.user?.uid}`);
  try {
    const { id } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    await connection.beginTransaction();

    // Lock Row
    const [product] = await connection.query(
      "SELECT p.*, ps.sellerid FROM products p LEFT JOIN product_seller ps ON p.pid = ps.pid WHERE p.pid = ? FOR UPDATE",
      [id]
    );

    if (product.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Product not found" });
    }

    const currentStatus = product[0].status;
    const sellerId = product[0].sellerid;
    const reservedBy = product[0].reserved_by;
    const requestedBy = product[0].reschedule_requested_by;

    if (currentStatus === 'sold') {
      await connection.rollback();
      return res.status(400).json({ error: "Product already sold. Cannot reschedule." });
    }

    // Authorization
    if (sellerId !== userId && reservedBy !== userId) {
      await connection.rollback();
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Only allow reschedule if in active meeting flow
    if (!['location_selected', 'otp_generated'].includes(currentStatus)) {
      await connection.rollback();
      return res.status(400).json({
        error: `Cannot reschedule in '${currentStatus}' state. Only allowed during active meeting.`
      });
    }

    // Logic Branch: Request vs Confirm
    if (requestedBy !== null) {
      // A request already exists
      if (String(requestedBy) === String(userId)) {
        await connection.rollback();
        return res.status(400).json({ error: "You have already requested to reschedule. Waiting for other party." });
      } else {
        // Other party requested -> CONFIRM & RESET
        console.log("[Reschedule] Request confirmed by other party. Executing reset...");

        // 1. Invalidate OTPs
        await connection.query("UPDATE otp_tokens SET used = true WHERE product_id = ? AND used = false", [id]);

        // 2. Clear Location
        await connection.query("UPDATE prod_loc SET is_selected = false WHERE pid = ?", [id]);

        // 3. Reset Product
        const [resetResult] = await connection.query(
          "UPDATE products SET status = 'reserved', reschedule_requested_by = NULL WHERE pid = ? AND status <> 'sold'",
          [id]
        );

        if (resetResult.affectedRows === 0) {
          await connection.rollback();
          return res.status(400).json({ error: "Unable to reschedule after product was sold." });
        }

        await connection.commit();
        return res.json({
          success: true,
          status: 'confirmed',
          message: "Reschedule request accepted. Meeting details have been reset."
        });
      }
    } else {
      // No request exists -> INITIATE REQUEST
      console.log("[Reschedule] Initiating new request...");

      await connection.query(
        "UPDATE products SET reschedule_requested_by = ? WHERE pid = ?",
        [userId, id]
      );

      await connection.commit();
      return res.json({
        success: true,
        status: 'requested',
        message: "Reschedule requested. Waiting for the other party to accept."
      });
    }

  } catch (err) {
    console.error("[Reschedule] Error:", err);
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

export const createDispute = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    const { reason, details, evidence_url } = req.body || {};

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!reason || String(reason).trim().length < 3) {
      return res.status(400).json({ error: "Reason is required" });
    }

    await connection.beginTransaction();

    const [rows] = await connection.query(
      "SELECT p.status, p.reserved_by, ps.sellerid FROM products p LEFT JOIN product_seller ps ON p.pid = ps.pid WHERE p.pid = ? FOR UPDATE",
      [id]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Product not found" });
    }

    const { status, reserved_by, sellerid } = rows[0];
    if (!['location_selected', 'otp_generated'].includes(status)) {
      await connection.rollback();
      return res.status(400).json({ error: "Reports can only be raised after the meeting is scheduled." });
    }

    const isBuyer = userId === reserved_by;
    const isSeller = userId === sellerid;
    if (!isBuyer && !isSeller) {
      await connection.rollback();
      return res.status(403).json({ error: "Only the buyer or seller can report an issue." });
    }

    const raisedRole = isSeller ? "seller" : "buyer";

    await connection.query(
      "INSERT INTO disputes (pid, buyer_id, seller_id, raised_by, raised_role, status, reason, details, evidence_url) VALUES (?, ?, ?, ?, ?, 'open', ?, ?, ?)",
      [id, reserved_by, sellerid, userId, raisedRole, String(reason).trim(), details || null, evidence_url || null]
    );

    await connection.commit();
    res.json({ message: "Dispute created" });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

export const rejectReschedule = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    await connection.beginTransaction();

    // Fetch product details with lock
    const [product] = await connection.query(
      "SELECT p.status, p.reserved_by, p.reschedule_requested_by, ps.sellerid FROM products p LEFT JOIN product_seller ps ON p.pid = ps.pid WHERE p.pid = ? FOR UPDATE",
      [id]
    );

    if (product.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Product not found" });
    }

    const reservedBy = product[0].reserved_by;
    const sellerId = product[0].sellerid;
    const requestedBy = product[0].reschedule_requested_by;
    const currentStatus = product[0].status;

    // Authorization
    if (sellerId !== userId && reservedBy !== userId) {
      await connection.rollback();
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (currentStatus === 'sold') {
      await connection.rollback();
      return res.status(400).json({ error: "Product already sold. No reschedule actions allowed." });
    }

    if (requestedBy === null) {
      await connection.rollback();
      return res.status(400).json({ error: "No reschedule request pending" });
    }

    // STRICT RULE: If Buyer is rejecting a request from Seller -> CANCEL TRANSACTION
    const isBuyer = String(userId) === String(reservedBy);
    const requestFromSeller = String(requestedBy) === String(sellerId);

    console.log(`[Reject Debug] User:${userId} Reserved:${reservedBy} ReqBy:${requestedBy} Seller:${sellerId}`);
    console.log(`[Reject Debug] IsBuyer:${isBuyer} ReqFromSeller:${requestFromSeller}`);

    if (isBuyer && requestFromSeller) {
      console.log("[Reject Reschedule] Buyer rejected Seller's request. Executing FULL CANCELLATION.");

      // 1. Reset Location
      await connection.query("UPDATE prod_loc SET is_selected = false WHERE pid = ?", [id]);

      // 2. Clear OTPs
      await connection.query("UPDATE otp_tokens SET used = true WHERE product_id = ? AND used = false", [id]);

      // 3. FULL CANCEL
      const [cancelResult] = await connection.query(
        "UPDATE products SET status = 'available', reserved_by = NULL, reserved_at = NULL, reschedule_requested_by = NULL WHERE pid = ? AND status <> 'sold'",
        [id]
      );

      if (cancelResult.affectedRows === 0) {
        await connection.rollback();
        return res.status(400).json({ error: "Product already sold. Cannot cancel reschedule." });
      }

      await connection.commit();
      return res.json({
        message: "Reschedule rejected. Transaction has been cancelled and product is now available.",
        action: "cancelled"
      });

    } else {
      // Default: Just clear the flag
      console.log("[Reject Reschedule] Clearing reschedule request flag only.");
      await connection.query(
        "UPDATE products SET reschedule_requested_by = NULL WHERE pid = ?",
        [id]
      );
      await connection.commit();
      return res.json({
        message: "Reschedule request cancelled.",
        action: "cleared"
      });
    }

  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

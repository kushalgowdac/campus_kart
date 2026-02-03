import { pool } from "../db/index.js";

const AUTO_FLAG_KEYWORDS = ["scam", "fake", "fraud", "counterfeit"];
const AUTO_FLAG_PRICE = 50000;

const logAdminAction = async ({ adminId, actionType, targetType, targetId, details }) => {
  await pool.query(
    "INSERT INTO admin_actions_log (admin_id, action_type, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)",
    [adminId, actionType, targetType, targetId, details ? JSON.stringify(details) : null]
  );
};

const notifySeller = async ({ sellerId, productId, status, reason }) => {
  // TODO: Integrate with notification system when available.
  console.info("[Notify Seller]", { sellerId, productId, status, reason });
};

const autoFlagPendingProducts = async (adminId) => {
  const [pending] = await pool.query(
    `SELECT pv.verification_id, pv.product_id, p.pname, p.price, ps.sellerid
     FROM product_verification pv
     INNER JOIN products p ON pv.product_id = p.pid
     INNER JOIN product_seller ps ON p.pid = ps.pid
     WHERE pv.status = 'pending'`
  );

  const flagged = [];

  for (const product of pending) {
    const nameLower = (product.pname || "").toLowerCase();
    const keywordMatch = AUTO_FLAG_KEYWORDS.find((kw) => nameLower.includes(kw));
    const priceMatch = Number(product.price) > AUTO_FLAG_PRICE;

    if (keywordMatch || priceMatch) {
      const reasons = [];
      if (keywordMatch) reasons.push(`keyword:${keywordMatch}`);
      if (priceMatch) reasons.push(`price>${AUTO_FLAG_PRICE}`);

      await pool.query(
        `UPDATE product_verification
         SET status = 'flagged', verified_by = ?, verified_at = NOW(), flag_details = ?, admin_notes = ?
         WHERE verification_id = ? AND status = 'pending'`,
        [
          adminId,
          JSON.stringify({ reasons }),
          `Auto-flagged due to ${reasons.join(", ")}`,
          product.verification_id,
        ]
      );

      await logAdminAction({
        adminId,
        actionType: "flagged_product",
        targetType: "product",
        targetId: product.product_id,
        details: { source: "auto-flag", reasons },
      });

      await notifySeller({
        sellerId: product.sellerid,
        productId: product.product_id,
        status: "flagged",
        reason: reasons.join(", "),
      });

      flagged.push(product.product_id);
    }
  }

  return flagged;
};

/**
 * GET /api/admin/products/pending
 * Query: ?category=&sellerid=
 * Sample Response:
 *   { "count": 1, "items": [{ "pid": 12, "pname": "Calculator", "verification_status": "pending" }] }
 */
export const getPendingProducts = async (req, res, next) => {
  try {
    await autoFlagPendingProducts(req.admin.admin_id);

    const [rows] = await pool.query(
      `SELECT p.pid, p.pname, p.category, p.price, p.status,
              u.uid AS seller_id, u.name AS seller_name, u.email AS seller_email, u.trust_points,
              pv.status AS verification_status, pv.created_at, pv.admin_notes
       FROM product_verification pv
       INNER JOIN products p ON pv.product_id = p.pid
       INNER JOIN product_seller ps ON p.pid = ps.pid
       INNER JOIN users u ON ps.sellerid = u.uid
       WHERE pv.status = 'pending'
       ORDER BY pv.created_at ASC`
    );

    res.json({ count: rows.length, items: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/products/flagged
 * Sample Response:
 *   { "count": 2, "items": [{ "pid": 9, "pname": "Fake Watch", "verification_status": "flagged" }] }
 */
export const getFlaggedProducts = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.pid, p.pname, p.category, p.price,
              u.uid AS seller_id, u.name AS seller_name, u.email AS seller_email, u.trust_points,
              pv.status AS verification_status, pv.flag_details, pv.admin_notes, pv.created_at
       FROM product_verification pv
       INNER JOIN products p ON pv.product_id = p.pid
       INNER JOIN product_seller ps ON p.pid = ps.pid
       INNER JOIN users u ON ps.sellerid = u.uid
       WHERE pv.status = 'flagged'
       ORDER BY pv.created_at DESC`
    );

    res.json({ count: rows.length, items: rows });
  } catch (err) {
    next(err);
  }
};

const updateVerificationStatus = async ({
  productId,
  status,
  adminId,
  reason,
  notes,
}) => {
  const [result] = await pool.query(
    `UPDATE product_verification
     SET status = ?, verified_by = ?, verified_at = NOW(), rejection_reason = ?, admin_notes = ?
     WHERE product_id = ? AND status = 'pending'`,
    [status, adminId, reason || null, notes || null, productId]
  );

  return result.affectedRows > 0;
};

/**
 * POST /api/admin/products/:id/approve
 * Sample Response:
 *   { "message": "Product approved", "product_id": 12 }
 */
export const approveProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const updated = await updateVerificationStatus({
      productId: id,
      status: "approved",
      adminId: req.admin.admin_id,
      notes: "Approved by admin",
    });

    if (!updated) {
      return res.status(400).json({ error: "Only pending products can be approved" });
    }

    await logAdminAction({
      adminId: req.admin.admin_id,
      actionType: "approved_product",
      targetType: "product",
      targetId: Number(id),
      details: { status: "approved" },
    });

    const [[seller]] = await pool.query(
      `SELECT ps.sellerid
       FROM product_seller ps
       WHERE ps.pid = ?`,
      [id]
    );

    if (seller) {
      await notifySeller({ sellerId: seller.sellerid, productId: id, status: "approved" });
    }

    res.json({ message: "Product approved", product_id: Number(id) });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/products/:id/reject
 * Body: { reason }
 * Sample Request:
 *   { "reason": "Missing seller proof" }
 * Sample Response:
 *   { "message": "Product rejected", "product_id": 12 }
 */
export const rejectProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const updated = await updateVerificationStatus({
      productId: id,
      status: "rejected",
      adminId: req.admin.admin_id,
      reason,
      notes: reason ? `Rejected: ${reason}` : "Rejected by admin",
    });

    if (!updated) {
      return res.status(400).json({ error: "Only pending products can be rejected" });
    }

    await logAdminAction({
      adminId: req.admin.admin_id,
      actionType: "rejected_product",
      targetType: "product",
      targetId: Number(id),
      details: { status: "rejected", reason },
    });

    const [[seller]] = await pool.query(
      `SELECT ps.sellerid
       FROM product_seller ps
       WHERE ps.pid = ?`,
      [id]
    );

    if (seller) {
      await notifySeller({ sellerId: seller.sellerid, productId: id, status: "rejected", reason });
    }

    res.json({ message: "Product rejected", product_id: Number(id) });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/products/:id/flag
 * Body: { reason }
 * Sample Request:
 *   { "reason": "Suspicious keywords" }
 * Sample Response:
 *   { "message": "Product flagged", "product_id": 12 }
 */
export const flagProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const [result] = await pool.query(
      `UPDATE product_verification
       SET status = 'flagged', verified_by = ?, verified_at = NOW(), admin_notes = ?, flag_details = ?
       WHERE product_id = ?`,
      [
        req.admin.admin_id,
        reason ? `Flagged: ${reason}` : "Flagged by admin",
        JSON.stringify({ reason: reason || "manual" }),
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product verification record not found" });
    }

    await logAdminAction({
      adminId: req.admin.admin_id,
      actionType: "flagged_product",
      targetType: "product",
      targetId: Number(id),
      details: { status: "flagged", reason },
    });

    const [[seller]] = await pool.query(
      `SELECT ps.sellerid
       FROM product_seller ps
       WHERE ps.pid = ?`,
      [id]
    );

    if (seller) {
      await notifySeller({ sellerId: seller.sellerid, productId: id, status: "flagged", reason });
    }

    res.json({ message: "Product flagged", product_id: Number(id) });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/products/history
 * Query: status, admin_id, start, end
 * Sample Response:
 *   { "count": 3, "items": [{ "product_id": 12, "status": "approved", "verified_by": 1 }] }
 */
export const getVerificationHistory = async (req, res, next) => {
  try {
    const { status, admin_id, start, end } = req.query;

    let sql = `
      SELECT pv.product_id, pv.status, pv.verified_by, pv.verified_at, pv.rejection_reason,
             pv.admin_notes, pv.created_at,
             p.pname, p.category, p.price,
             u.uid AS seller_id, u.name AS seller_name,
             a.full_name AS verified_by_name
      FROM product_verification pv
      INNER JOIN products p ON pv.product_id = p.pid
      INNER JOIN product_seller ps ON p.pid = ps.pid
      INNER JOIN users u ON ps.sellerid = u.uid
      LEFT JOIN admin_users a ON pv.verified_by = a.admin_id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      sql += " AND pv.status = ?";
      params.push(status);
    }

    if (admin_id) {
      sql += " AND pv.verified_by = ?";
      params.push(admin_id);
    }

    if (start) {
      sql += " AND pv.created_at >= ?";
      params.push(start);
    }

    if (end) {
      sql += " AND pv.created_at <= ?";
      params.push(end);
    }

    sql += " ORDER BY pv.created_at DESC";

    const [rows] = await pool.query(sql, params);

    res.json({ count: rows.length, items: rows });
  } catch (err) {
    next(err);
  }
};

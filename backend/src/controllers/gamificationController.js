import { pool } from "../db/index.js";
import {
  TRUST_POINTS,
  addTrustPoints,
  computeAndAwardBadges,
  getUserBadges,
  getTrustPoints,
  getLeaderboard,
} from "../services/gamificationService.js";

const RVCE_DOMAIN = "@rvce.edu.in";

export const getMe = async (req, res, next) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Authentication required" });

    const trustPoints = await getTrustPoints({ uid });
    const badges = await getUserBadges({ uid });

    res.json({ uid, trustPoints, badges });
  } catch (err) {
    next(err);
  }
};

// Get gamification data for any user by UID
export const getUserGamification = async (req, res, next) => {
  try {
    const uid = Number(req.params.uid);
    if (!uid || isNaN(uid)) {
      return res.status(400).json({ error: "Valid user ID required" });
    }

    const trustPoints = await getTrustPoints({ uid });
    const badges = await getUserBadges({ uid });

    res.json({ uid, trustPoints, badges });
  } catch (err) {
    next(err);
  }
};

// Called by frontend immediately after a user selects an account.
export const trackLogin = async (req, res, next) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Authentication required" });

    await addTrustPoints({ uid, delta: TRUST_POINTS.LOGIN });
    await computeAndAwardBadges({ uid });

    const trustPoints = await getTrustPoints({ uid });
    const badges = await getUserBadges({ uid });

    res.json({ uid, trustPoints, badges });
  } catch (err) {
    next(err);
  }
};

export const leaderboard = async (req, res, next) => {
  const safeLimit = Math.min(Math.max(Number(req.query?.limit) || 10, 1), 50);
  // Compute these outside try/catch so the catch block can never crash.
  const likeParam = `%${RVCE_DOMAIN}`;

  try {
    const rows = await getLeaderboard({ limit: safeLimit, rvceDomain: RVCE_DOMAIN });
    return res.status(200).json(Array.isArray(rows) ? rows : []);
  } catch (err) {
    // Make failures debuggable. Global error handler returns a generic message.
    console.error("[leaderboard] Failed", {
      code: err?.code,
      errno: err?.errno,
      sqlState: err?.sqlState,
      sqlMessage: err?.sqlMessage,
    });

    // Bulletproof fallback path: always return HTTP 200 and a JSON array.
    // We do NOT call next(err) here because the frontend expects an array.
    try {
      // First fallback: no badge join, no GROUP BY. Works in strict mode.
      const [rows] = await pool.query(
        `SELECT u.uid, u.name, u.email, COALESCE(u.trust_points, 0) AS trustPoints, 0 AS badgesCount
         FROM users u
         WHERE LOWER(u.email) LIKE ?
         ORDER BY trustPoints DESC, u.uid ASC
         LIMIT ${safeLimit}`,
        [likeParam]
      );
      return res.status(200).json(Array.isArray(rows) ? rows : []);
    } catch (fallbackErr) {
      console.error("[leaderboard] Fallback failed", {
        code: fallbackErr?.code,
        errno: fallbackErr?.errno,
        sqlState: fallbackErr?.sqlState,
        sqlMessage: fallbackErr?.sqlMessage,
      });

      try {
        // Second fallback: trust_points column missing -> return a valid 0-point list.
        const [rows] = await pool.query(
          `SELECT u.uid, u.name, u.email, 0 AS trustPoints, 0 AS badgesCount
           FROM users u
           WHERE LOWER(u.email) LIKE ?
           ORDER BY u.uid ASC
           LIMIT ${safeLimit}`,
          [likeParam]
        );
        return res.status(200).json(Array.isArray(rows) ? rows : []);
      } catch (fallbackErr2) {
        console.error("[leaderboard] Fallback(0) failed", {
          code: fallbackErr2?.code,
          errno: fallbackErr2?.errno,
          sqlState: fallbackErr2?.sqlState,
          sqlMessage: fallbackErr2?.sqlMessage,
        });

        return res.status(200).json([]);
      }
    }
  }
};

// Minimal rating API to support rating-based trust points.
// Ensures only participants of the completed trade can rate the counterparty.
export const createRating = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const raterUid = req.user?.uid;
    if (!raterUid) return res.status(401).json({ error: "Authentication required" });

    const { pid, rateeUid, rating, comment } = req.body;
    const pidNum = Number(pid);
    const rateeNum = Number(rateeUid);
    const ratingNum = Number(rating);

    if (!pidNum || !rateeNum || !Number.isInteger(ratingNum)) {
      return res.status(400).json({ error: "pid, rateeUid, rating required" });
    }
    if (ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: "rating must be between 1 and 5" });
    }
    if (rateeNum === raterUid) {
      return res.status(400).json({ error: "You cannot rate yourself" });
    }

    // Verify the rater and ratee participated in the completed transaction for this product.
    const [tradeRows] = await connection.query(
      "SELECT t.buyerid, ps.sellerid FROM `transaction` t JOIN product_seller ps ON t.pid = ps.pid WHERE t.pid = ? AND t.status = 'completed' ORDER BY t.time_of_purchase DESC LIMIT 1",
      [pidNum]
    );

    if (tradeRows.length === 0) {
      return res.status(400).json({ error: "No completed trade found for this product" });
    }

    const { buyerid, sellerid } = tradeRows[0];
    const isParticipant = raterUid === buyerid || raterUid === sellerid;
    if (!isParticipant) {
      return res.status(403).json({ error: "Only participants can rate this trade" });
    }

    const expectedCounterparty = raterUid === buyerid ? sellerid : buyerid;
    if (rateeNum !== expectedCounterparty) {
      return res.status(400).json({ error: "Invalid ratee for this trade" });
    }

    await connection.beginTransaction();

    try {
      await connection.query(
        "INSERT INTO user_ratings (pid, rater_uid, ratee_uid, rating, comment) VALUES (?, ?, ?, ?, ?)",
        [pidNum, raterUid, rateeNum, ratingNum, typeof comment === "string" ? comment.trim().slice(0, 500) : null]
      );
    } catch (err) {
      if (err?.code === "ER_DUP_ENTRY") {
        await connection.rollback();
        return res.status(409).json({ error: "You have already rated this trade" });
      }
      throw err;
    }

    await addTrustPoints({ uid: raterUid, delta: TRUST_POINTS.RATING_GIVEN, db: connection });

    const receiverDelta =
      TRUST_POINTS.RATING_RECEIVED + (ratingNum === 5 ? TRUST_POINTS.RATING_RECEIVED_BONUS_5STAR : 0);
    await addTrustPoints({ uid: rateeNum, delta: receiverDelta, db: connection });

    await connection.commit();

    // Badge evaluation can be done outside the rating transaction.
    await computeAndAwardBadges({ uid: raterUid });
    await computeAndAwardBadges({ uid: rateeNum });

    res.status(201).json({ success: true });
  } catch (err) {
    try {
      await connection.rollback();
    } catch {
      // ignore
    }
    next(err);
  } finally {
    connection.release();
  }
};

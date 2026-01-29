import { pool } from "../db/index.js";

// Centralized gamification rules.
// Keep these values small and readable; the goal is to reward healthy behavior,
// not to create an economy.
export const TRUST_POINTS = Object.freeze({
  SIGNUP: 10,
  LOGIN: 1,
  LISTING_CREATE: 5,
  PURCHASE_COMPLETED_BUYER: 20,
  PURCHASE_COMPLETED_SELLER: 15,
  RATING_GIVEN: 2,
  RATING_RECEIVED: 3,
  RATING_RECEIVED_BONUS_5STAR: 2,
});

export const BADGES = Object.freeze({
  FIRST_TRADE: "first_trade",
  TRUSTED_USER: "trusted_user",
  POWER_SELLER: "power_seller",
});

const getDb = (db) => db || pool;

export const addTrustPoints = async ({ uid, delta, db }) => {
  if (!uid || !Number.isFinite(Number(delta))) return;
  const database = getDb(db);
  await database.query(
    "UPDATE users SET trust_points = COALESCE(trust_points, 0) + ? WHERE uid = ?",
    [delta, uid]
  );
};

export const getTrustPoints = async ({ uid, db }) => {
  const database = getDb(db);
  const [rows] = await database.query(
    "SELECT COALESCE(trust_points, 0) AS trust_points FROM users WHERE uid = ?",
    [uid]
  );
  return rows?.[0]?.trust_points ?? 0;
};

export const awardBadge = async ({ uid, badgeKey, db }) => {
  const database = getDb(db);
  if (!uid || !badgeKey) return false;
  const [result] = await database.query(
    "INSERT IGNORE INTO user_badges (uid, badge_key) VALUES (?, ?)",
    [uid, badgeKey]
  );
  return Boolean(result?.affectedRows);
};

const countCompletedTrades = async ({ uid, db }) => {
  const database = getDb(db);
  const [rows] = await database.query(
    "SELECT COUNT(*) AS c FROM `transaction` t JOIN product_seller ps ON t.pid = ps.pid WHERE t.status = 'completed' AND (t.buyerid = ? OR ps.sellerid = ?)",
    [uid, uid]
  );
  return Number(rows?.[0]?.c || 0);
};

const countCompletedSales = async ({ uid, db }) => {
  const database = getDb(db);
  const [rows] = await database.query(
    "SELECT COUNT(*) AS c FROM `transaction` t JOIN product_seller ps ON t.pid = ps.pid WHERE t.status = 'completed' AND ps.sellerid = ?",
    [uid]
  );
  return Number(rows?.[0]?.c || 0);
};

export const computeAndAwardBadges = async ({ uid, db }) => {
  const database = getDb(db);
  const newlyAwarded = [];

  const completedTrades = await countCompletedTrades({ uid, db: database });
  if (completedTrades >= 1) {
    if (await awardBadge({ uid, badgeKey: BADGES.FIRST_TRADE, db: database })) {
      newlyAwarded.push(BADGES.FIRST_TRADE);
    }
  }

  const trustPoints = await getTrustPoints({ uid, db: database });
  if (trustPoints >= 100) {
    if (await awardBadge({ uid, badgeKey: BADGES.TRUSTED_USER, db: database })) {
      newlyAwarded.push(BADGES.TRUSTED_USER);
    }
  }

  const completedSales = await countCompletedSales({ uid, db: database });
  if (completedSales >= 5) {
    if (await awardBadge({ uid, badgeKey: BADGES.POWER_SELLER, db: database })) {
      newlyAwarded.push(BADGES.POWER_SELLER);
    }
  }

  return newlyAwarded;
};

export const getUserBadges = async ({ uid, db }) => {
  const database = getDb(db);
  const [rows] = await database.query(
    "SELECT b.badge_key AS `key`, b.name, b.description, b.icon, ub.earned_at AS earnedAt FROM user_badges ub JOIN badges b ON ub.badge_key = b.badge_key WHERE ub.uid = ? ORDER BY ub.earned_at ASC",
    [uid]
  );
  return rows;
};

export const getLeaderboard = async ({ limit = 10, rvceDomain = null, db }) => {
  const database = getDb(db);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);

  const params = [];
  let where = "";
  if (rvceDomain) {
    where = "WHERE LOWER(u.email) LIKE ?";
    params.push(`%${rvceDomain}`);
  }

  const [rows] = await database.query(
    `SELECT u.uid, u.name, u.email, COALESCE(u.trust_points, 0) AS trustPoints, COUNT(ub.badge_key) AS badgesCount
     FROM users u
     LEFT JOIN user_badges ub ON u.uid = ub.uid
     ${where}
     GROUP BY u.uid, u.name, u.email, u.trust_points
     ORDER BY COALESCE(u.trust_points, 0) DESC, u.uid ASC
     LIMIT ${safeLimit}`,
    params
  );

  return rows;
};

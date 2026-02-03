import { Router } from "express";
import { query, validationResult } from "express-validator";
import { verifyAdmin } from "../middleware/adminAuth.js";
import {
  getOverview,
  getTrends,
  getCategoryBreakdown,
  getLocationStats,
  getTrustDistribution,
  getAbandonmentFunnel,
  getPeakTimes,
} from "../controllers/adminAnalyticsController.js";

const router = Router();

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.use(verifyAdmin);

router.get("/overview", getOverview);

router.get(
  "/trends",
  [query("start").isISO8601(), query("end").isISO8601()],
  handleValidation,
  getTrends
);

router.get("/categories", getCategoryBreakdown);
router.get("/locations", getLocationStats);
router.get("/trust-distribution", getTrustDistribution);
router.get("/abandonment", getAbandonmentFunnel);
router.get("/peak-times", getPeakTimes);

export default router;

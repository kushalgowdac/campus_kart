import { Router } from "express";
import { query, validationResult } from "express-validator";
import { verifyAdmin, requireAdminRole } from "../middleware/adminAuth.js";
import {
  exportTransactionsReport,
  exportUsersReport,
  getFlaggedActivityReport,
} from "../controllers/adminReportsController.js";

const router = Router();

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.use(verifyAdmin);

router.get(
  "/transactions",
  requireAdminRole("super_admin"),
  [query("start").isISO8601(), query("end").isISO8601()],
  handleValidation,
  exportTransactionsReport
);

router.get("/users", requireAdminRole("super_admin"), exportUsersReport);
router.get("/flagged-activity", getFlaggedActivityReport);

export default router;

import { Router } from "express";
import { body, query, validationResult } from "express-validator";
import { verifyAdmin } from "../middleware/adminAuth.js";
import {
  getPendingProducts,
  getFlaggedProducts,
  approveProduct,
  rejectProduct,
  flagProduct,
  getVerificationHistory,
} from "../controllers/adminProductsController.js";

const router = Router();

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.use(verifyAdmin);

router.get("/pending", getPendingProducts);
router.get("/flagged", getFlaggedProducts);

router.post("/:id/approve", approveProduct);

router.post(
  "/:id/reject",
  [body("reason").isString().isLength({ min: 3, max: 500 })],
  handleValidation,
  rejectProduct
);

router.post(
  "/:id/flag",
  [body("reason").optional().isString().isLength({ min: 3, max: 500 })],
  handleValidation,
  flagProduct
);

router.get(
  "/history",
  [
    query("status").optional().isIn(["pending", "approved", "rejected", "flagged", "resubmitted"]),
    query("admin_id").optional().isInt(),
    query("start").optional().isISO8601(),
    query("end").optional().isISO8601(),
  ],
  handleValidation,
  getVerificationHistory
);

export default router;

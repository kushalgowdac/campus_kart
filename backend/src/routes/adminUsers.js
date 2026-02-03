import { Router } from "express";
import rateLimit from "express-rate-limit";
import { body, query, param, validationResult } from "express-validator";
import { verifyAdmin, requireAdminRole } from "../middleware/adminAuth.js";
import {
  listUsersAdmin,
  getUserProfileAdmin,
  suspendUser,
  unsuspendUser,
  getUserActivity,
} from "../controllers/adminUsersController.js";

const router = Router();

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const suspendLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  message: { error: "Too many suspension requests. Please try again later." },
});

router.use(verifyAdmin);

router.get(
  "/",
  [
    query("suspended")
      .optional({ checkFalsy: true })
      .custom((value) => value === "undefined" || ["true", "false"].includes(value)),
    query("trust_min")
      .optional({ checkFalsy: true })
      .custom((value) => value === "undefined" || Number.isInteger(Number(value)))
      .bail()
      .toInt()
      .isInt({ min: 0 }),
    query("trust_max")
      .optional({ checkFalsy: true })
      .custom((value) => value === "undefined" || Number.isInteger(Number(value)))
      .bail()
      .toInt()
      .isInt({ min: 0 }),
  ],
  handleValidation,
  listUsersAdmin
);

router.get("/:id", [param("id").isInt()], handleValidation, getUserProfileAdmin);

router.get("/:id/activity", [param("id").isInt()], handleValidation, getUserActivity);

router.post(
  "/:id/suspend",
  suspendLimiter,
  requireAdminRole("super_admin"),
  [
    param("id").isInt(),
    body("reason").isString().isLength({ min: 3, max: 500 }),
    body("duration_days").optional().isInt({ min: 1, max: 365 }),
  ],
  handleValidation,
  suspendUser
);

router.post(
  "/:id/unsuspend",
  requireAdminRole("super_admin"),
  [param("id").isInt(), body("reason").optional().isString().isLength({ min: 3, max: 500 })],
  handleValidation,
  unsuspendUser
);

export default router;

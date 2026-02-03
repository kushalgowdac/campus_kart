import { Router } from "express";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";
import { adminLogin, adminLogout, getAdminProfile } from "../controllers/adminAuthController.js";
import { verifyAdmin } from "../middleware/adminAuth.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts. Please try again later." },
});

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post(
  "/login",
  loginLimiter,
  [body("email").isEmail(), body("password").isLength({ min: 6 })],
  handleValidation,
  adminLogin
);

router.post("/logout", verifyAdmin, adminLogout);
router.get("/me", verifyAdmin, getAdminProfile);

export default router;

import { Router } from "express";
import { verifyOTP } from "../controllers/otpController.js";
import { reserveProduct, confirmMeet, cancelReservation } from "../controllers/productsController.js";

const router = Router();

/**
 * OTP Routes
 * POST /api/otp/verify - Seller verifies OTP during physical meeting
 */
router.post("/verify", verifyOTP);

// Fallback/Alternative Routes
router.post("/:id/reserve", reserveProduct);
router.post("/:id/confirm-meet", confirmMeet);
router.post("/:id/cancel", cancelReservation);

export default router;

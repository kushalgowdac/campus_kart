import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { createRating, getMe, getUserGamification, leaderboard, trackLogin, getRatingForProduct } from "../controllers/gamificationController.js";

const router = Router();

// Current user's trust score + badges
router.get("/me", requireAuth, getMe);

// Get any user's gamification data by UID
router.get("/user/:uid", getUserGamification);

// Called right after the (client-side) login action
router.post("/login", requireAuth, trackLogin);

// Public leaderboard
router.get("/leaderboard", leaderboard);

// Check if current user already rated a product
router.get("/ratings/:pid", requireAuth, getRatingForProduct);

// Rate a completed trade
router.post("/ratings", requireAuth, createRating);

export default router;

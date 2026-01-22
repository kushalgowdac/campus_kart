import { Router } from "express";
import { createLocations, getLocations, selectLocation } from "../controllers/locationController.js";

const router = Router();

/**
 * Location Selection Routes
 * Base path: /api/locations
 * 
 * POST   /:pid            - Seller proposes locations
 * GET    /:pid            - Get proposed locations
 * POST   /:pid/select     - Buyer selects one location
 */

router.post("/:pid", createLocations);
router.get("/:pid", getLocations);
router.post("/:pid/select", selectLocation);

export default router;

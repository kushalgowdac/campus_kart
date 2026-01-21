import { Router } from "express";
import {
  listWishlist,
  addWishlistItem,
  removeWishlistItem,
} from "../controllers/wishlistController.js";

const router = Router();

router.get("/", listWishlist);
router.post("/", addWishlistItem);
router.delete("/:uid/:pid", removeWishlistItem);

export default router;

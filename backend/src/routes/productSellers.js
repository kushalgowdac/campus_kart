import { Router } from "express";
import {
  listProductSellers,
  upsertProductSeller,
  deleteProductSeller,
} from "../controllers/productSellersController.js";

const router = Router();

router.get("/", listProductSellers);
router.post("/", upsertProductSeller);
router.delete("/:pid", deleteProductSeller);

export default router;

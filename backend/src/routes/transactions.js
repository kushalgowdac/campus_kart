import { Router } from "express";
import {
  listTransactions,
  createTransaction,
  listMyPurchases,
} from "../controllers/transactionsController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", listTransactions);
router.post("/", createTransaction);
router.get("/my-purchases", requireAuth, listMyPurchases);

export default router;

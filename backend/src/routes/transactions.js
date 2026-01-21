import { Router } from "express";
import {
  listTransactions,
  createTransaction,
} from "../controllers/transactionsController.js";

const router = Router();

router.get("/", listTransactions);
router.post("/", createTransaction);

export default router;

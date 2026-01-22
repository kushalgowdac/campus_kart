import { Router } from "express";
import {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  reserveProduct,
  confirmMeet,
  cancelReservation,
} from "../controllers/productsController.js";

const router = Router();
console.log("Loading products router...");

// request logger
router.use((req, res, next) => {
  console.log(`[ProductsRouter] ${req.method} ${req.url}`);
  next();
});

// Test route
router.post("/test", (req, res) => {
  console.log("Test route hit");
  res.json({ worked: true });
});

// OTP Flow Routes - Specific routes first!
router.post("/:id/reserve", reserveProduct);
router.post("/:id/confirm-meet", confirmMeet);
router.post("/:id/cancel", cancelReservation);

// Standard CRUD
router.get("/", listProducts);
router.get("/:id", getProductById);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;

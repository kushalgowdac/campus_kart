import { Router } from "express";
import {
  listProducts,
  searchProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  reserveProduct,
  confirmMeet,
  cancelReservation,
  createDispute,
  rescheduleProduct,
  rejectReschedule,
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
router.post("/:id/dispute", createDispute);
router.post("/:id/reschedule", rescheduleProduct);
router.post("/:id/reschedule/reject", rejectReschedule);

// Standard CRUD
router.get("/search", searchProducts); // Specific route first
router.get("/", listProducts);
router.get("/:id", getProductById);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;

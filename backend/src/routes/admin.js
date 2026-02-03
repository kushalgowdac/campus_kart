import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import {
  listAllUsers,
  updateUserRole,
  deleteUserAdmin,
  listAllProducts,
  forceDeleteProduct,
  getDashboardStats,
} from "../controllers/adminController.js";
import {
  getTimeSeries,
  getCategoryAnalytics,
  getYearAnalytics,
  getConversionFunnel,
  exportTransactionsCSV,
} from "../controllers/transactionsController.js";

const router = Router();

// All admin routes require admin role
router.use(requireAdmin);

// Dashboard stats
router.get("/stats", getDashboardStats);

// Analytics
router.get("/analytics/time-series", getTimeSeries);
router.get("/analytics/category", getCategoryAnalytics);
router.get("/analytics/year", getYearAnalytics);
router.get("/analytics/funnel", getConversionFunnel);
router.get("/analytics/export-csv", exportTransactionsCSV);

// User management
router.get("/users", listAllUsers);
router.put("/users/:uid/role", updateUserRole);
router.delete("/users/:uid", deleteUserAdmin);

// Product management
router.get("/products", listAllProducts);
router.delete("/products/:pid", forceDeleteProduct);

export default router;

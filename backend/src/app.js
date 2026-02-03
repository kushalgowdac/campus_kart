
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { pool } from "./db/index.js";
import { connectMongo } from "./db/mongo.js";

import usersRouter from "./routes/users.js";
import productsRouter from "./routes/products.js";
import productSellersRouter from "./routes/productSellers.js";
import productSpecsRouter from "./routes/productSpecs.js";
import productImagesRouter from "./routes/productImages.js";
import productLocationsRouter from "./routes/productLocations.js";
import wishlistRouter from "./routes/wishlist.js";
import transactionsRouter from "./routes/transactions.js";
import chatsRouter from "./routes/chats.js";
import otpRouter from "./routes/otpRoutes.js";
import locationRouter from "./routes/locationRoutes.js";
import gamificationRouter from "./routes/gamification.js";
import adminAuthRouter from "./routes/adminAuth.js";
import adminProductsRouter from "./routes/adminProducts.js";
import adminUsersRouter from "./routes/adminUsers.js";
import adminAnalyticsRouter from "./routes/adminAnalytics.js";
import adminReportsRouter from "./routes/adminReports.js";
import { authenticate } from "./middleware/auth.js";
import { startOTPCleanup } from "./jobs/otpCleanup.js";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imagesPath = path.resolve(__dirname, "..", "..", "images");

app.use(cors());
app.use(express.json());
app.use(authenticate); // Global authentication middleware
app.use("/images", express.static(imagesPath));

app.get("/", (req, res) => {
  res.send("CampusKart API is running");
});

app.get("/db-test", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SHOW TABLES");
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

app.use("/api/users", usersRouter);
app.use("/api/products", productsRouter);
app.use("/api/product-sellers", productSellersRouter);
app.use("/api/product-specs", productSpecsRouter);
app.use("/api/product-images", productImagesRouter);
app.use("/api/product-locations", productLocationsRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/chats", chatsRouter);
app.use("/api/otp", otpRouter);
app.use("/api/locations", locationRouter);
app.use("/api/gamification", gamificationRouter);
app.use("/api/admin", adminAuthRouter);
app.use("/api/admin/products", adminProductsRouter);
app.use("/api/admin/users", adminUsersRouter);
app.use("/api/admin/analytics", adminAnalyticsRouter);
app.use("/api/admin/reports", adminReportsRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  const isMySqlError = Boolean(err && (err.code || err.sqlMessage || err.sqlState));
  if (isMySqlError) {
    console.error("[MySQL Error]", {
      method: req.method,
      path: req.originalUrl,
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
      sqlMessage: err.sqlMessage,
      sql: err.sql,
    });
  } else {
    console.error("[Server Error]", {
      method: req.method,
      path: req.originalUrl,
      message: err?.message,
      stack: err?.stack,
    });
  }
  res.status(500).json({ error: "Server error" });
});

const PORT = process.env.PORT || 3000;

connectMongo();
startOTPCleanup(); // Start background cleanup job

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} → http://localhost:${PORT}`);
});

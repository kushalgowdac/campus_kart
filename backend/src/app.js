
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

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imagesPath = path.resolve(__dirname, "..", "..", "images");

app.use(cors());
app.use(express.json());
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

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

const PORT = process.env.PORT || 3000;

connectMongo();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} → http://localhost:${PORT}`);
});

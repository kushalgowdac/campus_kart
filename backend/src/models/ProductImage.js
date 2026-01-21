import mongoose from "mongoose";

const ProductImageSchema = new mongoose.Schema(
  {
    productId: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    caption: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("ProductImage", ProductImageSchema);

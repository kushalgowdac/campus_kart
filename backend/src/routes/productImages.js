import { Router } from "express";
import {
  listImages,
  createImage,
  deleteImage,
} from "../controllers/imagesController.js";

const router = Router();

router.get("/", listImages);
router.post("/", createImage);
router.delete("/:pid/:img_url", deleteImage);

export default router;

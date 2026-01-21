import { Router } from "express";
import { listImages, createImage } from "../controllers/imagesController.js";

const router = Router();

router.get("/", listImages);
router.post("/", createImage);

export default router;

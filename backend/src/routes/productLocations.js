import { Router } from "express";
import {
  listProductLocations,
  createProductLocation,
  deleteProductLocation,
} from "../controllers/productLocationsController.js";

const router = Router();

router.get("/", listProductLocations);
router.post("/", createProductLocation);
router.delete("/:pid/:location", deleteProductLocation);

export default router;

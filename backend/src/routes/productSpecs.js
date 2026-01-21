import { Router } from "express";
import {
  listProductSpecs,
  createProductSpec,
  deleteProductSpec,
} from "../controllers/productSpecsController.js";

const router = Router();

router.get("/", listProductSpecs);
router.post("/", createProductSpec);
router.delete("/:pid/:spec_name", deleteProductSpec);

export default router;

import { Router } from "express";
import { listChats, createChat } from "../controllers/chatsController.js";

const router = Router();

router.get("/", listChats);
router.post("/", createChat);

export default router;

import mongoose from "mongoose";
import ChatMessage from "../models/ChatMessage.js";

const ensureMongo = (res) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ error: "MongoDB not connected" });
    return false;
  }
  return true;
};

export const listChats = async (req, res, next) => {
  try {
    if (!ensureMongo(res)) return;
    const { fromUserId, toUserId, productId } = req.query;
    const filter = {};
    if (fromUserId) filter.fromUserId = Number(fromUserId);
    if (toUserId) filter.toUserId = Number(toUserId);
    if (productId) filter.productId = Number(productId);

    const messages = await ChatMessage.find(filter).sort({ createdAt: 1 }).lean();
    res.json(messages);
  } catch (err) {
    next(err);
  }
};

export const createChat = async (req, res, next) => {
  try {
    if (!ensureMongo(res)) return;
    const { fromUserId, toUserId, message, productId } = req.body;
    if (!fromUserId || !toUserId || !message) {
      return res
        .status(400)
        .json({ error: "fromUserId, toUserId, message required" });
    }

    const doc = await ChatMessage.create({
      fromUserId,
      toUserId,
      message,
      productId,
    });

    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
};

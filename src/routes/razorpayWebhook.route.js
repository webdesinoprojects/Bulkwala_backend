import express from "express";
import { razorpayWebhook } from "../controllers/razorpay.webhook.controller.js";

const router = express.Router();

// ⚠️ Must use express.raw() before express.json() to verify signature
router.post(
  "/razorpay-webhook",
  express.raw({ type: "application/json" }),
  razorpayWebhook
);

export default router;

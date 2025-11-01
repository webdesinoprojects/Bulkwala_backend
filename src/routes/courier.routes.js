import express from "express";
import { delhiveryWebhook } from "../controllers/delhivery.webhook.controller.js";

const router = express.Router();

// must accept raw/json; keep body small
router.post(
  "/order/delhivery-webhook",
  express.json({ limit: "1mb" }),
  delhiveryWebhook
);

export default router;

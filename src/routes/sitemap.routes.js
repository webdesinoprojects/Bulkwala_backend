import express from "express";
import { generateSitemap } from "../controllers/sitemap.controller.js";

const router = express.Router();

// GET /sitemap.xml
router.route("/sitemap.xml").get(generateSitemap);

export default router;

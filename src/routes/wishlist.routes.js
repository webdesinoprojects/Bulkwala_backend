import express from "express";
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  clearWishlist,
} from "../controllers/wishlist.controller.js";
import { isLoggedIn } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(isLoggedIn);

router.route("/").get(getWishlist).post(addToWishlist);
router.route("/:productId").delete(removeFromWishlist);
router.route("/clear").delete(clearWishlist);

export default router;

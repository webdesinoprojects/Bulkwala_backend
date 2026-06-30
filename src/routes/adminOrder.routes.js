import express from "express";
import { validateData } from "../middleware/validate.js";
import {
  isAdmin,
  isAdminOrSeller,
  isLoggedIn,
} from "../middleware/auth.middleware.js";
import { updateOrderStatusSchema } from "../validators/order.schema.js";
import {
  downloadShippingLabel,
  getAllOrders,
  retryShipment,
  syncOrderFromCourier,
  updateOrderStatus,
  updatePaymentStatus,
} from "../controllers/order.controller.js";

const router = express.Router();

router.route("/").get(isLoggedIn, isAdminOrSeller, getAllOrders);

router
  .route("/:orderId/status")
  .patch(
    isLoggedIn,
    isAdminOrSeller,
    validateData(updateOrderStatusSchema),
    updateOrderStatus
  );

router
  .route("/:orderId/payment-status")
  .patch(isLoggedIn, isAdminOrSeller, updatePaymentStatus);

router.route("/:orderId/sync").post(isLoggedIn, isAdmin, syncOrderFromCourier);

router
  .route("/:orderId/retry-shipment")
  .post(isLoggedIn, isAdmin, retryShipment);

router.route("/:orderId/label").get(isLoggedIn, isAdmin, downloadShippingLabel);

export default router;

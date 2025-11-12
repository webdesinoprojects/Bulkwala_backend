import express from "express";
import { validateData } from "../middleware/validate.js";
import {
  createOrderSchema,
  updateOrderStatusSchema,
  verifyPaymentStatusSchema,
} from "../validators/order.schema.js";
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  getSingleOrder,
  updateOrderStatus,
  cancelOrder,
  updatePaymentStatus,
  verifyRazorpayPayment,
  trackOrder,
  syncOrderFromCourier,
  delhiveryWebhook,
  razorpayWebhook,
  retryShipment,
  downloadShippingLabel,
} from "../controllers/order.controller.js";
import {
  isLoggedIn,
  isAdminOrSeller,
  isCustomer,
  isAdmin,
} from "../middleware/auth.middleware.js";

const router = express.Router();

router
  .route("/")
  .post(isLoggedIn, isCustomer, validateData(createOrderSchema), createOrder);

router.route("/my-orders").get(isLoggedIn, isCustomer, getMyOrders);

router.route("/:orderId/cancel").post(isLoggedIn, isCustomer, cancelOrder);

router.route("/").get(isLoggedIn, isAdminOrSeller, getAllOrders);

router.route("/:orderId").get(isLoggedIn, isCustomer, getSingleOrder);

router.route("/track/:orderId").get(isLoggedIn, trackOrder);

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

router
  .route("/verify-payment")
  .post(
    isLoggedIn,
    validateData(verifyPaymentStatusSchema),
    verifyRazorpayPayment
  );
router
  .route("/:orderId/sync-shipment")
  .post(isLoggedIn, isAdmin, syncOrderFromCourier);

router
  .route("/:orderId/retry-shipment")
  .post(isLoggedIn, isAdmin, retryShipment);

router
  .route("/:orderId/shipping-label")
  .get(isLoggedIn, isAdmin, downloadShippingLabel);

// 🔔 Webhooks (public, no auth)
router.route("/webhook/delhivery").post(
  express.json({ type: "*/*" }), // Delhivery: normal JSON
  delhiveryWebhook
);

router.route("/webhook/razorpay").post(
  express.raw({ type: "application/json" }), // Razorpay: RAW body required
  razorpayWebhook
);

export default router;

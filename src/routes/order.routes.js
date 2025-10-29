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
} from "../controllers/order.controller.js";
import {
  isLoggedIn,
  isAdminOrSeller,
  isCustomer,
} from "../middleware/auth.middleware.js";

const router = express.Router();

router
  .route("/")
  .post(isLoggedIn, isCustomer, validateData(createOrderSchema), createOrder);

router.route("/my-orders").get(isLoggedIn, isCustomer, getMyOrders);

router.route("/:orderId/cancel").post(isLoggedIn, isCustomer, cancelOrder);

router.route("/").get(isLoggedIn, isAdminOrSeller, getAllOrders);

router.route("/:orderId").get(isLoggedIn, isCustomer, getSingleOrder);

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

export default router;

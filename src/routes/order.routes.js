import express from "express";
import { validateData } from "../middlewares/validateData.js";
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from "../validators/order.schema.js";
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  getSingleOrder,
  updateOrderStatus,
  cancelOrder,
} from "../controllers/order.controller.js";
import {
  isLoggedIn,
  isAdminOrSeller,
  isCustomer,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router
  .route("/")
  .post(isLoggedIn, isCustomer, validateData(createOrderSchema), createOrder);

router.route("/my-orders").get(isLoggedIn, isCustomer, getMyOrders);

router.route("/:orderId/cancel").post(isLoggedIn, isCustomer, cancelOrder);

router.route("/").get(isLoggedIn, isAdminOrSeller, getAllOrders);

router.route("/:orderId").get(isLoggedIn, isAdminOrSeller, getSingleOrder);

router
  .route("/:orderId/status")
  .patch(
    isLoggedIn,
    isAdminOrSeller,
    validateData(updateOrderStatusSchema),
    updateOrderStatus
  );

export default router;

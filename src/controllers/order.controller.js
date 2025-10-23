import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { orderStatusEnum, paymentStatusEnum } from "../utils/constant.js";
import Payment from "../models/payment.model.js";
import razorpayInstance from "../utils/razorpay.js";
import crypto from "crypto";

const createOrder = asyncHandler(async (req, res) => {
  const { products, shippingAddress, paymentMode } = req.body;

  // validate products exist & fetch their prices
  const productIds = products.map((p) => p.product);
  const dbProducts = await Product.find({ _id: { $in: productIds } });

  if (dbProducts.length !== productIds.length) {
    throw new ApiError(400, "One or more products not found");
  }

  // prepare products array with priceAtPurchase
  const finalProducts = products.map((item) => {
    const dbProduct = dbProducts.find(
      (p) => p._id.toString() === item.product.toString()
    );
    if (!dbProduct) {
      throw new ApiError(400, `Product ${item.product} not found`);
    }
    if (dbProduct.stock < item.quantity) {
      throw new ApiError(
        400,
        `Not enough stock for ${dbProduct.title}. Available: ${dbProduct.stock}`
      );
    }
    return {
      product: dbProduct._id,
      quantity: item.quantity,
      priceAtPurchase: dbProduct.discountPrice || dbProduct.price,
    };
  });

  const order = await Order.create({
    products: finalProducts,
    user: req.user._id,
    shippingAddress,
    paymentMode,
    paymentStatus:
      paymentMode === "cod"
        ? paymentStatusEnum.PENDING
        : paymentStatusEnum.PENDING,
  });

  // ↓↓↓ CASE 1 → CASH ON DELIVERY ↓↓↓
  if (paymentMode === "COD") {
    // Reduce stock immediately
    for (const item of finalProducts) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }
    return res
      .status(201)
      .json(new ApiResponse(201, order, "COD order placed successfully"));
  }

  // ↓↓↓ CASE 2 → ONLINE / NETBANKING ↓↓↓
  const options = {
    amount: Math.round(order.totalPrice * 100),
    currency: "INR",
    receipt: `order_rcpt_${order._id}`,
  };

  const razorOrder = await razorpayInstance.orders.create(options);

  await Payment.create({
    orderId: order._id,
    razorpayOrderId: razorOrder.id,
    amount: order.totalPrice,
    currency: "INR",
    status: paymentStatusEnum.PENDING,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        orderId: order._id,
        razorpayOrderId: razorOrder.id,
        amount: order.totalPrice,
        currency: "INR",
      },
      "Razorpay order created successfully"
    )
  );
});

const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, "Invalid payment signature");
  }

  const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
  if (!payment) throw new ApiError(404, "Payment record not found");

  payment.razorpayPaymentId = razorpay_payment_id;
  payment.razorpaySignature = razorpay_signature;
  payment.status = paymentStatusEnum.SUCCESS;
  await payment.save();

  await Order.findByIdAndUpdate(payment.orderId, {
    paymentStatus: paymentStatusEnum.SUCCESS,
    transactionId: razorpay_payment_id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, payment, "Payment verified successfully"));
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).populate(
    "products.product",
    "title images price"
  );
  return res
    .status(200)
    .json(new ApiResponse(200, orders, "User orders fetched successfully"));
});

const getAllOrders = asyncHandler(async (_req, res) => {
  const orders = await Order.find()
    .populate("user", "name email")
    .populate("products.product", "title price images");
  return res
    .status(200)
    .json(new ApiResponse(200, orders, "All orders fetched successfully"));
});

const getSingleOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId)
    .populate("user", "name email")
    .populate("products.product", "title price images");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Restrict: user can only see their own order unless admin
  if (
    req.user.role !== "admin" &&
    order.user._id.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, "Forbidden: Not allowed to view this order");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, order, "Order fetched successfully"));
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  order.status = status;

  if (status === orderStatusEnum.DELIVERED) {
    order.deliveredAt = Date.now();
  }

  if (status === orderStatusEnum.CANCELLED) {
    order.cancelledAt = Date.now();
    // restore stock
    for (const item of order.products) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }
  }

  await order.save();

  return res
    .status(200)
    .json(new ApiResponse(200, order, "Order status updated successfully"));
});

const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Only the owner can cancel their own order
  if (order.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Forbidden: Not allowed to cancel this order");
  }

  // Check if already delivered
  if (order.status === orderStatusEnum.DELIVERED) {
    throw new ApiError(400, "Cannot cancel a delivered order");
  }

  // Update status and restore stock
  order.status = orderStatusEnum.CANCELLED;
  order.cancelledAt = Date.now();

  for (const item of order.products) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity },
    });
  }

  await order.save();

  return res
    .status(200)
    .json(new ApiResponse(200, order, "Order cancelled successfully"));
});

const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { paymentStatus } = req.body;
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  order.paymentStatus = paymentStatus;

  await order.save();

  return res
    .status(200)
    .json(new ApiResponse(200, order, "Payment status updated successfully"));
});

export {
  createOrder,
  getMyOrders,
  getAllOrders,
  getSingleOrder,
  updateOrderStatus,
  cancelOrder,
  updatePaymentStatus,
  verifyRazorpayPayment,
};

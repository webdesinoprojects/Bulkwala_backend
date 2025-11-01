import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { orderStatusEnum, paymentStatusEnum } from "../utils/constant.js";
import Payment from "../models/payment.model.js";
import razorpayInstance from "../utils/razorpay.js";
import crypto from "crypto";
import Cart from "../models/cart.model.js";
import { createShipment, trackShipment } from "../utils/delhivery.js";

const createOrder = asyncHandler(async (req, res) => {
  const { paymentMode, shippingAddress } = req.body;
  const userId = req.user._id;

  if (!shippingAddress || Object.keys(shippingAddress).length === 0) {
    throw new ApiError(400, "Shipping address is required");
  }

  const cart = await Cart.findOne({ user: userId }).populate(
    "items.product",
    "title price"
  );

  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Your cart is empty");
  }

  // Calculate the prices manually
  const itemsPrice = cart.items.reduce((acc, item) => {
    const price = item.product?.price || 0;
    return acc + price * item.quantity;
  }, 0);

  const shippingPrice = itemsPrice > 1000 ? 0 : 50;
  const taxPrice = itemsPrice * 0.18;
  const totalPrice = itemsPrice + shippingPrice + taxPrice;

  // Create the final products array
  const finalProducts = cart.items.map((item) => {
    const product = item.product._id;
    const quantity = item.quantity;
    const priceAtPurchase = item.product.price;

    return { product, quantity, priceAtPurchase };
  });

  // ↓↓↓ CASE 1 → CASH ON DELIVERY ↓↓↓
  if (paymentMode === "cod") {
    const order = await Order.create({
      products: finalProducts,
      user: userId,
      shippingAddress,
      paymentMode,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      paymentStatus: paymentStatusEnum.PENDING,
    });

    const shipmentData = await createShipment(order);
    if (
      shipmentData &&
      shipmentData.packages &&
      shipmentData.packages.length > 0
    ) {
      const trackingId = shipmentData.packages[0].waybill;
      order.trackingId = trackingId;
      order.shipmentStatus = "Created";
      order.shipmentCreatedAt = new Date();
      await order.save();
    }

    // Reduce stock immediately
    for (const item of finalProducts) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }
    // Clear user cart
    await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } });

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          order,
          "COD order placed and shipment created successfully"
        )
      );
  }

  // ↓↓↓ CASE 2 → ONLINE / NETBANKING ↓↓↓
  const options = {
    amount: Math.round(totalPrice * 100),
    currency: "INR",
    receipt: `order_rcpt_${Date.now()}`,
  };

  const razorOrder = await razorpayInstance.orders.create(options);

  await Payment.create({
    user: userId,
    razorpayOrderId: razorOrder.id,
    amount: totalPrice,
    currency: "INR",
    status: paymentStatusEnum.PENDING,
    paymentMode,
    shippingAddress,
    products: finalProducts,
    itemsPrice,
    shippingPrice,
    taxPrice,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        razorpayOrderId: razorOrder.id,
        amount: totalPrice,
        currency: "INR",
      },
      "Razorpay order created successfully"
    )
  );
});

const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;
  console.log(
    "Incoming body for verification from order controller:",
    req.body
  );

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, "Invalid payment signature");
  }

  const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
  if (!payment) throw new ApiError(404, "Payment record not found");

  // Update payment info
  payment.razorpayPaymentId = razorpay_payment_id;
  payment.razorpaySignature = razorpay_signature;
  payment.status = paymentStatusEnum.SUCCESS;
  await payment.save();

  // ✅ Create actual order now
  const order = await Order.create({
    products: payment.products,
    user: payment.user,
    shippingAddress: payment.shippingAddress,
    paymentMode: payment.paymentMode,
    itemsPrice: payment.itemsPrice,
    shippingPrice: payment.shippingPrice,
    taxPrice: payment.taxPrice,
    totalPrice: payment.amount,
    paymentStatus: paymentStatusEnum.SUCCESS,
    transactionId: razorpay_payment_id,
  });
  // ✅ Link payment → order
  payment.orderId = order._id;
  await payment.save();

  const shipmentData = await createShipment(order);

  if (
    shipmentData &&
    shipmentData.packages &&
    shipmentData.packages.length > 0
  ) {
    const trackingId = shipmentData.packages[0].waybill;
    order.trackingId = trackingId;
    order.shipmentStatus = "Created";
    order.shipmentCreatedAt = new Date();
    await order.save();
  }

  // ✅ Reduce stock
  for (const item of payment.products) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity },
    });
  }

  // ✅ Clear cart
  await Cart.findOneAndUpdate({ user: payment.user }, { $set: { items: [] } });

  const populatedOrder = await Order.findById(order._id).populate(
    "products.product",
    "title price images"
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { populatedOrder, payment },
        "Payment verified and order created successfully"
      )
    );
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

const trackOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) throw new ApiError(404, "Order not found");
  if (!order.trackingId)
    throw new ApiError(404, "Tracking ID not available yet");

  const trackingData = await trackShipment(order.trackingId);

  return res
    .status(200)
    .json(
      new ApiResponse(200, trackingData, "Tracking data fetched successfully")
    );
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
  trackOrder,
};

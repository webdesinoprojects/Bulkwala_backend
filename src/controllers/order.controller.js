import crypto from "crypto";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { orderStatusEnum, paymentStatusEnum } from "../utils/constant.js";
import Payment from "../models/payment.model.js";
import razorpayInstance from "../utils/razorpay.js";
import Cart from "../models/cart.model.js";
import {
  createShipment,
  trackShipment,
  getShippingLabel,
} from "../utils/delhivery.js";
import { mapDelhiveryToOrderStatus } from "../utils/delhiveryStatusMap.js";
import Offer from "../models/offer.model.js";

const createOrder = asyncHandler(async (req, res) => {
  const { paymentMode, shippingAddress } = req.body;
  const userId = req.user._id;

  if (paymentMode !== "pickup") {
    if (!shippingAddress || Object.keys(shippingAddress).length === 0) {
      throw new ApiError(400, "Shipping address is required");
    }
  }

  const cart = await Cart.findOne({ user: userId }).populate(
    "items.product",
    "title price discountPrice stock isActive isDeleted"
  );

  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Your cart is empty");
  }

  // ✅ Validate all products exist, are active, and have sufficient stock
  const validItems = [];
  const invalidProducts = [];
  const priceChangedProducts = [];
  const outOfStockProducts = [];

  for (const item of cart.items) {
    const product = item.product;

    // Check if product exists
    if (!product) {
      invalidProducts.push({ productId: item.product?.toString() || "unknown", reason: "Product not found" });
      continue;
    }

    // Check if product is deleted or inactive
    if (product.isDeleted || !product.isActive) {
      invalidProducts.push({ productId: product._id.toString(), reason: "Product is no longer available" });
      continue;
    }

    // Check stock availability
    if (item.quantity > product.stock) {
      if (product.stock === 0) {
        outOfStockProducts.push({ productId: product._id.toString(), name: product.title, requested: item.quantity, available: 0 });
      } else {
        outOfStockProducts.push({ productId: product._id.toString(), name: product.title, requested: item.quantity, available: product.stock });
      }
      continue;
    }

    // ✅ Check if price has changed (compare with current price)
    const currentPrice = product.discountPrice && product.discountPrice > 0 
      ? product.discountPrice 
      : product.price;
    
    // Get price that was likely used in cart (we'll use current price, but flag if different)
    // Note: We don't store original cart price, so we'll use current price but could add warning
    validItems.push({
      ...item.toObject(),
      currentPrice,
    });
  }

  // ✅ Remove invalid products from cart
  if (invalidProducts.length > 0 || outOfStockProducts.length > 0) {
    cart.items = validItems.map(item => ({
      product: item.product._id,
      quantity: item.quantity
    }));
    await cart.save();
  }

  // ✅ Return error if no valid items remain
  if (validItems.length === 0) {
    let errorMessage = "Cannot place order: ";
    if (invalidProducts.length > 0) {
      errorMessage += `${invalidProducts.length} product(s) are no longer available. `;
    }
    if (outOfStockProducts.length > 0) {
      errorMessage += `${outOfStockProducts.length} product(s) are out of stock. `;
    }
    errorMessage += "Your cart has been updated. Please review and try again.";
    throw new ApiError(400, errorMessage);
  }

  // ✅ Warn about removed products (but continue with valid items)
  if (invalidProducts.length > 0 || outOfStockProducts.length > 0) {
    // We'll include this in the response message
  }

  // ✅ Calculate the prices manually using valid items
  const itemsPrice = validItems.reduce((acc, item) => {
    const price = item.currentPrice || 0;
    return acc + price * item.quantity;
  }, 0);

  let shippingPrice = itemsPrice > 297 ? 0 : 50;
  let totalPrice = itemsPrice + shippingPrice;

  // ✅ Collect all active discounts
  const couponDiscount = cart.discount || 0;
  const referralDiscount = cart.referralDiscount || 0;

  // ✅ Flash Offer (dynamic)
  const activeOffer = await Offer.findOne({ isActive: true });
  let flashDiscount = 0;
  let flashDiscountPercent = 0;
  if (activeOffer && activeOffer.expiresAt > Date.now()) {
    flashDiscountPercent = activeOffer.discountPercent;
    const rawDiscount = (totalPrice * flashDiscountPercent) / 100;
    flashDiscount = Math.min(
      rawDiscount,
      activeOffer.maxDiscountAmount || rawDiscount
    );
  }

  // ✅ Prepaid discount for all online payment modes (card, upi, netbanking, online)
  const onlinePaymentModes = ["card", "upi", "netbanking", "online"];
  const prepaidDiscount = onlinePaymentModes.includes(paymentMode) ? 30 : 0;

  // ✅ Combine all discounts
  const totalDiscount =
    couponDiscount + referralDiscount + flashDiscount + prepaidDiscount;

  // ✅ If pickup → no shipping
  if (paymentMode === "pickup") {
    shippingPrice = 0;
  }

  totalPrice = Math.max(itemsPrice + shippingPrice - totalDiscount, 0);

  // ✅ Create the final products array from valid items
  const finalProducts = validItems.map((item) => {
    const product = item.product._id;
    const quantity = item.quantity;
    const priceAtPurchase = item.currentPrice || 0;

    return { product, quantity, priceAtPurchase };
  });

  // ↓↓↓ CASE 0 → PICKUP FROM STORE ↓↓↓
  if (paymentMode === "pickup") {
    const order = await Order.create({
      products: finalProducts,
      user: userId,
      shippingAddress,
      paymentMode,
      itemsPrice,
      shippingPrice: 0,
      couponDiscount,
      referralDiscount,
      flashDiscount,
      flashDiscountPercent,
      prepaidDiscount: 0,
      totalPrice,
      paymentStatus: paymentStatusEnum.PENDING,
      status: orderStatusEnum.PROCESSING,
      deliveredAt: new Date(),
    });

    // ✅ Reduce stock
    for (const item of finalProducts) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // ✅ Clear cart
    await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } });

    const populatedOrder = await Order.findById(order._id).populate(
      "products.product",
      "title sku price discountPrice gstSlab images"
    );

    // ✅ Include warning message if products were removed
    let message = "Pickup order placed successfully";
    if (invalidProducts.length > 0 || outOfStockProducts.length > 0) {
      message += `. Note: ${invalidProducts.length + outOfStockProducts.length} product(s) were removed from your cart as they are no longer available.`;
    }

    return res
      .status(201)
      .json(
        new ApiResponse(201, populatedOrder, message)
      );
  }

  // ↓↓↓ CASE 1 → CASH ON DELIVERY ↓↓↓
  if (paymentMode === "cod") {
    const order = await Order.create({
      products: finalProducts,
      user: userId,
      shippingAddress,
      paymentMode,
      itemsPrice,
      shippingPrice,
      couponDiscount,
      referralDiscount,
      flashDiscount,
      flashDiscountPercent,
      prepaidDiscount: 0,
      totalPrice,
      paymentStatus: paymentStatusEnum.PENDING,
      status: orderStatusEnum.PROCESSING,
    });

    const shipmentData = await createShipment(order);
    if (shipmentData?.packages?.length > 0) {
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

    const populatedOrder = await Order.findById(order._id).populate(
      "products.product",
      "title sku price discountPrice gstSlab images"
    );

    // ✅ Include warning message if products were removed
    let message = "COD order placed and shipment created successfully";
    if (invalidProducts.length > 0 || outOfStockProducts.length > 0) {
      message += `. Note: ${invalidProducts.length + outOfStockProducts.length} product(s) were removed from your cart as they are no longer available.`;
    }

    return res
      .status(201)
      .json(
        new ApiResponse(201, populatedOrder, message)
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
    couponDiscount,
    referralDiscount,
    flashDiscount,
    flashDiscountPercent,
    prepaidDiscount,
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
  if (process.env.NODE_ENV === "development") {
    console.log(
      "Incoming body for verification from order controller:",
      req.body
    );
  }

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
    couponDiscount: payment.couponDiscount || 0,
    referralDiscount: payment.referralDiscount || 0,
    flashDiscount: payment.flashDiscount || 0,
    flashDiscountPercent: payment.flashDiscountPercent || 0,
    prepaidDiscount: payment.prepaidDiscount || 0,
    totalPrice: payment.amount,
    paymentStatus: paymentStatusEnum.SUCCESS,
    transactionId: razorpay_payment_id,
    status: orderStatusEnum.PROCESSING,
  });
  // ✅ Link payment → order
  payment.orderId = order._id;
  await payment.save();

  let shipmentData = null;
  try {
    shipmentData = await createShipment(order);
    if (shipmentData?.packages?.length > 0) {
      const trackingId = shipmentData.packages[0].waybill;
      order.trackingId = trackingId;
      order.shipmentStatus = "Created";
      order.shipmentCreatedAt = new Date();
    } else {
      order.shipmentStatus = "Error: No waybill returned";
    }
  } catch (err) {
    console.error("Delhivery shipment creation failed:", err.message);
    order.shipmentStatus = "Error: Shipment not created";
  }
  await order.save();

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
    "title sku price discountPrice gstSlab images"
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
    "title sku price discountPrice gstSlab images"
  );

  return res
    .status(200)
    .json(new ApiResponse(200, orders, "User orders fetched successfully"));
});

const getAllOrders = asyncHandler(async (_req, res) => {
  const orders = await Order.find()
    .populate("user", "name email")
    .populate(
      "products.product",
      "title sku price discountPrice gstSlab images"
    )
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, orders, "All orders fetched successfully"));
});

const getSingleOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId)
    .populate("user", "name email")
    .populate("products.product", "title price discountPrice images");

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

  // ❌ Already cancelled → cannot cancel again
  if (order.status === orderStatusEnum.CANCELLED) {
    throw new ApiError(400, "Order already cancelled");
  }

  // ❌ Already shipped → cannot cancel after pickup
  const nonCancellableShipmentStates = [
    "in transit",
    "out for delivery",
    "ofd",
    "picked up",
    "dispatched",
  ];

  if (
    order.status === orderStatusEnum.SHIPPED ||
    (order.shipmentStatus &&
      nonCancellableShipmentStates.some((state) =>
        order.shipmentStatus.toLowerCase().includes(state)
      ))
  ) {
    throw new ApiError(
      400,
      "Cannot cancel — order has already been shipped or handed over to courier"
    );
  }

  // ✅ Allow cancellation only if still in Processing
  if (order.status !== orderStatusEnum.PROCESSING) {
    throw new ApiError(
      400,
      "Cannot cancel — only processing orders can be cancelled"
    );
  }

  // ✅ Perform cancellation
  order.status = orderStatusEnum.CANCELLED;
  order.cancelledAt = Date.now();

  // ✅ Restore stock for each item
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

const syncOrderFromCourier = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) throw new ApiError(404, "Order not found");
  if (!order.trackingId) throw new ApiError(400, "No trackingId on order");

  const data = await trackShipment(order.trackingId);
  const shipment = data?.ShipmentData?.[0]?.Shipment;
  if (!shipment) {
    return res
      .status(200)
      .json(new ApiResponse(200, order, "No shipment in response"));
  }

  const raw = shipment?.Status?.Status || shipment?.Status || "Pending";
  const mapped = mapDelhiveryToOrderStatus(raw);
  order.shipmentStatus = raw;
  order.status = mapped;

  const lastScan = shipment?.Scans?.[shipment?.Scans.length - 1]?.ScanDetail;
  if (lastScan?.ScanDateTime)
    order.lastShipmentEventAt = new Date(lastScan.ScanDateTime);
  if (mapped === "Delivered" && !order.deliveredAt)
    order.deliveredAt = new Date();
  if (mapped === "Cancelled" && !order.cancelledAt)
    order.cancelledAt = new Date();

  await order.save();
  return res
    .status(200)
    .json(new ApiResponse(200, order, "Order synced with Delhivery"));
});

const retryShipment = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");

  // 🧩 Optional guard: Only retry if not already shipped
  if (order.trackingId && order.shipmentStatus === "Created") {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Shipment already exists"));
  }

  let shipmentData = null;
  try {
    shipmentData = await createShipment(order);

    if (shipmentData?.packages?.length > 0) {
      const trackingId = shipmentData.packages[0].waybill;
      order.trackingId = trackingId;
      order.shipmentStatus = "Created";
      order.shipmentCreatedAt = new Date();
      order.shipmentCreated = true;
      await order.save();

      return res
        .status(200)
        .json(new ApiResponse(200, order, "Shipment recreated successfully"));
    } else {
      order.shipmentStatus = "Error: No waybill returned";
      order.shipmentCreated = false;
      await order.save();
      throw new ApiError(500, "Shipment API returned invalid response");
    }
  } catch (err) {
    console.error("🚨 Retry shipment failed:", err.message);
    order.shipmentStatus = "Error: Shipment creation failed";
    order.shipmentCreated = false;
    await order.save();
    throw new ApiError(500, `Shipment retry failed: ${err.message}`);
  }
});

const delhiveryWebhook = asyncHandler(async (req, res) => {
  const token = req.headers["x-delhivery-webhook-token"];

  // 🛡️ Optional security check if you set DELHIVERY_WEBHOOK_TOKEN in .env
  if (!token || token !== process.env.DELHIVERY_WEBHOOK_TOKEN) {
    console.warn("⚠️ Unauthorized Delhivery webhook call");
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const body = req.body || {};
  if (process.env.NODE_ENV === "development") {
    console.log("📦 Delhivery Webhook Received:", JSON.stringify(body));
  }

  // Normalize structure (Delhivery payloads vary a lot)
  const shipment =
    body?.Shipment ||
    body?.shipment ||
    body?.payload?.Shipment ||
    body?.payload?.shipment ||
    null;

  const awb =
    shipment?.AWB ||
    shipment?.Waybill ||
    body?.AWB ||
    body?.Waybill ||
    body?.waybill;

  const rawStatus =
    shipment?.Status?.Status ||
    shipment?.Status ||
    body?.Status ||
    body?.status ||
    "";

  const scanTime =
    shipment?.ScanDetail?.ScanDateTime ||
    body?.ScanDetail?.ScanDateTime ||
    body?.event_time ||
    null;

  if (!awb) {
    console.warn("⚠️ Webhook missing AWB/Waybill");
    return res.status(400).json({ success: false, message: "No AWB/Waybill" });
  }

  const order = await Order.findOne({ trackingId: awb });
  if (!order) {
    console.warn("⚠️ Order not found for waybill:", awb);
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  const mapped = mapDelhiveryToOrderStatus(rawStatus);

  // Idempotent update: only save if status changed
  if (order.status !== mapped || order.shipmentStatus !== rawStatus) {
    order.shipmentStatus = rawStatus || order.shipmentStatus;
    order.status = mapped;

    if (mapped === "Delivered" && !order.deliveredAt)
      order.deliveredAt = new Date();
    if (mapped === "Cancelled" && !order.cancelledAt)
      order.cancelledAt = new Date();
    if (scanTime) order.lastShipmentEventAt = new Date(scanTime);

    await order.save();
    if (process.env.NODE_ENV === "development") {
      console.log(`✅ Order ${order._id} updated → ${mapped} (${rawStatus})`);
    }
  } else {
    if (process.env.NODE_ENV === "development") {
      console.log(`ℹ️ No status change for ${awb} (${rawStatus})`);
    }
  }

  return res.status(200).json({ success: true });
});

const razorpayWebhook = asyncHandler(async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];
  const body = JSON.stringify(req.body);

  // ✅ Verify webhook signature
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  if (expectedSignature !== signature) {
    console.warn("⚠️ Invalid Razorpay signature");
    return res
      .status(400)
      .json({ success: false, message: "Invalid signature" });
  }

  const event = req.body.event;
  const paymentEntity = req.body.payload?.payment?.entity;

  if (!paymentEntity) {
    console.warn("⚠️ Missing payment entity in webhook");
    return res.status(200).json({ success: true });
  }

  const razorpayOrderId = paymentEntity.order_id;
  const razorpayPaymentId = paymentEntity.id;
  const paymentStatus = paymentEntity.status;

  if (process.env.NODE_ENV === "development") {
    console.log("💳 Webhook Event:", event, "| Status:", paymentStatus);
  }

  const payment = await Payment.findOne({ razorpayOrderId });
  if (!payment) {
    console.warn("⚠️ Payment not found for Razorpay Order:", razorpayOrderId);
    return res
      .status(404)
      .json({ success: false, message: "Payment not found" });
  }

  // 🔁 Map Razorpay → internal enum
  let mappedStatus = paymentStatusEnum.PENDING;
  if (paymentStatus === "captured") mappedStatus = paymentStatusEnum.SUCCESS;
  else if (paymentStatus === "failed") mappedStatus = paymentStatusEnum.FAILED;
  else if (paymentStatus === "refunded")
    mappedStatus = paymentStatusEnum.REFUNDED;

  // ✅ Update Payment
  payment.status = mappedStatus;
  payment.razorpayPaymentId = razorpayPaymentId;
  await payment.save();

  // ✅ Update linked Order (by orderId or fallback by transactionId)
  let order = null;
  if (payment.orderId) {
    order = await Order.findById(payment.orderId);
  } else {
    order = await Order.findOne({ transactionId: razorpayPaymentId });
  }

  if (order) {
    order.paymentStatus = mappedStatus;
    await order.save();
    if (process.env.NODE_ENV === "development") {
      console.log(`✅ Order ${order._id} payment → ${mappedStatus}`);
    }
  } else {
    if (process.env.NODE_ENV === "development") {
      console.log("ℹ️ No order linked to this payment yet");
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`✅ Razorpay Webhook processed: ${mappedStatus}`);
  }
  return res.status(200).json({ success: true });
});

const downloadShippingLabel = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");
  if (!order.trackingId)
    throw new ApiError(400, "No tracking ID for this order");

  const pdfBuffer = await getShippingLabel(order.trackingId);

  if (!pdfBuffer) {
    throw new ApiError(
      400,
      "Label not available yet — shipment not picked or token invalid."
    );
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename=Label_${order.trackingId}.pdf`
  );
  res.send(pdfBuffer);
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
  syncOrderFromCourier,
  retryShipment,
  delhiveryWebhook,
  razorpayWebhook,
  downloadShippingLabel,
};

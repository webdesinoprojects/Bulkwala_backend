import crypto from "crypto";
import Payment from "../models/payment.model.js";
import Order from "../models/order.model.js";
import { paymentStatusEnum } from "../utils/constant.js";

export const razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];
    const body = JSON.stringify(req.body);

    // ✅ Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    const event = req.body.event;
    const paymentEntity = req.body.payload?.payment?.entity;

    if (!paymentEntity) return res.status(200).json({ success: true });

    const razorpayOrderId = paymentEntity.order_id;
    const razorpayPaymentId = paymentEntity.id;
    const paymentStatus = paymentEntity.status;

    console.log("📦 Webhook Event:", event, "Status:", razorpayStatus);

    // Find corresponding Payment & Order
    const payment = await Payment.findOne({ razorpayOrderId });
    if (!payment) {
      console.warn("⚠️ Payment not found for Razorpay Order:", razorpayOrderId);

      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }
    // let order = null;
    // if (payment.orderId) order = await Order.findById(payment.orderId);

    // 🔁 Map Razorpay status → your enums
    let mappedStatus = paymentStatusEnum.PENDING;
    if (razorpayStatus === "captured") mappedStatus = paymentStatusEnum.SUCCESS;
    else if (razorpayStatus === "failed")
      mappedStatus = paymentStatusEnum.FAILED;
    else if (razorpayStatus === "refunded")
      mappedStatus = paymentStatusEnum.REFUNDED;

    // ✅ Update Payment model
    payment.status = mappedStatus;
    payment.razorpayPaymentId = razorpayPaymentId;
    await payment.save();

    // ✅ If corresponding order exists → update it too
    if (payment.orderId) {
      const order = await Order.findById(payment.orderId);
      if (order) {
        order.paymentStatus = mappedStatus;
        await order.save();
      }
    }

    console.log(`✅ Webhook processed successfully: ${mappedStatus}`);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Razorpay Webhook Error:", error.message);
    return res.status(500).json({ success: false });
  }
};

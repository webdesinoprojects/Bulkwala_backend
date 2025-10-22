import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

// ✅ Create Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// 1️⃣ Create Order API
export const createOrder = async (req, res) => {
  try {
    const { amount, paymentMode } = req.body;

    if (paymentMode === "cod") {
      return res.json({
        success: true,
        message: "COD selected. Proceed to place order directly.",
      });
    }

    // For Online or Netbanking (both Razorpay)
    const options = {
      amount: amount * 100, // in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
};

// 2️⃣ Verify Payment Signature
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      res.json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Verification failed" });
  }
};

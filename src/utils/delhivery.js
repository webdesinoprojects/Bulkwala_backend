// utils/delhivery.js
import axios from "axios";
import qs from "qs";

const DELHIVERY_API_URL = process.env.DELHIVERY_API_URL;
const DELHIVERY_TOKEN = process.env.DELHIVERY_API_TOKEN;
const DELHIVERY_PICKUP_NAME = process.env.DELHIVERY_PICKUP_NAME;

// 🔹 1. Check Pincode Serviceability
export const checkServiceability = async (pincode) => {
  try {
    const res = await axios.get(
      `https://track.delhivery.com/c/api/pin-codes/json/?filter_codes=${pincode}`,
      {
        headers: { Authorization: `Token ${DELHIVERY_TOKEN}` },
      }
    );
    return res.data;
  } catch (error) {
    console.error("Delhivery serviceability check failed:", error.message);
    return null;
  }
};

// 🔹 2. Create Shipment → Generates Tracking ID (waybill)

export const createShipment = async (order) => {
  try {
    const payload = {
      format: "json",
      data: JSON.stringify({
        shipments: [
          {
            add: order.shippingAddress.street,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            country: order.shippingAddress.country || "India",
            name: order.shippingAddress.name,
            phone: order.shippingAddress.phone,
            pin: order.shippingAddress.postalCode,
            order: order._id.toString(),
            payment_mode: order.paymentMode === "cod" ? "COD" : "Prepaid",
            total_amount: order.totalPrice,
            cod_amount: order.paymentMode === "cod" ? order.totalPrice : 0,
            weight: 0.5,
            seller_inv: `INV-${Date.now()}`,
          },
        ],
        pickup_location: {
          name: DELHIVERY_PICKUP_NAME,
        },
      }),
    };

    console.log("📦 Final Delhivery Payload:", payload);

    const response = await axios.post(
      `${process.env.DELHIVERY_API_URL}/cmu/create.json`,
      qs.stringify(payload), // 👈 Convert to URL-encoded form
      {
        headers: {
          Authorization: `Token ${process.env.DELHIVERY_API_TOKEN}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log(
      "✅ Delhivery Response:",
      JSON.stringify(response.data, null, 2)
    );
    return response.data;
  } catch (error) {
    console.error(
      "❌ Delhivery shipment creation failed:",
      error.response?.data || error.message
    );
    return null;
  }
};

// 🔹 3. Track Shipment
export const trackShipment = async (waybill) => {
  try {
    const response = await axios.get(
      `${DELHIVERY_API_URL}/v1/packages/json/?waybill=${waybill}`,
      {
        headers: { Authorization: `Token ${DELHIVERY_TOKEN}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Delhivery tracking failed:", error.message);
    return null;
  }
};

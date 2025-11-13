import axios from "axios";
import qs from "qs";
import Order from "../models/order.model.js";

const DELHIVERY_API_URL = process.env.DELHIVERY_API_URL;
const DELHIVERY_TOKEN = process.env.DELHIVERY_API_TOKEN;
const DELHIVERY_PICKUP_NAME = process.env.DELHIVERY_PICKUP_NAME;

// 🧱 Create Shipment → Generates Tracking ID (Waybill)
export const createShipment = async (order) => {
  try {
    if (!order.products?.[0]?.product?.title) {
      order = await Order.findById(order._id).populate(
        "products.product",
        "title sku"
      );
    }

    // 🧾 Collect product info
    const productDetails = order.products
      .map((item) => {
        const prod = item.product || {};
        return `${prod.title || "Product"} (${prod.sku || "N/A"}) × ${
          item.quantity
        }`;
      })
      .join(", ");

    // ✅ Build payload
    const payload = {
      format: "json",
      data: JSON.stringify({
        shipments: [
          {
            // 🏠 Address
            add: `${order.shippingAddress.street} (Phone: ${order.shippingAddress.phone})`,
            city: order.shippingAddress.city.trim(),
            state: order.shippingAddress.state.trim(),
            country: order.shippingAddress.country || "India",
            name: order.shippingAddress.name.trim(),
            pin: order.shippingAddress.postalCode,

            // 🧾 Order info
            order: order._id.toString(),
            payment_mode:
              order.paymentMode?.toLowerCase() === "cod" ? "COD" : "Prepaid",
            total_amount: Number(order.totalPrice) || 0,
            cod_amount:
              order.paymentMode?.toLowerCase() === "cod"
                ? Number(order.totalPrice)
                : 0,
            seller_inv: `INV-${Date.now()}`,
            weight: 0.5, // default weight (KG)

            // ✔ PRODUCT DETAILS PROPER WAY
            product_description: productDetails.slice(0, 200),
            // ⭐ THE MAGIC FIELD → WILL SHOW ON LABEL
            client: productDetails.slice(0, 30),
          },
        ],

        pickup_location: {
          name: DELHIVERY_PICKUP_NAME,
        },
      }),
    };

    console.log("📦 Final Delhivery Payload:", payload);

    // ✅ Send to Delhivery
    const response = await axios.post(
      `${DELHIVERY_API_URL}/cmu/create.json`,
      qs.stringify(payload),
      {
        headers: {
          Authorization: `Token ${DELHIVERY_TOKEN}`,
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

// 🧭 Track Shipment
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

// 🧾 Fetch Shipping Label PDF
export const getShippingLabel = async (waybill) => {
  try {
    const url = `${DELHIVERY_API_URL}/p/packing_slip?wbns=${waybill}&pdf=true&pdf_size=A4`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Token ${DELHIVERY_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    const link =
      response.data?.pdf_download_link ||
      response.data?.pdf_url ||
      response.data?.packages?.[0]?.pdf_download_link ||
      response.data?.packages?.[0]?.pdf_url ||
      null;

    if (!link) {
      console.warn(
        "⚠️ No PDF link found in Delhivery response:",
        response.data
      );
      return null;
    }

    console.log("✅ Found label link:", link);

    const pdf = await axios.get(link, { responseType: "arraybuffer" });
    return pdf.data;
  } catch (error) {
    console.error(
      "❌ Delhivery label fetch failed:",
      error.response?.data || error.message
    );
    return null;
  }
};

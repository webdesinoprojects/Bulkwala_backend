import Order from "../models/order.model.js";
import { mapDelhiveryToOrderStatus } from "../utils/delhiveryStatusMap.js";

export const delhiveryWebhook = async (req, res) => {
  try {
    const token = req.headers["x-delhivery-webhook-token"];
    if (!token || token !== process.env.DELHIVERY_WEBHOOK_TOKEN) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const body = req.body || {};

    // Delhivery payloads vary; normalize the common shapes
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
      return res
        .status(400)
        .json({ success: false, message: "No AWB/Waybill" });
    }

    const order = await Order.findOne({ trackingId: awb });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const mapped = mapDelhiveryToOrderStatus(rawStatus);
    order.shipmentStatus = rawStatus || order.shipmentStatus;
    order.status = mapped;

    if (mapped === "Delivered" && !order.deliveredAt)
      order.deliveredAt = new Date();
    if (mapped === "Cancelled" && !order.cancelledAt)
      order.cancelledAt = new Date();
    if (scanTime) order.lastShipmentEventAt = new Date(scanTime);

    await order.save();
    return res.json({ success: true });
  } catch (e) {
    console.error("Delhivery webhook error:", e);
    return res.status(500).json({ success: false });
  }
};

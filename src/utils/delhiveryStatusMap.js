export function mapDelhiveryToOrderStatus(raw = "") {
  const s = (raw || "").toLowerCase();

  if (s.includes("delivered")) return "Delivered";
  if (s.includes("return") || s.includes("rto") || s.includes("ndr"))
    return "Cancelled";

  if (
    s.includes("in transit") ||
    s.includes("out for delivery") ||
    s.includes("ofd") ||
    s.includes("picked up") ||
    s.includes("dispatched")
  )
    return "Shipped";

  // ✅ Manifested = still processing
  if (s.includes("manifest") || s.includes("created")) return "Processing";

  if (s.includes("cancelled")) return "Cancelled";

  return "Processing";
}

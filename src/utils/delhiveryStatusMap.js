export function mapDelhiveryToOrderStatus(raw = "") {
  const s = (raw || "").toLowerCase();
  if (s.includes("delivered")) return "Delivered";
  if (s.includes("return") || s.includes("rto") || s.includes("ndr"))
    return "Cancelled"; // or "Returned" if you add it
  if (
    s.includes("out for delivery") ||
    s.includes("ofd") ||
    s.includes("in transit") ||
    s.includes("manifest")
  )
    return "Shipped";
  if (s.includes("cancelled")) return "Cancelled";
  return "Pending";
}

// ===== UNIVERSAL COOKIE HANDLER =====
export const getCookieOptions = (req) => {
  const isProd = process.env.NODE_ENV === "production";
  const origin = req.headers.origin || "";

  let domain = undefined;

  // Only set domain when frontend is bulkwala.com or www.bulkwala.com
  if (origin.includes("bulkwala.com") && !origin.includes("vercel.app")) {
    domain = ".bulkwala.com";
  }

  return {
    httpOnly: true,
    secure: isProd, // must be true on Render
    sameSite: "None", // required for cross-site cookies
    domain: domain, // only for bulkwala.com
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
};

export const userRoleEnum = {
  ADMIN: "admin",
  CUSTOMER: "customer",
  SELLER: "seller",
};

export const availableUserRoles = Object.values(userRoleEnum);

export const paymentModeEnum = {
  COD: "cod",
  NETBANKING: "netbanking",
  UPI: "upi",
  CARD: "card",
  ONLINE: "online",
  PICKUP: "pickup", // ✅ New mode added
};

export const availablePaymentModes = Object.values(paymentModeEnum);

export const orderStatusEnum = {
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  PROCESSING: "Processing",
  CANCELLED: "Cancelled",
};

export const availableOrderStatus = Object.values(orderStatusEnum);

export const paymentStatusEnum = {
  PENDING: "pending",
  SUCCESS: "success",
  FAILED: "failed",
  REFUNDED: "refunded",
};

export const availablePaymentStatus = Object.values(paymentStatusEnum);

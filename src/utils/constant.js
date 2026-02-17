// ===== UNIVERSAL COOKIE HANDLER =====
export const getCookieOptions = (req) => {
  const isProd = process.env.NODE_ENV === "production";
  const isIOS = req.headers["user-agent"]?.toLowerCase().includes("iphone") || 
                req.headers["user-agent"]?.toLowerCase().includes("ipad");

  // iOS has strict cookie policies, so we use less restrictive settings for iOS
  if (isIOS) {
    return {
      httpOnly: false, // Allow JS access for iOS fallback
      secure: isProd,
      sameSite: "Lax", // More permissive for iOS
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      domain: isProd ? ".bulkwala.com" : undefined, // Allow subdomain access in production
    };
  }

  return {
    httpOnly: true,
    secure: isProd, // required for SameSite=None
    sameSite: isProd ? "None" : "Lax", // Use None only in production for cross-site
    path: "/", // accessible everywhere
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    domain: isProd ? ".bulkwala.com" : undefined, // Allow subdomain access in production
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

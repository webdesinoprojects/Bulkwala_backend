// ===== BASE OPTIONS =====
const baseCookieOptions = {
  httpOnly: true,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ===== UNIVERSAL COOKIE HANDLER =====
export const getCookieOptions = (req) => {
  const isProduction = process.env.NODE_ENV === "production";

  // Detect localhost (dev mode)
  const isLocalhost =
    req.hostname === "localhost" ||
    req.hostname === "127.0.0.1" ||
    (req.headers.origin && req.headers.origin.includes("localhost"));

  // Detect HTTPS (proxy or direct)
  const isHTTPS =
    req.secure ||
    req.headers["x-forwarded-proto"] === "https" ||
    req.headers["x-forwarded-ssl"] === "on";

  // Detect cross-origin (prod only)
  const frontendURL = process.env.FRONTEND_URL;
  let isCrossOrigin = false;

  if (isProduction && frontendURL && req.headers.origin) {
    try {
      const frontendHost = new URL(frontendURL.split(",")[0].trim()).hostname;
      const originHost = new URL(req.headers.origin).hostname;
      isCrossOrigin = frontendHost !== originHost;
    } catch (e) {
      isCrossOrigin = false;
    }
  }

  // ===== LOCALHOST LOGIC =====
  // Localhost CANNOT use secure:true or sameSite:none
  if (isLocalhost) {
    return {
      ...baseCookieOptions,
      secure: false,
      sameSite: "lax",
    };
  }

  // ===== PRODUCTION LOGIC =====
  return {
    ...baseCookieOptions,
    secure: isHTTPS || isCrossOrigin || isProduction, // must be true in production
    sameSite: isCrossOrigin ? "none" : "lax",
  };
};

// ===== LEGACY EXPORT (optional fallback) =====
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
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

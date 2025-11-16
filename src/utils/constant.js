// ✅ Base cookie options
const baseCookieOptions = {
  httpOnly: true,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ✅ Function to get Safari-compatible cookie options based on request
export const getCookieOptions = (req) => {
  const isProduction = process.env.NODE_ENV === 'production';
  // Check if request is over HTTPS (via proxy or direct)
  const isHTTPS = req.secure || req.headers['x-forwarded-proto'] === 'https' || req.headers['x-forwarded-ssl'] === 'on';
  
  // Check if frontend and backend are on different domains (cross-origin)
  const frontendURL = process.env.FRONTEND_URL;
  let isCrossOrigin = false;
  
  if (isProduction && frontendURL && req.headers.origin) {
    try {
      const frontendHost = new URL(frontendURL.split(',')[0].trim()).hostname;
      const originHost = new URL(req.headers.origin).hostname;
      isCrossOrigin = frontendHost !== originHost;
    } catch (e) {
      // If URL parsing fails, assume same-origin
      isCrossOrigin = false;
    }
  }
  
  // ✅ Safari requirements:
  // - If sameSite: "none", secure MUST be true
  // - For cross-origin requests, use "none"
  // - For same-origin, use "lax" (better security)
  const sameSite = isCrossOrigin ? 'none' : 'lax';
  const secure = isCrossOrigin || isHTTPS || isProduction;
  
  return {
    ...baseCookieOptions,
    secure,
    sameSite,
  };
};

// ✅ Legacy export for backward compatibility (uses lax, secure based on env)
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production' || process.env.SECURE_COOKIES === 'true',
  sameSite: process.env.NODE_ENV === 'production' && 
            process.env.FRONTEND_URL && 
            !process.env.FRONTEND_URL.includes('localhost')
    ? 'none'
    : 'lax',
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

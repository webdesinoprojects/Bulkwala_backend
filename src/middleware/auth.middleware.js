import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { userRoleEnum } from "../utils/constant.js";
const isLoggedIn = async (req, _res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return next(new ApiError(401, "Unauthorized"));
    }

    let decoded;
    try {
      decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
      // JWT expired OR malformed → allow frontend to refresh
      return next(new ApiError(401, "Unauthorized"));
    }

    req.user = decoded;
    next();
  } catch (error) {
    return next(new ApiError(401, "Unauthorized Access"));
  }
};

const isAdmin = async (req, _res, next) => {
  if (req.user.role !== userRoleEnum.ADMIN) {
    return next(new ApiError(403, "Forbidden Access denied!"));
  }
  next();
};

const isSeller = async (req, _res, next) => {
  if (req.user.role !== userRoleEnum.SELLER) {
    return next(new ApiError(403, "Forbidden Access denied!"));
  }
  next();
};

const isAdminOrSeller = (req, _res, next) => {
  if (
    req.user.role === userRoleEnum.ADMIN ||
    req.user.role === userRoleEnum.SELLER
  ) {
    return next();
  }
  return next(new ApiError(403, "Forbidden Access"));
};

const isCustomer = (req, _res, next) => {
  if (req.user.role !== userRoleEnum.CUSTOMER) {
    return next(new ApiError(403, "Forbidden: Only customers allowed"));
  }
  next();
};

export { isLoggedIn, isAdmin, isSeller, isAdminOrSeller, isCustomer };

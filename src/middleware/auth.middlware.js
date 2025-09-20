import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { userRoleEnum } from "../utils/constant.js";
const isLoggedIn = async (req, _res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return next(new ApiError(401, "Unauthorized"));
    }

    const decodeToken = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );
    req.user = decodeToken;
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

export { isLoggedIn, isAdmin, isSeller };

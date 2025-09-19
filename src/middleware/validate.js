import { ApiError } from "../utils/ApiError.js";

export const validateData = (schema) => {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (result.success) {
      req.body = result.data;
      next();
    } else {
      next(
        new ApiError(400, "Invalid data", result.error.flatten().fieldErrors)
      );
    }
  };
};

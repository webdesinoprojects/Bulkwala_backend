import { ApiError } from "../utils/ApiError.js";

export const validateData = (schema) => {
  return (req, _res, next) => {
    console.log("Incoming body for validation:", req.body);

    const result = schema.safeParse(req.body);

    if (result.success) {
      req.body = result.data;
      next();
    } else {
        console.error("Validation failed:", result.error.flatten().fieldErrors); 

      next(
        new ApiError(400, "Invalid data", result.error.flatten().fieldErrors)
      );
    }
  };
};

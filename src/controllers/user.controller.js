import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const existinguser = await User.findOne({ email });

  if (existinguser) {
    throw new ApiError(400, "User already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, user, "User registered successfully"));
});

export { registerUser };

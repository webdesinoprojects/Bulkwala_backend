import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { cookieOptions } from "../utils/constant.js";
import {
  sendResetPasswordEmail,
  sendVerificationEmail,
} from "../utils/email.js";
import ms from "ms";

// Get all users (Admin only)
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .select("-password -resetPasswordToken -refreshToken")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, users, "All users fetched successfully"));
});

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const existinguser = await User.findOne({ email });

  if (existinguser) {
    throw new ApiError(400, "User already exists");
  }

  const verificationToken = Math.floor(
    100000 + Math.random() * 900000
  ).toString();
  const expiresIn = ms(process.env.VERIFICATION_TOKEN_EXPIRES_IN);

  const user = await User.create({
    name,
    email,
    password,
    phone,
    verificationToken,
    verificationTokenExpiresAt: new Date(Date.now() + expiresIn),
    isVerified: false,
  });

  await sendVerificationEmail(user.email, verificationToken);

  return res
    .status(201)
    .json(new ApiResponse(201, user, "User register Please verify your email"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  console.log(password);

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(400, "User not found");
  }
  const isPassCorrect = await user.isPasswordCorrect(password);
  console.log(isPassCorrect);
  if (!isPassCorrect) {
    throw new ApiError(400, "Invalid password");
  }

  const { accessToken, refreshToken } = user.generateJWT();

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(200, user, "User logged in successfully"));
});

const updateUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.name = name ?? user.name;
  user.email = email ?? user.email;
  user.password = password ?? user.password;
  user.phone = phone ?? user.phone;

  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User updated successfully"));
});

const getuserProfile = asyncHandler(async (req, res) => {
  const userid = req.user._id;

  const user = await User.findById(userid).select(
    "-password -resetPasswordToken -refreshToken"
  );
  if (!user) {
    throw new ApiError(401, "User not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User found successfully"));
});

const verifyUser = asyncHandler(async (req, res) => {
  const { userid } = req.params;
  const { token } = req.body;

  const user = await User.findById(userid);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.verificationToken !== token) {
    throw new ApiError(400, "Invalid verification token");
  }

  if (user.verificationTokenExpiresAt < new Date()) {
    throw new ApiError(400, "Verification token has expired");
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpiresAt = undefined;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "Email verified successfully, you can now log in."
      )
    );
});

const forgetPassword = asyncHandler(async (req, _res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  // Generate a secure reset token
  const resetPasswordToken = crypto.randomBytes(32).toString("hex");
  const resetPasswordExpiresAt = new Date(
    Date.now() + process.env.RESET_PASSWORD_EXPIRY
  );

  // Save the token and its expiry to the user in the database
  user.resetPasswordToken = resetPasswordToken;
  user.resetPasswordExpiresAt = resetPasswordExpiresAt;
  await user.save({ validateBeforeSave: false });

  // Send the password reset email
  await sendResetPasswordEmail(user.email, user._id, resetPasswordToken);
});

const resetPassword = asyncHandler(async (req, res) => {
  const { userid, token } = req.params;
  const { newPassword } = req.body;

  const user = await User.findById(userid);

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (
    user.resetPasswordToken !== token ||
    user.resetPasswordExpiresAt < new Date()
  ) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  user.password = newPassword;

  user.resetPasswordToken = undefined;
  user.resetPasswordExpiresAt = undefined;

  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Password Reset Successfully"));
});

const changePassword = asyncHandler(async (req, _res) => {
  const { email } = req.body;
  const user = await User.findById(email);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Generate a secure reset token
  const resetPasswordToken = crypto.randomBytes(32).toString("hex");
  const resetPasswordExpiresAt = new Date(
    Date.now() + process.env.RESET_PASSWORD_EXPIRY
  );

  // Save the token and its expiry to the user in the database
  user.resetPasswordToken = resetPasswordToken;
  user.resetPasswordExpiresAt = resetPasswordExpiresAt;
  await user.save({ validateBeforeSave: false });

  // Send the password reset email
  await sendResetPasswordEmail(user.email, user._id, resetPasswordToken);
});

const refreshUserToken = asyncHandler(async (req, res) => {
  const refreshTokenFromCookie = req.cookies.refreshToken;
  if (!refreshTokenFromCookie) {
    throw new ApiError(401, "Refresh token not found");
  }

  const user = await User.findOne({ refreshToken: refreshTokenFromCookie });
  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }

  if (user.refreshTokenExpireAt < new Date()) {
    throw new ApiError(401, "Refresh token expired. Please log in again.");
  }

  // Generate new tokens
  const { accessToken, refreshToken } = user.generateJWT();

  // Database mein naya refreshToken save karein
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(200, null, "Access token refreshed successfully"));
});

const logoutUser = asyncHandler(async (_req, res) => {
  // const accessToken = req.cookies.accessToken;
  // const refreshToken = req.cookies.refreshToken;

  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "User logged out successfully"));
});

const applyForSeller = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    businessName,
    gstNumber,
    pickupAddress,
    bankName,
    accountNumber,
    ifsc,
  } = req.body;

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  if (user.sellerDetails?.approved) {
    throw new ApiError(400, "You are already an approved seller");
  }

  // Prevent multiple applications
  if (
    user.sellerDetails &&
    user.sellerDetails.businessName &&
    !user.sellerDetails.approved
  ) {
    throw new ApiError(400, "Your seller application is already under review");
  }

  // Save application details
  user.sellerDetails = {
    businessName,
    gstNumber,
    pickupAddress,
    bankName,
    accountNumber,
    ifsc,
    approved: false,
  };

  await user.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user,
        "Seller application submitted successfully and pending admin approval"
      )
    );
});

// Get all pending seller applications
const getPendingSellers = asyncHandler(async (_req, res) => {
  const pending = await User.find({
    "sellerDetails.approved": false,
    "sellerDetails.businessName": { $exists: true, $ne: "" },
    role: "customer",
  }).select("-password -refreshToken -resetPasswordToken");

  return res
    .status(200)
    .json(new ApiResponse(200, pending, "Pending seller applications fetched"));
});

//  Approve seller
const approveSeller = asyncHandler(async (req, res) => {
  const { userid } = req.params;
  const user = await User.findById(userid);

  if (!user) throw new ApiError(404, "User not found");

  if (!user.sellerDetails || !user.sellerDetails.businessName) {
    throw new ApiError(400, "This user has not applied as a seller");
  }

  user.role = "seller";
  user.sellerDetails.approved = true;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Seller approved successfully"));
});

const rejectSeller = asyncHandler(async (req, res) => {
  const { userid } = req.params;
  const user = await User.findById(userid);

  if (!user) throw new ApiError(404, "User not found");

  user.sellerDetails = {}; // clear application
  user.role = "customer";
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Seller application rejected"));
});

export {
  getAllUsers,
  registerUser,
  loginUser,
  updateUser,
  getuserProfile,
  verifyUser,
  forgetPassword,
  resetPassword,
  refreshUserToken,
  changePassword,
  logoutUser,
  applyForSeller,
  getPendingSellers,
  approveSeller,
  rejectSeller,
};

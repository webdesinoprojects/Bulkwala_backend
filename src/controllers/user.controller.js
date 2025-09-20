import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { cookieOptions } from "../utils/constant.js";
import { sendVerificationEmail } from "../utils/email.js";

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const existinguser = await User.findOne({ email });

  if (existinguser) {
    throw new ApiError(400, "User already exists");
  }

  const verificationToken = Math.floor(
    100000 + Math.random() * 900000
  ).toString();
  const user = await User.create({
    name,
    email,
    password,
    phone,
    verificationToken,
    verificationTokenExpiresAt: new Date(
      Date.now() + process.env.VERIFICATION_TOKEN_EXPIRES_IN
    ),
    isVerified: false,
  });

  await sendVerificationEmail(user.email, verificationToken);

  return res
    .status(201)
    .json(new ApiResponse(201, user, "User register Please verify your email"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(400, "User not found");
  }
  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
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
  const { userid } = req.parmas;
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

export { registerUser, loginUser, updateUser, getuserProfile, verifyUser };

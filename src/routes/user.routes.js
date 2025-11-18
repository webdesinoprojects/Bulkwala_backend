import express from "express";
import {
  loginUser,
  registerUser,
  updateUser,
  getuserProfile,
  verifyUser,
  forgetPassword,
  resetPassword,
  refreshUserToken,
  changePassword,
  logoutUser,
  applyForSeller,
  approveSeller,
  getPendingSellers,
  rejectSeller,
  getAllUsers,
  updateAddress,
  registerSellerDirect,
  sendOtpLogin,
  verifyOtpLogin,
  resendVerifyCode,
  deleteAddress,
} from "../controllers/user.controller.js";
import { validateData } from "../middleware/validate.js";
import {
  createuserSchema,
  updateuserSchema,
  loginuserSchema,
  forgetPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  sellerApplicationSchema,
  sellerRegistrationSchema,
  updateAddressSchema,
} from "../validators/user.Schema.js";
import { isAdmin, isLoggedIn } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/register").post(validateData(createuserSchema), registerUser);
router.route("/send-otp").post(sendOtpLogin);
router.route("/verify-otp").post(verifyOtpLogin);

router
  .route("/register-seller")
  .post(validateData(sellerRegistrationSchema), registerSellerDirect);

router.route("/login").post(validateData(loginuserSchema), loginUser);
router
  .route("/update")
  .put(validateData(updateuserSchema), isLoggedIn, updateUser);
router.route("/profile").get(isLoggedIn, getuserProfile);
router
  .route("/address")
  .put(isLoggedIn, validateData(updateAddressSchema), updateAddress);
router.route("/address/:index").delete(isLoggedIn, deleteAddress);
router.route("/verify/:userid").post(verifyUser);
router.route("/resend-verification/:userid").post(resendVerifyCode);
router
  .route("/forget-password")
  .post(validateData(forgetPasswordSchema), forgetPassword);
router
  .route("/change-password")
  .post(validateData(changePasswordSchema), isLoggedIn, changePassword);
router
  .route("/reset-password/:userid/:token")
  .post(validateData(resetPasswordSchema), resetPassword);
router.route("/refresh-token").post(refreshUserToken);
router.route("/logout").post(isLoggedIn, logoutUser);
router
  .route("/apply-seller")
  .post(isLoggedIn, validateData(sellerApplicationSchema), applyForSeller);

router.route("/sellers/pending").get(isLoggedIn, isAdmin, getPendingSellers);
router
  .route("/sellers/approve/:userid")
  .put(isLoggedIn, isAdmin, approveSeller);

router.route("/sellers/reject/:userid").put(isLoggedIn, isAdmin, rejectSeller);
router.route("/").get(isLoggedIn, isAdmin, getAllUsers);

export default router;

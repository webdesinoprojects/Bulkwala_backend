import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { availableUserRoles, userRoleEnum } from "../utils/constant.js";

const addressSchema = new Schema(
  {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, default: "India" },
  },
  { _id: false }
);

const sellerSchema = new Schema(
  {
    businessName: String,
    gstNumber: String,
    pickupAddress: String,
    bankName: String,
    accountNumber: String,
    ifsc: String,
    approved: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minLength: [4, "Email must be at least 4 characters long"],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
      maxLength: [50, "Email must be at most 50 characters long"],
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: availableUserRoles,
      default: userRoleEnum.CUSTOMER,
      optional: true,
    },

    address: addressSchema,

    phone: {
      type: String,
    },

    avatar: {
      type: String,
      default: "",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: String,
    refreshTokenExpireAt: Date,

    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,

    verificationToken: String,
    verificationTokenExpiresAt: Date,

    sellerDetails: sellerSchema,
  },

  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateJWT = function () {
  const accessToken = jwt.sign(
    {
      _id: this._id,
      name: this.name,
      email: this.email,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN }
  );
  return { accessToken, refreshToken };
};
const User = mongoose.model("User", userSchema);

export default User;

import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
    },
    // store 1–3 image URLs for a single banner set
    images: {
      type: [String],
      validate: {
        validator: (arr) => arr.length > 0 && arr.length <= 3,
        message: "A banner set must have between 1 and 3 images",
      },
      required: true,
    },
    ctaLink: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Banner = mongoose.model("Banner", bannerSchema);
export default Banner;

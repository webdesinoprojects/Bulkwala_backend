import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    title: String,
    image_url: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
const Banner = mongoose.model("Banner", bannerSchema);
export default Banner;

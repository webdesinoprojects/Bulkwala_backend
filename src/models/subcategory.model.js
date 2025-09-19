import mongoose from "mongoose";

const subcategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    img_url: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    // sample_price: {
    //   type: Number,
    //   required: true,
    //   min: 0,
    // },
  },
  { timestamps: true }
);

subcategorySchema.index({ slug: 1 });

const Subcategory = mongoose.model("Subcategory", subcategorySchema);

export default Subcategory;

import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
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
    subcategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subcategory",
      },
    ],
    banner: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

categorySchema.index({ slug: 1 });

const Category = mongoose.model("Category", categorySchema);

export default Category;

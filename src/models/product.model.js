import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      lowercase: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    images: [
      {
        type: String,
        required: true,
      },
    ],

    videos: [
      {
        type: String,
      },
    ],

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discountPrice: {
      type: Number,
      min: 0,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
      required: true,
    },

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },

    sku: {
      type: String, 
      unique: true,
      sparse: true, // allows null values without violating unique
      trim: true,
    },

    color: [
      {
        type: String,
        trim: true,
      },
    ],

    genericName: {
      type: String,
      trim: true,
    },

    countryOfOrigin: {
      type: String,
      enum: ["India", "China"],
      default: "India",
    },

    manufacturerName: { type: String, trim: true },

    gstSlab: {
      type: Number,
      enum: [0, 5, 12, 18, 28],
      default: 18,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Soft delete
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

productSchema.index({ title: "text" });
productSchema.index({ tags: 1 });
productSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

const Product = mongoose.model("Product", productSchema);

export default Product;

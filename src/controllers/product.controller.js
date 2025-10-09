import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import Subcategory from "../models/subcategory.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import imagekit from "../utils/imagekit.js";
import { v4 as uuidv4 } from "uuid";
import { generateUniqueSlug } from "../utils/slug.js";
import slugify from "slugify";

const createProduct = asyncHandler(async (req, res) => {
  const {
    title,
    slug: incomingSlug,
    description,
    price,
    discountPrice,
    stock,
    category,
    subcategory,
    tags,
    isActive,
    isFeatured,
    sku,
    color,
    genericName,
    countryOfOrigin,
    manufacturerName,
  } = req.body;

  const slug = incomingSlug
    ? slugify(incomingSlug, { lower: true, strict: true })
    : await generateUniqueSlug(Product, title);

  const existingSlug = await Product.findOne({ slug, isDeleted: false });
  if (existingSlug) throw new ApiError(400, "Product slug already exists");

  const parentCategory = await Category.findOne({
    _id: category,
    isDeleted: false,
  });
  if (!parentCategory) throw new ApiError(404, "Category not found");

  const childSubcategory = await Subcategory.findOne({
    _id: subcategory,
    isDeleted: false,
  });
  if (!childSubcategory) throw new ApiError(404, "Subcategory not found");

  //  Separate image & video files
  let imageUrls = [];
  let videoUrl = null;

  if (req.files) {
    // handle images
    if (req.files.images && req.files.images.length > 0) {
      const imgUploads = await Promise.all(
        req.files.images.map(async (file) => {
          const base64 = file.buffer.toString("base64");
          const fileData = `data:${file.mimetype};base64,${base64}`;
          const filename = `${Date.now()}_${uuidv4()}_${file.originalname}`;

          const result = await imagekit.upload({
            file: fileData,
            fileName: filename,
            folder: "products/images",
          });

          return result.url;
        })
      );
      imageUrls = imgUploads;
    }

    // handle single video
    if (req.files.video && req.files.video[0]) {
      const videoFile = req.files.video[0];

      // size check: 150MB max
      const MAX_VIDEO_SIZE = 150 * 1024 * 1024; // 150 MB
      if (videoFile.size > MAX_VIDEO_SIZE) {
        throw new ApiError(400, "Video size must not exceed 150 MB");
      }

      const base64 = videoFile.buffer.toString("base64");
      const fileData = `data:${videoFile.mimetype};base64,${base64}`;
      const filename = `${Date.now()}_${uuidv4()}_${videoFile.originalname}`;

      const result = await imagekit.upload({
        file: fileData,
        fileName: filename,
        folder: "products/videos",
      });

      videoUrl = result.url;
    }
  }

  const product = await Product.create({
    title,
    slug,
    description,
    images: imageUrls,
    videos: videoUrl ? [videoUrl] : [], // store single video URL in array
    price,
    discountPrice,
    stock,
    category,
    subcategory,
    tags,
    isActive,
    isFeatured,
    sku,
    color,
    genericName,
    countryOfOrigin,
    manufacturerName,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, product, "Product created successfully"));
});

const getSingleProduct = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const product = await Product.findOne({ slug, isDeleted: false })
    .populate("category", "name slug")
    .populate("subcategory", "name slug");

  if (!product) throw new ApiError(404, "Product not found");

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product fetched successfully"));
});

const getProducts = asyncHandler(async (req, res) => {
  const {
    category,
    subcategory,
    minPrice,
    maxPrice,
    search,
    page = 1,
    limit = 10,
  } = req.query;

  const filter = { isDeleted: false };

  if (category) filter.category = category;
  if (subcategory) filter.subcategory = subcategory;
  if (minPrice || maxPrice) filter.price = {};
  if (minPrice) filter.price.$gte = Number(minPrice);
  if (maxPrice) filter.price.$lte = Number(maxPrice);
  if (search) filter.$text = { $search: search };

  const skip = (Number(page) - 1) * Number(limit);

  const products = await Product.find(filter)
    .populate("category", "name slug")
    .populate("subcategory", "name slug")
    .skip(skip)
    .limit(Number(limit));

  const total = await Product.countDocuments(filter);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { products, total, page: Number(page), limit: Number(limit) },
        "Products fetched successfully"
      )
    );
});

const updateProduct = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const {
    title,
    price,
    stock,
    description,
    category,
    subcategory,
    slug: newSlug,
    sku: newSku,
    imagesToRemove = [],
    existingImages = [],
  } = req.body;

  const product = await Product.findOne({ slug, isDeleted: false });
  if (!product) throw new ApiError(404, "Product not found");

  // ---------- SLUG & SKU Checks ----------
  if (newSlug && newSlug !== product.slug) {
    const slugExists = await Product.findOne({ slug: newSlug, isDeleted: false });
    if (slugExists) throw new ApiError(400, "Slug already exists");
    product.slug = newSlug;
  }

  if (newSku && newSku !== product.sku) {
    const skuExists = await Product.findOne({ sku: newSku });
    if (skuExists) throw new ApiError(400, "SKU already exists");
    product.sku = newSku;
  }

  // ---------- Category / Subcategory validation ----------
  if (category) {
    const categoryExists = await Category.findOne({ _id: category, isDeleted: false });
    if (!categoryExists) throw new ApiError(404, "Category not found");
    product.category = category;
  }

  if (subcategory) {
    const subcategoryExists = await Subcategory.findOne({ _id: subcategory, isDeleted: false });
    if (!subcategoryExists) throw new ApiError(404, "Subcategory not found");
    product.subcategory = subcategory;
  }

  // ---------- Update basic fields ----------
  if (title) product.title = title;
  if (price) product.price = price;
  if (stock) product.stock = stock;
  if (description) product.description = description;

  // ---------- Handle images ----------
  // Remove images marked for deletion
  if (imagesToRemove.length > 0) {
    product.images = product.images.filter(img => !imagesToRemove.includes(img));
  }

  // Keep existing images from frontend
  if (existingImages.length > 0) {
    existingImages.forEach(img => {
      if (!product.images.includes(img)) product.images.push(img);
    });
  }

  // Upload new images
  if (req.files && req.files.images && req.files.images.length > 0) {
    const uploadedImages = await Promise.all(
      req.files.images.map(async (file) => {
        const base64 = file.buffer.toString("base64");
        const fileData = `data:${file.mimetype};base64,${base64}`;
        const filename = `${Date.now()}_${uuidv4()}_${file.originalname}`;
        const result = await imagekit.upload({
          file: fileData,
          fileName: filename,
          folder: "products/images",
        });
        return result.url;
      })
    );
    product.images.push(...uploadedImages);
  }

  // ---------- Handle video ----------
  if (req.files && req.files.video && req.files.video[0]) {
    const videoFile = req.files.video[0];
    const MAX_VIDEO_SIZE = 150 * 1024 * 1024; // 150 MB
    if (videoFile.size > MAX_VIDEO_SIZE) throw new ApiError(400, "Video size must not exceed 150 MB");

    const base64 = videoFile.buffer.toString("base64");
    const fileData = `data:${videoFile.mimetype};base64,${base64}`;
    const filename = `${Date.now()}_${uuidv4()}_${videoFile.originalname}`;
    const result = await imagekit.upload({
      file: fileData,
      fileName: filename,
      folder: "products/videos",
    });
    product.videos = [result.url];
  }

  await product.save();
  return res.status(200).json(new ApiResponse(200, product, "Product updated successfully"));
});


const deleteProduct = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const product = await Product.findOne({ slug, isDeleted: false });
  if (!product) throw new ApiError(404, "Product not found or already deleted");

  product.isDeleted = true;
  product.deletedAt = new Date();
  product.deletedBy = req.user._id;
  await product.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, null, "Product deleted successfully (soft delete)")
    );
});

const restoreProduct = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const product = await Product.findOne({ slug, isDeleted: true });
  if (!product) throw new ApiError(404, "Product not found or not deleted");

  product.isDeleted = false;
  product.deletedAt = null;
  product.deletedBy = null;
  await product.save();

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product restored successfully"));
});

export {
  createProduct,
  getSingleProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  restoreProduct,
};

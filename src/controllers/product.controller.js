import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import Subcategory from "../models/subcategory.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

const createProduct = asyncHandler(async (req, res) => {
  const {
    title,
    slug,
    description,
    images,
    videos,
    price,
    discountPrice,
    stock,
    category,
    subcategory,
    tags,
    isActive,
    isFeatured,
  } = req.body;

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

  const product = await Product.create({
    title,
    slug,
    description,
    images,
    videos,
    price,
    discountPrice,
    stock,
    category,
    subcategory,
    tags,
    isActive,
    isFeatured,
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
  const updates = req.body;

  const product = await Product.findOne({ slug, isDeleted: false });
  if (!product) throw new ApiError(404, "Product not found");

  if (updates.slug && updates.slug !== product.slug) {
    const slugExists = await Product.findOne({
      slug: updates.slug,
      isDeleted: false,
    });
    if (slugExists) throw new ApiError(400, "Slug already exists");
  }

  if (updates.category) {
    const categoryExists = await Category.findOne({
      _id: updates.category,
      isDeleted: false,
    });
    if (!categoryExists) throw new ApiError(404, "Category not found");
  }

  if (updates.subcategory) {
    const subcategoryExists = await Subcategory.findOne({
      _id: updates.subcategory,
      isDeleted: false,
    });
    if (!subcategoryExists) throw new ApiError(404, "Subcategory not found");
  }

  Object.assign(product, updates); //for overrites the existing fields.
  await product.save();

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product updated successfully"));
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

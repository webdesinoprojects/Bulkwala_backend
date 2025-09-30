import Category from "../models/category.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { generateUniqueSlug } from "../utils/slug.js";
import slugify from "slugify";
import Subcategory from "../models/subcategory.model.js";
import imagekit from "../utils/imagekit.js";
import { v4 as uuidv4 } from "uuid";

const createCategory = asyncHandler(async (req, res) => {
  const { name, slug: incomingSlug } = req.body;

  const slug = incomingSlug
    ? slugify(incomingSlug, { lower: true, strict: true })
    : await generateUniqueSlug(Category, name);

  const exists = await Category.findOne({ slug, isDeleted: false });
  if (exists) throw new ApiError(400, "Slug already exists");

  // Handle image upload
  let img_url = null;
  if (req.file) {
    const base64 = req.file.buffer.toString("base64");
    const fileData = `data:${req.file.mimetype};base64,${base64}`;
    const filename = `${Date.now()}_${uuidv4()}_${req.file.originalname}`;

    const result = await imagekit.upload({
      file: fileData,
      fileName: filename,
      folder: "categories",
    });

    img_url = result.url;
  } else {
    throw new ApiError(400, "Category image is required");
  }

  const category = await Category.create({
    name,
    slug,
    img_url,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, category, "Category created successfully"));
});

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isDeleted: false }).populate({
    path: "subcategories",
    match: { isDeleted: false },
  });
  return res
    .status(200)
    .json(new ApiResponse(200, categories, "Categories fetched successfully"));
});

const getSingleCategory = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const category = await Category.findOne({ slug, isDeleted: false }).populate({
    path: "subcategories",
    match: { isDeleted: false },
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, category, "Category fetched successfully"));
});

const deleteCategory = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const category = await Category.findOne({ slug, isDeleted: false });
  if (!category) throw new ApiError(404, "Category not found");

  // mark subcategories as deleted as well
  await Subcategory.updateMany(
    { _id: { $in: category.subcategories }, isDeleted: false },
    { isDeleted: true, deletedAt: new Date(), deletedBy: req.user?.id || null }
  );

  category.isDeleted = true;
  category.deletedAt = new Date();
  category.deletedBy = req.user?.id || null;
  await category.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, null, "Category and its subcategories soft-deleted")
    );
});

const updateCategory = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { name } = req.body;

  const category = await Category.findOne({ slug, isDeleted: false });
  if (!category) throw new ApiError(404, "Category not found");

  if (name && name !== category.name) {
    category.slug = await generateUniqueSlug(Category, name, category._id);
  }
  if (img_url) category.img_url = img_url;
  category.name = name || category.name;

  // Handle new image upload if provided
  if (req.file) {
    const base64 = req.file.buffer.toString("base64");
    const fileData = `data:${req.file.mimetype};base64,${base64}`;
    const filename = `${Date.now()}_${uuidv4()}_${req.file.originalname}`;

    const result = await imagekit.upload({
      file: fileData,
      fileName: filename,
      folder: "categories",
    });

    category.img_url = result.url;
  }

  await category.save();
  return res
    .status(200)
    .json(new ApiResponse(200, category, "Category updated successfully"));
});

const restoreCategory = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const category = await Category.findOne({ slug, isDeleted: true });
  if (!category) throw new ApiError(404, "Category not found or not deleted");

  // if another non-deleted category already uses this slug, generate a new one
  const conflict = await Category.findOne({
    slug: category.slug,
    isDeleted: false,
  });
  if (conflict) {
    category.slug = await generateUniqueSlug(
      Category,
      category.name,
      category._id
    );
  }

  category.isDeleted = false;
  category.deletedAt = null;
  category.deletedBy = null;
  await category.save();

  return res
    .status(200)
    .json(new ApiResponse(200, category, "Category restored successfully"));
});

export {
  createCategory,
  getCategories,
  getSingleCategory,
  deleteCategory,
  updateCategory,
  restoreCategory,
};

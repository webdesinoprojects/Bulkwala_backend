import Category from "../models/category.model.js";
import Subcategory from "../models/subcategory.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateUniqueSlug } from "../utils/slug.js";
import slugify from "slugify";
import imagekit from "../utils/imagekit.js";
import { v4 as uuidv4 } from "uuid";

const createSubCategory = asyncHandler(async (req, res) => {
  const { name, slug: incomingSlug, category } = req.body;

  const slug = incomingSlug
    ? slugify(incomingSlug, { lower: true, strict: true })
    : await generateUniqueSlug(Subcategory, name);

  const isSlugExists = await Subcategory.findOne({ slug, isDeleted: false });
  if (isSlugExists) {
    throw new ApiError(400, "Slug already exists");
  }

  const parentCategory = await Category.findOne({
    _id: category,
    isDeleted: false,
  });
  if (!parentCategory) {
    throw new ApiError(404, "Parent category not found");
  }

  // handle image upload
  let img_url = null;
  if (req.file) {
    const base64 = req.file.buffer.toString("base64");
    const fileData = `data:${req.file.mimetype};base64,${base64}`;
    const filename = `${Date.now()}_${uuidv4()}_${req.file.originalname}`;

    const result = await imagekit.upload({
      file: fileData,
      fileName: filename,
      folder: "subcategories",
    });

    img_url = result.url;
  } else {
    throw new ApiError(400, "Subcategory image is required");
  }

  const subcategory = await Subcategory.create({
    name,
    slug,
    img_url,
    category,
  });

  // maintain parent reference
  parentCategory.subcategories.push(subcategory._id);
  await parentCategory.save();

  return res
    .status(201)
    .json(
      new ApiResponse(201, subcategory, "Subcategory created successfully")
    );
});

const getSubcategories = asyncHandler(async (req, res) => {
  const { category } = req.query;

  let filter = { isDeleted: false };
  if (category) {
    filter.category = category;
  }

  const subcategories = await Subcategory.find(filter).populate(
    "category",
    "name slug"
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, subcategories, "Subcategories fetched successfully")
    );
});

const getSingleSubcategory = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const subcategory = await Subcategory.findOne({
    slug,
    isDeleted: false,
  }).populate("category", "name slug");

  if (!subcategory) {
    throw new ApiError(404, "Subcategory not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, subcategory, "Subcategory fetched successfully")
    );
});

const updateSubcategory = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { name, category } = req.body;

  const subcategory = await Subcategory.findOne({ slug, isDeleted: false });
  if (!subcategory) {
    throw new ApiError(404, "Subcategory not found");
  }

  // Update fields
  if (name) subcategory.name = name;

  // If category is changed, check it exists
  if (category) {
    const parentCategory = await Category.findOne({
      _id: category,
      isDeleted: false,
    });
    if (!parentCategory) {
      throw new ApiError(404, "New parent category not found");
    }
    subcategory.category = category;
  }

  // handle new image upload if provided
  if (req.file) {
    const base64 = req.file.buffer.toString("base64");
    const fileData = `data:${req.file.mimetype};base64,${base64}`;
    const filename = `${Date.now()}_${uuidv4()}_${req.file.originalname}`;

    const result = await imagekit.upload({
      file: fileData,
      fileName: filename,
      folder: "subcategories",
    });

    subcategory.img_url = result.url;
  }

  await subcategory.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, subcategory, "Subcategory updated successfully")
    );
});

const deleteSubcategory = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const subcategory = await Subcategory.findOne({ slug, isDeleted: false });
  if (!subcategory) {
    throw new ApiError(404, "Subcategory not found or already deleted");
  }

  subcategory.isDeleted = true;
  subcategory.deletedAt = new Date();
  subcategory.deletedBy = req.user._id;
  await subcategory.save();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Subcategory deleted successfully"));
});

const restoreSubcategory = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const subcategory = await Subcategory.findOne({ slug, isDeleted: true });
  if (!subcategory) {
    throw new ApiError(404, "Subcategory not found or not deleted");
  }

  subcategory.isDeleted = false;
  subcategory.deletedAt = null;
  subcategory.deletedBy = null;
  await subcategory.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, subcategory, "Subcategory restored successfully")
    );
});

export {
  createSubCategory,
  getSubcategories,
  getSingleSubcategory,
  updateSubcategory,
  deleteSubcategory,
  restoreSubcategory,
};

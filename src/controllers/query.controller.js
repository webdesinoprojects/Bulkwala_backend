import Query from "../models/query.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

export const createQuery = asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;

  const query = await Query.create({ name, email, message });

  return res
    .status(201)
    .json(new ApiResponse(201, query, "Query submitted successfully"));
});

export const getAllQueries = asyncHandler(async (req, res) => {
  const queries = await Query.find().sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, queries, "All queries fetched successfully"));
});

export const getSingleQuery = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const query = await Query.findById(id).populate("respondedBy", "name email");
  if (!query) throw new ApiError(404, "Query not found");

  return res
    .status(200)
    .json(new ApiResponse(200, query, "Query fetched successfully"));
});

export const updateQueryStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const query = await Query.findById(id);
  if (!query) throw new ApiError(404, "Query not found");

  if (status) query.status = status;
  if (req.user?._id) query.respondedBy = req.user._id;

  await query.save();

  return res
    .status(200)
    .json(new ApiResponse(200, query, "Query status updated successfully"));
});

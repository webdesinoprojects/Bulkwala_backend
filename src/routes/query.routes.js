import express from "express";
import {
  createQuery,
  getAllQueries,
  getSingleQuery,
  updateQueryStatus,
} from "../controllers/query.controller.js";
import { isLoggedIn, isAdmin } from "../middleware/auth.middleware.js";
import { validateData } from "../middleware/validate.js";
import {
  createQuerySchema,
  updateQueryStatusSchema,
} from "../validators/query.schema.js";

const router = express.Router();

router.post("/", validateData(createQuerySchema), createQuery);

router.get("/", isLoggedIn, isAdmin, getAllQueries);
router.get("/:id", isLoggedIn, isAdmin, getSingleQuery);

router.patch(
  "/:id",
  isLoggedIn,
  isAdmin,
  validateData(updateQueryStatusSchema),
  updateQueryStatus
);

export default router;

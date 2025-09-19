import express from "express";
import { registerUser } from "../controllers/user.controller.js";
import { createuserSchema } from "../validators/createuserSchema.js";
import { validateData } from "../middleware/validate.js";

const router = express.Router();

router.route("/").post(validateData(createuserSchema), registerUser);

export default router;

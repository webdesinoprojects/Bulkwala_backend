import express from "express";
import {
  loginUser,
  registerUser,
  updateUser,
} from "../controllers/user.controller.js";
import { createuserSchema } from "../validators/createuserSchema.js";
import { validateData } from "../middleware/validate.js";
import { loginuserSchema } from "../validators/loginuserSchema.js";
import { updateuserSchema } from "../validators/updateuserSchema.js";

const router = express.Router();

router.route("/register").post(validateData(createuserSchema), registerUser);
router.route("/login").post(validateData(loginuserSchema), loginUser);
router.route("/update").put(validateData(updateuserSchema), updateUser);

export default router;

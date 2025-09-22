import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

const frontendURL = process.env.FRONTEND_URL;

app.use(express.json());
app.use(
  cors({
    origin: frontendURL,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// imports
import userRoutes from "./routes/user.routes.js";
import categoryRoutes from "./routes/category.routes.js";

app.use("/api/users", userRoutes);
app.use("/api/category", categoryRoutes);

export default app;

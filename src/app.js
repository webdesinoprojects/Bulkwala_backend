import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

const app = express();

const frontendURL = process.env.FRONTEND_URL;
const allowedOrigins = frontendURL.split(",").map((url) => url.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["set-cookie"], // SAFARI FIX 🔥
  })
);

app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// imports
import userRoutes from "./routes/user.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import subcategoryRoutes from "./routes/subcategory.routes.js";
import productRoutes from "./routes/product.routes.js";
import orderRoutes from "./routes/order.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import queryRoutes from "./routes/query.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import referralRoutes from "./routes/referral.routes.js";
import offerRoutes from "./routes/offer.routes.js";
import bannerRoutes from "./routes/banner.routes.js";
import { globalErrorHandler } from "./middleware/globalError.middleware.js";

// routes

app.use("/api/users", userRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/subcategory", subcategoryRoutes);
app.use("/api/product", productRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/query", queryRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/referrals", referralRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/banners", bannerRoutes);

// Global Error Handler - always last middleware
app.use(globalErrorHandler);

export default app;

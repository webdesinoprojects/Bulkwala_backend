import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
// Route imports
import userRoutes from './routes/user.routes.js';
import categoryRoutes from './routes/category.routes.js';
import subcategoryRoutes from './routes/subcategory.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import cartRoutes from './routes/cart.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import queryRoutes from './routes/query.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import reviewRoutes from './routes/review.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import referralRoutes from './routes/referral.routes.js';
import offerRoutes from './routes/offer.routes.js';
import bannerRoutes from './routes/banner.routes.js';
import { globalErrorHandler } from './middleware/globalError.middleware.js';

const app = express();
app.set('trust proxy', 1);

// Environment variable validation with fallback
const frontendURL = process.env.FRONTEND_URL;
const allowedOrigins = frontendURL
  ? frontendURL.split(',').map((url) => url.trim())
  : ['http://localhost:5173', 'http://localhost:3000']; // Default for development

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // In development, allow localhost with any port for convenience
      if (
        process.env.NODE_ENV === 'development' &&
        origin.includes('localhost')
      ) {
        return callback(null, true);
      }

      return callback(new Error('CORS blocked: ' + origin));
    },
    credentials: true, // ✅ Required for cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    // ✅ Add headers that Safari might need
    allowedHeaders: [
      'Content-Type', 
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    // ✅ Explicitly expose Set-Cookie header (helps with Safari)
    exposedHeaders: ['Set-Cookie'],
  })
);

// Configure morgan to skip logging 401 errors using stream (better performance)
app.use(
  morgan('dev', {
    stream: {
      write: (message) => {
        // Don't log 401 responses (expected when not authenticated)
        if (!message.includes(' 401 ')) {
          process.stdout.write(message);
        }
      },
    },
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes

app.use('/api/users', userRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/subcategory', subcategoryRoutes);
app.use('/api/product', productRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/query', queryRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/banners', bannerRoutes);

// Global Error Handler - always last middleware
app.use(globalErrorHandler);

export default app;

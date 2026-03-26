import mongoose from "mongoose";
import dotenv from "dotenv";
import Banner from "../src/models/banner.model.js";

// Load environment variables
dotenv.config();

const deleteMidBanners = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Database connected\n");

    // Find all mid banners
    const midBanners = await Banner.find({ position: "mid" });
    
    if (midBanners.length === 0) {
      console.log("ℹ️  No mid banners found in the database.");
      await mongoose.connection.close();
      return;
    }

    console.log(`Found ${midBanners.length} mid banner(s):\n`);
    midBanners.forEach((banner, idx) => {
      console.log(`   ${idx + 1}. "${banner.title}" - ID: ${banner._id}`);
    });

    // Delete all mid banners
    const result = await Banner.deleteMany({ position: "mid" });
    
    console.log(`\n✅ Successfully deleted ${result.deletedCount} mid banner(s)`);

    // Close connection
    await mongoose.connection.close();
    console.log("✅ Database connection closed");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

// Run the script
deleteMidBanners();

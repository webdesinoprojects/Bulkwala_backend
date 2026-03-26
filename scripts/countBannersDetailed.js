import mongoose from "mongoose";
import dotenv from "dotenv";
import Banner from "../src/models/banner.model.js";

// Load environment variables
dotenv.config();

const countBannersDetailed = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Database connected\n");

    // Get all banners
    const allBanners = await Banner.find().sort({ position: 1, createdAt: -1 });
    
    // Count total banners
    const totalCount = allBanners.length;
    
    // Count by position
    const positions = ["top", "mid", "bottom", "promo", "bulk-orders"];
    const positionStats = {};
    
    for (const pos of positions) {
      const bannersInPos = allBanners.filter(b => b.position === pos);
      const totalImages = bannersInPos.reduce((sum, b) => sum + (b.images?.length || 0), 0);
      positionStats[pos] = {
        bannerCount: bannersInPos.length,
        imageCount: totalImages,
        banners: bannersInPos
      };
    }
    
    // Count active vs inactive
    const activeCount = allBanners.filter(b => b.isActive).length;
    const inactiveCount = allBanners.filter(b => !b.isActive).length;

    // Display results
    console.log("📊 Detailed Banner Count Summary");
    console.log("=================================\n");
    console.log(`Total Banners: ${totalCount}\n`);
    
    console.log("By Position (Banners | Images displayed):");
    console.log("------------------------------------------");
    for (const pos of positions) {
      const stats = positionStats[pos];
      console.log(`\n${pos.toUpperCase()}:`);
      console.log(`  • Banner Sets: ${stats.bannerCount}`);
      console.log(`  • Total Images: ${stats.imageCount} (displayed as ${stats.imageCount} slides)`);
      
      if (stats.banners.length > 0) {
        console.log(`  • Details:`);
        stats.banners.forEach((banner, idx) => {
          console.log(`    ${idx + 1}. "${banner.title || 'Untitled'}" - ${banner.images.length} image(s) - ${banner.isActive ? '✅ Active' : '❌ Inactive'}`);
        });
      }
    }
    
    console.log("\n\nBy Status:");
    console.log(`  • Active: ${activeCount}`);
    console.log(`  • Inactive: ${inactiveCount}\n`);

    console.log("💡 Note: Each banner can contain 1-3 images.");
    console.log("   The frontend displays each image as a separate slide in the carousel.\n");

    // Close connection
    await mongoose.connection.close();
    console.log("✅ Database connection closed");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

// Run the script
countBannersDetailed();

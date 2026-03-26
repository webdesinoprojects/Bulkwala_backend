import mongoose from "mongoose";
import dotenv from "dotenv";
import Banner from "../src/models/banner.model.js";

// Load environment variables
dotenv.config();

const countBanners = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Database connected\n");

    // Count total banners
    const totalCount = await Banner.countDocuments();
    
    // Count by position
    const topCount = await Banner.countDocuments({ position: "top" });
    const midCount = await Banner.countDocuments({ position: "mid" });
    const bottomCount = await Banner.countDocuments({ position: "bottom" });
    const promoCount = await Banner.countDocuments({ position: "promo" });
    const bulkOrdersCount = await Banner.countDocuments({ position: "bulk-orders" });
    
    // Count active vs inactive
    const activeCount = await Banner.countDocuments({ isActive: true });
    const inactiveCount = await Banner.countDocuments({ isActive: false });

    // Display results
    console.log("📊 Banner Count Summary");
    console.log("========================\n");
    console.log(`Total Banners: ${totalCount}\n`);
    
    console.log("By Position:");
    console.log(`  • Top: ${topCount}`);
    console.log(`  • Mid: ${midCount}`);
    console.log(`  • Bottom: ${bottomCount}`);
    console.log(`  • Promo: ${promoCount}`);
    console.log(`  • Bulk Orders: ${bulkOrdersCount}\n`);
    
    console.log("By Status:");
    console.log(`  • Active: ${activeCount}`);
    console.log(`  • Inactive: ${inactiveCount}\n`);

    // Close connection
    await mongoose.connection.close();
    console.log("✅ Database connection closed");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

// Run the script
countBanners();

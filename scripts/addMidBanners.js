import mongoose from "mongoose";
import dotenv from "dotenv";
import Banner from "../src/models/banner.model.js";

// Load environment variables
dotenv.config();

const addMidBanners = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Database connected\n");

    // Check if mid banners already exist
    const existingMidBanners = await Banner.countDocuments({ position: "mid" });
    
    if (existingMidBanners > 0) {
      console.log(`⚠️  Warning: ${existingMidBanners} mid banner(s) already exist.`);
      console.log("❓ Do you want to delete existing mid banners first?");
      console.log("   Run: node scripts/deleteMidBanners.js\n");
    }

    // Define the 3 mid banners matching the layout
    const midBanners = [
      {
        title: "Bulk Orders Available",
        images: [
          "https://ik.imagekit.io/bulkwala/demo/bannerimg3.png?updatedAt=1762846062182"
        ],
        ctaLink: "/products",
        position: "mid",
        isActive: true,
      },
      {
        title: "BULK ORDER BENEFIT",
        images: [
          "https://ik.imagekit.io/bulkwala/demo/bannerimg2.png?updatedAt=1762846061703"
        ],
        ctaLink: "/products",
        position: "mid",
        isActive: true,
      },
      {
        title: "Ensure Best Quality Products",
        images: [
          "https://ik.imagekit.io/bulkwala/demo/bannerimg1.png?updatedAt=1762846061563"
        ],
        ctaLink: "/products",
        position: "mid",
        isActive: true,
      },
    ];

    console.log(`📦 Adding ${midBanners.length} mid banners...\n`);

    // Insert banners
    const result = await Banner.insertMany(midBanners);
    
    console.log(`✅ Successfully added ${result.length} mid banner(s):\n`);
    result.forEach((banner, idx) => {
      console.log(`   ${idx + 1}. "${banner.title}" - ID: ${banner._id}`);
    });

    console.log("\n📊 Banner layout:");
    console.log("   Left (large):  Banner 1");
    console.log("   Right (top):   Banner 2");
    console.log("   Right (bottom): Banner 3");

    // Show updated counts
    const totalMid = await Banner.countDocuments({ position: "mid" });
    console.log(`\n📈 Total mid banners in database: ${totalMid}`);

    // Close connection
    await mongoose.connection.close();
    console.log("\n✅ Database connection closed");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

// Run the script
addMidBanners();

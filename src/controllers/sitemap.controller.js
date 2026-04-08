import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import Subcategory from "../models/subcategory.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const generateSitemap = asyncHandler(async (req, res) => {
  const DOMAIN = process.env.FRONTEND_URL || "https://bulkwala.com";

  // Fetch all non-deleted items from database
  const [products, categories, subcategories] = await Promise.all([
    Product.find({ isDeleted: false })
      .select("slug updatedAt")
      .lean()
      .exec(),
    Category.find({ isDeleted: false })
      .select("slug updatedAt")
      .lean()
      .exec(),
    Subcategory.find({ isDeleted: false })
      .select("slug updatedAt")
      .lean()
      .exec(),
  ]);

  // Generate XML sitemap
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Add homepage
  xml += `  <url>\n`;
  xml += `    <loc>${DOMAIN}/</loc>\n`;
  xml += `    <priority>1.0</priority>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `  </url>\n`;

  // Add categories
  categories.forEach((category) => {
    const lastmod = category.updatedAt
      ? new Date(category.updatedAt).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    xml += `  <url>\n`;
    xml += `    <loc>${DOMAIN}/category/${category.slug}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `  </url>\n`;
  });

  // Add subcategories
  subcategories.forEach((subcategory) => {
    const lastmod = subcategory.updatedAt
      ? new Date(subcategory.updatedAt).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    xml += `  <url>\n`;
    xml += `    <loc>${DOMAIN}/subcategory/${subcategory.slug}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <priority>0.7</priority>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `  </url>\n`;
  });

  // Add products
  products.forEach((product) => {
    const lastmod = product.updatedAt
      ? new Date(product.updatedAt).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    xml += `  <url>\n`;
    xml += `    <loc>${DOMAIN}/product/${product.slug}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <priority>0.6</priority>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `  </url>\n`;
  });

  // Add static pages
  const staticPages = [
    { url: "/about", priority: "0.6", changefreq: "monthly" },
    { url: "/contact", priority: "0.6", changefreq: "monthly" },
    { url: "/faq", priority: "0.5", changefreq: "monthly" },
    { url: "/privacy-policy", priority: "0.4", changefreq: "yearly" },
    { url: "/terms-and-conditions", priority: "0.4", changefreq: "yearly" },
    { url: "/return-policy", priority: "0.4", changefreq: "yearly" },
  ];

  staticPages.forEach((page) => {
    xml += `  <url>\n`;
    xml += `    <loc>${DOMAIN}${page.url}</loc>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `  </url>\n`;
  });

  xml += "</urlset>";

  // Send response with proper XML headers
  res.set("Content-Type", "application/xml");
  res.set("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
  res.send(xml);
});

export { generateSitemap };

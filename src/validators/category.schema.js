import { z } from "zod";

const createCategorySchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }),
  slug: z.string().trim().min(1, { message: "Slug is required" }),
  img_url: z.string().trim().min(1, { message: "Image is required" }),
});

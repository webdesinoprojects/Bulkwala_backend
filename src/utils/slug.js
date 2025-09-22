import slugify from "slugify";

export async function generateUniqueSlug(Model, name, excludeId = null) {
  const base = slugify(name, { lower: true, strict: true });
  let slug = base;
  let counter = 0;

  while (true) {
    const query = { slug, isDeleted: false };
    if (excludeId) query._id = { $ne: excludeId };
    const exists = await Model.findOne(query).lean();
    if (!exists) return slug;
    counter++;
    slug = `${base}-${counter}`;
  }
}

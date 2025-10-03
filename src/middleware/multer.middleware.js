import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image and video files are allowed!"), false);
  }
};

// dynamic size limit check
const limits = {
  fileSize: 150 * 1024 * 1024, // 150 MB max 
};

const upload = multer({
  storage,
  fileFilter,
  limits,
});

export default upload;

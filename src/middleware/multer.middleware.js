import multer from "multer";

const storage = multer.memoryStorage();

const filefilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage,
  fileFilter: filefilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export default upload;

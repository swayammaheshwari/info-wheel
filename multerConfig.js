const multer = require("multer");
const path = require("path");
const shortid = require("shortid");

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join("public", "uploads")); // Set the destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    const uniqueId = shortid.generate(); // Generate a unique ID
    const ext = path.extname(file.originalname); // Get the file extension
    const fileName = `${uniqueId}-${file.fieldname}${ext}`; // Construct the filename
    cb(null, fileName);
  },
});

// File filter configuration (accept only certain file types)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed."), false);
  }
};

// Initialize Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

module.exports = upload;

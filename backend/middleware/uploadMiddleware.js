const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadPath = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// =====================================
// STORAGE
// =====================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname).toLowerCase();

    cb(null, uniqueName);
  },
});

// =====================================
// PROFILE PHOTO - PNG ONLY
// =====================================

const profilePhotoFilter = (req, file, cb) => {
  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  if (extension !== ".png") {
    return cb(
      new Error("Only PNG images are allowed"),
      false
    );
  }

  cb(null, true);
};

// =====================================
// RESUME - PDF ONLY
// =====================================

const resumeFilter = (req, file, cb) => {
  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  if (extension !== ".pdf") {
    return cb(
      new Error("Only PDF files are allowed"),
      false
    );
  }

  cb(null, true);
};

// =====================================
// PROFILE PHOTO UPLOAD
// =====================================

const profilePhotoUpload = multer({
  storage: storage,
  fileFilter: profilePhotoFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// =====================================
// RESUME UPLOAD
// =====================================

const resumeUpload = multer({
  storage: storage,
  fileFilter: resumeFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// =====================================
// EXPORT
// =====================================

module.exports = {
  profilePhotoUpload,
  resumeUpload,
};
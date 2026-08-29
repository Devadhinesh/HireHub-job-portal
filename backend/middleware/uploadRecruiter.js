const multer = require("multer");
const path = require("path");
const fs = require("fs");

const profileDir = path.join(
  __dirname,
  "../uploads/recruiter/profile"
);

const companyDir = path.join(
  __dirname,
  "../uploads/recruiter/company"
);

fs.mkdirSync(profileDir, { recursive: true });
fs.mkdirSync(companyDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "profilePhoto") {
      cb(null, profileDir);
    } else if (file.fieldname === "companyLogo") {
      cb(null, companyDir);
    }
  },

  filename: (req, file, cb) => {
    const uniqueName =
      `${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${path.extname(file.originalname)}`;

    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only JPG, JPEG, PNG and WEBP images are allowed"
      ),
      false
    );
  }
};

const uploadRecruiterImages = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}).fields([
  {
    name: "profilePhoto",
    maxCount: 1,
  },
  {
    name: "companyLogo",
    maxCount: 1,
  },
]);

module.exports = uploadRecruiterImages;
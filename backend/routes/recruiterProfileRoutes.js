const express = require("express");
const { createRecruiterProfile, getMyRecruiterProfile, updateMyRecruiterProfile,
  deleteMyRecruiterProfile, getRecruiterProfileByUserId
} = require("../controllers/recruiterProfileController");
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");
const uploadRecruiterImages = require("../middleware/uploadRecruiter");

const router = express.Router();

router.post("/", authMiddleware, authorizeRoles("recruiter"), uploadRecruiterImages, createRecruiterProfile);
router.get("/me", authMiddleware, authorizeRoles("recruiter"), getMyRecruiterProfile);
router.get(
  "/public/:userId",
  authMiddleware,
  authorizeRoles("candidate", "recruiter"),
  getRecruiterProfileByUserId
);
router.put("/", authMiddleware, authorizeRoles("recruiter"), uploadRecruiterImages, updateMyRecruiterProfile);
router.delete("/", authMiddleware, authorizeRoles("recruiter"), deleteMyRecruiterProfile);

module.exports = router;
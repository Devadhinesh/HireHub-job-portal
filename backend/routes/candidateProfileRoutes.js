const express = require("express");
const { createProfile, getMyProfile, updateMyProfile,
  uploadProfilePhoto, uploadResume, deleteProfilePhoto,
  deleteResume, uploadCoverLetter, deleteCoverLetter,
  getCandidateProfileByUserId } = require("../controllers/candidateProfileController");
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");
const { profilePhotoUpload, resumeUpload } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/", authMiddleware, authorizeRoles("candidate"), createProfile);
router.get("/me", authMiddleware, authorizeRoles("candidate"), getMyProfile);
router.get("/public/:userId", authMiddleware, authorizeRoles("recruiter"), getCandidateProfileByUserId);
router.put("/", authMiddleware, authorizeRoles("candidate"), updateMyProfile);
router.post("/photo", authMiddleware, authorizeRoles("candidate"), profilePhotoUpload.single("profilePhoto"), uploadProfilePhoto);
router.post("/resume", authMiddleware, authorizeRoles("candidate"), resumeUpload.single("resume"), uploadResume);
router.delete("/photo", authMiddleware, authorizeRoles("candidate"), deleteProfilePhoto);
router.delete("/resume/:resumeId", authMiddleware, authorizeRoles("candidate"), deleteResume);
router.post("/cover-letter", authMiddleware, authorizeRoles("candidate"), resumeUpload.single("coverLetter"), uploadCoverLetter);
router.delete("/cover-letter", authMiddleware, authorizeRoles("candidate"), deleteCoverLetter);

module.exports = router;
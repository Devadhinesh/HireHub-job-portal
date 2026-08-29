const express = require("express");
const {
  createInterview,
  getRecruiterInterviews,
  getCandidateInterviews,
  getInterviewById,
  updateInterview,
  deleteInterview,
} = require("../controllers/interviewController");
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();
router.post("/", authMiddleware, authorizeRoles("recruiter"), createInterview);
router.get("/recruiter", authMiddleware, authorizeRoles("recruiter"), getRecruiterInterviews);
router.get("/candidate", authMiddleware, authorizeRoles("candidate"), getCandidateInterviews);
router.get("/:interviewId", authMiddleware, authorizeRoles("candidate", "recruiter"), getInterviewById);
router.put("/:interviewId", authMiddleware, authorizeRoles("recruiter"), updateInterview);
router.delete("/:interviewId", authMiddleware, authorizeRoles("recruiter"), deleteInterview);

module.exports = router;
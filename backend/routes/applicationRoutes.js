const express = require("express");
const { applyForJob, getMyApplications, getApplicationById, getRecruiterApplications, updateApplicationStatus, getApplicationByStatus } = require("../controllers/applicationController");
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, authorizeRoles("candidate"), applyForJob);
router.get("/my", authMiddleware, authorizeRoles("candidate"), getMyApplications);
router.get("/status", authMiddleware, authorizeRoles("recruiter"), getApplicationByStatus);
router.get("/recruiter", authMiddleware, authorizeRoles("recruiter"), getRecruiterApplications);
router.put("/:applicationId/status", authMiddleware, authorizeRoles("recruiter"), updateApplicationStatus);
router.get("/:applicationId", authMiddleware, authorizeRoles("candidate", "recruiter"), getApplicationById);

module.exports = router;
const express = require("express");
const { createJob, getAllJobs, getJobById, updateJob, deleteJob, getRecruiterJobs } = require("../controllers/jobController");
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getAllJobs); 
router.get("/recruiter", authMiddleware, authorizeRoles("recruiter"), getRecruiterJobs); 
router.get("/:jobId", getJobById); 
router.post("/", authMiddleware, authorizeRoles("recruiter"), createJob); 
router.put("/:jobId", authMiddleware, authorizeRoles("recruiter"), updateJob); 
router.delete("/:jobId", authMiddleware, authorizeRoles("recruiter"), deleteJob); 

module.exports = router;
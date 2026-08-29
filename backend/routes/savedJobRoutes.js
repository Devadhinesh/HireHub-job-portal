const express = require("express");
const { saveJob, getSavedJobs, removeSavedJob } = require("../controllers/savedJobController");
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, authorizeRoles("candidate"), saveJob);
router.get("/", authMiddleware, authorizeRoles("candidate"), getSavedJobs);
router.delete("/:jobId", authMiddleware, authorizeRoles("candidate"), removeSavedJob);

module.exports = router;
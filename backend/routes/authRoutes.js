const express = require("express");
const { register, login } = require("../controllers/authController");
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authMiddleware, (req, res) => { res.json({ message: "Profile access granted", user: req.user }); });
router.get("/candidate", authMiddleware, authorizeRoles("candidate"), (req, res) => { res.json({ message: "Candidate access granted", user: req.user }); });
router.get("/recruiter", authMiddleware, authorizeRoles("recruiter"), (req, res) => { res.json({ message: "Recruiter access granted", user: req.user }); });
router.get("/admin", authMiddleware, authorizeRoles("admin"), (req, res) => { res.json({ message: "Admin access granted", user: req.user }); });

module.exports = router;
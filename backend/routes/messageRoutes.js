const express = require("express");
const { sendMessage, getConversation, getMyMessages, markAsRead, deleteMessage } = require("../controllers/messageController");
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, authorizeRoles("candidate", "recruiter"), sendMessage);
router.get("/", authMiddleware, authorizeRoles("candidate", "recruiter"), getMyMessages);
router.get("/conversation/:userId", authMiddleware, authorizeRoles("candidate", "recruiter"), getConversation);
router.put("/:messageId/read", authMiddleware, authorizeRoles("candidate", "recruiter"), markAsRead);
router.delete("/:messageId", authMiddleware, authorizeRoles("candidate", "recruiter"), deleteMessage);

module.exports = router;
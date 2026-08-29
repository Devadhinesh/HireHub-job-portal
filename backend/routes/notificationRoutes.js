const express = require("express");
const { getMyNotifications, getUnreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead } = require("../controllers/notificationController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, getMyNotifications);
router.get("/unread-count", authMiddleware, getUnreadNotificationCount);
router.put("/:notificationId/read", authMiddleware, markNotificationAsRead);
router.put("/read-all", authMiddleware, markAllNotificationsAsRead);

module.exports = router;
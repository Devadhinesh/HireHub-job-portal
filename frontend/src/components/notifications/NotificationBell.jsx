import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { FiBell, FiMessageSquare, FiCheck, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./NotificationBell.css";

const SERVER_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const NOTIFICATION_API = `${SERVER_URL}/api/notifications`;

const NotificationBell = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const socketRef = useRef(null);
  const notificationRef = useRef(null);

  const getUserId = () => {
    return user?._id || user?.id || user?.userId || user?.user?._id || user?.user?.id;
  };

  const fetchNotifications = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await axios.get(NOTIFICATION_API, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = Array.isArray(response.data.notifications) ? response.data.notifications : [];
      setNotifications(data);
    } catch (error) {
      console.error("Fetch notifications error:", error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };


  const fetchUnreadCount = async () => {
    if (!token) return;

    try {
      const response = await axios.get(`${NOTIFICATION_API}/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUnreadCount(Number(response.data.count) || 0);
    } catch (error) {
      console.error("Unread notification error:", error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchNotifications();
    fetchUnreadCount();
  }, [token]);

  useEffect(() => {
    const userId = getUserId();
    if (!token || !userId) return;

    const socket = io(SERVER_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Notification Socket Connected:", socket.id);
      socket.emit("joinUser", userId.toString());
    });

    socket.on("newMessageNotification", (notification) => {
      console.log("New notification:", notification);
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    socket.on("connect_error", (error) => {
      console.error("Notification Socket Error:", error.message);
    });

    return () => {
      socket.off("newMessageNotification");
      socket.off("connect");
      socket.off("connect_error");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => setIsOpen((prev) => !prev);

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`${NOTIFICATION_API}/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (error) {
      console.error("Mark notification read error:", error.response?.data?.message || error.message);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) await markAsRead(notification._id);
    setIsOpen(false);
    navigate("/candidate/messages");
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${NOTIFICATION_API}/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Mark all notifications error:", error.response?.data?.message || error.message);
    }
  };

  const formatTime = (date) => {
    if (!date) return "";

    const messageDate = new Date(date);
    const now = new Date();
    const difference = now.getTime() - messageDate.getTime();
    const minutes = Math.floor(difference / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return messageDate.toLocaleDateString("en-IN");
  };

  const getSenderName = (notification) => notification?.sender?.name || "User";

  return (
    <div className="notification-wrapper" ref={notificationRef}>
      <button
        type="button"
        className={`notification-bell-btn ${isOpen ? "notification-bell-active" : ""}`}
        onClick={handleToggle}
        aria-label="Notifications"
      >
        <FiBell />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <div>
              <h3>Notifications</h3>
              <span>{unreadCount > 0 ? `${unreadCount} unread` : "No unread notifications"}</span>
            </div>
            <button type="button" className="notification-close-btn" onClick={() => setIsOpen(false)}>
              <FiX />
            </button>
          </div>

          {unreadCount > 0 && (
            <button type="button" className="mark-all-btn" onClick={markAllAsRead}>
              <FiCheck />
              Mark all as read
            </button>
          )}

          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <div className="notification-empty-icon">
                  <FiBell />
                </div>
                <h4>No notifications</h4>
                <p>You're all caught up.</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <button
                  type="button"
                  key={notification._id}
                  className={`notification-item ${!notification.isRead ? "notification-unread" : ""}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-item-icon">
                    <FiMessageSquare />
                  </div>

                  <div className="notification-item-content">
                    <div className="notification-item-title">
                      <strong>{getSenderName(notification)}</strong>
                      {!notification.isRead && <span className="notification-unread-dot" />}
                    </div>
                    <p>{notification.content || "You have a new message."}</p>
                    <small>{formatTime(notification.createdAt)}</small>
                  </div>
                </button>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/candidate/messages");
                }}
              >
                View all messages
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
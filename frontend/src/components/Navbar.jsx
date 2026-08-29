import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiLogIn, FiUserPlus, FiUser, FiLogOut, FiBell, FiX, FiMessageSquare, FiCheck } from "react-icons/fi";
import axios from "axios";
import { io } from "socket.io-client";
import { useAuth } from "./context/AuthContext";
import "./Navbar.css";

const CANDIDATE_API_URL = "http://localhost:5000/api/candidates/profile";
const RECRUITER_API_URL = "http://localhost:5000/api/recruiter-profile";
const NOTIFICATION_API_URL = "http://localhost:5000/api/notifications";
const SERVER_URL = "http://localhost:5000";
const SOCKET_URL = "http://localhost:5000";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, token, isAuthenticated, logout } = useAuth();

  const [candidateProfile, setCandidateProfile] = useState(null);
  const [recruiterProfile, setRecruiterProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [messageAlert, setMessageAlert] = useState(null);

  const getUserId = () => {
    return user?._id || user?.id || user?.userId || user?.user?._id || user?.user?.id;
  };

  const currentUserId = getUserId();

  const getPhotoUrl = (photo) => {
    if (!photo) return null;
    if (photo.startsWith("http")) return photo;
    if (photo.startsWith("/")) return `${SERVER_URL}${photo}`;
    return `${SERVER_URL}/${photo}`;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isAuthenticated || !token || !user?.role) return;

      try {
        if (user.role === "candidate") {
          const response = await axios.get(`${CANDIDATE_API_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          setCandidateProfile(response.data.profile);
        }

        if (user.role === "recruiter") {
          const response = await axios.get(`${RECRUITER_API_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          setRecruiterProfile(response.data.profile);
        }
      } catch (error) {
        console.error("Navbar profile error:", error);

        if (user.role === "candidate") {
          setCandidateProfile(null);
        }

        if (user.role === "recruiter") {
          setRecruiterProfile(null);
        }
      }
    };

    fetchProfile();
  }, [isAuthenticated, token, user]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!isAuthenticated || !token || !currentUserId) return;

      try {
        setLoadingNotifications(true);

        const response = await axios.get(NOTIFICATION_API_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const notificationData = Array.isArray(response.data.notifications)
          ? response.data.notifications
          : [];

        setNotifications(notificationData);
      } catch (error) {
        console.error(
          "Notification fetch error:",
          error.response?.data?.message || error.message
        );
      } finally {
        setLoadingNotifications(false);
      }
    };

    fetchNotifications();
  }, [isAuthenticated, token, currentUserId]);

  useEffect(() => {
    if (!isAuthenticated || !token || !currentUserId) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("Navbar socket connected:", socket.id);

      socket.emit("joinUser", currentUserId.toString());
    });

    socket.on("newMessageNotification", (notification) => {
      console.log("New message notification:", notification);

      const newNotification = {
        ...notification,
        isRead: false,
      };

      setNotifications((prev) => {
        const exists = prev.some(
          (item) => item._id === newNotification._id
        );

        if (exists) {
          return prev;
        }

        return [newNotification, ...prev];
      });

      setMessageAlert({
        title:
          newNotification.title ||
          `New message from ${newNotification.sender?.name || "User"}`,
        content:
          newNotification.content ||
          "You received a new message",
      });
    });

    socket.on("connect_error", (error) => {
      console.error("Navbar socket error:", error.message);
    });

    return () => {
      socket.off("newMessageNotification");
      socket.off("connect_error");
      socket.disconnect();
    };
  }, [isAuthenticated, token, currentUserId]);

  useEffect(() => {
    if (!messageAlert) return;

    const timer = setTimeout(() => {
      setMessageAlert(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [messageAlert]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  const markNotificationAsRead = async (notificationId) => {
    try {
      await axios.put(
        `${NOTIFICATION_API_URL}/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error(
        "Mark notification read error:",
        error.response?.data?.message || error.message
      );
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await axios.put(
        `${NOTIFICATION_API_URL}/read-all`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );
    } catch (error) {
      console.error(
        "Mark all notifications error:",
        error.response?.data?.message || error.message
      );
    }
  };

  const closeNotifications = () => {
    setShowNotifications(false);
  };

  const formatNotificationDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification._id);
    }

    setShowNotifications(false);
    setMessageAlert(null);

    if (notification.type === "message") {
      if (user?.role === "candidate") {
        navigate("/candidate/messages");
      }

      if (user?.role === "recruiter") {
        navigate("/recruiter/messages");
      }

      return;
    }
  };

  const handleMessageAlertClick = () => {
    setMessageAlert(null);

    if (user?.role === "candidate") {
      navigate("/candidate/messages");
    }

    if (user?.role === "recruiter") {
      navigate("/recruiter/messages");
    }
  };

  return (
    <nav className="navbar">
      {messageAlert && (
        <button
          type="button"
          className="message-alert"
          onClick={handleMessageAlertClick}
        >
          <div className="message-alert-icon">
            <FiMessageSquare />
          </div>

          <div className="message-alert-content">
            <strong>{messageAlert.title}</strong>
            <span>{messageAlert.content}</span>
          </div>

          <span
            className="message-alert-close"
            onClick={(event) => {
              event.stopPropagation();
              setMessageAlert(null);
            }}
          >
            <FiX />
          </span>
        </button>
      )}

      <div className="navbar-container">
        <Link to="/" className="logo">
          HireHub
        </Link>

        <div className="navbar-actions">
          {!isAuthenticated && (
            <>
              <Link to="/login" className="login-btn">
                <FiLogIn />
                <span>Login</span>
              </Link>

              <Link to="/register" className="register-btn">
                <FiUserPlus />
                <span>Register</span>
              </Link>
            </>
          )}

          {isAuthenticated && (
            <>
              <div className="notification-wrapper">
                <button
                  type="button"
                  className={`notification-btn ${
                    showNotifications ? "active" : ""
                  }`}
                  onClick={() =>
                    setShowNotifications((prev) => !prev)
                  }
                >
                  <FiBell />

                  {unreadCount > 0 && (
                    <span className="notification-badge">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="notification-dropdown">
                    <div className="notification-header">
                      <div>
                        <h3>Notifications</h3>

                        <span>
                          {unreadCount > 0
                            ? `${unreadCount} unread`
                            : "All caught up"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={closeNotifications}
                      >
                        <FiX />
                      </button>
                    </div>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        className="mark-all-read-btn"
                        onClick={markAllNotificationsAsRead}
                      >
                        <FiCheck />
                        Mark all as read
                      </button>
                    )}

                    {loadingNotifications && (
                      <div className="notification-empty">
                        <p>Loading notifications...</p>
                      </div>
                    )}

                    {!loadingNotifications &&
                      notifications.length === 0 && (
                        <div className="notification-empty">
                          <FiBell />
                          <p>No notifications</p>
                        </div>
                      )}

                    {!loadingNotifications &&
                      notifications.length > 0 && (
                        <div className="notification-list">
                          {notifications.slice(0, 10).map(
                            (notification) => (
                              <button
                                type="button"
                                key={notification._id}
                                className={`notification-item ${
                                  !notification.isRead
                                    ? "unread"
                                    : ""
                                }`}
                                onClick={() =>
                                  handleNotificationClick(
                                    notification
                                  )
                                }
                              >
                                <div className="notification-icon">
                                  <FiMessageSquare />
                                </div>

                                <div className="notification-content">
                                  <strong>
                                    {notification.sender?.name ||
                                      "New Message"}
                                  </strong>

                                  <p>
                                    {notification.content ||
                                      "You received a new message"}
                                  </p>

                                  <small>
                                    {formatNotificationDate(
                                      notification.createdAt
                                    )}
                                  </small>
                                </div>

                                {!notification.isRead && (
                                  <span className="notification-unread-dot" />
                                )}
                              </button>
                            )
                          )}
                        </div>
                      )}
                  </div>
                )}
              </div>

              {user?.role === "candidate" && (
                <Link
                  to="/candidate/profile"
                  className="candidate-navbar-profile"
                >
                  <div className="candidate-navbar-photo">
                    {getPhotoUrl(
                      candidateProfile?.profilePhoto
                    ) ? (
                      <img
                        src={getPhotoUrl(
                          candidateProfile.profilePhoto
                        )}
                        alt={
                          candidateProfile?.fullName ||
                          user?.name ||
                          "Candidate"
                        }
                      />
                    ) : (
                      <FiUser />
                    )}
                  </div>

                  <div className="candidate-navbar-info">
                    <strong>
                      {candidateProfile?.fullName ||
                        user?.name ||
                        "Candidate"}
                    </strong>

                    <span>Candidate</span>
                  </div>
                </Link>
              )}

              {user?.role === "recruiter" && (
                <Link
                  to="/recruiter/profile"
                  className="recruiter-navbar-profile"
                >
                  <div className="recruiter-navbar-photo">
                    {getPhotoUrl(
                      recruiterProfile?.profilePhoto
                    ) ? (
                      <img
                        src={getPhotoUrl(
                          recruiterProfile.profilePhoto
                        )}
                        alt={
                          recruiterProfile?.fullName ||
                          user?.name ||
                          "Recruiter"
                        }
                      />
                    ) : (
                      <FiUser />
                    )}
                  </div>

                  <div className="recruiter-navbar-info">
                    <strong>
                      {recruiterProfile?.fullName ||
                        user?.name ||
                        "Recruiter"}
                    </strong>

                    <span>
                      {recruiterProfile?.jobTitle ||
                        "Recruiter"}
                    </span>
                  </div>
                </Link>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="logout-btn"
              >
                <FiLogOut />
                <span>Logout</span>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
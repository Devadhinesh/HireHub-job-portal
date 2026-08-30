import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiSearch,
  FiHeart,
  FiFileText,
  FiCalendar,
  FiMessageSquare,
  FiUser,
  FiLogOut,
  FiX,
} from "react-icons/fi";
import { useAuth } from "../../components/context/AuthContext";
import "./CandidateSidebar.css";

const CandidateSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menuItems = [
    { path: "/candidate", label: "Dashboard", icon: <FiHome /> },
    { path: "/candidate/search-jobs", label: "Search Jobs", icon: <FiSearch /> },
    { path: "/candidate/saved-jobs", label: "Saved Jobs", icon: <FiHeart /> },
    { path: "/candidate/applications", label: "My Applications", icon: <FiFileText /> },
    { path: "/candidate/interviews", label: "Interviews", icon: <FiCalendar /> },
    { path: "/candidate/messages", label: "Messages", icon: <FiMessageSquare /> },
    { path: "/candidate/profile", label: "My Profile", icon: <FiUser /> },
  ];

  const handleLogout = () => {
    logout();
    onClose();
    navigate("/login");
  };

  return (
    <>
      {isOpen && (
        <div
          className="candidate-sidebar-overlay"
          onClick={onClose}
        />
      )}

      <aside className={`candidate-sidebar ${isOpen ? "sidebar-open" : ""}`}>
        <div className="candidate-sidebar-top">
          <h2>Candidate Menu</h2>

          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
          >
            <FiX />
          </button>
        </div>

        <nav className="candidate-sidebar-menu">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/candidate"}
              className={({ isActive }) =>
                `candidate-menu-item ${isActive ? "active" : ""}`
              }
              onClick={onClose}
            >
              <span className="menu-icon">
                {item.icon}
              </span>

              <span className="menu-label">
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="candidate-sidebar-footer">
          <button
            type="button"
            className="candidate-logout-btn"
            onClick={handleLogout}
          >
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default CandidateSidebar;
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FiHome, FiPlusSquare, FiBriefcase, FiFileText, FiCalendar, FiMessageSquare, FiUser, FiLogOut } from "react-icons/fi";
import { useAuth } from "../../components/context/AuthContext";
import "./RecruiterSidebar.css";

const menuItems = [
  { label: "Dashboard", icon: <FiHome />, path: "/recruiter" },
  { label: "Post Job", icon: <FiPlusSquare />, path: "/recruiter/post-job" },
  { label: "My Jobs", icon: <FiBriefcase />, path: "/recruiter/my-jobs" },
  { label: "Applications", icon: <FiFileText />, path: "/recruiter/applications" },
  { label: "Interviews", icon: <FiCalendar />, path: "/recruiter/interviews" },
  { label: "Messages", icon: <FiMessageSquare />, path: "/recruiter/messages" },
  { label: "My Profile", icon: <FiUser />, path: "/recruiter/profile" },
];

const RecruiterSidebar = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="recruiter-sidebar">
      <div className="recruiter-sidebar-menu">
        {menuItems.map(({ label, icon, path }) => (
          <NavLink key={label} to={path} end={path === "/recruiter"} className={({ isActive }) => `recruiter-sidebar-item ${isActive ? "active" : ""}`}>
            <span className="recruiter-sidebar-icon">{icon}</span>
            <span className="recruiter-sidebar-tooltip">{label}</span>
          </NavLink>
        ))}
      </div>

      <div className="recruiter-sidebar-bottom">
        <button type="button" className="recruiter-sidebar-item recruiter-sidebar-logout" onClick={handleLogout}>
          <span className="recruiter-sidebar-icon"><FiLogOut /></span>
          <span className="recruiter-sidebar-tooltip">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default RecruiterSidebar;
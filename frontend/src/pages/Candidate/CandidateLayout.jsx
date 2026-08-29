import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { FiMenu } from "react-icons/fi";
import CandidateSidebar from "./CandidateSidebar";
import "./CandidateLayout.css";

const CandidateLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="candidate-layout">
      <button
        type="button"
        className="candidate-menu-toggle"
        onClick={toggleSidebar}
        aria-label="Open Candidate Menu"
      >
        <FiMenu />
      </button>

      <CandidateSidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      <main className="candidate-main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default CandidateLayout;
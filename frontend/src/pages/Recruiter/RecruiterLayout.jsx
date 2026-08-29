import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import RecruiterSidebar from "./RecruiterSidebar";
import "./RecruiterLayout.css";

const RecruiterLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={`recruiter-layout ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
      <RecruiterSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <main className="recruiter-main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default RecruiterLayout;
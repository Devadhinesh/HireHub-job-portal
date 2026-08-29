import React, { useState } from "react";
import { FiUser, FiBriefcase, FiCode, FiBook, FiFileText, FiAward, FiFolder, FiLink } from "react-icons/fi";
import "./CandidateProfile.css";

import BasicInformation from "./profile/BasicInformation";
import ProfessionalSummary from "./profile/ProfessionalSummary";
import Skills from "./profile/Skills";
import WorkExperience from "./profile/WorkExperience";
import Education from "./profile/Education";
import Resume from "./profile/Resume";
import Certifications from "./profile/Certifications";
import Projects from "./profile/Projects";
import ProfileLinks from "./profile/ProfileLinks";

const CandidateProfile = () => {
    const [activeSection, setActiveSection] = useState("basic");

    const sections = [
        { id: "basic", label: "Basic Information", icon: <FiUser /> },
        { id: "professional", label: "Professional Summary", icon: <FiBriefcase /> },
        { id: "skills", label: "Skills", icon: <FiCode /> },
        { id: "experience", label: "Work Experience", icon: <FiBriefcase /> },
        { id: "education", label: "Education", icon: <FiBook /> },
        { id: "resume", label: "Resume & Documents", icon: <FiFileText /> },
        { id: "certifications", label: "Certifications", icon: <FiAward /> },
        { id: "projects", label: "Projects", icon: <FiFolder /> },
        { id: "links", label: "Links", icon: <FiLink /> }
    ];

    const renderSection = () => {
        switch (activeSection) {
            case "basic": return <BasicInformation />;
            case "professional": return <ProfessionalSummary />;
            case "skills": return <Skills />;
            case "experience": return <WorkExperience />;
            case "education": return <Education />;
            case "resume": return <Resume />;
            case "certifications": return <Certifications />;
            case "projects": return <Projects />;
            case "links": return <ProfileLinks />;
            default: return <BasicInformation />;
        }
    };

    return (
        <div className="candidate-profile-page">
            <aside className="profile-sidebar">
                <div className="sidebar-title">
                    <FiUser />
                    <h2>Profile</h2>
                </div>

                <div className="profile-menu">
                    {sections.map((section) => (
                        <button key={section.id} className={activeSection === section.id ? "profile-menu-item active" : "profile-menu-item"} onClick={() => setActiveSection(section.id)}>
                            {section.icon}
                            <span>{section.label}</span>
                        </button>
                    ))}
                </div>
            </aside>

            <main className="profile-content">
                {renderSection()}
            </main>
        </div>
    );
};

export default CandidateProfile;
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiPlus,
  FiTrash2,
  FiSave,
  FiFolder,
  FiFileText,
  FiCode,
  FiExternalLink,
  FiGithub,
} from "react-icons/fi";
import { useAuth } from "../../../components/context/AuthContext";
import "./Projects.css";

const API_URL = "http://localhost:5000/api/candidates/profile";

const Projects = () => {
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    techStack: "",
    projectUrl: "",
    githubUrl: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${API_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profile = response.data.profile;
        if (profile) {
          setProjects(profile.projects || []);
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          setError(error.response?.data?.message || "Failed to fetch projects");
        }
      }
    };
    if (token) fetchProjects();
  }, [token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage("");
    setError("");
  };

  const handleAddProject = () => {
    setMessage("");
    setError("");
    if (!formData.title.trim()) {
      setError("Project title is required");
      return;
    }
    if (!formData.description.trim()) {
      setError("Project description is required");
      return;
    }
    const newProject = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      techStack: formData.techStack
        .split(",")
        .map((tech) => tech.trim())
        .filter(Boolean),
      projectUrl: formData.projectUrl.trim(),
      githubUrl: formData.githubUrl.trim(),
    };
    setProjects((prev) => [...prev, newProject]);
    setFormData({
      title: "",
      description: "",
      techStack: "",
      projectUrl: "",
      githubUrl: "",
    });
    setShowForm(false);
  };

  const handleDeleteProject = async (index) => {
    const confirmed = window.confirm("Are you sure you want to delete this project?");
    if (!confirmed) return;
    setMessage("");
    setError("");
    try {
      const updatedProjects = projects.filter((_, projectIndex) => projectIndex !== index);
      const response = await axios.put(
        API_URL,
        { projects: updatedProjects },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProjects(response.data.profile?.projects || updatedProjects);
      setMessage("Project deleted successfully");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to delete project");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    if (projects.length === 0) {
      setError("Please add at least one project");
      return;
    }
    try {
      const response = await axios.put(
        API_URL,
        { projects },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProjects(response.data.profile?.projects || projects);
      setMessage("Projects saved successfully");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save projects");
    }
  };

  return (
    <div className="projects">
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
      <form className="projects-form" onSubmit={handleSubmit} autoComplete="off">
        {/* ADD PROJECT BUTTON */}
        {!showForm && (
          <div className="form-actions">
            <button
              type="button"
              className="add-project-btn"
              onClick={() => {
                setShowForm(true);
                setMessage("");
                setError("");
              }}
            >
              <FiPlus />
              Add Project
            </button>
          </div>
        )}
        {/* PROJECT FORM */}
        {showForm && (
          <>
            {/* PROJECT TITLE */}
            <div className="form-group">
              <label htmlFor="title">
                <FiFolder />
                Project Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                placeholder="e.g. HireHub Job Portal"
                value={formData.title}
                onChange={handleChange}
              />
            </div>
            {/* DESCRIPTION */}
            <div className="form-group">
              <label htmlFor="description">
                <FiFileText />
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows="5"
                placeholder="Describe your project..."
                value={formData.description}
                onChange={handleChange}
              />
            </div>
            {/* TECH STACK */}
            <div className="form-group">
              <label htmlFor="techStack">
                <FiCode />
                Tech Stack
              </label>
              <input
                type="text"
                id="techStack"
                name="techStack"
                placeholder="React, Node.js, Express, MongoDB"
                value={formData.techStack}
                onChange={handleChange}
              />
              <span className="input-hint">Separate technologies with commas.</span>
            </div>
            {/* PROJECT URLS */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="projectUrl">
                  <FiExternalLink />
                  Project URL
                </label>
                <input
                  type="url"
                  id="projectUrl"
                  name="projectUrl"
                  placeholder="https://..."
                  value={formData.projectUrl}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="githubUrl">
                  <FiGithub />
                  GitHub URL
                </label>
                <input
                  type="url"
                  id="githubUrl"
                  name="githubUrl"
                  placeholder="https://github.com/..."
                  value={formData.githubUrl}
                  onChange={handleChange}
                />
              </div>
            </div>
            {/* FORM BUTTONS */}
            <div className="form-actions">
              <button type="button" className="add-project-btn" onClick={handleAddProject}>
                <FiPlus />
                Add Project
              </button>
              <button
                type="button"
                className="cancel-project-btn"
                onClick={() => {
                  setShowForm(false);
                  setError("");
                  setFormData({
                    title: "",
                    description: "",
                    techStack: "",
                    projectUrl: "",
                    githubUrl: "",
                  });
                }}
              >
                Cancel
              </button>
            </div>
          </>
        )}
        {/* PROJECT LIST */}
        <div className="projects-list">
          {projects.length === 0 ? (
            <p className="no-projects">No projects added yet.</p>
          ) : (
            projects.map((project, index) => (
              <div className="project-card" key={project._id || index}>
                <div className="project-icon">
                  <FiFolder />
                </div>
                <div className="project-content">
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  {/* TECH STACK */}
                  {project.techStack?.length > 0 && (
                    <div className="tech-stack">
                      {project.techStack.map((tech, techIndex) => (
                        <span key={techIndex}>{tech}</span>
                      ))}
                    </div>
                  )}
                  {/* PROJECT LINKS */}
                  {(project.projectUrl || project.githubUrl) && (
                    <div className="project-links">
                      {project.projectUrl && (
                        <a
                          href={project.projectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="project-link"
                        >
                          <FiExternalLink />
                          Live Demo
                        </a>
                      )}
                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="project-link"
                        >
                          <FiGithub />
                          Source Code
                        </a>
                      )}
                    </div>
                  )}
                </div>
                {/* DELETE */}
                <button
                  type="button"
                  className="delete-project-btn"
                  onClick={() => handleDeleteProject(index)}
                >
                  <FiTrash2 />
                </button>
              </div>
            ))
          )}
        </div>
        {/* SAVE */}
        {projects.length > 0 && (
          <div className="form-actions">
            <button type="submit" className="save-profile-btn">
              <FiSave />
              Save Projects
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default Projects;
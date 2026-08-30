import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiSave,
  FiGlobe,
  FiGithub,
  FiLinkedin,
  FiLink,
} from "react-icons/fi";
import { useAuth } from "../../../components/context/AuthContext";
import "./ProfileLinks.css";

const API_URL =
  `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/candidates/profile`;

const ProfileLinks = () => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    portfolio: "",
    github: "",
    linkedin: "",
    personalWebsite: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfileLinks = async () => {
      try {
        const response = await axios.get(`${API_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profile = response.data.profile;
        if (profile) {
          setFormData({
            portfolio: profile.portfolioUrl || "",
            github: profile.githubUrl || "",
            linkedin: profile.linkedinUrl || "",
            personalWebsite: profile.personalWebsite || "",
          });
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          setError(error.response?.data?.message || "Failed to fetch profile links");
        }
      }
    };
    if (token) fetchProfileLinks();
  }, [token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      const response = await axios.put(
        API_URL,
        {
          portfolioUrl: formData.portfolio,
          githubUrl: formData.github,
          linkedinUrl: formData.linkedin,
          personalWebsite: formData.personalWebsite,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const profile = response.data.profile;
      setFormData({
        portfolio: profile?.portfolioUrl || formData.portfolio,
        github: profile?.githubUrl || formData.github,
        linkedin: profile?.linkedinUrl || formData.linkedin,
        personalWebsite: profile?.personalWebsite || formData.personalWebsite,
      });
      setMessage("Profile links saved successfully");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save profile links");
    }
  };

  return (
    <div className="profile-links">
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
      <form className="profile-links-form" onSubmit={handleSubmit} autoComplete="off">
        {/* PORTFOLIO */}
        <div className="form-group">
          <label htmlFor="portfolio">
            <FiGlobe />
            Portfolio
          </label>
          <div className="link-input">
            <FiGlobe />
            <input
              type="url"
              id="portfolio"
              name="portfolio"
              placeholder="https://yourportfolio.com"
              value={formData.portfolio}
              onChange={handleChange}
            />
          </div>
        </div>
        {/* GITHUB */}
        <div className="form-group">
          <label htmlFor="github">
            <FiGithub />
            GitHub
          </label>
          <div className="link-input">
            <FiGithub />
            <input
              type="url"
              id="github"
              name="github"
              placeholder="https://github.com/username"
              value={formData.github}
              onChange={handleChange}
            />
          </div>
        </div>
        {/* LINKEDIN */}
        <div className="form-group">
          <label htmlFor="linkedin">
            <FiLinkedin />
            LinkedIn
          </label>
          <div className="link-input">
            <FiLinkedin />
            <input
              type="url"
              id="linkedin"
              name="linkedin"
              placeholder="https://linkedin.com/in/username"
              value={formData.linkedin}
              onChange={handleChange}
            />
          </div>
        </div>
        {/* PERSONAL WEBSITE */}
        <div className="form-group">
          <label htmlFor="personalWebsite">
            <FiLink />
            Personal Website
          </label>
          <div className="link-input">
            <FiLink />
            <input
              type="url"
              id="personalWebsite"
              name="personalWebsite"
              placeholder="https://example.com"
              value={formData.personalWebsite}
              onChange={handleChange}
            />
          </div>
        </div>
        {/* SAVE */}
        <div className="form-actions">
          <button type="submit" className="save-profile-btn">
            <FiSave />
            Save Links
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileLinks;
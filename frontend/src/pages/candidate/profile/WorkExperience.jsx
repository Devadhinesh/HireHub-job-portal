import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiPlus, FiTrash2, FiSave, FiBriefcase, FiUser, FiMapPin, FiSettings, FiCalendar, FiFileText, FiClock } from "react-icons/fi";
import { useAuth } from "../../../components/context/AuthContext";
import "./WorkExperience.css";

const API_URL =
  `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/candidates/profile`;
const initialFormData = {
  companyName: "", jobTitle: "", location: "", startDate: "",
  endDate: "", currentlyWorking: false, description: "", employmentType: "",
};

const WorkExperience = () => {
  const { token } = useAuth();
  const [experience, setExperience] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    const fetchExperience = async () => {
      try {
        const res = await axios.get(`${API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data.profile) setExperience(res.data.profile.experience || []);
      } catch (err) {
        if (err.response?.status !== 404) setError(err.response?.data?.message || "Failed to fetch work experience");
      }
    };
    fetchExperience();
  }, [token]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
    setMessage(""); setError("");
  };

  const handleAddExperience = () => {
    setMessage(""); setError("");
    if (!formData.companyName.trim()) return setError("Company name is required");
    if (!formData.jobTitle.trim()) return setError("Job title is required");
    if (!formData.startDate) return setError("Start date is required");
    if (!formData.currentlyWorking && !formData.endDate) return setError("End date is required");

    const newExperience = {
      ...formData,
      companyName: formData.companyName.trim(),
      jobTitle: formData.jobTitle.trim(),
      location: formData.location.trim(),
      endDate: formData.currentlyWorking ? "" : formData.endDate,
      description: formData.description.trim(),
    };

    setExperience((prev) => [...prev, newExperience]);
    setFormData(initialFormData);
    setShowForm(false);
    setMessage("Experience added successfully");
  };

  const handleDeleteExperience = async (index) => {
    if (!window.confirm("Are you sure you want to delete this experience?")) return;
    setMessage(""); setError("");

    try {
      const updated = experience.filter((_, i) => i !== index);
      const res = await axios.put(API_URL, { experience: updated }, { headers: { Authorization: `Bearer ${token}` } });
      setExperience(res.data.profile?.experience || updated);
      setMessage("Experience deleted successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete experience");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(""); setError("");
    if (experience.length === 0) return setError("Please add at least one work experience");

    try {
      const res = await axios.put(API_URL, { experience }, { headers: { Authorization: `Bearer ${token}` } });
      setExperience(res.data.profile?.experience || experience);
      setMessage("Work experience saved successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save work experience");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setError("");
    setFormData(initialFormData);
  };

  return (
    <div className="work-experience">
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <form className="work-experience-form" onSubmit={handleSubmit} autoComplete="off">

        {!showForm && (
          <div className="form-actions">
            <button type="button" className="add-experience-btn" onClick={() => { setShowForm(true); setMessage(""); setError(""); }}>
              <FiPlus /> Add Experience
            </button>
          </div>
        )}

        {showForm && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="companyName"><FiBriefcase /> Company Name</label>
                <input type="text" id="companyName" name="companyName" placeholder="Enter company name" value={formData.companyName} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="jobTitle"><FiUser /> Job Title</label>
                <input type="text" id="jobTitle" name="jobTitle" placeholder="e.g. MERN Full Stack Developer" value={formData.jobTitle} onChange={handleChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="location"><FiMapPin /> Location</label>
                <input type="text" id="location" name="location" placeholder="e.g. Coimbatore, Tamil Nadu" value={formData.location} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="employmentType"><FiSettings /> Employment Type</label>
                <select id="employmentType" name="employmentType" value={formData.employmentType} onChange={handleChange}>
                  <option value="">Select Employment Type</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startDate"><FiCalendar /> Start Date</label>
                <input type="date" id="startDate" name="startDate" value={formData.startDate} onChange={handleChange} />
              </div>
              {!formData.currentlyWorking && (
                <div className="form-group">
                  <label htmlFor="endDate"><FiCalendar /> End Date</label>
                  <input type="date" id="endDate" name="endDate" value={formData.endDate} onChange={handleChange} />
                </div>
              )}
            </div>

            <div className="checkbox-group">
              <input type="checkbox" id="currentlyWorking" name="currentlyWorking" checked={formData.currentlyWorking} onChange={handleChange} />
              <label htmlFor="currentlyWorking">I currently work here</label>
            </div>

            <div className="form-group full-width">
              <label htmlFor="description"><FiFileText /> Description / Responsibilities</label>
              <textarea id="description" name="description" rows="5" placeholder="Describe your responsibilities, achievements, and work..." value={formData.description} onChange={handleChange} />
            </div>

            <div className="form-actions">
              <button type="button" className="add-experience-btn" onClick={handleAddExperience}><FiPlus /> Add Experience</button>
              <button type="button" className="cancel-experience-btn" onClick={handleCancel}>Cancel</button>
            </div>
          </>
        )}

        <div className="experience-list">
          {experience.length === 0 ? (
            <p className="no-experience">No work experience added yet.</p>
          ) : (
            experience.map((item, index) => (
              <div className="experience-card" key={index}>
                <div className="experience-icon"><FiBriefcase /></div>

                <div className="experience-content">
                  <div className="experience-header">
                    <div>
                      <h3>{item.jobTitle}</h3>
                      <h4>{item.companyName}</h4>
                    </div>
                    {item.currentlyWorking && <span className="current-badge">Current</span>}
                  </div>

                  <div className="experience-meta">
                    {item.location && <span className="meta-item"><FiMapPin /> {item.location}</span>}
                    <span className="meta-item"><FiClock /> {item.startDate} - {item.currentlyWorking ? "Present" : item.endDate}</span>
                    {item.employmentType && <span className="meta-item type-tag">{item.employmentType}</span>}
                  </div>

                  {item.description && <p className="experience-description">{item.description}</p>}
                </div>

                <button type="button" className="delete-experience-btn" onClick={() => handleDeleteExperience(index)}>
                  <FiTrash2 />
                </button>
              </div>
            ))
          )}
        </div>

        {experience.length > 0 && (
          <div className="form-actions">
            <button type="submit" className="save-profile-btn"><FiSave /> Save Experience</button>
          </div>
        )}

      </form>
    </div>
  );
};

export default WorkExperience;
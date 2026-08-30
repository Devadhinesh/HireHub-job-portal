import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiPlus,
  FiTrash2,
  FiSave,
  FiHome,
  FiAward,
  FiBook,
  FiCalendar,
  FiStar,
} from "react-icons/fi";
import { useAuth } from "../../../components/context/AuthContext";
import "./Education.css";

const API_URL =
  `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/candidates/profile`;

const Education = () => {
  const { token } = useAuth();
  const [education, setEducation] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    institution: "",
    degree: "",
    fieldOfStudy: "",
    startYear: "",
    endYear: "",
    currentlyStudying: false,
    grade: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // GET EDUCATION
  useEffect(() => {
    const fetchEducation = async () => {
      try {
        const response = await axios.get(`${API_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profile = response.data.profile;
        if (profile) {
          setEducation(profile.education || []);
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          setError(error.response?.data?.message || "Failed to fetch education");
        }
      }
    };
    if (token) {
      fetchEducation();
    }
  }, [token]);

  // HANDLE INPUT CHANGE
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    setMessage("");
    setError("");
  };

  // ADD EDUCATION
  const handleAddEducation = () => {
    setMessage("");
    setError("");
    if (!formData.institution.trim()) {
      setError("Institution is required");
      return;
    }
    if (!formData.degree.trim()) {
      setError("Degree is required");
      return;
    }
    if (!formData.fieldOfStudy.trim()) {
      setError("Field of study is required");
      return;
    }
    if (!formData.startYear) {
      setError("Start year is required");
      return;
    }
    if (!formData.currentlyStudying && !formData.endYear) {
      setError("End year is required");
      return;
    }
    const newEducation = {
      ...formData,
      institution: formData.institution.trim(),
      degree: formData.degree.trim(),
      fieldOfStudy: formData.fieldOfStudy.trim(),
      endYear: formData.currentlyStudying ? "" : formData.endYear,
      grade: formData.grade.trim(),
    };
    setEducation((prev) => [...prev, newEducation]);
    setFormData({
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startYear: "",
      endYear: "",
      currentlyStudying: false,
      grade: "",
    });
    setShowForm(false);
  };

  // DELETE EDUCATION
  const handleDeleteEducation = async (index) => {
    const confirmed = window.confirm("Are you sure you want to delete this education?");
    if (!confirmed) {
      return;
    }
    setMessage("");
    setError("");
    try {
      const updatedEducation = education.filter((_, educationIndex) => educationIndex !== index);
      const response = await axios.put(
        API_URL,
        { education: updatedEducation },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEducation(response.data.profile?.education || updatedEducation);
      setMessage("Education deleted successfully");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to delete education");
    }
  };

  // SAVE EDUCATION
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    if (education.length === 0) {
      setError("Please add at least one education");
      return;
    }
    try {
      const response = await axios.put(
        API_URL,
        { education },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEducation(response.data.profile?.education || education);
      setMessage("Education saved successfully");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save education");
    }
  };

  // YEAR OPTIONS
  const years = Array.from({ length: 50 }, (_, index) => new Date().getFullYear() - index);

  return (
    <div className="education">
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
      <form className="education-form" onSubmit={handleSubmit} autoComplete="off">
        {/* ADD EDUCATION BUTTON */}
        {!showForm && (
          <div className="form-actions">
            <button
              type="button"
              className="add-education-btn"
              onClick={() => {
                setShowForm(true);
                setError("");
                setMessage("");
              }}
            >
              <FiPlus />
              Add Education
            </button>
          </div>
        )}

        {/* EDUCATION FORM */}
        {showForm && (
          <>
            {/* INSTITUTION */}
            <div className="form-group full-width">
              <label htmlFor="institution">
                <FiHome />
                Institution
              </label>
              <input
                type="text"
                id="institution"
                name="institution"
                placeholder="e.g. KSR Institute of Engineering and Technology"
                value={formData.institution}
                onChange={handleChange}
              />
            </div>

            {/* DEGREE + FIELD */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="degree">
                  <FiAward />
                  Degree
                </label>
                <input
                  type="text"
                  id="degree"
                  name="degree"
                  placeholder="e.g. B.Tech"
                  value={formData.degree}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="fieldOfStudy">
                  <FiBook />
                  Field of Study
                </label>
                <input
                  type="text"
                  id="fieldOfStudy"
                  name="fieldOfStudy"
                  placeholder="e.g. Information Technology"
                  value={formData.fieldOfStudy}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* START + END YEAR */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startYear">
                  <FiCalendar />
                  Start Year
                </label>
                <select id="startYear" name="startYear" value={formData.startYear} onChange={handleChange}>
                  <option value="">Select Start Year</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              {!formData.currentlyStudying && (
                <div className="form-group">
                  <label htmlFor="endYear">
                    <FiCalendar />
                    End Year
                  </label>
                  <select id="endYear" name="endYear" value={formData.endYear} onChange={handleChange}>
                    <option value="">Select End Year</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* CURRENTLY STUDYING */}
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="currentlyStudying"
                name="currentlyStudying"
                checked={formData.currentlyStudying}
                onChange={handleChange}
              />
              <label htmlFor="currentlyStudying">I am currently studying here</label>
            </div>

            {/* GRADE */}
            <div className="form-group full-width">
              <label htmlFor="grade">
                <FiStar />
                Grade / CGPA
              </label>
              <input
                type="text"
                id="grade"
                name="grade"
                placeholder="e.g. 8.5 CGPA"
                value={formData.grade}
                onChange={handleChange}
              />
            </div>

            {/* FORM BUTTONS */}
            <div className="form-actions">
              <button type="button" className="add-education-btn" onClick={handleAddEducation}>
                <FiPlus />
                Add Education
              </button>
              <button
                type="button"
                className="cancel-education-btn"
                onClick={() => {
                  setShowForm(false);
                  setError("");
                  setFormData({
                    institution: "",
                    degree: "",
                    fieldOfStudy: "",
                    startYear: "",
                    endYear: "",
                    currentlyStudying: false,
                    grade: "",
                  });
                }}
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {/* EDUCATION LIST */}
        <div className="education-list">
          {education.length === 0 ? (
            <p className="no-education">No education added yet.</p>
          ) : (
            education.map((item, index) => (
              <div className="education-card" key={index}>
                <div className="education-icon">
                  <FiAward />
                </div>
                <div className="education-content">
                  <div className="education-header">
                    <div>
                      <h3>{item.degree}</h3>
                      <h4>{item.institution}</h4>
                    </div>
                    {item.currentlyStudying && <span className="current-badge">Ongoing</span>}
                  </div>
                  <div className="education-meta">
                    <span className="meta-item">
                      <FiBook />
                      {item.fieldOfStudy}
                    </span>
                    <span className="meta-item">
                      <FiCalendar />
                      {item.startYear} - {item.currentlyStudying ? "Present" : item.endYear}
                    </span>
                    {item.grade && (
                      <span className="meta-item grade-tag">
                        <FiStar />
                        {item.grade}
                      </span>
                    )}
                  </div>
                </div>
                <button type="button" className="delete-education-btn" onClick={() => handleDeleteEducation(index)}>
                  <FiTrash2 />
                </button>
              </div>
            ))
          )}
        </div>

        {/* SAVE */}
        {education.length > 0 && (
          <div className="form-actions">
            <button type="submit" className="save-profile-btn">
              <FiSave />
              Save Education
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default Education;
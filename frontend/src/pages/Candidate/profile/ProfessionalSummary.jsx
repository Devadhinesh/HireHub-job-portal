import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiSave, FiFileText, FiBriefcase, FiClock, FiCalendar, FiDollarSign, FiSettings } from "react-icons/fi";
import { useAuth } from "../../../components/context/AuthContext";
import "./ProfessionalSummary.css";

const API_URL = "http://localhost:5000/api/candidates/profile";

const ProfessionalSummary = () => {
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    bio: "",
    currentJobTitle: "",
    currentCompany: "",
    yearsOfExperience: "",
    noticePeriod: "",
    availabilityDate: "",
    expectedSalaryMin: "",
    expectedSalaryMax: "",
    employmentType: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // GET PROFILE
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API_URL}/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const profile = response.data.profile;

        if (profile) {
          setFormData({
            bio: profile.bio || "",
            currentJobTitle: profile.currentJobTitle || "",
            currentCompany: profile.currentCompany || "",
            yearsOfExperience: profile.totalExperience ?? "",
            noticePeriod: profile.noticePeriod || "",
            availabilityDate: profile.availabilityDate ? profile.availabilityDate.split("T")[0] : "",
            expectedSalaryMin: profile.expectedSalary?.min ?? "",
            expectedSalaryMax: profile.expectedSalary?.max ?? "",
            employmentType: profile.employmentTypePreference?.[0] || "",
          });
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          setError(error.response?.data?.message || "Failed to fetch professional summary");
        }
      }
    };

    if (token) {
      fetchProfile();
    }
  }, [token]);

  // HANDLE CHANGE
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setMessage("");
    setError("");
  };

  // SAVE
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    try {
      const data = {
        bio: formData.bio,
        currentJobTitle: formData.currentJobTitle,
        currentCompany: formData.currentCompany,
        totalExperience: formData.yearsOfExperience ? Number(formData.yearsOfExperience) : 0,
        noticePeriod: formData.noticePeriod,
        availabilityDate: formData.availabilityDate || null,
        expectedSalary: {
          min: formData.expectedSalaryMin ? Number(formData.expectedSalaryMin) : undefined,
          max: formData.expectedSalaryMax ? Number(formData.expectedSalaryMax) : undefined,
        },
        employmentTypePreference: formData.employmentType ? [formData.employmentType] : [],
      };

      const response = await axios.put(API_URL, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const profile = response.data.profile;

      setFormData({
        bio: profile.bio || "",
        currentJobTitle: profile.currentJobTitle || "",
        currentCompany: profile.currentCompany || "",
        yearsOfExperience: profile.totalExperience ?? "",
        noticePeriod: profile.noticePeriod || "",
        availabilityDate: profile.availabilityDate ? profile.availabilityDate.split("T")[0] : "",
        expectedSalaryMin: profile.expectedSalary?.min ?? "",
        expectedSalaryMax: profile.expectedSalary?.max ?? "",
        employmentType: profile.employmentTypePreference?.[0] || "",
      });

      setMessage("Professional summary saved successfully");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save professional summary");
    }
  };

  return (
    <div className="professional-summary">

      {message && <div className="success-message">{message}</div>}

      {error && <div className="error-message">{error}</div>}

      <form className="professional-summary-form" onSubmit={handleSubmit} autoComplete="off">

        <div className="form-group full-width">
          <label htmlFor="bio"><FiFileText /> Bio / About</label>

          <textarea id="bio" name="bio" placeholder="Write a short professional summary about yourself..." value={formData.bio} onChange={handleChange} rows="5" />
        </div>

        <div className="form-row">

          <div className="form-group">
            <label htmlFor="currentJobTitle"><FiBriefcase /> Current Job Title</label>

            <input type="text" id="currentJobTitle" name="currentJobTitle" placeholder="e.g. MERN Full Stack Developer" value={formData.currentJobTitle} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="currentCompany"><FiBriefcase /> Current Company</label>

            <input type="text" id="currentCompany" name="currentCompany" placeholder="Enter company name" value={formData.currentCompany} onChange={handleChange} />
          </div>

        </div>

        <div className="form-row">

          <div className="form-group">
            <label htmlFor="yearsOfExperience"><FiClock /> Total Years of Experience</label>

            <input type="number" id="yearsOfExperience" name="yearsOfExperience" placeholder="e.g. 2" min="0" step="0.1" value={formData.yearsOfExperience} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="noticePeriod"><FiClock /> Notice Period</label>

            <select id="noticePeriod" name="noticePeriod" value={formData.noticePeriod} onChange={handleChange}>
              <option value="">Select Notice Period</option>
              <option value="Immediate">Immediate</option>
              <option value="15 Days">15 Days</option>
              <option value="30 Days">30 Days</option>
              <option value="60 Days">60 Days</option>
              <option value="90 Days">90 Days</option>
            </select>
          </div>

        </div>

        <div className="form-row">

          <div className="form-group">
            <label htmlFor="availabilityDate"><FiCalendar /> Availability Date</label>

            <input type="date" id="availabilityDate" name="availabilityDate" value={formData.availabilityDate} onChange={handleChange} />
          </div>

        </div>

        <div className="salary-section">

          <h3><FiDollarSign /> Expected Salary</h3>

          <div className="form-row">

            <div className="form-group">
              <label htmlFor="expectedSalaryMin">Minimum Salary</label>

              <input type="number" id="expectedSalaryMin" name="expectedSalaryMin" placeholder="e.g. 300000" min="0" value={formData.expectedSalaryMin} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label htmlFor="expectedSalaryMax">Maximum Salary</label>

              <input type="number" id="expectedSalaryMax" name="expectedSalaryMax" placeholder="e.g. 500000" min="0" value={formData.expectedSalaryMax} onChange={handleChange} />
            </div>

          </div>

        </div>

        <div className="form-group full-width">

          <label htmlFor="employmentType"><FiSettings /> Employment Type Preference</label>

          <select id="employmentType" name="employmentType" value={formData.employmentType} onChange={handleChange}>
            <option value="">Select Employment Type</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
            <option value="Remote">Remote</option>
          </select>

        </div>

        <div className="form-actions">

          <button type="submit" className="save-profile-btn">
            <FiSave />
            Save Information
          </button>

        </div>

      </form>

    </div>
  );
};

export default ProfessionalSummary;
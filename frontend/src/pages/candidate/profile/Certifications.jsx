import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiPlus,
  FiTrash2,
  FiSave,
  FiAward,
  FiHome,
  FiCalendar,
  FiLink,
  FiExternalLink,
} from "react-icons/fi";
import { useAuth } from "../../../components/context/AuthContext";
import "./Certifications.css";

const API_URL = "http://localhost:5000/api/candidates/profile";

const Certifications = () => {
  const { token } = useAuth();
  const [certifications, setCertifications] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    issuingOrganization: "",
    issueDate: "",
    expiryDate: "",
    credentialUrl: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCertifications = async () => {
      try {
        const response = await axios.get(`${API_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profile = response.data.profile;
        if (profile) {
          setCertifications(profile.certifications || []);
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          setError(error.response?.data?.message || "Failed to fetch certifications");
        }
      }
    };
    if (token) fetchCertifications();
  }, [token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage("");
    setError("");
  };

  const handleAddCertification = () => {
    setMessage("");
    setError("");
    if (!formData.name.trim()) {
      setError("Certification name is required");
      return;
    }
    if (!formData.issuingOrganization.trim()) {
      setError("Issuing organization is required");
      return;
    }
    if (!formData.issueDate) {
      setError("Issue date is required");
      return;
    }
    const newCertification = {
      ...formData,
      name: formData.name.trim(),
      issuingOrganization: formData.issuingOrganization.trim(),
      credentialUrl: formData.credentialUrl.trim(),
    };
    setCertifications((prev) => [...prev, newCertification]);
    setFormData({
      name: "",
      issuingOrganization: "",
      issueDate: "",
      expiryDate: "",
      credentialUrl: "",
    });
    setShowForm(false);
  };

  const handleDeleteCertification = async (index) => {
    const confirmed = window.confirm("Are you sure you want to delete this certification?");
    if (!confirmed) return;
    setMessage("");
    setError("");
    try {
      const updatedCertifications = certifications.filter(
        (_, certificationIndex) => certificationIndex !== index
      );
      const response = await axios.put(
        API_URL,
        { certifications: updatedCertifications },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCertifications(response.data.profile?.certifications || updatedCertifications);
      setMessage("Certification deleted successfully");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to delete certification");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    if (certifications.length === 0) {
      setError("Please add at least one certification");
      return;
    }
    try {
      const response = await axios.put(
        API_URL,
        { certifications },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCertifications(response.data.profile?.certifications || certifications);
      setMessage("Certifications saved successfully");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save certifications");
    }
  };

  return (
    <div className="certifications">
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
      <form className="certifications-form" onSubmit={handleSubmit} autoComplete="off">
        {/* ADD BUTTON */}
        {!showForm && (
          <div className="form-actions">
            <button
              type="button"
              className="add-certification-btn"
              onClick={() => {
                setShowForm(true);
                setMessage("");
                setError("");
              }}
            >
              <FiPlus />
              Add Certification
            </button>
          </div>
        )}
        {/* FORM */}
        {showForm && (
          <>
            {/* CERTIFICATION NAME */}
            <div className="form-group">
              <label htmlFor="name">
                <FiAward />
                Certification Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="e.g. AWS Certified Cloud Practitioner"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            {/* ISSUING ORGANIZATION */}
            <div className="form-group">
              <label htmlFor="issuingOrganization">
                <FiHome />
                Issuing Organization
              </label>
              <input
                type="text"
                id="issuingOrganization"
                name="issuingOrganization"
                placeholder="e.g. Amazon Web Services"
                value={formData.issuingOrganization}
                onChange={handleChange}
              />
            </div>
            {/* DATES */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="issueDate">
                  <FiCalendar />
                  Issue Date
                </label>
                <input
                  type="date"
                  id="issueDate"
                  name="issueDate"
                  value={formData.issueDate}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="expiryDate">
                  <FiCalendar />
                  Expiry Date
                </label>
                <input
                  type="date"
                  id="expiryDate"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                />
              </div>
            </div>
            {/* CREDENTIAL URL */}
            <div className="form-group">
              <label htmlFor="credentialUrl">
                <FiLink />
                Credential URL
              </label>
              <input
                type="url"
                id="credentialUrl"
                name="credentialUrl"
                placeholder="https://..."
                value={formData.credentialUrl}
                onChange={handleChange}
              />
            </div>
            {/* FORM BUTTONS */}
            <div className="form-actions">
              <button
                type="button"
                className="add-certification-btn"
                onClick={handleAddCertification}
              >
                <FiPlus />
                Add Certification
              </button>
              <button
                type="button"
                className="cancel-certification-btn"
                onClick={() => {
                  setShowForm(false);
                  setError("");
                  setFormData({
                    name: "",
                    issuingOrganization: "",
                    issueDate: "",
                    expiryDate: "",
                    credentialUrl: "",
                  });
                }}
              >
                Cancel
              </button>
            </div>
          </>
        )}
        {/* CERTIFICATION LIST */}
        <div className="certifications-list">
          {certifications.length === 0 ? (
            <p className="no-certifications">No certifications added yet.</p>
          ) : (
            certifications.map((item, index) => (
              <div className="certification-card" key={item._id || index}>
                <div className="certification-icon">
                  <FiAward />
                </div>
                <div className="certification-content">
                  <h3>{item.name}</h3>
                  <h4>{item.issuingOrganization}</h4>
                  <div className="certification-meta">
                    <span className="meta-item">
                      <FiCalendar />
                      Issued: {item.issueDate}
                    </span>
                    {item.expiryDate && (
                      <span className="meta-item">
                        <FiCalendar />
                        Expiry: {item.expiryDate}
                      </span>
                    )}
                    {item.credentialUrl && (
                      <a
                        href={item.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="meta-item credential-link"
                      >
                        <FiExternalLink />
                        View Credential
                      </a>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="delete-certification-btn"
                  onClick={() => handleDeleteCertification(index)}
                >
                  <FiTrash2 />
                </button>
              </div>
            ))
          )}
        </div>
        {/* SAVE */}
        {certifications.length > 0 && (
          <div className="form-actions">
            <button type="submit" className="save-profile-btn">
              <FiSave />
              Save Certifications
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default Certifications;
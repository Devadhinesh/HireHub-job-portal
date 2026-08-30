import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiUpload,
  FiFileText,
  FiTrash2,
  FiSave,
  FiCheckCircle,
  FiPaperclip,
} from "react-icons/fi";
import { useAuth } from "../../../components/context/AuthContext";
import "./Resume.css";

const SERVER_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const API_URL = `${SERVER_URL}/api/candidates/profile`;

const Resume = () => {
  const { token } = useAuth();
  const [resume, setResume] = useState(null);
  const [coverLetter, setCoverLetter] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // GET PROFILE
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await axios.get(`${API_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profile = response.data.profile;
        if (profile?.resume?.length > 0) {
          setResume(profile.resume[profile.resume.length - 1]);
        }
        if (profile?.coverLetterUrl) {
          setCoverLetter({ name: "Cover Letter", url: profile.coverLetterUrl });
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          setError(error.response?.data?.message || "Failed to fetch documents");
        }
      }
    };
    if (token) fetchDocuments();
  }, [token]);

  // RESUME CHANGE
  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed for resume.");
      return;
    }
    setResume(file);
    setMessage("");
    setError("");
  };

  // COVER LETTER CHANGE
  const handleCoverLetterChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed for cover letter.");
      return;
    }
    setCoverLetter(file);
    setMessage("");
    setError("");
  };

  // UPLOAD RESUME
  const uploadResume = async () => {
    if (!resume || !resume.type) return;
    const formData = new FormData();
    formData.append("resume", resume);
    const response = await axios.post(`${API_URL}/resume`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.resume;
  };

  // UPLOAD COVER LETTER
  const uploadCoverLetter = async () => {
    if (!coverLetter || !coverLetter.type) return;
    const formData = new FormData();
    formData.append("coverLetter", coverLetter);
    const response = await axios.post(`${API_URL}/cover-letter`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.coverLetterUrl;
  };

  // SAVE DOCUMENTS
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      let uploadedResume = null;
      let uploadedCoverLetter = null;
      if (resume?.type === "application/pdf") {
        uploadedResume = await uploadResume();
      }
      if (coverLetter?.type === "application/pdf") {
        uploadedCoverLetter = await uploadCoverLetter();
      }
      if (uploadedResume) setResume(uploadedResume);
      if (uploadedCoverLetter) {
        setCoverLetter({ name: "Cover Letter", url: uploadedCoverLetter });
      }
      setMessage("Documents saved successfully");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save documents");
    }
  };

  // DELETE RESUME
  const handleDeleteResume = async () => {
    if (!resume?._id) {
      setResume(null);
      return;
    }
    const confirmed = window.confirm("Are you sure you want to delete this resume?");
    if (!confirmed) return;
    try {
      await axios.delete(`${API_URL}/resume/${resume._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResume(null);
      setMessage("Resume deleted successfully");
      setError("");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to delete resume");
    }
  };

  // DELETE COVER LETTER
  const handleDeleteCoverLetter = async () => {
    if (!coverLetter) return;
    const confirmed = window.confirm("Are you sure you want to delete this cover letter?");
    if (!confirmed) return;
    try {
      await axios.delete(`${API_URL}/cover-letter`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCoverLetter(null);
      setMessage("Cover letter deleted successfully");
      setError("");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to delete cover letter");
    }
  };

  return (
    <div className="resume-documents">
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
      <form className="resume-form" onSubmit={handleSubmit} autoComplete="off">
        {/* RESUME */}
        <div className="document-section">
          <div className="document-header">
            <FiFileText />
            <div>
              <h3>Resume</h3>
              <span>Upload your latest resume in PDF format.</span>
            </div>
            {resume && (
              <span className="uploaded-badge">
                <FiCheckCircle />
                Uploaded
              </span>
            )}
          </div>
          <label htmlFor="resume" className="upload-document-btn">
            <FiUpload />
            Upload Resume
          </label>
          <input
            type="file"
            id="resume"
            accept=".pdf,application/pdf"
            onChange={handleResumeChange}
            hidden
          />
          {resume && (
            <div className="document-card">
              <div className="document-icon">
                <FiPaperclip />
              </div>
              <div className="document-info">
                <h4>{resume.name}</h4>
                {resume.size && <span>{(resume.size / 1024).toFixed(2)} KB</span>}
                {resume.url && (
                  <a href={`${SERVER_URL}${resume.url}`} target="_blank" rel="noreferrer">
                    View Resume
                  </a>
                )}
              </div>
              <button type="button" onClick={handleDeleteResume} className="delete-document-btn">
                <FiTrash2 />
              </button>
            </div>
          )}
        </div>
        {/* COVER LETTER */}
        <div className="document-section">
          <div className="document-header">
            <FiFileText />
            <div>
              <h3>Cover Letter</h3>
              <span>Upload your cover letter in PDF format.</span>
            </div>
            {coverLetter && (
              <span className="uploaded-badge">
                <FiCheckCircle />
                Uploaded
              </span>
            )}
          </div>
          <label htmlFor="coverLetter" className="upload-document-btn">
            <FiUpload />
            Upload Cover Letter
          </label>
          <input
            type="file"
            id="coverLetter"
            accept=".pdf,application/pdf"
            onChange={handleCoverLetterChange}
            hidden
          />
          {coverLetter && (
            <div className="document-card">
              <div className="document-icon">
                <FiPaperclip />
              </div>
              <div className="document-info">
                <h4>{coverLetter.name}</h4>
                {coverLetter.size && <span>{(coverLetter.size / 1024).toFixed(2)} KB</span>}
                {coverLetter.url && (
                  <a href={`${SERVER_URL}${coverLetter.url}`} target="_blank" rel="noreferrer">
                    View Cover Letter
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={handleDeleteCoverLetter}
                className="delete-document-btn"
              >
                <FiTrash2 />
              </button>
            </div>
          )}
        </div>
        {/* SAVE */}
        <div className="form-actions">
          <button type="submit" className="save-profile-btn">
            <FiSave />
            Save Documents
          </button>
        </div>
      </form>
    </div>
  );
};

export default Resume;
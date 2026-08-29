import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiCalendar, FiSave, FiVideo, FiMapPin, FiXCircle } from "react-icons/fi";
import Swal from "sweetalert2";
import { useAuth } from "../../components/context/AuthContext";
import "./RecruiterEditInterview.css";

const API_URL = "http://localhost:5000/api/interviews";

const RecruiterEditInterview = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    interviewType: "Online",
    interviewDate: "",
    startTime: "",
    endTime: "",
    meetingLink: "",
    location: "",
    notes: "",
  });

  const fetchInterview = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`${API_URL}/${interviewId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const interview = response.data.interview;

      setFormData({
        interviewType: interview.interviewType || "Online",
        interviewDate: interview.interviewDate ? new Date(interview.interviewDate).toISOString().split("T")[0] : "",
        startTime: interview.startTime || "",
        endTime: interview.endTime || "",
        meetingLink: interview.meetingLink || "",
        location: interview.location || "",
        notes: interview.notes || "",
      });
    } catch (err) {
      console.error("Fetch Interview Error:", err);
      setError(err.response?.data?.message || "Failed to fetch interview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && interviewId) {
      fetchInterview();
    }
  }, [token, interviewId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.interviewDate || !formData.startTime || !formData.endTime) {
      setError("Date, start time and end time are required.");
      return;
    }

    if (formData.startTime >= formData.endTime) {
      setError("End time must be after start time.");
      return;
    }

    if (formData.interviewType === "Online" && !formData.meetingLink.trim()) {
      setError("Meeting link is required for online interviews.");
      return;
    }

    if (formData.interviewType === "Offline" && !formData.location.trim()) {
      setError("Location is required for offline interviews.");
      return;
    }

    try {
      setSaving(true);

      await axios.put(
        `${API_URL}/${interviewId}`,
        {
          interviewType: formData.interviewType,
          interviewDate: formData.interviewDate,
          startTime: formData.startTime,
          endTime: formData.endTime,
          meetingLink: formData.interviewType === "Online" ? formData.meetingLink : "",
          location: formData.interviewType === "Offline" ? formData.location : "",
          notes: formData.notes,
          status: "Rescheduled",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await Swal.fire({
        position: "top-end",
        icon: "success",
        title: "Interview updated successfully",
        showConfirmButton: false,
        timer: 1500,
      });

      navigate(`/recruiter/interviews/${interviewId}`);
    } catch (err) {
      console.error("Update Interview Error:", err);
      setError(err.response?.data?.message || "Failed to update interview");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="recruiter-edit-interview-page">
        <div className="edit-interview-loading">Loading interview...</div>
      </div>
    );
  }

  return (
    <div className="recruiter-edit-interview-page">
      <button type="button" className="edit-interview-back-btn" onClick={() => navigate(`/recruiter/interviews/${interviewId}`)}>
        <FiArrowLeft />
        Back to Interview
      </button>

      <div className="edit-interview-header">
        <div>
          <h1>Edit Interview</h1>
          <p>Update the interview schedule and details.</p>
        </div>
      </div>

      {error && (
        <div className="edit-interview-error">
          <FiXCircle />
          <span>{error}</span>
        </div>
      )}

      <form className="edit-interview-form" onSubmit={handleSubmit}>
        <div className="edit-interview-card">
          <div className="edit-card-title">
            <FiCalendar />
            <h2>Interview Details</h2>
          </div>

          <div className="edit-form-group">
            <label>Interview Type</label>
            <select name="interviewType" value={formData.interviewType} onChange={handleChange}>
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
            </select>
          </div>

          <div className="edit-form-row">
            <div className="edit-form-group">
              <label>Interview Date</label>
              <input type="date" name="interviewDate" value={formData.interviewDate} onChange={handleChange} required />
            </div>

            <div className="edit-form-group">
              <label>Start Time</label>
              <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required />
            </div>

            <div className="edit-form-group">
              <label>End Time</label>
              <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} required />
            </div>
          </div>

          {formData.interviewType === "Online" && (
            <div className="edit-form-group">
              <label>
                <FiVideo />
                Meeting Link
              </label>
              <input
                type="url"
                name="meetingLink"
                value={formData.meetingLink}
                onChange={handleChange}
                placeholder="https://meet.google.com/..."
                required
              />
            </div>
          )}

          {formData.interviewType === "Offline" && (
            <div className="edit-form-group">
              <label>
                <FiMapPin />
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Enter interview location"
                required
              />
            </div>
          )}

          <div className="edit-form-group">
            <label>Notes</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Add interview notes..." rows="5" />
          </div>

          <div className="edit-interview-actions">
            <button
              type="button"
              className="edit-interview-cancel-btn"
              onClick={() => navigate(`/recruiter/interviews/${interviewId}`)}
              disabled={saving}
            >
              Cancel
            </button>

            <button type="submit" className="edit-interview-save-btn" disabled={saving}>
              <FiSave />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RecruiterEditInterview;
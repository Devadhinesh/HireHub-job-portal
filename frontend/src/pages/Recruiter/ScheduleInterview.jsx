import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiArrowLeft, FiCalendar, FiClock, FiFileText, FiMapPin, FiSave, FiVideo } from "react-icons/fi";
import Swal from "sweetalert2";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../components/context/AuthContext";
import "./ScheduleInterview.css";

const API_URL = "http://localhost:5000/api/interviews";
const SERVER_URL = "http://localhost:5000";
const CANDIDATE_PROFILE_API = "http://localhost:5000/api/candidates/profile";

const ScheduleInterview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();

  const application = location.state?.application;

  const [candidateProfile, setCandidateProfile] = useState(null);
  const [loadingCandidateProfile, setLoadingCandidateProfile] = useState(false);

  const [formData, setFormData] = useState({
    interviewType: "Online",
    interviewDate: "",
    startTime: "",
    endTime: "",
    meetingLink: "",
    location: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // GET PHOTO URL
  const getPhotoUrl = (photo) => {
    if (!photo) return null;
    if (photo.startsWith("http://") || photo.startsWith("https://")) return photo;
    return `${SERVER_URL}${photo.startsWith("/") ? photo : `/${photo}`}`;
  };

  // FETCH CANDIDATE PROFILE
  const fetchCandidateProfile = async () => {
    const candidateId = application?.candidate?._id;
    if (!token || !candidateId) return;

    try {
      setLoadingCandidateProfile(true);
      console.log("Fetching candidate profile:", candidateId);

      const response = await axios.get(`${CANDIDATE_PROFILE_API}/public/${candidateId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Candidate profile:", response.data);
      setCandidateProfile(response.data?.profile || null);
    } catch (error) {
      console.error("Failed to fetch candidate profile:", error.response?.data?.message || error.message);
      setCandidateProfile(null);
    } finally {
      setLoadingCandidateProfile(false);
    }
  };

  // LOAD CANDIDATE PROFILE
  useEffect(() => {
    if (token && application?.candidate?._id) fetchCandidateProfile();
  }, [token, application?.candidate?._id]);

  // HANDLE INPUT CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  // SUBMIT INTERVIEW
  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  console.log("========== CREATE INTERVIEW ==========");
  console.log("Application:", application);
  console.log("Application ID:", application?._id);

  if (!token) {
    setError("Authentication token is missing.");
    return;
  }

  if (!application?._id) {
    setError("Application information is missing.");
    return;
  }

  if (!formData.interviewDate) {
    setError("Please select interview date.");
    return;
  }

  if (!formData.startTime) {
    setError("Please select start time.");
    return;
  }

  if (!formData.endTime) {
    setError("Please select end time.");
    return;
  }

  if (formData.endTime <= formData.startTime) {
    setError("End time must be after start time.");
    return;
  }

  if (
    formData.interviewType === "Online" &&
    !formData.meetingLink.trim()
  ) {
    setError(
      "Meeting link is required for online interviews."
    );
    return;
  }

  if (
    formData.interviewType === "Offline" &&
    !formData.location.trim()
  ) {
    setError(
      "Location is required for offline interviews."
    );
    return;
  }

  try {
    setSaving(true);

    const requestData = {
      application: application._id,
      interviewType: formData.interviewType,
      interviewDate: formData.interviewDate,
      startTime: formData.startTime,
      endTime: formData.endTime,

      meetingLink:
        formData.interviewType === "Online"
          ? formData.meetingLink.trim()
          : "",

      location:
        formData.interviewType === "Offline"
          ? formData.location.trim()
          : "",

      notes: formData.notes.trim(),
    };

    console.log(
      "POST /api/interviews"
    );

    console.log(
      "Request Data:",
      requestData
    );

    const response = await axios.post(
      API_URL,
      requestData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(
      "Interview Created:",
      response.data
    );

    await Swal.fire({
      position: "top-end",
      icon: "success",
      title: "Interview scheduled successfully",
      showConfirmButton: false,
      timer: 1500,
    });

    navigate("/recruiter/interviews");

  } catch (err) {
    console.error(
      "Schedule Interview Error:",
      err
    );

    console.error(
      "Backend Response:",
      err.response?.data
    );

    setError(
      err.response?.data?.message ||
        "Failed to schedule interview"
    );

  } finally {
    setSaving(false);
  }
};

  // APPLICATION NOT FOUND
  if (!application) {
    return (
      <div className="schedule-interview-page">
        <div className="schedule-interview-error">
          <h2>Application not found</h2>
          <button type="button" onClick={() => navigate("/recruiter/applications")}>
            <FiArrowLeft />
            Back to Applications
          </button>
        </div>
      </div>
    );
  }

  const candidateName = candidateProfile?.fullName || application.candidate?.name || "Candidate";
  const candidateEmail = candidateProfile?.email || application.candidate?.email || "No email";
  const candidatePhoto = candidateProfile?.profilePhoto;

  return (
    <div className="schedule-interview-page">
      {/* HEADER */}
      <div className="schedule-interview-header">
        <button type="button" className="schedule-back-btn" onClick={() => navigate("/recruiter/applications")}>
          <FiArrowLeft />
          Applications
        </button>
        <div>
          <h1>Schedule Interview</h1>
          <p>Schedule an interview with the selected candidate.</p>
        </div>
      </div>

      {/* CANDIDATE */}
      <div className="schedule-interview-card">
        <div className="candidate-info">
          <div className="candidate-avatar">
            {loadingCandidateProfile ? (
              <span className="candidate-avatar-loading">...</span>
            ) : candidatePhoto ? (
              <img src={getPhotoUrl(candidatePhoto)} alt={candidateName} />
            ) : (
              <span>{candidateName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <h2>{candidateName}</h2>
            <p>{candidateEmail}</p>
            <span>{application.job?.title || "Job"}</span>
          </div>
        </div>
      </div>

      {/* ERROR */}
      {error && <div className="schedule-error">{error}</div>}

      {/* FORM */}
      <form className="schedule-interview-form" onSubmit={handleSubmit}>
        <div className="schedule-interview-card">
          <div className="schedule-card-header">
            <div>
              <h2>Interview Details</h2>
              <p>Set the interview type, date and time.</p>
            </div>
            <FiCalendar />
          </div>

          <div className="schedule-form-grid">
            {/* TYPE */}
            <div className="schedule-form-group">
              <label>Interview Type</label>
              <select name="interviewType" value={formData.interviewType} onChange={handleChange}>
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
              </select>
            </div>

            {/* DATE */}
            <div className="schedule-form-group">
              <label>Interview Date</label>
              <div className="schedule-input-icon">
                <FiCalendar />
                <input
                  type="date"
                  name="interviewDate"
                  value={formData.interviewDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
            </div>

            {/* START */}
            <div className="schedule-form-group">
              <label>Start Time</label>
              <div className="schedule-input-icon">
                <FiClock />
                <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required />
              </div>
            </div>

            {/* END */}
            <div className="schedule-form-group">
              <label>End Time</label>
              <div className="schedule-input-icon">
                <FiClock />
                <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} required />
              </div>
            </div>

            {/* ONLINE */}
            {formData.interviewType === "Online" && (
              <div className="schedule-form-group full-width">
                <label>Meeting Link</label>
                <div className="schedule-input-icon">
                  <FiVideo />
                  <input
                    type="url"
                    name="meetingLink"
                    value={formData.meetingLink}
                    onChange={handleChange}
                    placeholder="https://meet.google.com/..."
                    required
                  />
                </div>
              </div>
            )}

            {/* OFFLINE */}
            {formData.interviewType === "Offline" && (
              <div className="schedule-form-group full-width">
                <label>Interview Location</label>
                <div className="schedule-input-icon">
                  <FiMapPin />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Enter interview location"
                    required
                  />
                </div>
              </div>
            )}

            {/* NOTES */}
            <div className="schedule-form-group full-width">
              <label>Interview Notes</label>
              <div className="schedule-textarea-icon">
                <FiFileText />
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="5"
                  placeholder="Add interview instructions or notes..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="schedule-form-actions">
          <button
            type="button"
            className="schedule-cancel-btn"
            onClick={() => navigate("/recruiter/applications")}
            disabled={saving}
          >
            Cancel
          </button>
          <button type="submit" className="schedule-save-btn" disabled={saving}>
            <FiSave />
            {saving ? "Scheduling..." : "Schedule Interview"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ScheduleInterview;
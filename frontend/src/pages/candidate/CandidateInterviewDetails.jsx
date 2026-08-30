import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiBriefcase,
  FiVideo,
  FiMapPin,
  FiUser,
  FiXCircle,
} from "react-icons/fi";
import { useAuth } from "../../components/context/AuthContext";
import "./CandidateInterviewDetails.css";

const SERVER_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const API_URL = `${SERVER_URL}/api/interviews`;

const RECRUITER_PROFILE_API =
  `${SERVER_URL}/api/recruiter-profile`;

const CandidateInterviewDetails = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recruiterProfile, setRecruiterProfile] =
    useState(null);

  const fetchInterview = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/${interviewId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "FULL INTERVIEW:",
        response.data?.interview
      );

      const interviewData =
        response.data?.interview;

      setInterview(interviewData);

      // ==========================================
      // GET RECRUITER PROFILE
      // ==========================================

      const recruiterId =
        interviewData?.recruiter?._id;

      console.log(
        "RECRUITER ID:",
        recruiterId
      );

      if (recruiterId) {
        try {
          const recruiterResponse =
            await axios.get(
              `${RECRUITER_PROFILE_API}/public/${recruiterId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

          console.log(
            "RECRUITER PROFILE:",
            recruiterResponse.data
          );

          setRecruiterProfile(
            recruiterResponse.data?.profile ||
            null
          );
        } catch (recruiterError) {
          console.error(
            "Recruiter Profile Error:",
            recruiterError.response?.data?.message ||
            recruiterError.message
          );

          setRecruiterProfile(null);
        }
      }
    } catch (err) {
      console.error(
        "Fetch Interview Error:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Failed to fetch interview details"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && interviewId) {
      fetchInterview();
    }
  }, [token, interviewId]);

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Scheduled":
        return "candidate-details-status-scheduled";
      case "Completed":
        return "candidate-details-status-completed";
      case "Cancelled":
        return "candidate-details-status-cancelled";
      case "Rescheduled":
        return "candidate-details-status-rescheduled";
      default:
        return "";
    }
  };

  const getRecruiterPhoto = () => {
    const photo =
      recruiterProfile?.profilePhoto;

    if (!photo) {
      return null;
    }

    if (
      photo.startsWith("http://") ||
      photo.startsWith("https://")
    ) {
      return photo;
    }

    return `${SERVER_URL}${photo}`;
  };

  if (loading) {
    return (
      <div className="candidate-interview-details-page">
        <div className="candidate-interview-details-loading">Loading interview details...</div>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="candidate-interview-details-page">
        <div className="candidate-interview-details-error">
          <FiXCircle />
          <h2>{error || "Interview not found"}</h2>
          <button type="button" onClick={() => navigate("/candidate/interviews")}>
            <FiArrowLeft />
            Back to Interviews
          </button>
        </div>
      </div>
    );
  }

  const job = interview?.job;
  const recruiter = interview?.recruiter;
  const recruiterPhoto = getRecruiterPhoto();

  return (
    <div className="candidate-interview-details-page">
      <button type="button" className="candidate-interview-back-btn" onClick={() => navigate("/candidate/interviews")}>
        <FiArrowLeft />
        Back to Interviews
      </button>

      <div className="candidate-interview-details-header">
        <div>
          <h1>Interview Details</h1>
          <p>View your interview schedule and details.</p>
        </div>
        <span className={`candidate-interview-details-status ${getStatusClass(interview.status)}`}>
          {interview.status}
        </span>
      </div>

      <div className="candidate-interview-details-grid">
        <div className="candidate-interview-details-card">
          <div className="candidate-details-card-title">
            <FiBriefcase />
            <h2>Job Information</h2>
          </div>
          <div className="candidate-job-details">
            <h3>{job?.title || "Job"}</h3>
            <p>{job?.companyName || "Company"}</p>
          </div>
        </div>

        <div className="candidate-interview-details-card">

          <div className="candidate-details-card-title">
            <FiUser />
            <h2>Recruiter Information</h2>
          </div>

          <div className="candidate-recruiter-details">

            <div className="candidate-recruiter-avatar">

              {getRecruiterPhoto() ? (
                <img
                  src={getRecruiterPhoto()}
                  alt={
                    recruiterProfile?.fullName ||
                    recruiter?.name ||
                    "Recruiter"
                  }
                  onError={(e) => {
                    e.currentTarget.style.display =
                      "none";

                    const placeholder =
                      e.currentTarget
                        .parentElement
                        .querySelector(
                          ".candidate-recruiter-placeholder"
                        );

                    if (placeholder) {
                      placeholder.style.display =
                        "flex";
                    }
                  }}
                />
              ) : null}

              <div
                className="candidate-recruiter-placeholder"
                style={{
                  display: getRecruiterPhoto()
                    ? "none"
                    : "flex",
                }}
              >
                {(
                  recruiterProfile?.fullName ||
                  recruiter?.name ||
                  "R"
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>

            </div>

            <div className="candidate-recruiter-info">

              <h3>
                {recruiterProfile?.fullName ||
                  recruiter?.name ||
                  "Recruiter"}
              </h3>

              <p>
                {recruiterProfile?.email ||
                  recruiter?.email ||
                  ""}
              </p>

            </div>

          </div>

        </div>

        <div className="candidate-interview-details-card candidate-details-full">
          <div className="candidate-details-card-title">
            <FiCalendar />
            <h2>Interview Information</h2>
          </div>
          <div className="candidate-interview-info-grid">
            <div className="candidate-interview-info-item">
              <FiCalendar />
              <div>
                <span>Date</span>
                <strong>{formatDate(interview.interviewDate)}</strong>
              </div>
            </div>

            <div className="candidate-interview-info-item">
              <FiClock />
              <div>
                <span>Time</span>
                <strong>
                  {interview.startTime || "-"} - {interview.endTime || "-"}
                </strong>
              </div>
            </div>

            <div className="candidate-interview-info-item">
              {interview.interviewType === "Online" ? <FiVideo /> : <FiMapPin />}
              <div>
                <span>Interview Type</span>
                <strong>{interview.interviewType || "-"}</strong>
              </div>
            </div>
          </div>
        </div>

        {interview.interviewType === "Online" && interview.meetingLink && (
          <div className="candidate-interview-details-card candidate-details-full">
            <div className="candidate-details-card-title">
              <FiVideo />
              <h2>Online Interview</h2>
            </div>
            <p className="candidate-meeting-description">Join the interview using the meeting link below.</p>
            <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" className="candidate-details-meeting-link">
              <FiVideo />
              Join Meeting
            </a>
          </div>
        )}

        {interview.interviewType === "Offline" && interview.location && (
          <div className="candidate-interview-details-card candidate-details-full">
            <div className="candidate-details-card-title">
              <FiMapPin />
              <h2>Interview Location</h2>
            </div>
            <div className="candidate-details-location">
              <FiMapPin />
              <span>{interview.location}</span>
            </div>
          </div>
        )}

        {interview.notes && (
          <div className="candidate-interview-details-card candidate-details-full">
            <div className="candidate-details-card-title">
              <FiBriefcase />
              <h2>Interview Notes</h2>
            </div>
            <p className="candidate-details-notes">{interview.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateInterviewDetails;
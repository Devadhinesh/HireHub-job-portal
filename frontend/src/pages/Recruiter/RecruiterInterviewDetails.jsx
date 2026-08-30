import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft, FiCalendar, FiClock, FiUser, FiBriefcase,
  FiVideo, FiMapPin, FiEdit, FiCheckCircle, FiXCircle, FiFileText,
} from "react-icons/fi";
import Swal from "sweetalert2";
import { useAuth } from "../../components/context/AuthContext";
import "./RecruiterInterviewDetails.css";

const SERVER_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const API_URL = `${SERVER_URL}/api/interviews`;

const CANDIDATE_PROFILE_API =
  `${SERVER_URL}/api/candidates/profile`;

const RECRUITER_PROFILE_API =
  `${SERVER_URL}/api/recruiter-profile`;

const RecruiterInterviewDetails = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [interview, setInterview] = useState(null);

  const [candidateProfile, setCandidateProfile] =
    useState(null);

  const [recruiterProfile, setRecruiterProfile] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getPhotoUrl = (photo) => {
    if (!photo) return null;

    if (
      photo.startsWith("http://") ||
      photo.startsWith("https://")
    ) {
      return photo;
    }

    return `${SERVER_URL}${photo.startsWith("/") ? photo : `/${photo}`
      }`;
  };
  // GET /api/interviews/:interviewId
  const fetchInterview = async () => {
    if (!token || !interviewId) return;

    try {
      setLoading(true);
      setError("");

      // ==========================================
      // GET INTERVIEW
      // ==========================================
      const response = await axios.get(
        `${API_URL}/${interviewId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const interviewData =
        response.data?.interview || null;

      setInterview(interviewData);

      // ==========================================
      // GET CANDIDATE PROFILE
      // ==========================================
      const candidateId =
        interviewData?.candidate?._id;

      if (candidateId) {
        try {
          const candidateResponse =
            await axios.get(
              `${CANDIDATE_PROFILE_API}/public/${candidateId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

          console.log(
            "Candidate Profile:",
            candidateResponse.data
          );

          setCandidateProfile(
            candidateResponse.data?.profile || null
          );
        } catch (candidateError) {
          console.error(
            "Failed to fetch candidate profile:",
            candidateError.response?.data?.message ||
            candidateError.message
          );

          setCandidateProfile(null);
        }
      }

      // ==========================================
      // GET RECRUITER PROFILE
      // ==========================================
      try {
        const recruiterResponse =
          await axios.get(
            `${RECRUITER_PROFILE_API}/me`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

        console.log(
          "Recruiter Profile:",
          recruiterResponse.data
        );

        setRecruiterProfile(
          recruiterResponse.data?.profile || null
        );
      } catch (recruiterError) {
        console.error(
          "Failed to fetch recruiter profile:",
          recruiterError.response?.data?.message ||
          recruiterError.message
        );

        setRecruiterProfile(null);
      }

    } catch (err) {
      console.error(
        "Fetch Interview Error:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Failed to fetch interview"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && interviewId) fetchInterview();
  }, [token, interviewId]);

  const formatDate = (date) => {
    if (!date) return "-";
    const formattedDate = new Date(date);
    if (isNaN(formattedDate.getTime())) return "-";

    return formattedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getStatusClass = (status) =>
    `status-${(status || "Scheduled").toLowerCase().replace(/\s+/g, "-")}`;

  // PUT /api/interviews/:interviewId
  const handleComplete = async () => {
    const result = await Swal.fire({
      title: "Mark interview as completed?",
      text: "This interview will be marked as completed.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, complete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await axios.put(
        `${API_URL}/${interviewId}`,
        { status: "Completed" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setInterview(response.data?.interview);

      await Swal.fire({
        position: "top-end",
        icon: "success",
        title: "Interview marked as completed",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (err) {
      console.error("Complete Interview Error:", err);
      await Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: err.response?.data?.message || "Failed to update interview",
      });
    }
  };

  // DELETE /api/interviews/:interviewId
  const handleCancel = async () => {
    const result = await Swal.fire({
      title: "Cancel this interview?",
      text: "This interview will be cancelled.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, cancel",
      cancelButtonText: "No",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_URL}/${interviewId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await Swal.fire({
        position: "top-end",
        icon: "success",
        title: "Interview cancelled",
        showConfirmButton: false,
        timer: 1500,
      });

      navigate("/recruiter/interviews");
    } catch (err) {
      console.error("Cancel Interview Error:", err);
      await Swal.fire({
        icon: "error",
        title: "Cancellation Failed",
        text: err.response?.data?.message || "Failed to cancel interview",
      });
    }
  };

  if (loading) {
    return (
      <div className="recruiter-interview-details-page">
        <div className="interview-details-loading">
          <div className="loading-spinner"></div>
          <p>Loading interview details...</p>
        </div>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="recruiter-interview-details-page">
        <div className="interview-details-error">
          <FiXCircle />
          <h2>{error || "Interview not found"}</h2>
          <button type="button" onClick={() => navigate("/recruiter/interviews")}>
            <FiArrowLeft /> Back to Interviews
          </button>
        </div>
      </div>
    );
  }

  const candidate = interview.candidate;
  const recruiter = interview.recruiter;
  const job = interview.job;

  return (
    <div className="recruiter-interview-details-page">
      <button type="button" className="interview-back-btn" onClick={() => navigate("/recruiter/interviews")}>
        <FiArrowLeft /> Back to Interviews
      </button>

      <div className="interview-details-header">
        <div>
          <h1>Interview Details</h1>
          <p>View and manage the scheduled interview.</p>
        </div>
        <span className={`interview-details-status ${getStatusClass(interview.status)}`}>
          {interview.status}
        </span>
      </div>

      <div className="interview-details-grid">
        {/* CANDIDATE INFORMATION */}
        <div className="interview-details-card">
          <div className="details-card-title">
            <FiUser />
            <h2>Candidate Information</h2>
          </div>

          <div className="candidate-details">

            <div className="candidate-details-avatar">
              {candidateProfile?.profilePhoto ? (
                <img
                  src={getPhotoUrl(
                    candidateProfile.profilePhoto
                  )}
                  alt={
                    candidateProfile.fullName ||
                    candidate?.name ||
                    "Candidate"
                  }
                />
              ) : (
                <span>
                  {(
                    candidateProfile?.fullName ||
                    candidate?.name ||
                    "C"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </span>
              )}
            </div>

            <div>
              <h3>
                {candidateProfile?.fullName ||
                  candidate?.name ||
                  "Candidate"}
              </h3>

              <p>
                {candidateProfile?.email ||
                  candidate?.email ||
                  "No email"}
              </p>
            </div>

          </div>
        </div>

        {/* RECRUITER INFORMATION */}
        <div className="interview-details-card">
          <div className="details-card-title">
            <FiUser />
            <h2>Recruiter Information</h2>
          </div>

          <div className="candidate-details">

            <div className="recruiter-details-avatar">
              {recruiterProfile?.profilePhoto ? (
                <img
                  src={getPhotoUrl(
                    recruiterProfile.profilePhoto
                  )}
                  alt={
                    recruiterProfile.fullName ||
                    recruiter?.name ||
                    "Recruiter"
                  }
                />
              ) : (
                <span>
                  {(
                    recruiterProfile?.fullName ||
                    recruiter?.name ||
                    "R"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </span>
              )}
            </div>

            <div>
              <h3>
                {recruiterProfile?.fullName ||
                  recruiter?.name ||
                  "Recruiter"}
              </h3>

              <p>
                {recruiterProfile?.email ||
                  recruiter?.email ||
                  "No email"}
              </p>
            </div>

          </div>
        </div>
        {/* JOB INFORMATION */}
        <div className="interview-details-card">
          <div className="details-card-title">
            <FiBriefcase />
            <h2>Job Information</h2>
          </div>

          <div className="job-details">
            <div className="job-details-info">
              <h3>{job?.title || "Job"}</h3>
              <p>
                {recruiterProfile?.companyName ||
                  job?.companyName ||
                  "Company"}
              </p>
              {job?.location && <span>{job.location}</span>}
            </div>

            <div className="company-logo">
              {recruiterProfile?.companyLogo ? (
                <img
                  src={getPhotoUrl(recruiterProfile.companyLogo)}
                  alt={
                    recruiterProfile.companyName ||
                    job?.companyName ||
                    "Company"
                  }
                />
              ) : (
                <FiBriefcase />
              )}
            </div>
          </div>
        </div>

        {/* INTERVIEW INFORMATION */}
        <div className="interview-details-card interview-details-full">
          <div className="details-card-title">
            <FiCalendar />
            <h2>Interview Information</h2>
          </div>
          <div className="interview-info-grid">
            <div className="interview-info-item">
              <FiCalendar />
              <div>
                <span>Date</span>
                <strong>{formatDate(interview.interviewDate)}</strong>
              </div>
            </div>

            <div className="interview-info-item">
              <FiClock />
              <div>
                <span>Time</span>
                <strong>{interview.startTime || "-"} - {interview.endTime || "-"}</strong>
              </div>
            </div>

            <div className="interview-info-item">
              {interview.interviewType === "Online" ? <FiVideo /> : <FiMapPin />}
              <div>
                <span>Interview Type</span>
                <strong>{interview.interviewType || "-"}</strong>
              </div>
            </div>

            <div className="interview-info-item">
              {interview.status === "Completed" ? (
                <FiCheckCircle />
              ) : interview.status === "Cancelled" ? (
                <FiXCircle />
              ) : (
                <FiClock />
              )}
              <div>
                <span>Status</span>
                <strong>{interview.status || "-"}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* ONLINE MEETING */}
        {interview.interviewType === "Online" && (
          <div className="interview-details-card interview-details-full">
            <div className="details-card-title">
              <FiVideo />
              <h2>Online Meeting</h2>
            </div>
            {interview.meetingLink ? (
              <div className="meeting-details">
                <p>Meeting Link</p>
                <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" className="details-meeting-link">
                  <FiVideo /> Join Meeting
                </a>
                <div className="meeting-url">{interview.meetingLink}</div>
              </div>
            ) : (
              <p className="details-empty-text">No meeting link available.</p>
            )}
          </div>
        )}

        {/* OFFLINE LOCATION */}
        {interview.interviewType === "Offline" && (
          <div className="interview-details-card interview-details-full">
            <div className="details-card-title">
              <FiMapPin />
              <h2>Interview Location</h2>
            </div>
            {interview.location ? (
              <div className="details-location">
                <FiMapPin />
                <span>{interview.location}</span>
              </div>
            ) : (
              <p className="details-empty-text">No interview location available.</p>
            )}
          </div>
        )}

        {/* NOTES */}
        <div className="interview-details-card interview-details-full">
          <div className="details-card-title">
            <FiFileText />
            <h2>Interview Notes</h2>
          </div>
          {interview.notes ? (
            <p className="details-notes">{interview.notes}</p>
          ) : (
            <p className="details-empty-text">No interview notes added.</p>
          )}
        </div>
      </div>

      {/* ACTION BUTTONS */}
      {interview.status === "Scheduled" && (
        <div className="interview-details-actions">
          <button type="button" className="details-edit-btn" onClick={() => navigate(`/recruiter/interviews/${interviewId}/edit`)}>
            <FiEdit /> Edit Interview
          </button>
          <button type="button" className="details-complete-btn" onClick={handleComplete}>
            <FiCheckCircle /> Mark Completed
          </button>
          <button type="button" className="details-cancel-btn" onClick={handleCancel}>
            <FiXCircle /> Cancel Interview
          </button>
        </div>
      )}

      {interview.status === "Cancelled" && (
        <div className="interview-cancelled-message">
          <FiXCircle />
          <div>
            <h3>Interview Cancelled</h3>
            <p>This interview has been cancelled.</p>
          </div>
        </div>
      )}

      {interview.status === "Completed" && (
        <div className="interview-completed-message">
          <FiCheckCircle />
          <div>
            <h3>Interview Completed</h3>
            <p>This interview has been completed.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterInterviewDetails;
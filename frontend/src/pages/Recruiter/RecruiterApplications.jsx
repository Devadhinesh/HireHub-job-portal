import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiFileText, FiUser, FiBriefcase, FiCalendar, FiCheckCircle, FiXCircle, FiEye, FiVideo } from "react-icons/fi";
import Swal from "sweetalert2";
import { useAuth } from "../../components/context/AuthContext";
import "./RecruiterApplications.css";

const SERVER_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const APPLICATION_API = `${SERVER_URL}/api/applications`;
const INTERVIEW_API = `${SERVER_URL}/api/interviews`;

const RecruiterApplications = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // FETCH APPLICATIONS
  const fetchApplications = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`${APPLICATION_API}/recruiter`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Recruiter Applications:", response.data);
      setApplications(response.data?.applications || []);
    } catch (err) {
      console.error("Fetch Applications Error:", err);
      setError(err.response?.data?.message || "Failed to fetch applications");
    }
  };

  // FETCH INTERVIEWS
  const fetchInterviews = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${INTERVIEW_API}/recruiter`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Recruiter Interviews:", response.data);
      setInterviews(Array.isArray(response.data?.interviews) ? response.data.interviews : []);
    } catch (err) {
      console.error("Fetch Interviews Error:", err);
      // Don't show interview error here because applications can still load.
    }
  };

  // FETCH EVERYTHING
  const fetchData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      await Promise.all([fetchApplications(), fetchInterviews()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  // FIND INTERVIEW FOR APPLICATION
  const getInterviewByApplication = (applicationId) => {
    if (!applicationId) return null;
    return interviews.find((interview) => {
      const interviewApplication = interview?.application;
      if (interviewApplication && typeof interviewApplication === "object") {
        return interviewApplication._id === applicationId;
      }
      return interviewApplication === applicationId;
    });
  };

  // UPDATE APPLICATION STATUS
  const updateStatus = async (applicationId, status) => {
    if (!token) return;
    try {
      setUpdatingId(applicationId);
      const response = await axios.put(
        `${APPLICATION_API}/${applicationId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Status Updated:", response.data);
      setApplications((prev) =>
        prev.map((application) =>
          application._id === applicationId ? { ...application, status } : application
        )
      );

      if (status === "Shortlisted") {
        await Swal.fire({ position: "top-end", icon: "success", title: "Candidate shortlisted", showConfirmButton: false, timer: 1500 });
      }
      if (status === "Rejected") {
        await Swal.fire({ position: "top-end", icon: "success", title: "Application rejected", showConfirmButton: false, timer: 1500 });
      }
      if (status === "Interview") {
        await Swal.fire({ position: "top-end", icon: "success", title: "Application moved to interview", showConfirmButton: false, timer: 1500 });
      }
    } catch (err) {
      console.error("Update Status Error:", err);
      await Swal.fire({ icon: "error", title: "Update Failed", text: err.response?.data?.message || "Failed to update application status" });
    } finally {
      setUpdatingId(null);
    }
  };

  // SCHEDULE INTERVIEW
  const handleScheduleInterview = (application) => {
    console.log("========== SCHEDULE INTERVIEW ==========");
    console.log("Application:", application);
    console.log("Application ID:", application?._id);

    if (!application?._id) {
      Swal.fire({ icon: "error", title: "Application Error", text: "Application information is missing." });
      return;
    }

    navigate("/recruiter/interviews/schedule", { state: { application } });
  };

  // VIEW INTERVIEW
  const handleViewInterview = (application) => {
    const interview = getInterviewByApplication(application._id);
    console.log("Application:", application);
    console.log("Matching Interview:", interview);

    if (!interview?._id) {
      Swal.fire({ icon: "info", title: "Interview Not Found", text: "No interview was found for this application." });
      navigate("/recruiter/interviews");
      return;
    }

    navigate(`/recruiter/interviews/${interview._id}`);
  };

  // STATUS CLASS
  const getStatusClass = (status) => {
    switch (status) {
      case "Applied": return "status-applied";
      case "Under Review": return "status-review";
      case "Shortlisted": return "status-shortlisted";
      case "Interview": return "status-interview";
      case "Hired": return "status-hired";
      case "Rejected": return "status-rejected";
      default: return "";
    }
  };

  // LOADING
  if (loading) {
    return (
      <div className="recruiter-applications-page">
        <div className="recruiter-applications-loading">
          <div className="loading-spinner"></div>
          <p>Loading applications...</p>
        </div>
      </div>
    );
  }

  const getPhotoUrl = (photo) => {
    if (!photo) return null;

    if (photo.startsWith("http://") || photo.startsWith("https://")) {
      return photo;
    }

    return `${SERVER_URL}${photo.startsWith("/") ? photo : `/${photo}`}`;
  };
  // UI
  return (
    <div className="recruiter-applications-page">
      {/* HEADER */}
      <div className="recruiter-applications-header">
        <div>
          <h1>Applications</h1>
          <p>Review and manage candidate applications.</p>
        </div>
        <div className="applications-count">
          <FiFileText />
          <span>{applications.length}</span>
          <small>Applications</small>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="applications-error">
          <FiXCircle />
          <span>{error}</span>
          <button type="button" onClick={fetchData}>Retry</button>
        </div>
      )}

      {/* EMPTY */}
      {!error && applications.length === 0 && (
        <div className="applications-empty">
          <div className="applications-empty-icon">
            <FiFileText />
          </div>
          <h2>No Applications Yet</h2>
          <p>Applications from candidates will appear here.</p>
        </div>
      )}

      {/* APPLICATION LIST */}
      {applications.length > 0 && (
        <div className="applications-list">
          {applications.map((application) => {
            const candidate = application.candidate;
            const job = application.job;

            const isApplied = application.status === "Applied";
            const isUnderReview = application.status === "Under Review";
            const isShortlisted = application.status === "Shortlisted";
            const isInterview = application.status === "Interview";
            const isHired = application.status === "Hired";
            const isRejected = application.status === "Rejected";

            const interview = getInterviewByApplication(application._id);
            const hasInterview = !!interview;

            return (
              <div className="application-card" key={application._id}>
                {/* CANDIDATE */}
                <div className="application-candidate">
                  <div className="candidate-avatar">
                    {candidate?.profilePhoto ? (
                      <img
                        src={getPhotoUrl(candidate.profilePhoto)}
                        alt={candidate?.name || "Candidate"}
                      />
                    ) : (
                      <span>
                        {candidate?.name?.charAt(0)?.toUpperCase() || "C"}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3>{candidate?.name || "Candidate"}</h3>
                    <p>{candidate?.email || "No email"}</p>
                  </div>
                </div>

                {/* JOB */}
                <div className="application-job">
                  <FiBriefcase />
                  <div>
                    <strong>{job?.title || "Job"}</strong>
                    <span>{job?.companyName || "Company"}</span>
                  </div>
                </div>

                {/* STATUS */}
                <div className="application-status">
                  <span className={`application-status-badge ${getStatusClass(application.status)}`}>
                    {application.status}
                  </span>
                </div>

                {/* ACTIONS */}
                <div className="application-actions">
                  {/* VIEW APPLICATION */}
                  <button
                    type="button"
                    className="application-view-btn"
                    title="View Application"
                    onClick={() => navigate(`/recruiter/applications/${application._id}`)}
                  >
                    <FiEye />
                  </button>

                  {/* SHORTLIST */}
                  {(isApplied || isUnderReview) && (
                    <button
                      type="button"
                      className="application-shortlist-btn"
                      disabled={updatingId === application._id}
                      onClick={() => updateStatus(application._id, "Shortlisted")}
                    >
                      <FiCheckCircle />
                      {updatingId === application._id ? "Updating..." : "Shortlist"}
                    </button>
                  )}

                  {/* SCHEDULE INTERVIEW */}
                  {isShortlisted && !hasInterview && (
                    <button
                      type="button"
                      className="application-interview-btn"
                      onClick={() => handleScheduleInterview(application)}
                    >
                      <FiCalendar />
                      Schedule Interview
                    </button>
                  )}

                  {/* VIEW INTERVIEW */}
                  {isInterview && (
                    <button
                      type="button"
                      className="application-interview-btn"
                      onClick={() => handleViewInterview(application)}
                    >
                      <FiVideo />
                      View Interview
                    </button>
                  )}

                  {/* INTERVIEW EXISTS BUT STATUS IS STILL SHORTLISTED */}
                  {isShortlisted && hasInterview && (
                    <button
                      type="button"
                      className="application-interview-btn"
                      onClick={() => handleViewInterview(application)}
                    >
                      <FiVideo />
                      View Interview
                    </button>
                  )}

                  {/* HIRED */}
                  {isHired && (
                    <span className="application-hired-text">
                      <FiCheckCircle />
                      Hired
                    </span>
                  )}

                  {/* REJECT */}
                  {!isRejected && !isHired && !isInterview && (
                    <button
                      type="button"
                      className="application-reject-btn"
                      title="Reject Application"
                      disabled={updatingId === application._id}
                      onClick={() => updateStatus(application._id, "Rejected")}
                    >
                      <FiXCircle />
                    </button>
                  )}

                  {/* REJECTED */}
                  {isRejected && (
                    <span className="application-rejected-text">
                      <FiXCircle />
                      Rejected
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecruiterApplications;
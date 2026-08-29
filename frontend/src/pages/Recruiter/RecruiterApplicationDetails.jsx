import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiArrowLeft, FiBriefcase, FiCalendar, FiCheckCircle, FiClock,
  FiFileText, FiMail, FiMapPin, FiUser, FiXCircle, FiPhone, FiDollarSign,
} from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../components/context/AuthContext";
import "./RecruiterApplicationDetails.css";

const API_URL = "http://localhost:5000/api/applications";
const SERVER_URL = "http://localhost:5000";
const CANDIDATE_PROFILE_API =
  "http://localhost:5000/api/candidates/profile";
const RECRUITER_PROFILE_API =
  "http://localhost:5000/api/recruiter-profile";

const RecruiterApplicationDetails = () => {
  const navigate = useNavigate();
  const { applicationId } = useParams();
  const { token } = useAuth();

  const [application, setApplication] = useState(null);
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [recruiterProfile, setRecruiterProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchApplication = async () => {
    try {
      setLoading(true);
      setError("");

      // ============================================
      // GET APPLICATION
      // ============================================
      const response = await axios.get(
        `${API_URL}/${applicationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const applicationData =
        response.data.application;

      setApplication(applicationData);

      // ============================================
      // GET CANDIDATE PROFILE
      // ============================================
      const candidateId =
        applicationData?.candidate?._id;

      if (candidateId) {
        try {
          const profileResponse = await axios.get(
            `${CANDIDATE_PROFILE_API}/public/${candidateId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          setCandidateProfile(
            profileResponse.data?.profile || null
          );
        } catch (profileError) {
          console.error(
            "Failed to fetch candidate profile:",
            profileError.response?.data?.message ||
            profileError.message
          );

          setCandidateProfile(null);
        }
      }

      // ============================================
      // GET RECRUITER PROFILE / COMPANY LOGO
      // ============================================
      try {
        const recruiterResponse = await axios.get(
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
    } catch (error) {
      console.error(
        "Fetch application error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Failed to fetch application details"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && applicationId) fetchApplication();
  }, [token, applicationId]);

  const handleStatusChange = async (status) => {
    try {
      setUpdating(true);
      setError("");
      setSuccess("");
      const response = await axios.put(
        `${API_URL}/${applicationId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      setApplication((prev) => ({ ...prev, status: response.data.application.status }));
      setSuccess("Application status updated successfully.");
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.message || "Failed to update application status");
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not available";
    return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  };

  const formatDateTime = (date) => {
    if (!date) return "Not available";
    return new Date(date).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const getResumeUrl = (resume) => {
    if (!resume) return null;
    return resume.startsWith("http") ? resume : `${SERVER_URL}${resume}`;
  };

  const getStatusClass = (status) => status?.toLowerCase().replace(/\s+/g, "-") || "";

  const getStatusIcon = (status) => {
    switch (status) {
      case "Applied": return <FiFileText />;
      case "Under Review": return <FiClock />;
      case "Shortlisted": return <FiCheckCircle />;
      case "Interview": return <FiCalendar />;
      case "Hired": return <FiCheckCircle />;
      case "Rejected": return <FiXCircle />;
      default: return <FiFileText />;
    }
  };

  if (loading) {
    return (
      <div className="recruiter-application-details">
        <div className="recruiter-application-details-loading">
          <FiFileText />
          <p>Loading application details...</p>
        </div>
      </div>
    );
  }

  if (error && !application) {
    return (
      <div className="recruiter-application-details">
        <button type="button" className="recruiter-details-back-btn" onClick={() => navigate("/recruiter/applications")}>
          <FiArrowLeft /> Back to Applications
        </button>

        <div className="recruiter-details-error-state">
          <div className="recruiter-details-error-icon"><FiXCircle /></div>
          <h2>Unable to Load Application</h2>
          <p>{error}</p>
          <button type="button" onClick={() => navigate("/recruiter/applications")}>Back to Applications</button>
        </div>
      </div>
    );
  }

  if (!application) return null;

  const candidate = application.candidate;
  const job = application.job;

  const getPhotoUrl = (photo) => {
    if (!photo) return null;

    if (
      photo.startsWith("http://") ||
      photo.startsWith("https://")
    ) {
      return photo;
    }

    return `${SERVER_URL}${photo.startsWith("/")
        ? photo
        : `/${photo}`
      }`;
  };

  return (
    <div className="recruiter-application-details">

      <div className="recruiter-details-header">
        <button type="button" className="recruiter-details-back-btn" onClick={() => navigate("/recruiter/applications")}>
          <FiArrowLeft /> Back to Applications
        </button>

        <div className="recruiter-details-header-content">
          <div>
            <div className="recruiter-details-title-row">
              <div className="recruiter-details-title-icon"><FiFileText /></div>
              <div>
                <h1>Application Details</h1>
                <p>Review candidate application information.</p>
              </div>
            </div>
          </div>

          <div className={`recruiter-details-status ${getStatusClass(application.status)}`}>
            {getStatusIcon(application.status)} {application.status}
          </div>
        </div>
      </div>

      {success && (
        <div className="recruiter-details-success">
          <FiCheckCircle /> {success}
        </div>
      )}

      {error && application && (
        <div className="recruiter-details-error">
          <FiXCircle /> {error}
        </div>
      )}

      <div className="recruiter-details-grid">

        <div className="recruiter-details-main">

          <div className="recruiter-details-card">
            <div className="recruiter-details-card-header">
              <div>
                <h2>Candidate Information</h2>
                <p>Candidate details provided with the application.</p>
              </div>
              <FiUser />
            </div>

            <div className="recruiter-candidate-profile">

              <div className="recruiter-candidate-large-avatar">

                {candidateProfile?.profilePhoto ? (
                  <img
                    src={getPhotoUrl(candidateProfile.profilePhoto)}
                    alt={
                      candidateProfile?.fullName ||
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

              <div className="recruiter-candidate-profile-info">

                <h2>
                  {candidateProfile?.fullName ||
                    candidate?.name ||
                    "Candidate"}
                </h2>

                <div className="recruiter-candidate-contact">

                  <span>
                    <FiMail />

                    {candidateProfile?.email ||
                      candidate?.email ||
                      "Email not available"}
                  </span>

                  {candidateProfile?.phone && (
                    <span>
                      <FiPhone />
                      {candidateProfile.phone}
                    </span>
                  )}

                </div>

                {candidateProfile?.headline && (
                  <p className="candidate-profile-headline">
                    {candidateProfile.headline}
                  </p>
                )}

                {candidateProfile?.currentJobTitle && (
                  <p className="candidate-current-job">
                    {candidateProfile.currentJobTitle}
                  </p>
                )}

              </div>

            </div>
          </div>

          <div className="recruiter-details-card">
            <div className="recruiter-details-card-header">
              <div>
                <h2>Applied Job</h2>
                <p>Job position the candidate applied for.</p>
              </div>
              <FiBriefcase />
            </div>

            <div className="recruiter-details-job">

              {/* COMPANY LOGO */}
              <div className="recruiter-details-job-icon">
                {recruiterProfile?.companyLogo ? (
                  <img
                    src={getPhotoUrl(
                      recruiterProfile.companyLogo
                    )}
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

              <div>
                <h2>
                  {job?.title || "Job not available"}
                </h2>

                <p>
                  {recruiterProfile?.companyName ||
                    job?.companyName ||
                    "Company not available"}
                </p>
              </div>

            </div>

            <div className="recruiter-job-info-grid">
              <div className="recruiter-job-info-item">
                <FiMapPin />
                <div>
                  <span>Location</span>
                  <strong>{job?.location?.city || "Not available"}</strong>
                </div>
              </div>

              <div className="recruiter-job-info-item">
                <FiBriefcase />
                <div>
                  <span>Employment</span>
                  <strong>{job?.employmentType || "Not available"}</strong>
                </div>
              </div>

              <div className="recruiter-job-info-item">
                <FiClock />
                <div>
                  <span>Work Mode</span>
                  <strong>{job?.workMode || "Not available"}</strong>
                </div>
              </div>

              {(job?.salaryMin || job?.salaryMax) && (
                <div className="recruiter-job-info-item">
                  <FiDollarSign />
                  <div>
                    <span>Salary</span>
                    <strong>{job.salaryMin || 0} - {job.salaryMax || 0} {job.salaryType || ""}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="recruiter-details-card">
            <div className="recruiter-details-card-header">
              <div>
                <h2>Cover Letter</h2>
                <p>Candidate's message for this application.</p>
              </div>
              <FiFileText />
            </div>

            <div className="recruiter-cover-letter-box">
              {application.coverLetter ? (
                <p>{application.coverLetter}</p>
              ) : (
                <div className="recruiter-no-cover-letter">
                  <FiFileText />
                  <span>No cover letter provided.</span>
                </div>
              )}
            </div>
          </div>

        </div>

        <div className="recruiter-details-sidebar">

          <div className="recruiter-details-card">
            <div className="recruiter-details-card-header">
              <div>
                <h2>Application Status</h2>
                <p>Update the candidate's application status.</p>
              </div>
              <FiCheckCircle />
            </div>

            <div className="recruiter-status-current">
              <span>Current Status</span>
              <div className={`recruiter-current-status ${getStatusClass(application.status)}`}>
                {getStatusIcon(application.status)} {application.status}
              </div>
            </div>

            <div className="recruiter-status-update-box">
              <label>Change Status</label>
              <select value={application.status || "Applied"} disabled={updating} onChange={(e) => handleStatusChange(e.target.value)}>
                <option value="Applied">Applied</option>
                <option value="Under Review">Under Review</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Interview">Interview</option>
                <option value="Hired">Hired</option>
                <option value="Rejected">Rejected</option>
              </select>
              {updating && <small>Updating status...</small>}
            </div>
          </div>

          <div className="recruiter-details-card">
            <div className="recruiter-details-card-header">
              <div>
                <h2>Resume</h2>
                <p>Candidate's submitted resume.</p>
              </div>
              <FiFileText />
            </div>

            {application.resume ? (
              <a href={getResumeUrl(application.resume)} target="_blank" rel="noopener noreferrer" className="recruiter-details-resume-btn">
                <FiFileText />
                <span>View Resume</span>
              </a>
            ) : (
              <div className="recruiter-no-resume">
                <FiFileText />
                <span>No resume available.</span>
              </div>
            )}
          </div>

          <div className="recruiter-details-card">
            <div className="recruiter-details-card-header">
              <div>
                <h2>Application Information</h2>
                <p>Application timeline.</p>
              </div>
              <FiCalendar />
            </div>

            <div className="recruiter-application-info-list">
              <div>
                <FiCalendar />
                <div>
                  <span>Applied On</span>
                  <strong>{formatDate(application.appliedAt || application.createdAt)}</strong>
                </div>
              </div>

              <div>
                <FiClock />
                <div>
                  <span>Application Time</span>
                  <strong>{formatDateTime(application.appliedAt || application.createdAt)}</strong>
                </div>
              </div>

              <div>
                <FiFileText />
                <div>
                  <span>Application ID</span>
                  <strong>{application._id}</strong>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default RecruiterApplicationDetails;
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiArrowLeft,
  FiBriefcase,
  FiMapPin,
  FiClock,
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiEdit,
  FiTrash2,
  FiTag,
  FiFileText,
} from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../components/context/AuthContext";
import "./RecruiterJobDetails.css";

const API_URL = "http://localhost:5000/api/jobs";
const RECRUITER_PROFILE_API =
  "http://localhost:5000/api/recruiter-profile";

const RecruiterJobDetails = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const { token } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recruiterProfile, setRecruiterProfile] = useState(null);
  // Fetch job details
  useEffect(() => {
    const fetchJobAndRecruiterProfile = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch job
        const jobResponse = await axios.get(
          `${API_URL}/${jobId}`
        );

        const jobData = jobResponse.data.job;

        setJob(jobData);

        // Fetch logged-in recruiter's profile
        try {
          const profileResponse = await axios.get(
            `${RECRUITER_PROFILE_API}/me`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          setRecruiterProfile(
            profileResponse.data.profile || null
          );
        } catch (profileError) {
          console.error(
            "Failed to fetch recruiter profile:",
            profileError.response?.data?.message ||
            profileError.message
          );

          setRecruiterProfile(null);
        }
      } catch (error) {
        console.error("Fetch job error:", error);

        setError(
          error.response?.data?.message ||
          "Failed to fetch job details"
        );
      } finally {
        setLoading(false);
      }
    };

    if (jobId && token) {
      fetchJobAndRecruiterProfile();
    }
  }, [jobId, token]);

  const formatDate = (date) => {
    if (!date) return "Not specified";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatSalary = () => {
    if (job?.salaryMin == null && job?.salaryMax == null) return "Salary not specified";

    const min = job.salaryMin != null ? `₹${Number(job.salaryMin).toLocaleString("en-IN")}` : "";
    const max = job.salaryMax != null ? `₹${Number(job.salaryMax).toLocaleString("en-IN")}` : "";

    if (min && max) return `${min} - ${max}`;
    return min || max;
  };

  const getLocation = () => {
    const location = [job?.location?.city, job?.location?.state, job?.location?.country].filter(Boolean);
    return location.length ? location.join(", ") : "Location not specified";
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this job?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_URL}/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/recruiter/my-jobs");
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.message || "Failed to delete job");
    }
  };

  if (loading) {
    return (
      <div className="rjd-page">
        <div className="rjd-loading">
          <FiBriefcase />
          <p>Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="rjd-page">
        <button type="button" className="rjd-back-btn" onClick={() => navigate("/recruiter/my-jobs")}>
          <FiArrowLeft />
          Back to My Jobs
        </button>

        <div className="rjd-error-state">
          <FiBriefcase />
          <h2>{error || "Job not found"}</h2>
          <button type="button" onClick={() => navigate("/recruiter/my-jobs")}>
            Back to My Jobs
          </button>
        </div>
      </div>
    );
  }

  const getPhotoUrl = (photo) => {
    if (!photo) return null;

    if (
      photo.startsWith("http://") ||
      photo.startsWith("https://")
    ) {
      return photo;
    }

    return `http://localhost:5000${photo.startsWith("/") ? photo : `/${photo}`
      }`;
  };

  return (
    <div className="rjd-page">
      {/* TOP ACTIONS */}
      <div className="rjd-topbar">
        <button type="button" className="rjd-back-btn" onClick={() => navigate("/recruiter/my-jobs")}>
          <FiArrowLeft />
          Back to My Jobs
        </button>

        <div className="rjd-actions">
          <button
            type="button"
            className="rjd-edit-btn"
            onClick={() => navigate(`/recruiter/my-jobs/edit/${job._id}`)}
          >
            <FiEdit />
            Edit Job
          </button>

          <button type="button" className="rjd-delete-btn" onClick={handleDelete}>
            <FiTrash2 />
            Delete
          </button>
        </div>
      </div>

      {/* JOB HEADER */}
      <div className="rjd-header">
        <div className="rjd-header-icon">
          {recruiterProfile?.companyLogo ? (
            <img
              src={getPhotoUrl(recruiterProfile.companyLogo)}
              alt={
                recruiterProfile?.companyName ||
                job.companyName ||
                "Company"
              }
            />
          ) : (
            <FiBriefcase />
          )}
        </div>

        <div className="rjd-header-title">
          <div className="rjd-title-row">
            <h1>{job.title}</h1>
            <span className={`rjd-status ${job.status?.toLowerCase()}`}>{job.status}</span>
          </div>

          <h3>{job.companyName}</h3>

          <div className="rjd-header-meta">
            <span>
              <FiMapPin />
              {getLocation()}
            </span>
            <span>
              <FiBriefcase />
              {job.workMode}
            </span>
            <span>
              <FiClock />
              {job.employmentType}
            </span>
          </div>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="rjd-summary">
        <div className="rjd-summary-card">
          <FiDollarSign />
          <div>
            <span>Salary</span>
            <strong>{formatSalary()}</strong>
            <small>{job.salaryType}</small>
          </div>
        </div>

        <div className="rjd-summary-card">
          <FiUsers />
          <div>
            <span>Vacancies</span>
            <strong>{job.vacancies}</strong>
            <small>{job.vacancies === 1 ? "Position" : "Positions"}</small>
          </div>
        </div>

        <div className="rjd-summary-card">
          <FiBriefcase />
          <div>
            <span>Experience</span>
            <strong>{job.experienceMin} - {job.experienceMax} years</strong>
            <small>Experience required</small>
          </div>
        </div>

        <div className="rjd-summary-card">
          <FiCalendar />
          <div>
            <span>Deadline</span>
            <strong>{formatDate(job.applicationDeadline)}</strong>
            <small>Application deadline</small>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="rjd-grid">
        {/* LEFT */}
        <div className="rjd-main">
          {/* DESCRIPTION */}
          <div className="rjd-card">
            <div className="rjd-card-title">
              <FiFileText />
              <h2>Job Description</h2>
            </div>
            <p className="rjd-description">{job.description || "No description provided."}</p>
          </div>

          {/* REQUIREMENTS */}
          <div className="rjd-card">
            <div className="rjd-card-title">
              <FiFileText />
              <h2>Requirements</h2>
            </div>
            <p className="rjd-description">{job.requirements || "No requirements provided."}</p>
          </div>

          {/* SKILLS */}
          <div className="rjd-card">
            <div className="rjd-card-title">
              <FiTag />
              <h2>Required Skills</h2>
            </div>

            {job.skills?.length > 0 ? (
              <div className="rjd-skills">
                {job.skills.map((skill, index) => (
                  <span key={index}>{skill}</span>
                ))}
              </div>
            ) : (
              <p className="rjd-description">No skills specified.</p>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="rjd-sidebar">
          {/* JOB INFORMATION */}
          <div className="rjd-card">
            <div className="rjd-card-title">
              <FiBriefcase />
              <h2>Job Information</h2>
            </div>

            <div className="rjd-info-list">
              <div>
                <span>Category</span>
                <strong>{job.category || "Not specified"}</strong>
              </div>
              <div>
                <span>Employment Type</span>
                <strong>{job.employmentType}</strong>
              </div>
              <div>
                <span>Work Mode</span>
                <strong>{job.workMode}</strong>
              </div>
              <div>
                <span>Posted On</span>
                <strong>{formatDate(job.createdAt)}</strong>
              </div>
              <div>
                <span>Last Updated</span>
                <strong>{formatDate(job.updatedAt)}</strong>
              </div>
            </div>
          </div>

          {/* LOCATION */}
          <div className="rjd-card">
            <div className="rjd-card-title">
              <FiMapPin />
              <h2>Location</h2>
            </div>
            <p className="rjd-location-text">{getLocation()}</p>
          </div>

          {/* RECRUITER */}
          {job.recruiter && (
            <div className="rjd-card">
              <div className="rjd-card-title">
                <FiUsers />
                <h2>Recruiter</h2>
              </div>

              <div className="rjd-owner-info">
                <div className="rjd-recruiter-profile">

                  <div className="rjd-recruiter-photo">
                    {recruiterProfile?.profilePhoto ? (
                      <img
                        src={getPhotoUrl(
                          recruiterProfile.profilePhoto
                        )}
                        alt={
                          recruiterProfile.fullName ||
                          job.recruiter.name ||
                          "Recruiter"
                        }
                      />
                    ) : (
                      (
                        recruiterProfile?.fullName ||
                        job.recruiter.name ||
                        "R"
                      )
                        .charAt(0)
                        .toUpperCase()
                    )}
                  </div>

                  <div className="rjd-recruiter-details">
                    <strong>
                      {recruiterProfile?.fullName ||
                        job.recruiter.name ||
                        "Recruiter"}
                    </strong>

                    <span>
                      {recruiterProfile?.email ||
                        job.recruiter.email ||
                        "Email not available"}
                    </span>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecruiterJobDetails;
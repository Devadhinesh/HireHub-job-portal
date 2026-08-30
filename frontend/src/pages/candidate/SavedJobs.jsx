import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiBriefcase,
  FiMapPin,
  FiDollarSign,
  FiLayers,
  FiClock,
  FiCalendar,
  FiUsers,
  FiCode,
  FiHeart,
  FiArrowRight,
  FiX,
  FiCheckCircle,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/context/AuthContext";
import "./SavedJobs.css";

const SERVER_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const API_URL = `${SERVER_URL}/api/saved-jobs`;

const RECRUITER_PROFILE_API =
  `${SERVER_URL}/api/recruiter-profile`;

const SavedJobs = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [savedJobs, setSavedJobs] = useState([]);
  const [companyLogos, setCompanyLogos] = useState({});
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deletingJob, setDeletingJob] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchCompanyLogos = async (savedJobsData) => {
    try {
      const recruiterIds = [
        ...new Set(
          savedJobsData
            .map((savedJob) => {
              const job =
                savedJob?.job ||
                savedJob?.jobId;

              return (
                job?.recruiter?._id ||
                job?.recruiter ||
                null
              );
            })
            .filter(Boolean)
            .map((id) => id.toString())
        ),
      ];

      if (recruiterIds.length === 0) {
        setCompanyLogos({});
        return;
      }

      const results = await Promise.all(
        recruiterIds.map(async (recruiterId) => {
          try {
            const response = await axios.get(
              `${RECRUITER_PROFILE_API}/public/${recruiterId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            return {
              recruiterId,
              companyLogo:
                response.data?.profile?.companyLogo || "",
            };
          } catch (error) {
            console.error(
              `Company logo error for ${recruiterId}:`,
              error.response?.data?.message ||
              error.message
            );

            return {
              recruiterId,
              companyLogo: "",
            };
          }
        })
      );

      const logoMap = {};

      results.forEach(
        ({ recruiterId, companyLogo }) => {
          logoMap[recruiterId] = companyLogo;
        }
      );

      setCompanyLogos(logoMap);
    } catch (error) {
      console.error(
        "Fetch company logos error:",
        error
      );
    }
  };

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const savedJobsData =
        response.data.savedJobs || [];

      setSavedJobs(savedJobsData);

      await fetchCompanyLogos(savedJobsData);
    } catch (error) {
      console.error(error);
      setSavedJobs([]);
      setError(error.response?.data?.message || "Failed to fetch saved jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchSavedJobs();
  }, [token]);

  const getJob = (savedJob) => {
    return savedJob?.job || savedJob?.jobId || null;
  };

  const getJobId = (savedJob) => {
    const job = getJob(savedJob);
    if (typeof job === "string") return job;
    return job?._id;
  };

  const getJobLocation = (job) => {
    if (!job?.location) return "Location not specified";
    const location = [job.location.city, job.location.state, job.location.country].filter(
      Boolean
    );
    return location.length > 0 ? location.join(", ") : "Location not specified";
  };

  const getSalary = (job) => {
    if (job?.salaryMin == null && job?.salaryMax == null) {
      return "Salary not specified";
    }
    const min = job.salaryMin != null ? `₹${job.salaryMin.toLocaleString()}` : "";
    const max = job.salaryMax != null ? `₹${job.salaryMax.toLocaleString()}` : "";
    if (min && max) {
      return `${min} - ${max} ${job.salaryType || ""}`;
    }
    return `${min || max} ${job.salaryType || ""}`;
  };

  const getExperience = (job) => {
    const min = job?.experienceMin ?? 0;
    const max = job?.experienceMax ?? 0;
    if (min === 0 && max === 0) return "Fresher";
    if (min === max) return `${min} years`;
    return `${min} - ${max} years`;
  };

  const formatDate = (date) => {
    if (!date) return "Not specified";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleUnsaveJob = async (savedJob) => {
    const savedJobId = savedJob?._id;
    const jobId = getJobId(savedJob);

    if (!savedJobId) {
      setError("Saved job ID not found");
      return;
    }

    if (!jobId) {
      setError("Job ID not found");
      return;
    }

    try {
      setDeletingJob(savedJobId);
      setError("");
      setMessage("");

      console.log("Saved Job ID:", savedJobId);
      console.log("Job ID:", jobId);

      // IMPORTANT:
      // Backend expects /api/saved-jobs/:jobId
      await axios.delete(`${API_URL}/${jobId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Remove from UI using SavedJob ID
      setSavedJobs((prev) =>
        prev.filter((item) => item._id !== savedJobId)
      );

      // Close modal if this job is currently selected
      if (selectedJob && selectedJob._id === jobId) {
        setSelectedJob(null);
      }

      setMessage("Job removed from saved jobs");
    } catch (error) {
      console.error("Remove Saved Job Error:", error);

      setError(
        error.response?.data?.message ||
        "Failed to remove saved job"
      );
    } finally {
      setDeletingJob(null);
    }
  };

  const handleViewDetails = (savedJob) => {
    const job = getJob(savedJob);
    if (!job || typeof job === "string") {
      setError("Job details not available");
      return;
    }
    setSelectedJob(job);
    setError("");
    setMessage("");
  };

  const closeDetails = () => {
    setSelectedJob(null);
  };

  const getImageUrl = (image) => {
    if (!image) return "";

    if (
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      return image;
    }

    return `${SERVER_URL}${image.startsWith("/") ? image : `/${image}`
      }`;
  };

  return (
    <div className="candidate-saved-jobs">
      {/* HEADER */}
      <div className="saved-jobs-header">
        <div className="saved-jobs-title">
          <div className="saved-jobs-icon">
            <FiHeart />
          </div>
          <div>
            <h1>Jobs You Saved</h1>
            <p>Keep track of opportunities you're interested in.</p>
          </div>
        </div>
        <div className="saved-jobs-count">
          <FiHeart />
          <span>{savedJobs.length} Saved</span>
        </div>
      </div>
      {/* MESSAGE */}
      {message && (
        <div className="success-message">
          <FiCheckCircle />
          {message}
        </div>
      )}
      {error && <div className="error-message">{error}</div>}
      {/* CONTENT */}
      {loading ? (
        <div className="saved-jobs-empty">
          <div className="empty-icon">
            <FiBriefcase />
          </div>
          <h3>Loading saved jobs...</h3>
          <p>Please wait while we load your saved jobs.</p>
        </div>
      ) : savedJobs.length === 0 ? (
        <div className="saved-jobs-empty">
          <div className="empty-icon">
            <FiHeart />
          </div>
          <h3>No Saved Jobs</h3>
          <p>
            You haven't saved any jobs yet. Search for jobs and save the ones you're interested
            in.
          </p>
          <button
            type="button"
            className="search-jobs-btn"
            onClick={() => navigate("/candidate/search-jobs")}
          >
            <FiBriefcase />
            Search Jobs
          </button>
        </div>
      ) : (
        <div className="saved-jobs-list">
          {savedJobs.map((savedJob) => {
            const job = getJob(savedJob);
            if (!job || typeof job === "string") return null;
            return (
              <div className="saved-job-card" key={savedJob._id}>
                {/* JOB HEADER */}
                <div className="saved-job-top">
                  <div className="saved-job-icon">
                    {(() => {
                      const recruiterId =
                        job?.recruiter?._id ||
                        job?.recruiter;

                      const logo = recruiterId
                        ? companyLogos[recruiterId.toString()]
                        : "";

                      return logo ? (
                        <img
                          src={getImageUrl(logo)}
                          alt={job?.companyName || "Company"}
                        />
                      ) : (
                        <FiBriefcase />
                      );
                    })()}
                  </div>
                  <div className="saved-job-title">
                    <h2>{job.title}</h2>
                    <h4>{job.companyName}</h4>
                  </div>
                  <button
                    type="button"
                    className="unsave-job-btn"
                    title="Remove Saved Job"
                    disabled={deletingJob === savedJob._id}
                    onClick={() => handleUnsaveJob(savedJob)}
                  >
                    <FiHeart />
                  </button>
                </div>
                {/* JOB META */}
                <div className="saved-job-meta">
                  <span>
                    <FiMapPin />
                    {getJobLocation(job)}
                  </span>
                  <span>
                    <FiBriefcase />
                    {job.employmentType}
                  </span>
                  <span>
                    <FiLayers />
                    {job.workMode}
                  </span>
                  <span>
                    <FiDollarSign />
                    {getSalary(job)}
                  </span>
                  <span>
                    <FiClock />
                    {getExperience(job)}
                  </span>
                </div>
                {/* DESCRIPTION */}
                <p className="saved-job-description">
                  {job.description?.length > 180
                    ? `${job.description.substring(0, 180)}...`
                    : job.description}
                </p>
                {/* SKILLS */}
                {job.skills?.length > 0 && (
                  <div className="saved-job-skills">
                    {job.skills.slice(0, 6).map((skill, index) => (
                      <span key={index}>{skill}</span>
                    ))}
                  </div>
                )}
                {/* FOOTER */}
                <div className="saved-job-footer">
                  <span>
                    <FiCalendar />
                    Apply before {formatDate(job.applicationDeadline)}
                  </span>
                  <button
                    type="button"
                    className="view-saved-job-btn"
                    onClick={() => handleViewDetails(savedJob)}
                  >
                    View Details
                    <FiArrowRight />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* JOB DETAILS MODAL */}
      {selectedJob && (
        <div className="saved-job-details-overlay">
          <div className="saved-job-details-modal">
            <button type="button" className="close-details-btn" onClick={closeDetails}>
              <FiX />
            </button>
            {/* DETAILS HEADER */}
            <div className="details-header">
              <div className="details-job-icon">
                {(() => {
                  const recruiterId =
                    selectedJob?.recruiter?._id ||
                    selectedJob?.recruiter;

                  const logo = recruiterId
                    ? companyLogos[recruiterId.toString()]
                    : "";

                  return logo ? (
                    <img
                      src={getImageUrl(logo)}
                      alt={
                        selectedJob?.companyName ||
                        "Company"
                      }
                    />
                  ) : (
                    <FiBriefcase />
                  );
                })()}
              </div>
              <div>
                <h1>{selectedJob.title}</h1>
                <h3>{selectedJob.companyName}</h3>
              </div>
            </div>
            {/* DETAILS META */}
            <div className="details-meta">
              <div>
                <FiMapPin />
                <span>{getJobLocation(selectedJob)}</span>
              </div>
              <div>
                <FiBriefcase />
                <span>{selectedJob.employmentType}</span>
              </div>
              <div>
                <FiLayers />
                <span>{selectedJob.workMode}</span>
              </div>
              <div>
                <FiDollarSign />
                <span>{getSalary(selectedJob)}</span>
              </div>
              <div>
                <FiClock />
                <span>{getExperience(selectedJob)}</span>
              </div>
            </div>
            {/* DESCRIPTION */}
            <div className="details-section">
              <h2>Job Description</h2>
              <p>{selectedJob.description || "No description provided."}</p>
            </div>
            {/* REQUIREMENTS */}
            <div className="details-section">
              <h2>Requirements</h2>
              <p>{selectedJob.requirements || "No requirements specified."}</p>
            </div>
            {/* SKILLS */}
            <div className="details-section">
              <h2>Required Skills</h2>
              {selectedJob.skills?.length > 0 ? (
                <div className="details-skills">
                  {selectedJob.skills.map((skill, index) => (
                    <span key={index}>
                      <FiCode />
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p>No specific skills listed.</p>
              )}
            </div>
            {/* JOB INFORMATION */}
            <div className="details-section">
              <h2>Job Information</h2>
              <div className="job-information-grid">
                <div>
                  <FiUsers />
                  <span>Vacancies</span>
                  <strong>{selectedJob.vacancies}</strong>
                </div>
                <div>
                  <FiBriefcase />
                  <span>Category</span>
                  <strong>{selectedJob.category}</strong>
                </div>
                <div>
                  <FiCalendar />
                  <span>Application Deadline</span>
                  <strong>{formatDate(selectedJob.applicationDeadline)}</strong>
                </div>
                <div>
                  <FiClock />
                  <span>Posted On</span>
                  <strong>{formatDate(selectedJob.createdAt)}</strong>
                </div>
              </div>
            </div>
            {/* ACTIONS */}
            <div className="details-actions">
              <button
                type="button"
                className="remove-saved-btn"
                onClick={() => {
                  const savedJob = savedJobs.find(
                    (item) => getJobId(item) === selectedJob._id
                  );

                  if (savedJob) {
                    handleUnsaveJob(savedJob);
                  } else {
                    setError("Saved job not found");
                  }
                }}
              >
                <FiHeart />
                Remove Saved Job
              </button>
              <button
                type="button"
                className="apply-job-btn"
                onClick={() =>
                  window.open(
                    `/candidate/applications/apply/${selectedJob._id}`,
                    "_blank"
                  )
                }
              >
                <FiCheckCircle />
                Apply Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedJobs;
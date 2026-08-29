import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiBriefcase, FiMapPin, FiDollarSign, FiLayers, FiClock,
  FiCalendar, FiUsers, FiCode, FiFileText, FiCheckCircle,
  FiSend, FiArrowLeft,
} from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../../components/context/AuthContext";
import "./CandidateApplyJob.css";

const JOB_API = "http://localhost:5000/api/jobs";
const RECRUITER_PROFILE_API =
  "http://localhost:5000/api/recruiter-profile";
const PROFILE_API = "http://localhost:5000/api/candidates/profile";
const APPLICATION_API = "http://localhost:5000/api/applications";

const CandidateApplyJob = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const { token } = useAuth();


  const [job, setJob] = useState(null);
  const [companyLogo, setCompanyLogo] = useState("");
  const [profile, setProfile] = useState(null);
  const [selectedResume, setSelectedResume] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Fetch job + profile
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [jobResponse, profileResponse] =
          await Promise.all([
            axios.get(`${JOB_API}/${jobId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),

            axios.get(`${PROFILE_API}/me`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),
          ]);

        const jobData = jobResponse.data.job;
        const candidateProfile =
          profileResponse.data.profile;

        setJob(jobData);
        setProfile(candidateProfile);

        // Resume
        const resumes =
          candidateProfile?.resume || [];

        if (resumes.length > 0) {
          setSelectedResume(
            resumes[resumes.length - 1].url
          );
        }

        // ==============================
        // FETCH COMPANY LOGO
        // ==============================

        const recruiterId =
          jobData?.recruiter?._id ||
          jobData?.recruiter;

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

            const recruiterProfile =
              recruiterResponse.data?.profile;

            setCompanyLogo(
              recruiterProfile?.companyLogo || ""
            );
          } catch (recruiterError) {
            console.error(
              "Failed to fetch recruiter profile:",
              recruiterError.response?.data?.message ||
              recruiterError.message
            );

            setCompanyLogo("");
          }
        }
      } catch (error) {
        console.error(error);

        setError(
          error.response?.data?.message ||
          "Failed to load application details"
        );
      } finally {
        setLoading(false);
      }
    };

    if (token && jobId) {
      fetchData();
    }
  }, [token, jobId]);

  const getLocation = () => {
    if (!job?.location) return "Location not specified";
    const location = [job.location.city, job.location.state, job.location.country].filter(Boolean);
    return location.length > 0 ? location.join(", ") : "Location not specified";
  };

  const getSalary = () => {
    if (job?.salaryMin == null && job?.salaryMax == null) return "Salary not specified";
    const min = job.salaryMin != null ? `₹${job.salaryMin.toLocaleString()}` : "";
    const max = job.salaryMax != null ? `₹${job.salaryMax.toLocaleString()}` : "";
    if (min && max) return `${min} - ${max} ${job.salaryType || ""}`;
    return `${min || max} ${job.salaryType || ""}`;
  };

  const getExperience = () => {
    const min = job?.experienceMin ?? 0;
    const max = job?.experienceMax ?? 0;
    if (min === 0 && max === 0) return "Fresher";
    if (min === max) return `${min} years`;
    return `${min} - ${max} years`;
  };

  const formatDate = (date) => {
    if (!date) return "Not specified";
    return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    if (!selectedResume) {
      setError("Please select a resume before applying.");
      return;
    }
    try {
      setSubmitting(true);
      const response = await axios.post(
        APPLICATION_API,
        { job: jobId, resume: selectedResume, coverLetter: coverLetter.trim() },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      setMessage(response.data.message || "Job application submitted successfully");
      setTimeout(() => navigate("/candidate/applications"), 1200);
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="candidate-apply-job">
        <div className="apply-loading">
          <FiBriefcase />
          <h3>Loading job details...</h3>
          <p>Please wait while we prepare the application.</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="candidate-apply-job">
        <div className="apply-error">
          <div className="apply-error-icon"><FiBriefcase /></div>
          <h2>Job Not Found</h2>
          <p>{error || "The job you're trying to apply for could not be found."}</p>
          <button type="button" className="back-jobs-btn" onClick={() => window.close()}>
            <FiArrowLeft /> Close Tab
          </button>
        </div>
      </div>
    );
  }

  const resumes = profile?.resume || [];

  const getImageUrl = (image) => {
    if (!image) return "";

    if (
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      return image;
    }

    return `http://localhost:5000${image.startsWith("/") ? image : `/${image}`
      }`;
  };

  return (
    <div className="candidate-apply-job">
      <div className="apply-page-header">
        <button
          type="button"
          className="back-apply-btn"
          onClick={handleClose}
        >
          <FiArrowLeft />
          Close
        </button>
        <div>
          <h1>Apply for Job</h1>
          <p>Submit your application for this opportunity.</p>
        </div>
      </div>

      {message && (
        <div className="apply-success-message">
          <FiCheckCircle /> <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="apply-error-message">
          <span>{error}</span>
        </div>
      )}

      <div className="apply-page-grid">
        <div className="apply-job-details">
          <div className="apply-job-heading">
            <div className="apply-job-icon">
              {companyLogo ? (
                <img
                  src={getImageUrl(companyLogo)}
                  alt={job?.companyName || "Company Logo"}
                />
              ) : (
                <FiBriefcase />
              )}
            </div>
            <div>
              <h2>{job.title}</h2>
              <h3>{job.companyName}</h3>
            </div>
          </div>

          <div className="apply-job-meta">
            <div><FiMapPin /><span>{getLocation()}</span></div>
            <div><FiBriefcase /><span>{job.employmentType}</span></div>
            <div><FiLayers /><span>{job.workMode}</span></div>
            <div><FiDollarSign /><span>{getSalary()}</span></div>
            <div><FiClock /><span>{getExperience()}</span></div>
            <div><FiCalendar /><span>Apply before {formatDate(job.applicationDeadline)}</span></div>
          </div>

          <div className="apply-details-section">
            <h2>Job Description</h2>
            <p>{job.description || "No description provided."}</p>
          </div>

          <div className="apply-details-section">
            <h2>Requirements</h2>
            <p>{job.requirements || "No specific requirements provided."}</p>
          </div>

          <div className="apply-details-section">
            <h2>Required Skills</h2>
            {job.skills?.length > 0 ? (
              <div className="apply-skills">
                {job.skills.map((skill, index) => (
                  <span key={index}><FiCode />{skill}</span>
                ))}
              </div>
            ) : (
              <p>No specific skills listed.</p>
            )}
          </div>

          <div className="apply-details-section">
            <h2>Job Information</h2>
            <div className="apply-information-grid">
              <div><FiUsers /><span>Vacancies</span><strong>{job.vacancies}</strong></div>
              <div><FiBriefcase /><span>Category</span><strong>{job.category}</strong></div>
              <div><FiCalendar /><span>Deadline</span><strong>{formatDate(job.applicationDeadline)}</strong></div>
              <div><FiClock /><span>Posted</span><strong>{formatDate(job.createdAt)}</strong></div>
            </div>
          </div>
        </div>

        <div className="apply-form-card">
          <div className="apply-form-header">
            <FiSend />
            <div>
              <h2>Submit Application</h2>
              <p>Complete your application details below.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="apply-form-group">
              <label><FiFileText /> Select Resume</label>
              {resumes.length === 0 ? (
                <div className="no-resume">
                  <p>No resume found in your candidate profile.</p>
                  <button type="button" onClick={() => navigate("/candidate/profile")}>
                    Upload Resume
                  </button>
                </div>
              ) : (
                <div className="resume-options">
                  {resumes.map((resume, index) => (
                    <label
                      className={`resume-option ${selectedResume === resume.url ? "selected" : ""}`}
                      key={resume._id || index}
                    >
                      <input
                        type="radio"
                        name="resume"
                        value={resume.url}
                        checked={selectedResume === resume.url}
                        onChange={(e) => setSelectedResume(e.target.value)}
                      />
                      <FiFileText />
                      <span>{resume.name || `Resume ${index + 1}`}</span>
                      {selectedResume === resume.url && <FiCheckCircle />}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="apply-form-group">
              <label htmlFor="coverLetter"><FiFileText /> Cover Letter <small>Optional</small></label>
              <textarea
                id="coverLetter"
                name="coverLetter"
                rows="8"
                placeholder="Write a short cover letter for this position..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              />
            </div>

            <div className="application-profile-info">
              <h3>Applying as</h3>
              <div>
                <strong>{profile?.fullName || "Candidate"}</strong>
                <span>{profile?.email || "Email not available"}</span>
              </div>
            </div>

            <button
              type="submit"
              className="submit-application-btn"
              disabled={submitting || !selectedResume || resumes.length === 0}
            >
              {submitting ? (<><FiClock /> Submitting...</>) : (<><FiSend /> Submit Application</>)}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CandidateApplyJob;
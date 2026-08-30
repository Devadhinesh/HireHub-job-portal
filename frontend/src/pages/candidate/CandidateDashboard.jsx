import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiSearch,
  FiHeart,
  FiFileText,
  FiCalendar,
  FiMessageSquare,
  FiUser,
  FiArrowRight,
  FiBriefcase,
  FiMail,
  FiMapPin,
  FiPhone,
  FiTag,
  FiDollarSign,
  FiLayers,
  FiSend,
  FiEye,
  FiClock,
  FiX,
} from "react-icons/fi";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/context/AuthContext";
import "./CandidateDashboard.css";

const SERVER_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";
const PROFILE_API = `${SERVER_URL}/api/candidates/profile`;
const RECRUITER_PROFILE_API = `${SERVER_URL}/api/recruiter-profile/public`;
const APPLICATION_API = `${SERVER_URL}/api/applications`;
const INTERVIEW_API = `${SERVER_URL}/api/interviews`;
const SAVED_JOB_API = `${SERVER_URL}/api/saved-jobs`;
const MESSAGE_API = `${SERVER_URL}/api/messages`;
const JOB_API = `${SERVER_URL}/api/jobs`;

const CandidateDashboard = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [profile, setProfile] = useState(null);
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [interviewsCount, setInterviewsCount] = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);
  const [jobs, setJobs] = useState([]);
  const [recruiterProfiles, setRecruiterProfiles] = useState({});
  const [savedJobIds, setSavedJobIds] = useState([]);
  const [savingJobId, setSavingJobId] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${PROFILE_API}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(response.data.profile || null);
    } catch (error) {
      console.error("Profile Error:", error.response?.data?.message || error.message);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await axios.get(`${APPLICATION_API}/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const applications = Array.isArray(response.data.applications) ? response.data.applications : [];
      setApplicationsCount(applications.length);
    } catch (error) {
      console.error("Applications Error:", error.response?.data?.message || error.message);
      setApplicationsCount(0);
    }
  };

  const fetchInterviews = async () => {
    try {
      const response = await axios.get(`${INTERVIEW_API}/candidate`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const interviews = Array.isArray(response.data.interviews) ? response.data.interviews : [];
      setInterviewsCount(interviews.length);
    } catch (error) {
      console.error("Interviews Error:", error.response?.data?.message || error.message);
      setInterviewsCount(0);
    }
  };

  const fetchSavedJobs = async () => {
    try {
      const response = await axios.get(SAVED_JOB_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const savedJobs = Array.isArray(response.data.savedJobs) ? response.data.savedJobs : [];
      setSavedJobsCount(savedJobs.length);
      const ids = savedJobs
        .map((savedJob) => {
          if (savedJob?.job?._id) return savedJob.job._id.toString();
          if (savedJob?.job) return savedJob.job.toString();
          return null;
        })
        .filter(Boolean);
      setSavedJobIds(ids);
    } catch (error) {
      console.error("Saved Jobs Error:", error.response?.data?.message || error.message);
      setSavedJobsCount(0);
      setSavedJobIds([]);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(MESSAGE_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const messages = response.data.messages || response.data.conversations || response.data.data || [];
      setMessagesCount(Array.isArray(messages) ? messages.length : 0);
    } catch (error) {
      console.error("Messages Error:", error.response?.data?.message || error.message);
      setMessagesCount(0);
    }
  };

  const fetchRecruiterProfiles = async (jobsData) => {
    if (!token || !jobsData?.length) return;

    const profileMap = {};

    await Promise.all(
      jobsData.map(async (job) => {
        const recruiterId =
          job?.recruiter?._id || job?.recruiter;

        if (!recruiterId) return;

        // Avoid duplicate API requests
        if (profileMap[recruiterId]) return;

        try {
          const response = await axios.get(
            `${RECRUITER_PROFILE_API}/${recruiterId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const recruiterProfile =
            response.data?.profile;

          if (recruiterProfile) {
            profileMap[recruiterId] =
              recruiterProfile;
          }
        } catch (error) {
          console.error(
            "Recruiter Profile Error:",
            recruiterId,
            error.response?.data?.message ||
            error.message
          );
        }
      })
    );

    setRecruiterProfiles(profileMap);
  };

  const fetchJobs = async () => {
    try {
      setJobsLoading(true);

      const response = await axios.get(JOB_API);

      let jobsData = [];

      if (Array.isArray(response.data)) {
        jobsData = response.data;
      } else if (Array.isArray(response.data.jobs)) {
        jobsData = response.data.jobs;
      } else if (Array.isArray(response.data.data)) {
        jobsData = response.data.data;
      }

      jobsData = jobsData.filter(
        (job) => job?._id
      );

      setJobs(jobsData);

      // Fetch recruiter profile + company logo
      await fetchRecruiterProfiles(jobsData);

    } catch (error) {
      console.error(
        "Jobs Error:",
        error.response?.data?.message ||
        error.message
      );

      setJobs([]);
    } finally {
      setJobsLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      await Promise.all([fetchProfile(), fetchApplications(), fetchInterviews(), fetchSavedJobs(), fetchMessages()]);
    } catch (error) {
      console.error("Dashboard Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
      fetchJobs();
    }
  }, [token]);

  const getProfilePhoto = () => {
    if (!profile?.profilePhoto) return null;
    if (profile.profilePhoto.startsWith("http")) return profile.profilePhoto;
    return `${SERVER_URL}${profile.profilePhoto}`;
  };
  const getCompanyLogo = (job) => {
    const recruiterId =
      job?.recruiter?._id || job?.recruiter;

    if (!recruiterId) return null;

    const logo =
      recruiterProfiles[recruiterId]?.companyLogo;

    if (!logo) return null;

    if (
      logo.startsWith("http://") ||
      logo.startsWith("https://")
    ) {
      return logo;
    }

    return `${SERVER_URL}${logo}`;
  };

  const getAddress = () => {
    const location = profile?.location;
    if (!location) return "Location not added";
    const address = [location.city, location.state, location.country].filter(Boolean);
    return address.length > 0 ? address.join(", ") : "Location not added";
  };

  const getJobLocation = (job) => {
    if (!job?.location) return "Location not specified";
    if (typeof job.location === "string") return job.location;
    return [job.location.city, job.location.state, job.location.country].filter(Boolean).join(", ") || "Location not specified";
  };

  const getSalary = (job) => {
    const min = job?.salaryMin;
    const max = job?.salaryMax;
    if (!min && !max) return "Salary not specified";
    const formatNumber = (value) => Number(value).toLocaleString("en-IN");
    if (min && max) return `₹${formatNumber(min)} - ₹${formatNumber(max)}`;
    if (min) return `₹${formatNumber(min)}`;
    return `₹${formatNumber(max)}`;
  };

  const formatDeadline = (date) => {
    if (!date) return "No deadline";
    return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const recommendedJobs = useMemo(() => {
    if (!jobs.length) return [];
    const candidateSkills = Array.isArray(profile?.skills)
      ? profile.skills.map((skill) => String(skill).toLowerCase().trim())
      : [];
    if (candidateSkills.length === 0) return jobs.slice(0, 3);
    const scoredJobs = jobs.map((job) => {
      const jobSkills = Array.isArray(job?.skills) ? job.skills.map((skill) => String(skill).toLowerCase().trim()) : [];
      let score = 0;
      candidateSkills.forEach((candidateSkill) => {
        jobSkills.forEach((jobSkill) => {
          if (candidateSkill === jobSkill || candidateSkill.includes(jobSkill) || jobSkill.includes(candidateSkill)) {
            score += 1;
          }
        });
      });
      return { ...job, recommendationScore: score };
    });
    return scoredJobs.sort((a, b) => b.recommendationScore - a.recommendationScore).slice(0, 3);
  }, [jobs, profile]);

  const handleSaveJob = async (job) => {
    if (!token) {
      await Swal.fire({ icon: "warning", title: "Login Required", text: "Please login to save jobs." });
      return;
    }
    if (!job?._id) {
      await Swal.fire({ icon: "error", title: "Job Error", text: "Job information is missing." });
      return;
    }
    const jobId = job._id.toString();
    try {
      setSavingJobId(jobId);
      const isSaved = savedJobIds.includes(jobId);
      if (isSaved) {
        await axios.delete(`${SAVED_JOB_API}/${jobId}`, { headers: { Authorization: `Bearer ${token}` } });
        setSavedJobIds((previous) => previous.filter((id) => id !== jobId));
        setSavedJobsCount((previous) => Math.max(previous - 1, 0));
        await Swal.fire({ position: "top-end", icon: "success", title: "Job removed from saved jobs", showConfirmButton: false, timer: 1200 });
        return;
      }
      await axios.post(SAVED_JOB_API, { job: jobId }, { headers: { Authorization: `Bearer ${token}` } });
      setSavedJobIds((previous) => (previous.includes(jobId) ? previous : [...previous, jobId]));
      setSavedJobsCount((previous) => previous + 1);
      await Swal.fire({ position: "top-end", icon: "success", title: "Job saved successfully", showConfirmButton: false, timer: 1200 });
    } catch (error) {
      console.error("Save Job Error:", error);
      const message = error.response?.data?.message || "Failed to save job.";
      if (message === "Job already saved") {
        setSavedJobIds((previous) => (previous.includes(jobId) ? previous : [...previous, jobId]));
      }
      await Swal.fire({ icon: "error", title: "Save Job Failed", text: message });
    } finally {
      setSavingJobId(null);
    }
  };

  const handleViewJob = async (job) => {
    if (!job?._id) return;
    try {
      const response = await axios.get(`${JOB_API}/${job._id}`);
      const jobDetails = response.data.job || response.data.data || response.data;
      setSelectedJob(jobDetails);
    } catch (error) {
      console.error("Job Details Error:", error);
      setSelectedJob(job);
    }
  };

  const handleApplyJob = (job) => {
    if (!job?._id) {
      console.error("Job ID is missing:", job);
      return;
    }
    navigate(`/candidate/applications/apply/${job._id}`, { state: { job } });
  };

  const stats = [
    { title: "Saved Jobs", value: savedJobsCount, icon: <FiHeart />, path: "/candidate/saved-jobs", className: "saved" },
    { title: "Applications", value: applicationsCount, icon: <FiFileText />, path: "/candidate/applications", className: "applications" },
    { title: "Interviews", value: interviewsCount, icon: <FiCalendar />, path: "/candidate/interviews", className: "interviews" },
    { title: "Messages", value: messagesCount, icon: <FiMessageSquare />, path: "/candidate/messages", className: "messages" },
  ];

  const quickActions = [
    { title: "Search Jobs", description: "Find jobs that match your skills.", icon: <FiSearch />, path: "/candidate/search-jobs" },
    { title: "Update Profile", description: "Keep your profile updated.", icon: <FiUser />, path: "/candidate/profile" },
    { title: "My Applications", description: "Track your job applications.", icon: <FiFileText />, path: "/candidate/applications" },
  ];

  if (loading) {
    return (
      <div className="candidate-dashboard">
        <div className="candidate-dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="candidate-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome Back, {profile?.fullName || "Candidate"}!</h1>
          <p>Find your next opportunity and manage your job search.</p>
        </div>
        <button type="button" className="search-jobs-btn" onClick={() => navigate("/candidate/search-jobs")}>
          <FiSearch />
          Search Jobs
        </button>
      </div>

      <div className="dashboard-stats">
        {stats.map((stat) => (
          <div className="dashboard-stat-card" key={stat.title} onClick={() => navigate(stat.path)}>
            <div className={`stat-icon ${stat.className}`}>{stat.icon}</div>
            <div className="stat-content">
              <span>{stat.title}</span>
              <h2>{stat.value}</h2>
            </div>
            <FiArrowRight className="stat-arrow" />
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card profile-completion">
          <div className="dashboard-profile">
            <div className="dashboard-profile-photo">
              {getProfilePhoto() ? <img src={getProfilePhoto()} alt={profile?.fullName || "Profile"} /> : <FiUser />}
            </div>
            <div className="dashboard-profile-info">
              <h3>{profile?.fullName || "Name not added"}</h3>
              <div className="profile-detail-row">
                <div className="profile-detail">
                  <FiMail />
                  <span>{profile?.email || "Email not added"}</span>
                </div>
                <div className="profile-detail">
                  <FiMapPin />
                  <span>{getAddress()}</span>
                </div>
                <div className="profile-detail">
                  <FiPhone />
                  <span>{profile?.phone || "Phone not added"}</span>
                </div>
                <div className="profile-detail">
                  <FiTag />
                  <span>{profile?.headline || "Headline not added"}</span>
                </div>
              </div>
            </div>
          </div>
          <button type="button" className="complete-profile-btn" onClick={() => navigate("/candidate/profile")}>
            Update Profile
            <FiArrowRight />
          </button>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h2>Quick Actions</h2>
              <p>Manage your job search quickly.</p>
            </div>
            <FiBriefcase />
          </div>
          <div className="quick-actions">
            {quickActions.map((action) => (
              <button type="button" className="quick-action" key={action.title} onClick={() => navigate(action.path)}>
                <span className="quick-action-icon">{action.icon}</span>
                <span className="quick-action-content">
                  <strong>{action.title}</strong>
                  <small>{action.description}</small>
                </span>
                <FiArrowRight />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-card recent-jobs">
        <div className="card-header">
          <div>
            <h2>Recommended Jobs</h2>
            <p>Jobs that may match your profile and skills.</p>
          </div>
          <button type="button" className="view-all-btn" onClick={() => navigate("/candidate/search-jobs")}>
            View All
            <FiArrowRight />
          </button>
        </div>

        {jobsLoading ? (
          <div className="empty-jobs">
            <div className="empty-jobs-icon">
              <FiBriefcase />
            </div>
            <h3>Loading recommended jobs...</h3>
          </div>
        ) : recommendedJobs.length === 0 ? (
          <div className="empty-jobs">
            <div className="empty-jobs-icon">
              <FiBriefcase />
            </div>
            <h3>No recommended jobs yet</h3>
            <p>Complete your profile and skills to get better job recommendations.</p>
            <button type="button" className="search-jobs-btn" onClick={() => navigate("/candidate/search-jobs")}>
              <FiSearch />
              Search Jobs
            </button>
          </div>
        ) : (
          <div className="dashboard-recommended-jobs">
            {recommendedJobs.map((job) => {
              const jobId = job?._id?.toString();
              const isSaved = jobId && savedJobIds.includes(jobId);
              const isSaving = savingJobId === jobId;
              return (
                <div className="recommended-job-card" key={jobId}>
                  <div className="recommended-job-header">
                    <div className="recommended-job-icon">
                      {getCompanyLogo(job) ? (
                        <img
                          src={getCompanyLogo(job)}
                          alt={`${job?.companyName || "Company"} logo`}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <FiBriefcase />
                      )}
                    </div>
                    <div className="recommended-job-title">
                      <h3>{job?.title || "Job Title"}</h3>
                      <p>{job?.companyName || "Company"}</p>
                    </div>
                    <button
                      type="button"
                      className={`recommended-save-btn ${isSaved ? "saved" : ""}`}
                      onClick={() => handleSaveJob(job)}
                      disabled={isSaving || !jobId}
                      title={isSaved ? "Remove from saved jobs" : "Save job"}
                    >
                      <FiHeart fill={isSaved ? "currentColor" : "none"} />
                    </button>
                  </div>

                  <div className="recommended-job-meta">
                    <span>
                      <FiMapPin />
                      {getJobLocation(job)}
                    </span>
                    <span>
                      <FiBriefcase />
                      {job?.employmentType || "Full-time"}
                    </span>
                    <span>
                      <FiLayers />
                      {job?.workMode || "On-site"}
                    </span>
                  </div>

                  <div className="recommended-job-salary">
                    <FiDollarSign />
                    <span>{getSalary(job)}</span>
                  </div>

                  <p className="recommended-job-description">
                    {job?.description
                      ? job.description.length > 180
                        ? `${job.description.substring(0, 180)}...`
                        : job.description
                      : "No job description available."}
                  </p>

                  {Array.isArray(job?.skills) && job.skills.length > 0 && (
                    <div className="recommended-job-skills">
                      {job.skills.slice(0, 5).map((skill, index) => (
                        <span key={`${jobId}-${index}`}>{skill}</span>
                      ))}
                    </div>
                  )}

                  <div className="recommended-job-footer">
                    <div className="recommended-job-deadline">
                      <FiClock />
                      <span>Apply by {formatDeadline(job?.applicationDeadline)}</span>
                    </div>
                    <div className="recommended-job-actions">
                      <button type="button" className="recommended-view-btn" onClick={() => handleViewJob(job)}>
                        <FiEye />
                        View
                      </button>
                      <button type="button" className="recommended-apply-btn" onClick={() => handleApplyJob(job)}>
                        <FiSend />
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedJob && (
        <div className="dashboard-job-overlay" onClick={() => setSelectedJob(null)}>
          <div className="dashboard-job-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dashboard-job-modal-header">
              <div>
                <h2>{selectedJob?.title || "Job Details"}</h2>
                <p>{selectedJob?.companyName || "Company"}</p>
              </div>
              <button type="button" onClick={() => setSelectedJob(null)}>
                <FiX />
              </button>
            </div>

            <div className="dashboard-job-modal-body">
              <div className="dashboard-job-detail">
                <FiMapPin />
                <span>{getJobLocation(selectedJob)}</span>
              </div>
              <div className="dashboard-job-detail">
                <FiBriefcase />
                <span>{selectedJob?.employmentType || "Full-time"}</span>
              </div>
              <div className="dashboard-job-detail">
                <FiLayers />
                <span>{selectedJob?.workMode || "On-site"}</span>
              </div>
              <div className="dashboard-job-detail">
                <FiDollarSign />
                <span>{getSalary(selectedJob)}</span>
              </div>

              <div className="dashboard-job-section">
                <h3>Job Description</h3>
                <p>{selectedJob?.description || "No description available."}</p>
              </div>

              <div className="dashboard-job-section">
                <h3>Requirements</h3>
                <p>{selectedJob?.requirements || "No requirements available."}</p>
              </div>

              {Array.isArray(selectedJob?.skills) && selectedJob.skills.length > 0 && (
                <div className="dashboard-job-section">
                  <h3>Skills</h3>
                  <div className="recommended-job-skills">
                    {selectedJob.skills.map((skill, index) => (
                      <span key={index}>{skill}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="dashboard-job-modal-footer">
              <button
                type="button"
                className={`recommended-save-btn ${selectedJob?._id && savedJobIds.includes(selectedJob._id.toString()) ? "saved" : ""
                  }`}
                onClick={() => handleSaveJob(selectedJob)}
              >
                <FiHeart fill={selectedJob?._id && savedJobIds.includes(selectedJob._id.toString()) ? "currentColor" : "none"} />
                {selectedJob?._id && savedJobIds.includes(selectedJob._id.toString()) ? "Saved" : "Save Job"}
              </button>
              <button type="button" className="recommended-apply-btn" onClick={() => handleApplyJob(selectedJob)}>
                <FiSend />
                Apply Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateDashboard;
import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiBriefcase, FiFileText, FiUsers, FiCalendar, FiPlus, FiArrowRight, FiCheckCircle, FiClock, FiGrid } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/context/AuthContext";
import "./RecruiterDashboard.css";

const JOB_API = "http://localhost:5000/api/jobs/recruiter";
const APPLICATION_API = "http://localhost:5000/api/applications/recruiter";

const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [jobsResponse, applicationsResponse] = await Promise.all([axios.get(JOB_API, config), axios.get(APPLICATION_API, config)]);

        setJobs(jobsResponse.data.jobs || []);
        setApplications(applicationsResponse.data.applications || []);
      } catch (error) {
        console.error(error);
        setError(error.response?.data?.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchDashboardData();
  }, [token]);

  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((job) => job.status === "Open").length;

  const totalApplications = applications.length;
  const appliedApplications = applications.filter((application) => application.status === "Applied").length;
  const underReviewApplications = applications.filter((application) => application.status === "Under Review").length;
  const shortlistedApplications = applications.filter((application) => application.status === "Shortlisted").length;
  const interviewApplications = applications.filter((application) => application.status === "Interview").length;

  const stats = [
    { title: "Total Jobs", value: totalJobs, icon: <FiBriefcase />, className: "jobs", path: "/recruiter/my-jobs" },
    { title: "Active Jobs", value: activeJobs, icon: <FiCheckCircle />, className: "active", path: "/recruiter/my-jobs" },
    { title: "Applications", value: totalApplications, icon: <FiFileText />, className: "applications", path: "/recruiter/applications" },
    { title: "Interviews", value: interviewApplications, icon: <FiCalendar />, className: "interviews", path: "/recruiter/interviews" },
  ];

  const quickActions = [
    { title: "Post a Job", description: "Create a new job opening.", icon: <FiPlus />, path: "/recruiter/post-job" },
    { title: "Manage Jobs", description: "View and manage your job posts.", icon: <FiBriefcase />, path: "/recruiter/my-jobs" },
    { title: "View Applications", description: "Review candidate applications.", icon: <FiFileText />, path: "/recruiter/applications" },
  ];

  const recentJobs = jobs.slice(0, 5);

  return (
    <div className="recruiter-dashboard">
      <div className="recruiter-dashboard-header">
        <div>
          <h1>
            <FiGrid />
            Dashboard
          </h1>
          <p>Manage your jobs and find the right candidates.</p>
        </div>
        <button type="button" className="recruiter-post-job-btn" onClick={() => navigate("/recruiter/post-job")}>
          <FiPlus />
          Post a Job
        </button>
      </div>

      {error && <div className="recruiter-dashboard-error">{error}</div>}

      {loading ? (
        <div className="recruiter-dashboard-loading">Loading dashboard...</div>
      ) : (
        <>
          <div className="recruiter-dashboard-stats">
            {stats.map((stat) => (
              <button type="button" className="recruiter-stat-card" key={stat.title} onClick={() => navigate(stat.path)}>
                <div className={`recruiter-stat-icon ${stat.className}`}>{stat.icon}</div>
                <div className="recruiter-stat-content">
                  <span>{stat.title}</span>
                  <strong>{stat.value}</strong>
                </div>
                <FiArrowRight className="recruiter-stat-arrow" />
              </button>
            ))}
          </div>

          <div className="recruiter-dashboard-grid">
            <div className="recruiter-dashboard-card">
              <div className="recruiter-card-header">
                <div>
                  <h2>Quick Actions</h2>
                  <p>Manage your recruitment activities quickly.</p>
                </div>
                <FiBriefcase />
              </div>

              <div className="recruiter-quick-actions">
                {quickActions.map((action) => (
                  <button type="button" className="recruiter-quick-action" key={action.title} onClick={() => navigate(action.path)}>
                    <span className="recruiter-quick-action-icon">{action.icon}</span>
                    <span className="recruiter-quick-action-content">
                      <strong>{action.title}</strong>
                      <small>{action.description}</small>
                    </span>
                    <FiArrowRight />
                  </button>
                ))}
              </div>
            </div>

            <div className="recruiter-dashboard-card">
              <div className="recruiter-card-header">
                <div>
                  <h2>Application Overview</h2>
                  <p>Track your candidate applications.</p>
                </div>
                <FiUsers />
              </div>

              <div className="recruiter-application-overview">
                <div className="recruiter-overview-item">
                  <div className="recruiter-overview-icon applied"><FiFileText /></div>
                  <div>
                    <strong>{appliedApplications}</strong>
                    <span>Applied</span>
                  </div>
                </div>

                <div className="recruiter-overview-item">
                  <div className="recruiter-overview-icon review"><FiClock /></div>
                  <div>
                    <strong>{underReviewApplications}</strong>
                    <span>Under Review</span>
                  </div>
                </div>

                <div className="recruiter-overview-item">
                  <div className="recruiter-overview-icon shortlisted"><FiCheckCircle /></div>
                  <div>
                    <strong>{shortlistedApplications}</strong>
                    <span>Shortlisted</span>
                  </div>
                </div>

                <div className="recruiter-overview-item">
                  <div className="recruiter-overview-icon interview"><FiCalendar /></div>
                  <div>
                    <strong>{interviewApplications}</strong>
                    <span>Interview</span>
                  </div>
                </div>
              </div>

              <button type="button" className="recruiter-view-applications-btn" onClick={() => navigate("/recruiter/applications")}>
                View Applications
                <FiArrowRight />
              </button>
            </div>
          </div>

          <div className="recruiter-dashboard-card recruiter-recent-jobs">
            <div className="recruiter-card-header">
              <div>
                <h2>Recent Job Posts</h2>
                <p>Your recently created job openings.</p>
              </div>
              <button type="button" className="recruiter-view-all-btn" onClick={() => navigate("/recruiter/my-jobs")}>
                View All
                <FiArrowRight />
              </button>
            </div>

            {recentJobs.length === 0 ? (
              <div className="recruiter-empty-state">
                <div className="recruiter-empty-icon"><FiBriefcase /></div>
                <h3>No Jobs Posted Yet</h3>
                <p>Create your first job post to start receiving applications.</p>
                <button type="button" className="recruiter-post-job-btn" onClick={() => navigate("/recruiter/post-job")}>
                  <FiPlus />
                  Post a Job
                </button>
              </div>
            ) : (
              <div className="recruiter-recent-job-list">
                {recentJobs.map((job) => (
                  <div className="recruiter-recent-job" key={job._id}>
                    <div className="recruiter-job-info">
                      <h3>{job.title}</h3>
                      <p>{job.companyName}</p>
                    </div>
                    <div className="recruiter-job-meta">
                      <span>{job.location?.city || "Location not added"}</span>
                      <span className={`job-status ${job.status?.toLowerCase()}`}>{job.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default RecruiterDashboard;
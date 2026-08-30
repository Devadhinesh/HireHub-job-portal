import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiBriefcase,
  FiPlus,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiEye,
  FiMapPin,
  FiClock,
  FiUsers,
  FiCalendar,
  FiArrowRight,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/context/AuthContext";
import "./RecruiterMyJobs.css";

const SERVER_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const API_URL = `${SERVER_URL}/api/jobs/recruiter`;
const JOB_API = `${SERVER_URL}/api/jobs`;
const RECRUITER_PROFILE_API =
  `${SERVER_URL}/api/recruiter-profile`;

const RecruiterMyJobs = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [recruiterProfiles, setRecruiterProfiles] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================
  // GET IMAGE URL
  // ============================================
  const getPhotoUrl = (logo) => {
    if (!logo) return null;

    if (
      logo.startsWith("http://") ||
      logo.startsWith("https://")
    ) {
      return logo;
    }

    return `${SERVER_URL}${
      logo.startsWith("/") ? logo : `/${logo}`
    }`;
  };

  // ============================================
  // FETCH RECRUITER PROFILE
  // ============================================
  const fetchRecruiterProfile = async (recruiterId) => {
    if (!token || !recruiterId) {
      return null;
    }

    try {
      const response = await axios.get(
        `${RECRUITER_PROFILE_API}/public/${recruiterId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "Recruiter Profile:",
        response.data
      );

      return response.data?.profile || null;
    } catch (error) {
      console.error(
        "Failed to fetch recruiter profile:",
        error.response?.data?.message ||
          error.message
      );

      return null;
    }
  };

  // ============================================
  // FETCH RECRUITER JOBS
  // ============================================
  const fetchJobs = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const response = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Recruiter Jobs:", response.data);

      const jobData = response.data.jobs || [];

      setJobs(jobData);
      setFilteredJobs(jobData);

      // ============================================
      // FETCH COMPANY LOGOS
      // ============================================

      const profileMap = {};

      for (const job of jobData) {
        const recruiterId =
          typeof job.recruiter === "object"
            ? job.recruiter?._id
            : job.recruiter;

        if (!recruiterId) {
          continue;
        }

        // Don't fetch the same recruiter profile multiple times
        if (profileMap[recruiterId]) {
          continue;
        }

        const profile =
          await fetchRecruiterProfile(recruiterId);

        if (profile) {
          profileMap[recruiterId] = profile;
        }
      }

      console.log(
        "Recruiter Profiles:",
        profileMap
      );

      setRecruiterProfiles(profileMap);
    } catch (error) {
      console.error(
        "Fetch jobs error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to fetch your jobs"
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // LOAD JOBS
  // ============================================
  useEffect(() => {
    if (token) {
      fetchJobs();
    }
  }, [token]);

  // ============================================
  // SEARCH + FILTER
  // ============================================
  useEffect(() => {
    let result = [...jobs];

    if (search.trim()) {
      const searchValue =
        search.toLowerCase();

      result = result.filter(
        (job) =>
          job.title
            ?.toLowerCase()
            .includes(searchValue) ||
          job.companyName
            ?.toLowerCase()
            .includes(searchValue) ||
          job.category
            ?.toLowerCase()
            .includes(searchValue) ||
          job.location?.city
            ?.toLowerCase()
            .includes(searchValue)
      );
    }

    if (statusFilter !== "All") {
      result = result.filter(
        (job) =>
          job.status === statusFilter
      );
    }

    setFilteredJobs(result);
  }, [search, statusFilter, jobs]);

  // ============================================
  // DELETE JOB
  // ============================================
  const handleDelete = async (jobId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this job?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await axios.delete(
        `${JOB_API}/${jobId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setJobs((prevJobs) =>
        prevJobs.filter(
          (job) => job._id !== jobId
        )
      );
    } catch (error) {
      console.error(
        "Delete job error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to delete job"
      );
    }
  };

  // ============================================
  // FORMAT DATE
  // ============================================
  const formatDate = (date) => {
    if (!date) {
      return "Not specified";
    }

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ============================================
  // FORMAT SALARY
  // ============================================
  const formatSalary = (job) => {
    if (
      job.salaryMin == null &&
      job.salaryMax == null
    ) {
      return "Salary not specified";
    }

    const min =
      job.salaryMin != null
        ? `₹${Number(
            job.salaryMin
          ).toLocaleString("en-IN")}`
        : "";

    const max =
      job.salaryMax != null
        ? `₹${Number(
            job.salaryMax
          ).toLocaleString("en-IN")}`
        : "";

    if (min && max) {
      return `${min} - ${max}`;
    }

    return min || max;
  };

  // ============================================
  // GET LOCATION
  // ============================================
  const getLocation = (job) => {
    const location = [
      job.location?.city,
      job.location?.state,
      job.location?.country,
    ].filter(Boolean);

    return location.length
      ? location.join(", ")
      : "Location not specified";
  };

  // ============================================
  // LOADING
  // ============================================
  if (loading) {
    return (
      <div className="recruiter-my-jobs">
        <div className="recruiter-my-jobs-loading">
          <FiBriefcase />
          <p>Loading your jobs...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // RETURN
  // ============================================
  return (
    <div className="recruiter-my-jobs">

      {/* ============================================
          HEADER
      ============================================ */}
      <div className="recruiter-my-jobs-header">

        <div className="recruiter-my-jobs-title">

          <div className="recruiter-my-jobs-icon">
            <FiBriefcase />
          </div>

          <div>
            <h1>My Jobs</h1>
            <p>
              Manage the jobs you have posted.
            </p>
          </div>

        </div>

        <button
          type="button"
          className="recruiter-create-job-btn"
          onClick={() =>
            navigate(
              "/recruiter/post-job"
            )
          }
        >
          <FiPlus />
          Post a Job
        </button>

      </div>

      {/* ============================================
          ERROR
      ============================================ */}
      {error && (
        <div className="recruiter-my-jobs-error">
          {error}
        </div>
      )}

      {/* ============================================
          SUMMARY
      ============================================ */}
      <div className="recruiter-job-summary">

        <div className="recruiter-summary-card">
          <span>Total Jobs</span>
          <strong>
            {jobs.length}
          </strong>
        </div>

        <div className="recruiter-summary-card">
          <span>Active</span>
          <strong>
            {
              jobs.filter(
                (job) =>
                  job.status === "Open"
              ).length
            }
          </strong>
        </div>

        <div className="recruiter-summary-card">
          <span>Drafts</span>
          <strong>
            {
              jobs.filter(
                (job) =>
                  job.status === "Draft"
              ).length
            }
          </strong>
        </div>

        <div className="recruiter-summary-card">
          <span>Closed</span>
          <strong>
            {
              jobs.filter(
                (job) =>
                  job.status === "Closed"
              ).length
            }
          </strong>
        </div>

      </div>

      {/* ============================================
          SEARCH / FILTER
      ============================================ */}
      <div className="recruiter-job-filters">

        <div className="recruiter-job-search">

          <FiSearch />

          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(
              e.target.value
            )
          }
        >
          <option value="All">
            All Status
          </option>

          <option value="Open">
            Open
          </option>

          <option value="Draft">
            Draft
          </option>

          <option value="Closed">
            Closed
          </option>
        </select>

      </div>

      {/* ============================================
          JOB LIST
      ============================================ */}
      {filteredJobs.length === 0 ? (

        <div className="recruiter-my-jobs-empty">

          <div className="recruiter-empty-job-icon">
            <FiBriefcase />
          </div>

          <h2>
            {jobs.length === 0
              ? "No Jobs Posted Yet"
              : "No Jobs Found"}
          </h2>

          <p>
            {jobs.length === 0
              ? "Create your first job post to start finding candidates."
              : "Try changing your search or status filter."}
          </p>

          {jobs.length === 0 && (
            <button
              type="button"
              className="recruiter-create-job-btn"
              onClick={() =>
                navigate(
                  "/recruiter/post-job"
                )
              }
            >
              <FiPlus />
              Post Your First Job
            </button>
          )}

        </div>

      ) : (

        <div className="recruiter-jobs-list">

          {filteredJobs.map((job) => {

            // ========================================
            // GET RECRUITER ID
            // ========================================
            const recruiterId =
              typeof job.recruiter === "object"
                ? job.recruiter?._id
                : job.recruiter;

            // ========================================
            // GET RECRUITER PROFILE
            // ========================================
            const recruiterProfile =
              recruiterProfiles[
                recruiterId
              ];

            return (
              <div
                className="recruiter-job-card"
                key={job._id}
              >

                {/* ====================================
                    JOB HEADER
                ==================================== */}
                <div className="recruiter-job-card-header">

                  <div className="recruiter-job-title-section">

                    {/* COMPANY LOGO */}
                    <div className="recruiter-job-icon">

                      {recruiterProfile?.companyLogo ? (
                        <img
                          src={getPhotoUrl(
                            recruiterProfile.companyLogo
                          )}
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

                    <div>
                      <h2>
                        {job.title}
                      </h2>

                      <p>
                        {job.companyName}
                      </p>
                    </div>

                  </div>

                  <span
                    className={`recruiter-job-status ${job.status?.toLowerCase()}`}
                  >
                    {job.status}
                  </span>

                </div>

                {/* ====================================
                    JOB DETAILS
                ==================================== */}
                <div className="recruiter-job-details">

                  <div className="recruiter-job-detail">
                    <FiMapPin />
                    <span>
                      {getLocation(job)}
                    </span>
                  </div>

                  <div className="recruiter-job-detail">
                    <FiClock />
                    <span>
                      {job.employmentType}
                    </span>
                  </div>

                  <div className="recruiter-job-detail">
                    <FiBriefcase />
                    <span>
                      {job.workMode}
                    </span>
                  </div>

                  <div className="recruiter-job-detail">
                    <FiUsers />
                    <span>
                      {job.vacancies}{" "}
                      {job.vacancies === 1
                        ? "Vacancy"
                        : "Vacancies"}
                    </span>
                  </div>

                </div>

                {/* ====================================
                    JOB BOTTOM
                ==================================== */}
                <div className="recruiter-job-card-bottom">

                  <div className="recruiter-job-meta">

                    <span>
                      {formatSalary(job)}
                    </span>

                    <span>
                      {job.category}
                    </span>

                    <span>
                      <FiCalendar />
                      Deadline:{" "}
                      {formatDate(
                        job.applicationDeadline
                      )}
                    </span>

                  </div>

                  {/* ACTIONS */}
                  <div className="recruiter-job-actions">

                    <button
                      type="button"
                      className="job-action view"
                      onClick={() =>
                        navigate(
                          `/recruiter/my-jobs/${job._id}`
                        )
                      }
                      title="View Job"
                    >
                      <FiEye />
                    </button>

                    <button
                      type="button"
                      className="job-action edit"
                      onClick={() =>
                        navigate(
                          `/recruiter/my-jobs/edit/${job._id}`
                        )
                      }
                      title="Edit Job"
                    >
                      <FiEdit />
                    </button>

                    <button
                      type="button"
                      className="job-action delete"
                      onClick={() =>
                        handleDelete(
                          job._id
                        )
                      }
                      title="Delete Job"
                    >
                      <FiTrash2 />
                    </button>

                  </div>

                </div>

              </div>
            );
          })}

        </div>
      )}

      {/* ============================================
          FOOTER
      ============================================ */}
      {filteredJobs.length > 0 && (
        <div className="recruiter-job-list-footer">

          Showing{" "}
          <strong>
            {filteredJobs.length}
          </strong>{" "}
          of{" "}
          <strong>
            {jobs.length}
          </strong>{" "}
          jobs

          <FiArrowRight />

        </div>
      )}

    </div>
  );
};

export default RecruiterMyJobs;
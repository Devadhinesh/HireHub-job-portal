import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiSearch,
  FiHeart,
  FiMapPin,
  FiBriefcase,
  FiDollarSign,
  FiLayers,
  FiEye,
  FiSend,
  FiX,
  FiClock,
} from "react-icons/fi";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/context/AuthContext";
import "./CandidateSearchJobs.css";

const SERVER_URL = "http://localhost:5000";
const JOB_API = `${SERVER_URL}/api/jobs`;
const SAVED_JOB_API = `${SERVER_URL}/api/saved-jobs`;
const RECRUITER_PROFILE_API =
  `${SERVER_URL}/api/recruiter-profile`;

const SearchJobs = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [companyLogos, setCompanyLogos] = useState({});
  const [savedJobIds, setSavedJobIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedLoading, setSavedLoading] = useState(false);
  const [error, setError] = useState("");
  const [savingJobId, setSavingJobId] = useState(null);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [workMode, setWorkMode] = useState("All");
  const [selectedJob, setSelectedJob] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 3;

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

  const fetchCompanyLogos = async (jobsData) => {
    if (!token || !Array.isArray(jobsData)) {
      return;
    }

    try {
      const recruiterIds = [
        ...new Set(
          jobsData
            .map((job) => {
              if (job?.recruiter?._id) {
                return job.recruiter._id.toString();
              }

              if (job?.recruiter) {
                return job.recruiter.toString();
              }

              return null;
            })
            .filter(Boolean)
        ),
      ];

      if (recruiterIds.length === 0) {
        setCompanyLogos({});
        return;
      }

      const logoResults = await Promise.all(
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
              `Failed to fetch company logo for ${recruiterId}:`,
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

      logoResults.forEach(
        ({ recruiterId, companyLogo }) => {
          logoMap[recruiterId] = companyLogo;
        }
      );

      setCompanyLogos(logoMap);
    } catch (error) {
      console.error(
        "Fetch Company Logos Error:",
        error
      );
    }
  };

  // FETCH JOBS
  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(JOB_API);

      // Backend may respond with an array, { jobs: [] }, or { data: [] }
      let jobsData = [];
      if (Array.isArray(response.data)) {
        jobsData = response.data;
      } else if (Array.isArray(response.data.jobs)) {
        jobsData = response.data.jobs;
      } else if (Array.isArray(response.data.data)) {
        jobsData = response.data.data;
      }

      setJobs(jobsData);

      await fetchCompanyLogos(jobsData);
    } catch (error) {
      console.error("Fetch Jobs Error:", error);
      setError(error.response?.data?.message || "Failed to fetch jobs.");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  // FETCH SAVED JOBS
  const fetchSavedJobs = async () => {
    if (!token) {
      setSavedJobIds([]);
      return;
    }

    try {
      setSavedLoading(true);

      const response = await axios.get(SAVED_JOB_API, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const savedJobs = Array.isArray(response.data.savedJobs) ? response.data.savedJobs : [];

      // Extract job IDs whether job is populated or a raw ObjectId
      const ids = savedJobs
        .map((savedJob) => {
          if (savedJob?.job?._id) return savedJob.job._id.toString();
          if (savedJob?.job) return savedJob.job.toString();
          return null;
        })
        .filter(Boolean);

      setSavedJobIds(ids);
    } catch (error) {
      console.error("Fetch Saved Jobs Error:", error.response?.data?.message || error.message);
      setSavedJobIds([]);
    } finally {
      setSavedLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchJobs();
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchSavedJobs();
    } else {
      setSavedJobIds([]);
    }
  }, [token]);

  // SAVE / UNSAVE JOB
  const handleSaveJob = async (job) => {
    if (!token) {
      await Swal.fire({ icon: "warning", title: "Login Required", text: "Please login to save jobs.", confirmButtonText: "Login" });
      return;
    }

    if (!job?._id) {
      console.error("Job ID is missing:", job);
      await Swal.fire({ icon: "error", title: "Job Error", text: "Job information is missing." });
      return;
    }

    const jobId = job._id.toString();

    try {
      setSavingJobId(jobId);
      const isSaved = savedJobIds.includes(jobId);

      if (isSaved) {
        await axios.delete(`${SAVED_JOB_API}/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setSavedJobIds((previous) => previous.filter((id) => id !== jobId));

        await Swal.fire({ position: "top-end", icon: "success", title: "Job removed from saved jobs", showConfirmButton: false, timer: 1200 });
        return;
      }

      // Backend expects { job: jobId }, not { jobId }
      const response = await axios.post(
        SAVED_JOB_API,
        { job: jobId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSavedJobIds((previous) => (previous.includes(jobId) ? previous : [...previous, jobId]));

      await Swal.fire({ position: "top-end", icon: "success", title: "Job saved successfully", showConfirmButton: false, timer: 1200 });
    } catch (error) {
      console.error("Save Job Error:", error);
      const message = error.response?.data?.message || "Failed to save job.";

      // If backend says already saved, sync frontend state
      if (message === "Job already saved") {
        setSavedJobIds((previous) => (previous.includes(jobId) ? previous : [...previous, jobId]));
      }

      await Swal.fire({ icon: "error", title: "Save Job Failed", text: message });
    } finally {
      setSavingJobId(null);
    }
  };

  // FILTER JOBS
  const filteredJobs = useMemo(() => {
    const searchText = search.toLowerCase().trim();
    const locationText = location.toLowerCase().trim();

    return jobs.filter((job) => {
      const title = job?.title?.toLowerCase() || "";
      const company = job?.companyName?.toLowerCase() || "";
      const description = job?.description?.toLowerCase() || "";

      const jobLocation =
        typeof job?.location === "string"
          ? job.location.toLowerCase()
          : [
            job?.location?.city,
            job?.location?.state,
            job?.location?.country,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

      const matchesSearch =
        !searchText ||
        title.includes(searchText) ||
        company.includes(searchText) ||
        description.includes(searchText);

      const matchesLocation =
        !locationText || jobLocation.includes(locationText);

      const matchesWorkMode =
        workMode === "All" || job?.workMode === workMode;

      return (
        matchesSearch &&
        matchesLocation &&
        matchesWorkMode
      );
    });
  }, [jobs, search, location, workMode]);

  const totalPages = Math.ceil(
    filteredJobs.length / jobsPerPage
  );

  const paginatedJobs = useMemo(() => {
    const startIndex =
      (currentPage - 1) * jobsPerPage;

    return filteredJobs.slice(
      startIndex,
      startIndex + jobsPerPage
    );
  }, [filteredJobs, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, location, workMode]);

  const handleClear = () => {
    setSearch("");
    setLocation("");
    setWorkMode("All");
  };

  const handleViewJob = async (job) => {
    if (!job?._id) return;

    try {
      const response = await axios.get(`${JOB_API}/${job._id}`);
      const jobDetails = response.data.job || response.data.data || response.data;
      setSelectedJob(jobDetails);
    } catch (error) {
      console.error("Job Details Error:", error);
      // Fall back to the already-loaded job if the details API fails
      setSelectedJob(job);
    }
  };

  const handleApplyJob = (job) => {
    if (!job?._id) {
      console.error("Job ID is missing:", job);
      return;
    }

    navigate(`/candidate/applications/apply/${job._id}`, {
      state: {
        job,
      },
    });
  };

  const getLocation = (job) => {
    if (!job?.location) return "Location not specified";
    if (typeof job.location === "string") return job.location;
    return [job.location.city, job.location.state, job.location.country].filter(Boolean).join(", ") || "Location not specified";
  };

  const getSalary = (job) => {
    const min = job?.salaryMin;
    const max = job?.salaryMax;
    if (!min && !max) return "Salary not specified";

    const formatNumber = (value) => Number(value).toLocaleString("en-IN");

    if (min && max) return `₹${formatNumber(min)} - ₹${formatNumber(max)} Per Year`;
    if (min) return `₹${formatNumber(min)} Per Year`;
    return `₹${formatNumber(max)} Per Year`;
  };

  const formatDeadline = (date) => {
    if (!date) return "No deadline";
    return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="candidate-search-jobs">
        <div className="search-jobs-loading">
          <div className="loading-spinner"></div>
          <p>Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="candidate-search-jobs">
      {/* SEARCH HEADER */}
      <div className="search-jobs-header">
        <div>
          <h1>Search Jobs</h1>
          <p>Find the right opportunity for your career.</p>
        </div>
      </div>

      {/* FILTER BOX */}
      <div className="job-search-filters">
        <div className="job-filter-group">
          <label>Search</label>
          <div className="job-filter-input">
            <FiSearch />
            <input type="text" placeholder="Job title, company, skills..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="job-filter-group">
          <label>Location</label>
          <div className="job-filter-input">
            <FiMapPin />
            <input type="text" placeholder="Chennai, Bangalore..." value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
        </div>

        <div className="job-filter-group">
          <label>Work Mode</label>
          <select value={workMode} onChange={(e) => setWorkMode(e.target.value)}>
            <option value="All">All</option>
            <option value="On-site">On-site</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>

        <div className="job-filter-actions">
          <button type="button" className="job-search-btn" onClick={() => { }}>
            <FiSearch />
            Search
          </button>
          <button type="button" className="job-clear-btn" onClick={handleClear}>
            Clear
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="search-jobs-error">
          <span>{error}</span>
          <button type="button" onClick={fetchJobs}>Retry</button>
        </div>
      )}

      {/* JOB LIST HEADER */}
      <div className="available-jobs-header">
        <div>
          <h2>Available Jobs</h2>
          <p>{filteredJobs.length} {filteredJobs.length === 1 ? "job" : "jobs"} found</p>
        </div>
        {savedLoading && <small>Loading saved jobs...</small>}
      </div>

      {/* EMPTY */}
      {!error && filteredJobs.length === 0 && (
        <div className="search-jobs-empty">
          <div className="empty-jobs-icon">
            <FiBriefcase />
          </div>
          <h2>No Jobs Found</h2>
          <p>Try changing your search filters.</p>
          <button type="button" onClick={handleClear}>Clear Filters</button>
        </div>
      )}

      {/* JOB LIST */}
      {filteredJobs.length > 0 && (
        <div className="search-jobs-list">
          {paginatedJobs.map((job) => {
            const jobId = job?._id?.toString();
            const isSaved = jobId && savedJobIds.includes(jobId);
            const isSaving = savingJobId === jobId;

            return (
              <div className="search-job-card" key={jobId}>
                {/* JOB TOP */}
                <div className="search-job-top">
                  <div className="search-job-company-icon">
                    {(() => {
                      const recruiterId =
                        job?.recruiter?._id ||
                        job?.recruiter;

                      const companyLogo = recruiterId
                        ? companyLogos[recruiterId.toString()]
                        : "";

                      return companyLogo ? (
                        <img
                          src={getImageUrl(companyLogo)}
                          alt={
                            job?.companyName ||
                            "Company Logo"
                          }
                        />
                      ) : (
                        <FiBriefcase />
                      );
                    })()}
                  </div>
                  <div className="search-job-title">
                    <h3>{job?.title || "Job Title"}</h3>
                    <p>{job?.companyName || "Company"}</p>
                  </div>
                  <button
                    type="button"
                    className={`save-job-btn ${isSaved ? "saved" : ""}`}
                    onClick={() => handleSaveJob(job)}
                    disabled={isSaving || !jobId}
                    title={isSaved ? "Remove from saved jobs" : "Save job"}
                  >
                    <FiHeart fill={isSaved ? "currentColor" : "none"} />
                  </button>
                </div>

                {/* JOB META */}
                <div className="search-job-meta">
                  <div>
                    <FiMapPin />
                    <span>{getLocation(job)}</span>
                  </div>
                  <div>
                    <FiBriefcase />
                    <span>{job?.employmentType || "Full-time"}</span>
                  </div>
                  <div>
                    <FiLayers />
                    <span>{job?.workMode || "On-site"}</span>
                  </div>
                </div>

                {/* SALARY */}
                <div className="search-job-salary">
                  <FiDollarSign />
                  <span>{getSalary(job)}</span>
                </div>

                {/* DESCRIPTION */}
                <p className="search-job-description">{job?.description || "No job description available."}</p>

                {/* SKILLS */}
                {Array.isArray(job?.skills) && job.skills.length > 0 && (
                  <div className="search-job-skills">
                    {job.skills.slice(0, 8).map((skill, index) => (
                      <span key={`${jobId}-skill-${index}`}>{skill}</span>
                    ))}
                  </div>
                )}

                {/* FOOTER */}
                <div className="search-job-footer">
                  <div className="job-deadline">
                    <FiClock />
                    <span>Apply by {formatDeadline(job?.applicationDeadline)}</span>
                  </div>
                  <div className="search-job-actions">
                    <button type="button" className="view-job-btn" onClick={() => handleViewJob(job)}>
                      <FiEye />
                      View Details
                    </button>
                    <button type="button" className="apply-job-btn" onClick={() => handleApplyJob(job)}>
                      <FiSend />
                      Apply Now
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* JOB DETAILS MODAL */}
      {selectedJob && (
        <div className="job-details-overlay" onClick={() => setSelectedJob(null)}>
          <div className="job-details-modal" onClick={(e) => e.stopPropagation()}>
            {/* MODAL HEADER */}
            <div className="job-details-modal-header">
              <div>
                <h2>{selectedJob?.title || "Job Details"}</h2>
                <p>{selectedJob?.companyName || "Company"}</p>
              </div>
              <button type="button" onClick={() => setSelectedJob(null)}>
                <FiX />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="job-details-modal-body">
              <div className="job-detail-row">
                <FiMapPin />
                <span>{getLocation(selectedJob)}</span>
              </div>
              <div className="job-detail-row">
                <FiBriefcase />
                <span>{selectedJob?.employmentType || "Full-time"}</span>
              </div>
              <div className="job-detail-row">
                <FiLayers />
                <span>{selectedJob?.workMode || "On-site"}</span>
              </div>
              <div className="job-detail-row">
                <FiDollarSign />
                <span>{getSalary(selectedJob)}</span>
              </div>

              <div className="job-details-section">
                <h3>Job Description</h3>
                <p>{selectedJob?.description || "No description available."}</p>
              </div>

              <div className="job-details-section">
                <h3>Requirements</h3>
                <p>{selectedJob?.requirements || "No requirements available."}</p>
              </div>

              {Array.isArray(selectedJob?.skills) && selectedJob.skills.length > 0 && (
                <div className="job-details-section">
                  <h3>Skills</h3>
                  <div className="search-job-skills">
                    {selectedJob.skills.map((skill, index) => (
                      <span key={index}>{skill}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="job-details-modal-footer">
              <button
                type="button"
                className={`save-job-btn ${selectedJob?._id && savedJobIds.includes(selectedJob._id.toString()) ? "saved" : ""}`}
                onClick={() => handleSaveJob(selectedJob)}
              >
                <FiHeart fill={selectedJob?._id && savedJobIds.includes(selectedJob._id.toString()) ? "currentColor" : "none"} />
                {selectedJob?._id && savedJobIds.includes(selectedJob._id.toString()) ? "Saved" : "Save Job"}
              </button>
              <button type="button" className="apply-job-btn" onClick={() => handleApplyJob(selectedJob)}>
                <FiSend />
                Apply Now
              </button>
            </div>
          </div>
        </div>
      )}
      {totalPages > 1 && (
        <div className="jobs-pagination">

          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() =>
              setCurrentPage((prev) => prev - 1)
            }
          >
            Previous
          </button>

          {Array.from(
            { length: totalPages },
            (_, index) => index + 1
          ).map((page) => (
            <button
              key={page}
              type="button"
              className={
                currentPage === page ? "active" : ""
              }
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((prev) => prev + 1)
            }
          >
            Next
          </button>

        </div>
      )}
    </div>
  );
};

export default SearchJobs;
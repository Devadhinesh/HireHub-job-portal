import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiBriefcase, FiMapPin, FiDollarSign, FiLayers, FiCalendar, FiClock,
  FiFileText, FiCheckCircle, FiEye, FiX, FiSend, FiUserCheck, FiAlertCircle,
} from "react-icons/fi";
import { useAuth } from "../../components/context/AuthContext";
import "./MyApplications.css";

const API_URL = "http://localhost:5000/api/applications/my";
const RECRUITER_PROFILE_API =
  "http://localhost:5000/api/recruiter-profile/public";

const SERVER_URL = "http://localhost:5000";

const MyApplications = () => {
  const { token } = useAuth();

  const [applications, setApplications] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [companyLogos, setCompanyLogos] = useState({});

  const fetchCompanyLogos = async (applicationList) => {
    if (!token || !applicationList?.length) return;

    try {
      const logoMap = {};

      const requests = applicationList.map(async (application) => {
        const recruiterId = application?.job?.recruiter?._id ||
          application?.job?.recruiter;

        if (!recruiterId) return;

        try {
          const response = await axios.get(
            `${RECRUITER_PROFILE_API}/${recruiterId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const profile = response.data?.profile;

          if (profile?.companyLogo) {
            logoMap[recruiterId.toString()] = profile.companyLogo;
          }
        } catch (error) {
          console.error(
            `Failed to fetch company logo for recruiter ${recruiterId}:`,
            error.response?.data?.message || error.message
          );
        }
      });

      await Promise.all(requests);

      setCompanyLogos(logoMap);
    } catch (error) {
      console.error("Failed to fetch company logos:", error);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const applicationList = response.data.applications || [];

      setApplications(applicationList);

      // Fetch company logos
      await fetchCompanyLogos(applicationList);

    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
        "Failed to fetch applications"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchApplications();
  }, [token]);

  const statusFilters = ["All", "Applied", "Under Review", "Shortlisted", "Interview", "Hired", "Rejected"];

  const filteredApplications =
    activeFilter === "All"
      ? applications
      : applications.filter((application) => application.status === activeFilter);

  const getLocation = (job) => {
    if (!job?.location) return "Location not specified";
    const location = [job.location.city, job.location.state, job.location.country].filter(Boolean);
    return location.length > 0 ? location.join(", ") : "Location not specified";
  };

  const getSalary = (job) => {
    if (job?.salaryMin == null && job?.salaryMax == null) return "Salary not specified";
    const min = job.salaryMin != null ? `₹${job.salaryMin.toLocaleString()}` : "";
    const max = job.salaryMax != null ? `₹${job.salaryMax.toLocaleString()}` : "";
    if (min && max) return `${min} - ${max} ${job.salaryType || ""}`;
    return `${min || max} ${job.salaryType || ""}`;
  };

  const formatDate = (date) => {
    if (!date) return "Not available";
    return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

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

  const getStatusIcon = (status) => {
    switch (status) {
      case "Applied": return <FiSend />;
      case "Under Review": return <FiEye />;
      case "Shortlisted": return <FiUserCheck />;
      case "Interview": return <FiCalendar />;
      case "Hired": return <FiCheckCircle />;
      case "Rejected": return <FiX />;
      default: return <FiClock />;
    }
  };

  const statusOrder = ["Applied", "Under Review", "Shortlisted", "Interview", "Hired"];

  const getStatusIndex = (status) => statusOrder.indexOf(status);

  const getStepClass = (stepStatus, currentStatus) => {
    if (currentStatus === "Rejected") return stepStatus === "Applied" ? "completed" : "";
    const currentIndex = getStatusIndex(currentStatus);
    const stepIndex = getStatusIndex(stepStatus);
    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "";
  };
  const getCompanyLogoUrl = (logo) => {
    if (!logo) return "";

    if (
      logo.startsWith("http://") ||
      logo.startsWith("https://")
    ) {
      return logo;
    }

    return `${SERVER_URL}${logo.startsWith("/") ? logo : `/${logo}`
      }`;
  };

  const handleViewApplication = (application) => {
    setSelectedApplication(application);
  };

  const closeModal = () => {
    setSelectedApplication(null);
  };

  const renderTracker = (status) => {
    if (status === "Rejected") {
      return (
        <div className="rejected-tracker">
          <div className="tracker-step completed">
            <div className="tracker-circle"><FiCheckCircle /></div>
            <span>Applied</span>
          </div>
          <div className="tracker-line" />
          <div className="tracker-step rejected">
            <div className="tracker-circle"><FiX /></div>
            <span>Rejected</span>
          </div>
        </div>
      );
    }



    return (
      <div className="tracker">
        {statusOrder.map((step, index) => {
          const stepClass = getStepClass(step, status);
          return (
            <React.Fragment key={step}>
              <div className={`tracker-step ${stepClass}`}>
                <div className="tracker-circle">
                  {stepClass === "completed" ? (
                    <FiCheckCircle />
                  ) : stepClass === "current" ? (
                    getStatusIcon(step)
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span>{step}</span>
              </div>
              {index < statusOrder.length - 1 && (
                <div className={`tracker-line ${getStatusIndex(status) > index ? "completed" : ""}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="my-applications">
      <div className="applications-header">
        <div className="applications-title">
          <div className="applications-icon"><FiFileText /></div>
          <div>
            <h1>My Applications</h1>
            <p>Track the progress of your job applications.</p>
          </div>
        </div>

        <div className="applications-count">
          <FiFileText />
          <span>{applications.length} Applications</span>
        </div>
      </div>

      <div className="application-filters">
        {statusFilters.map((status) => {
          const count =
            status === "All"
              ? applications.length
              : applications.filter((application) => application.status === status).length;

          return (
            <button
              type="button"
              key={status}
              className={activeFilter === status ? "filter-btn active" : "filter-btn"}
              onClick={() => setActiveFilter(status)}
            >
              {status}
              <span>{count}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="applications-error">
          <FiAlertCircle />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="applications-empty">
          <div className="empty-icon"><FiFileText /></div>
          <h3>Loading applications...</h3>
          <p>Please wait while we load your applications.</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="applications-empty">
          <div className="empty-icon"><FiFileText /></div>
          <h3>{activeFilter === "All" ? "No Applications Yet" : `No ${activeFilter} Applications`}</h3>
          <p>
            {activeFilter === "All"
              ? "You haven't applied for any jobs yet."
              : `You don't have any applications with the "${activeFilter}" status.`}
          </p>
        </div>
      ) : (
        <div className="applications-list">
          {filteredApplications.map((application) => {
            const job = application.job;

            return (
              <div className="application-card" key={application._id}>
                <div className="application-card-header">
                  <div className="application-job-info">
                    <div className="application-company-logo">
                      {(() => {
                        const recruiterId =
                          job?.recruiter?._id || job?.recruiter;

                        const recruiterKey = recruiterId
                          ? recruiterId.toString()
                          : "";

                        const logo = recruiterKey
                          ? companyLogos[recruiterKey]
                          : "";

                        return logo ? (
                          <img
                            src={getCompanyLogoUrl(logo)}
                            alt={`${job?.companyName || "Company"} logo`}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <FiBriefcase />
                        );
                      })()}
                    </div>

                    <div>
                      <h2>{job?.title || "Job Title"}</h2>
                      <h4>{job?.companyName || "Company"}</h4>
                    </div>
                  </div>

                  <div className={`application-status ${getStatusClass(application.status)}`}>
                    {getStatusIcon(application.status)}
                    <span>{application.status}</span>
                  </div>
                </div>

                <div className="application-meta">
                  <span><FiMapPin />{getLocation(job)}</span>
                  <span><FiBriefcase />{job?.employmentType || "Not specified"}</span>
                  <span><FiLayers />{job?.workMode || "Not specified"}</span>
                  <span><FiDollarSign />{getSalary(job)}</span>
                </div>

                <div className="application-tracker">{renderTracker(application.status)}</div>

                <div className="application-footer">
                  <div className="applied-date">
                    <FiCalendar />
                    <span>
                      Applied on <strong>{formatDate(application.appliedAt || application.createdAt)}</strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    className="view-application-btn"
                    onClick={() => handleViewApplication(application)}
                  >
                    <FiEye /> View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedApplication && (
        <div className="application-modal-overlay">
          <div className="application-modal">
            <div className="modal-header">
              <div>
                <span className="modal-label">Application Details</span>
                <h2>{selectedApplication.job?.title || "Job Title"}</h2>
                <p>{selectedApplication.job?.companyName || "Company"}</p>
              </div>

              <button type="button" className="close-modal-btn" onClick={closeModal}>
                <FiX />
              </button>
            </div>

            <div className={`modal-status ${getStatusClass(selectedApplication.status)}`}>
              {getStatusIcon(selectedApplication.status)}
              <div>
                <small>Current Status</small>
                <strong>{selectedApplication.status}</strong>
              </div>
            </div>

            <div className="modal-details">
              <div>
                <FiMapPin />
                <span>Location</span>
                <strong>{getLocation(selectedApplication.job)}</strong>
              </div>

              <div>
                <FiBriefcase />
                <span>Employment</span>
                <strong>{selectedApplication.job?.employmentType || "Not specified"}</strong>
              </div>

              <div>
                <FiLayers />
                <span>Work Mode</span>
                <strong>{selectedApplication.job?.workMode || "Not specified"}</strong>
              </div>

              <div>
                <FiDollarSign />
                <span>Salary</span>
                <strong>{getSalary(selectedApplication.job)}</strong>
              </div>

              <div>
                <FiCalendar />
                <span>Applied On</span>
                <strong>{formatDate(selectedApplication.appliedAt)}</strong>
              </div>

              <div>
                <FiFileText />
                <span>Resume</span>
                <strong>Submitted</strong>
              </div>
            </div>

            {selectedApplication.coverLetter && (
              <div className="modal-cover-letter">
                <h3>Cover Letter</h3>
                <p>{selectedApplication.coverLetter}</p>
              </div>
            )}

            <div className="modal-tracking">
              <h3>Application Progress</h3>
              {renderTracker(selectedApplication.status)}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="close-details-btn"
                onClick={closeModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyApplications;
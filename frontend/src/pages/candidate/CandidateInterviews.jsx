import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiCalendar, FiClock, FiBriefcase, FiVideo, FiMapPin, FiEye, FiSearch, FiRefreshCw, FiCheckCircle, FiXCircle, FiUser } from "react-icons/fi";
import { useAuth } from "../../components/context/AuthContext";
import "./CandidateInterviews.css";

const API_URL = "http://localhost:5000/api/interviews";

const RECRUITER_PROFILE_API =
  "http://localhost:5000/api/recruiter-profile/public";

const SERVER_URL = "http://localhost:5000";

const CandidateInterviews = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [recruiterProfiles, setRecruiterProfiles] = useState({});

  const fetchRecruiterProfiles = async (interviewList) => {
    if (!token || !interviewList?.length) return;

    try {
      const profileMap = {};

      const requests = interviewList.map(async (interview) => {
        const recruiterId =
          interview?.recruiter?._id ||
          interview?.recruiter;

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

          if (profile) {
            profileMap[recruiterId.toString()] = profile;
          }
        } catch (error) {
          console.error(
            `Failed to fetch recruiter profile ${recruiterId}:`,
            error.response?.data?.message || error.message
          );
        }
      });

      await Promise.all(requests);

      setRecruiterProfiles(profileMap);
    } catch (error) {
      console.error("Failed to fetch recruiter profiles:", error);
    }
  };

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`${API_URL}/candidate`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const interviewList = response.data.interviews || [];

      setInterviews(interviewList);

      // Fetch recruiter profile photo + company logo
      await fetchRecruiterProfiles(interviewList);
    } catch (err) {
      console.error("Fetch Candidate Interviews Error:", err);
      setError(err.response?.data?.message || "Failed to fetch interviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchInterviews();
  }, [token]);

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Scheduled":
        return "candidate-interview-status-scheduled";
      case "Completed":
        return "candidate-interview-status-completed";
      case "Cancelled":
        return "candidate-interview-status-cancelled";
      case "Rescheduled":
        return "candidate-interview-status-rescheduled";
      default:
        return "";
    }
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

  const filteredInterviews = interviews.filter((interview) => {
    const jobTitle = interview.job?.title || "";
    const companyName = interview.job?.companyName || "";
    const recruiterName = interview.recruiter?.name || "";
    const searchText = `${jobTitle} ${companyName} ${recruiterName}`.toLowerCase();
    const matchesSearch = searchText.includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || interview.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalInterviews = interviews.length;
  const scheduledInterviews = interviews.filter((item) => item.status === "Scheduled").length;
  const completedInterviews = interviews.filter((item) => item.status === "Completed").length;
  const cancelledInterviews = interviews.filter((item) => item.status === "Cancelled").length;

  if (loading) {
    return (
      <div className="candidate-interviews-page">
        <div className="candidate-interviews-loading">
          <div className="candidate-interview-spinner"></div>
          <p>Loading interviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="candidate-interviews-page">
      <div className="candidate-interviews-header">
        <div>
          <h1>My Interviews</h1>
          <p>View and manage your upcoming and previous interviews.</p>
        </div>
        <button type="button" className="candidate-interview-refresh-btn" onClick={fetchInterviews} disabled={loading}>
          <FiRefreshCw />
          Refresh
        </button>
      </div>

      <div className="candidate-interview-stats">
        <div className="candidate-interview-stat-card">
          <div className="candidate-interview-stat-icon total">
            <FiCalendar />
          </div>
          <div>
            <span>Total</span>
            <strong>{totalInterviews}</strong>
          </div>
        </div>

        <div className="candidate-interview-stat-card">
          <div className="candidate-interview-stat-icon scheduled">
            <FiClock />
          </div>
          <div>
            <span>Scheduled</span>
            <strong>{scheduledInterviews}</strong>
          </div>
        </div>

        <div className="candidate-interview-stat-card">
          <div className="candidate-interview-stat-icon completed">
            <FiCheckCircle />
          </div>
          <div>
            <span>Completed</span>
            <strong>{completedInterviews}</strong>
          </div>
        </div>

        <div className="candidate-interview-stat-card">
          <div className="candidate-interview-stat-icon cancelled">
            <FiXCircle />
          </div>
          <div>
            <span>Cancelled</span>
            <strong>{cancelledInterviews}</strong>
          </div>
        </div>
      </div>

      <div className="candidate-interview-filters">
        <div className="candidate-interview-search">
          <FiSearch />
          <input type="text" placeholder="Search job, company or recruiter..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">All Status</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Rescheduled">Rescheduled</option>
        </select>
      </div>

      {error && (
        <div className="candidate-interviews-error">
          <FiXCircle />
          <span>{error}</span>
        </div>
      )}

      {!error && filteredInterviews.length === 0 && (
        <div className="candidate-interviews-empty">
          <div className="candidate-interview-empty-icon">
            <FiCalendar />
          </div>
          <h2>{interviews.length === 0 ? "No Interviews Yet" : "No Matching Interviews"}</h2>
          <p>{interviews.length === 0 ? "Your scheduled interviews will appear here." : "Try changing your search or status filter."}</p>
        </div>
      )}

      {filteredInterviews.length > 0 && (
        <div className="candidate-interview-list">
          {filteredInterviews.map((interview) => {
            const job = interview.job;
            const recruiter = interview.recruiter;

            const recruiterId =
              recruiter?._id || recruiter;

            const recruiterProfile =
              recruiterId
                ? recruiterProfiles[recruiterId.toString()]
                : null;

            return (
              <div className="candidate-interview-card" key={interview._id}>
                <div className="candidate-interview-card-top">
                  <div className="candidate-interview-job-info">
                    <div className="candidate-interview-job-icon">
                      {recruiterProfile?.companyLogo ? (
                        <img
                          src={getImageUrl(recruiterProfile.companyLogo)}
                          alt={`${job?.companyName || "Company"} logo`}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <FiBriefcase />
                      )}
                    </div>
                    <div>
                      <h3>{job?.title || "Job"}</h3>
                      <p>{job?.companyName || "Company"}</p>
                    </div>
                  </div>

                  <span className={`candidate-interview-status ${getStatusClass(interview.status)}`}>{interview.status}</span>
                </div>

                <div className="candidate-interview-details">
                  <div className="candidate-interview-detail">
                    <FiCalendar />
                    <div>
                      <span>Date</span>
                      <strong>{formatDate(interview.interviewDate)}</strong>
                    </div>
                  </div>

                  <div className="candidate-interview-detail">
                    <FiClock />
                    <div>
                      <span>Time</span>
                      <strong>{interview.startTime || "-"} - {interview.endTime || "-"}</strong>
                    </div>
                  </div>

                  <div className="candidate-interview-detail">
                    {interview.interviewType === "Online" ? <FiVideo /> : <FiMapPin />}
                    <div>
                      <span>Type</span>
                      <strong>{interview.interviewType || "-"}</strong>
                    </div>
                  </div>
                </div>

                {recruiter && (
                  <div className="candidate-interview-recruiter">

                    <div className="candidate-interview-recruiter-photo">
                      {recruiterProfile?.profilePhoto ? (
                        <img
                          src={getImageUrl(recruiterProfile.profilePhoto)}
                          alt={recruiter.name || "Recruiter"}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <FiUser />
                      )}
                    </div>

                    <div>
                      <span>Recruiter</span>

                      <strong>
                        {recruiterProfile?.fullName ||
                          recruiter.name ||
                          "Recruiter"}
                      </strong>

                      {recruiterProfile?.email ||
                        recruiter.email ? (
                        <small>
                          {recruiterProfile?.email ||
                            recruiter.email}
                        </small>
                      ) : null}
                    </div>

                  </div>
                )}

                {interview.status !== "Cancelled" && interview.interviewType === "Online" && interview.meetingLink && (
                  <a href={interview.meetingLink} target="_blank" rel="noreferrer" className="candidate-interview-meeting-link">
                    <FiVideo />
                    Join Meeting
                  </a>
                )}

                {interview.status !== "Cancelled" && interview.interviewType === "Offline" && interview.location && (
                  <div className="candidate-interview-location">
                    <FiMapPin />
                    <span>{interview.location}</span>
                  </div>
                )}

                {interview.notes && (
                  <div className="candidate-interview-notes">
                    <strong>Notes:</strong>
                    <span>{interview.notes}</span>
                  </div>
                )}

                <div className="candidate-interview-actions">
                  <button type="button" className="candidate-interview-view-btn" onClick={() => navigate(`/candidate/interviews/${interview._id}`)}>
                    <FiEye />
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CandidateInterviews;
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  FiCalendar, FiClock, FiUser, FiBriefcase, FiVideo, FiMapPin,
  FiRefreshCw, FiSearch, FiXCircle, FiCheckCircle, FiEye,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/context/AuthContext";
import "./RecruiterInterviews.css";

const API_URL = "http://localhost:5000/api/interviews";
const SERVER_URL = "http://localhost:5000";
const CANDIDATE_PROFILE_API = "http://localhost:5000/api/candidates/profile";
const RECRUITER_PROFILE_API = "http://localhost:5000/api/recruiter-profile";

const RecruiterInterviews = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [interviews, setInterviews] = useState([]);
  const [candidateProfiles, setCandidateProfiles] = useState({});
  const [recruiterProfiles, setRecruiterProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const getPhotoUrl = (photo) => {
    if (!photo) return null;
    if (photo.startsWith("http://") || photo.startsWith("https://")) return photo;
    return `${SERVER_URL}${photo.startsWith("/") ? photo : `/${photo}`}`;
  };

  const fetchProfiles = async (interviewList) => {
    const candidateMap = {};
    let recruiterProfile = null;

    for (const interview of interviewList) {
      const candidateId = typeof interview?.candidate === "object" ? interview.candidate?._id : interview?.candidate;
      if (candidateId && !candidateMap[candidateId]) {
        try {
          const response = await axios.get(`${CANDIDATE_PROFILE_API}/public/${candidateId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          candidateMap[candidateId] = response.data?.profile || null;
        } catch (error) {
          console.error("Candidate profile error:", error.response?.data?.message || error.message);
        }
      }
    }

    try {
      const response = await axios.get(`${RECRUITER_PROFILE_API}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      recruiterProfile = response.data?.profile || null;
    } catch (error) {
      console.error("Recruiter profile error:", error.response?.data?.message || error.message);
    }

    setCandidateProfiles(candidateMap);
    if (recruiterProfile) setRecruiterProfiles({ current: recruiterProfile });
  };

  const fetchInterviews = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError("Authentication token not found.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`${API_URL}/recruiter`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      const interviewList = Array.isArray(response.data?.interviews) ? response.data.interviews : [];
      setInterviews(interviewList);
      await fetchProfiles(interviewList);
    } catch (err) {
      console.error("Fetch Recruiter Interviews Error:", err);
      if (err.code === "ECONNABORTED") {
        setError("Server request timed out. Please check your backend server.");
      } else if (err.response?.status === 401) {
        setError("Authentication failed. Please login again.");
      } else if (err.response?.status === 403) {
        setError("You are not authorized to view recruiter interviews.");
      } else {
        setError(err.response?.data?.message || "Failed to fetch interviews.");
      }
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  const formatDate = (date) => {
    if (!date) return "-";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "-";
    return parsedDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Scheduled": return "status-scheduled";
      case "Completed": return "status-completed";
      case "Cancelled": return "status-cancelled";
      case "Rescheduled": return "status-rescheduled";
      default: return "";
    }
  };

  const filteredInterviews = interviews.filter((interview) => {
    const candidateName = interview?.candidate?.name || "";
    const candidateEmail = interview?.candidate?.email || "";
    const jobTitle = interview?.job?.title || "";
    const companyName = interview?.job?.companyName || "";
    const searchText = search.toLowerCase().trim();

    const matchesSearch =
      candidateName.toLowerCase().includes(searchText) ||
      candidateEmail.toLowerCase().includes(searchText) ||
      jobTitle.toLowerCase().includes(searchText) ||
      companyName.toLowerCase().includes(searchText);

    const matchesStatus = statusFilter === "All" || interview?.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const total = interviews.length;
  const scheduled = interviews.filter((i) => i.status === "Scheduled").length;
  const completed = interviews.filter((i) => i.status === "Completed").length;
  const cancelled = interviews.filter((i) => i.status === "Cancelled").length;

  if (loading) {
    return (
      <div className="recruiter-interviews-page">
        <div className="recruiter-interviews-loading">
          <div className="loading-spinner"></div>
          <p>Loading interviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recruiter-interviews-page">
      <div className="recruiter-interviews-header">
        <div>
          <h1>Interviews</h1>
          <p>Manage and track your candidate interviews.</p>
        </div>
        <button type="button" className="refresh-interviews-btn" onClick={fetchInterviews} disabled={loading}>
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {error && (
        <div className="interviews-error">
          <FiXCircle />
          <span>{error}</span>
          <button type="button" onClick={fetchInterviews}>Retry</button>
        </div>
      )}

      <div className="interviews-stats">
        <div className="interview-stat-card">
          <div className="interview-stat-icon total"><FiCalendar /></div>
          <div><span>Total</span><strong>{total}</strong></div>
        </div>
        <div className="interview-stat-card">
          <div className="interview-stat-icon scheduled"><FiClock /></div>
          <div><span>Scheduled</span><strong>{scheduled}</strong></div>
        </div>
        <div className="interview-stat-card">
          <div className="interview-stat-icon completed"><FiCheckCircle /></div>
          <div><span>Completed</span><strong>{completed}</strong></div>
        </div>
        <div className="interview-stat-card">
          <div className="interview-stat-icon cancelled"><FiXCircle /></div>
          <div><span>Cancelled</span><strong>{cancelled}</strong></div>
        </div>
      </div>

      <div className="interviews-toolbar">
        <div className="interview-search">
          <FiSearch />
          <input type="text" placeholder="Search candidate or job..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="interview-status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">All Status</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Rescheduled">Rescheduled</option>
        </select>
      </div>

      {filteredInterviews.length === 0 && (
        <div className="interviews-empty">
          <div className="interviews-empty-icon"><FiCalendar /></div>
          <h2>{interviews.length === 0 ? "No Interviews Yet" : "No Matching Interviews"}</h2>
          <p>{interviews.length === 0 ? "Scheduled candidate interviews will appear here." : "Try changing your search or status filter."}</p>
          {interviews.length === 0 && (
            <button type="button" className="schedule-first-interview-btn" onClick={() => navigate("/recruiter/applications")}>
              <FiCalendar /> Schedule Interview
            </button>
          )}
        </div>
      )}

      {filteredInterviews.length > 0 && (
        <div className="interviews-list">
          {filteredInterviews.map((interview) => {
            const candidate = interview?.candidate;
            const job = interview?.job;
            const candidateId = typeof candidate === "object" ? candidate?._id : candidate;
            const profile = candidateProfiles[candidateId];

            return (
              <div className="interview-card" key={interview._id}>
                <div className="interview-candidate">
                  <div className="interview-candidate-avatar">
                    {profile?.profilePhoto ? (
                      <img src={getPhotoUrl(profile.profilePhoto)} alt={profile?.fullName || candidate?.name || "Candidate"} />
                    ) : (
                      <span>{(profile?.fullName || candidate?.name || "C").charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <h3>{candidate?.name || "Candidate"}</h3>
                    <p>{candidate?.email || "No email"}</p>
                  </div>
                </div>

                <div className="interview-job">
                  <div className="interview-company-logo">
                    {recruiterProfiles.current?.companyLogo ? (
                      <img
                        src={getPhotoUrl(recruiterProfiles.current.companyLogo)}
                        alt={recruiterProfiles.current?.companyName || job?.companyName || "Company"}
                      />
                    ) : (
                      <FiBriefcase />
                    )}
                  </div>
                  <div>
                    <strong>{job?.title || "Job"}</strong>
                    <span>{recruiterProfiles.current?.companyName || job?.companyName || "Company"}</span>
                  </div>
                </div>

                <div className="interview-date-time">
                  <div><FiCalendar /><span>{formatDate(interview.interviewDate)}</span></div>
                  <div><FiClock /><span>{interview.startTime || "-"} - {interview.endTime || "-"}</span></div>
                </div>

                <div className="interview-type">
                  {interview.interviewType === "Online" ? (
                    <><FiVideo /><span>Online</span></>
                  ) : (
                    <><FiMapPin /><span>Offline</span></>
                  )}
                </div>

                <div className="interview-status">
                  <span className={`interview-status-badge ${getStatusClass(interview.status)}`}>{interview.status}</span>
                </div>

                <div className="interview-action">
                  <button type="button" onClick={() => navigate(`/recruiter/interviews/${interview._id}`)}>
                    <FiEye /> View Interview
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

export default RecruiterInterviews;
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

import CandidateLayout from "./pages/Candidate/CandidateLayout";
import CandidateDashboard from "./pages/Candidate/CandidateDashboard";
import SearchJobs from "./pages/Candidate/SearchJobs";
import SavedJobs from "./pages/candidate/SavedJobs";
import MyApplications from "./pages/candidate/MyApplications";
import CandidateInterviews from "./pages/candidate/CandidateInterviews";
import CandidateInterviewDetails from "./pages/candidate/CandidateInterviewDetails";
import CandidateMessages from "./pages/Candidate/CandidateMessages";
import CandidateProfile from "./pages/candidate/CandidateProfile";
import CandidateApplyJob from "./pages/Candidate/CandidateApplyJob";

import RecruiterLayout from "./pages/Recruiter/RecruiterLayout";
import RecruiterDashboard from "./pages/Recruiter/RecruiterDashboard";
import RecruiterPostJob from "./pages/Recruiter/RecruiterPostJob";
import RecruiterMyJobs from "./pages/Recruiter/RecruiterMyJobs";
import RecruiterJobDetails from "./pages/Recruiter/RecruiterJobDetails";
import RecruiterEditJob from "./pages/Recruiter/RecruiterEditJob";
import RecruiterApplications from "./pages/Recruiter/RecruiterApplications";
import RecruiterApplicationDetails from "./pages/Recruiter/RecruiterApplicationDetails";
import RecruiterInterviews from "./pages/Recruiter/RecruiterInterviews";
import RecruiterInterviewDetails from "./pages/Recruiter/RecruiterInterviewDetails";
import RecruiterEditInterview from "./pages/Recruiter/RecruiterEditInterview";
import ScheduleInterview from "./pages/Recruiter/ScheduleInterview";
import RecruiterMessages from "./pages/Recruiter/RecruiterMessages";
import RecruiterProfile from "./pages/Recruiter/RecruiterProfile";

const App = () => {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* CANDIDATE */}
        <Route path="/candidate" element={<CandidateLayout />}>
          <Route index element={<CandidateDashboard />} />
          <Route path="search-jobs" element={<SearchJobs />} />
          <Route path="saved-jobs" element={<SavedJobs />} />
          <Route path="applications" element={<MyApplications />} />
          <Route path="applications/apply/:jobId" element={<CandidateApplyJob />} />
          <Route path="interviews" element={<CandidateInterviews />} />
          <Route path="interviews/:interviewId" element={<CandidateInterviewDetails />} />
          <Route path="messages" element={<CandidateMessages />} />
          <Route path="profile" element={<CandidateProfile />} />
        </Route>

        {/* RECRUITER */}
        <Route path="/recruiter" element={<RecruiterLayout />}>
          <Route index element={<RecruiterDashboard />} />
          <Route path="post-job" element={<RecruiterPostJob />} />
          <Route path="my-jobs" element={<RecruiterMyJobs />} />
          <Route path="my-jobs/:jobId" element={<RecruiterJobDetails />} />
          <Route path="my-jobs/edit/:jobId" element={<RecruiterEditJob />} />
          <Route path="applications" element={<RecruiterApplications />} />
          <Route path="applications/:applicationId" element={<RecruiterApplicationDetails />} />
          <Route path="interviews" element={<RecruiterInterviews />} />
          <Route
            path="interviews/schedule"
            element={<ScheduleInterview />}
          />
          <Route path="interviews/:interviewId" element={<RecruiterInterviewDetails />} />
          <Route path="interviews/:interviewId/edit" element={<RecruiterEditInterview />} />
          <Route path="messages" element={<RecruiterMessages />} />
          <Route path="profile" element={<RecruiterProfile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
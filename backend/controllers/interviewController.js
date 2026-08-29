const Interview = require("../models/Interview");
const Application = require("../models/Application");
const Job = require("../models/Job");
const Notification = require("../models/Notification");
const { getIO } = require("../socket");

const createInterview = async (req, res) => {
    try {
        console.log("\n========== CREATE INTERVIEW ==========");
        console.log("Logged-in User ID:", req.user?.id);
        console.log("Logged-in User Role:", req.user?.role);
        console.log("Request Body:", req.body);

        const { application, interviewType, interviewDate, startTime, endTime, meetingLink, location, notes } = req.body;

        // VALIDATION
        if (!application || !interviewType || !interviewDate || !startTime || !endTime) {
            return res.status(400).json({ message: "Application, interview type, date, start time and end time are required" });
        }

        if (!["Online", "Offline"].includes(interviewType)) {
            return res.status(400).json({ message: "Interview type must be Online or Offline" });
        }

        // FIND APPLICATION
        const existingApplication = await Application.findById(application);
        console.log("Application Found:", existingApplication);

        if (!existingApplication) {
            return res.status(404).json({ message: "Application not found" });
        }

        console.log("Application Recruiter:", existingApplication.recruiter);
        console.log("Logged-in Recruiter:", req.user.id);

        // CHECK RECRUITER
        if (existingApplication.recruiter.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: "You can schedule interviews only for your own applications" });
        }

        // CHECK EXISTING INTERVIEW
        const existingInterview = await Interview.findOne({ application: application });

        if (existingInterview) {
            return res.status(400).json({ message: "An interview already exists for this application" });
        }

        // ONLINE VALIDATION
        if (interviewType === "Online" && !meetingLink?.trim()) {
            return res.status(400).json({ message: "Meeting link is required for online interviews" });
        }

        // OFFLINE VALIDATION
        if (interviewType === "Offline" && !location?.trim()) {
            return res.status(400).json({ message: "Location is required for offline interviews" });
        }

        // CREATE INTERVIEW
        const interview = await Interview.create({
            application: existingApplication._id,
            candidate: existingApplication.candidate,
            recruiter: existingApplication.recruiter,
            job: existingApplication.job,
            interviewType,
            interviewDate,
            startTime,
            endTime,
            meetingLink: interviewType === "Online" ? meetingLink.trim() : "",
            location: interviewType === "Offline" ? location.trim() : "",
            notes: notes?.trim() || "",
            status: "Scheduled",
        });

        console.log("========== INTERVIEW CREATED ==========");
        console.log("Interview ID:", interview._id);
        console.log("Candidate:", interview.candidate);
        console.log("Recruiter:", interview.recruiter);
        console.log("Job:", interview.job);

        // UPDATE APPLICATION
        existingApplication.status = "Interview";
        await existingApplication.save();

        // JOB
        const job = await Job.findById(existingApplication.job);
        const jobTitle = job?.title || "Job";

        // NOTIFICATION
        const notification = await Notification.create({
            recipient: interview.candidate,
            sender: interview.recruiter,

            type: "interview",

            title: "Interview Cancelled",

            content: `Your interview for ${jobTitle} has been cancelled.`,

            interview: interview._id,

            application: interview.application,

            isRead: false,
        });

        // SOCKET NOTIFICATION
        try {
            const io = getIO();
            io.to(existingApplication.candidate.toString()).emit("newNotification", notification);
            console.log("Real-time notification sent");
        } catch (socketError) {
            console.error("Socket notification error:", socketError.message);
        }

        // POPULATE
        const populatedInterview = await Interview.findById(interview._id)
            .populate("candidate", "name email")
            .populate("recruiter", "name email")
            .populate("job", "title companyName")
            .populate("application");

        console.log("Interview saved successfully:");
        console.log(populatedInterview);
        console.log("======================================\n");

        return res.status(201).json({
            message: "Interview scheduled successfully",
            interview: populatedInterview,
            notification,
        });
    } catch (error) {
        console.error("\n========== CREATE INTERVIEW ERROR ==========");
        console.error(error);
        console.error("Error Message:", error.message);
        console.error("============================================\n");

        return res.status(500).json({ message: "Failed to schedule interview", error: error.message });
    }
};

const getRecruiterInterviews = async (req, res) => {
    try {
        console.log("========== GET RECRUITER INTERVIEWS ==========");
        console.log("Logged-in Recruiter ID:", req.user.id);

        const totalInterviews = await Interview.countDocuments();
        console.log("Total Interviews In DB:", totalInterviews);

        const interviews = await Interview.find({ recruiter: req.user.id })
            .populate("candidate", "name email")
            .populate("recruiter", "name email")
            .populate("job", "title companyName")
            .populate("application")
            .sort({ interviewDate: 1, startTime: 1 });

        console.log("Interviews Found:", interviews.length);

        interviews.forEach((interview) => {
            console.log({
                id: interview._id,
                recruiter: interview.recruiter?._id,
                candidate: interview.candidate?._id,
                job: interview.job?._id,
                status: interview.status,
            });
        });

        console.log("============================================");

        return res.status(200).json({
            message: "Recruiter interviews fetched successfully",
            count: interviews.length,
            interviews,
        });
    } catch (error) {
        console.error("Get Recruiter Interviews Error:", error);
        return res.status(500).json({ message: "Failed to fetch recruiter interviews", error: error.message });
    }
};

const getCandidateInterviews = async (req, res) => {
    try {
        const interviews = await Interview.find({ candidate: req.user.id })
            .populate("recruiter", "name email")
            .populate("job", "title companyName")
            .populate("application")
            .sort({ interviewDate: 1, startTime: 1 });

        res.status(200).json({ message: "Candidate interviews fetched successfully", count: interviews.length, interviews });
    } catch (error) {
        console.error("Get Candidate Interviews Error:", error.message);
        res.status(500).json({ message: "Failed to fetch candidate interviews", error: error.message });
    }
};

const getInterviewById = async (req, res) => {
    try {
        const { interviewId } = req.params;

        const interview = await Interview.findById(interviewId)
            .populate("candidate", "name email")
            .populate("recruiter", "name email")
            .populate("job", "title companyName")
            .populate("application");

        if (!interview) {
            return res.status(404).json({ message: "Interview not found" });
        }

        const userId = req.user.id.toString();
        const candidateId = interview.candidate._id.toString();
        const recruiterId = interview.recruiter._id.toString();

        if (userId !== candidateId && userId !== recruiterId) {
            return res.status(403).json({ message: "You are not authorized to view this interview" });
        }

        res.status(200).json({ message: "Interview fetched successfully", interview });
    } catch (error) {
        console.error("Get Interview Error:", error.message);
        res.status(500).json({ message: "Failed to fetch interview", error: error.message });
    }
};

const updateInterview = async (req, res) => {
    try {
        const { interviewId } = req.params;
        const { interviewType, interviewDate, startTime, endTime, meetingLink, location, notes, status } = req.body;

        const interview = await Interview.findById(interviewId);
        if (!interview) {
            return res.status(404).json({ message: "Interview not found" });
        }

        if (interview.recruiter.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: "You can update only your own interviews" });
        }

        if (interviewType && !["Online", "Offline"].includes(interviewType)) {
            return res.status(400).json({ message: "Interview type must be Online or Offline" });
        }

        const finalType = interviewType || interview.interviewType;

        if (finalType === "Online" && !(meetingLink?.trim() || interview.meetingLink)) {
            return res.status(400).json({ message: "Meeting link is required for online interviews" });
        }

        if (finalType === "Offline" && !(location?.trim() || interview.location)) {
            return res.status(400).json({ message: "Location is required for offline interviews" });
        }

        interview.interviewType = finalType;
        if (interviewDate !== undefined) interview.interviewDate = interviewDate;
        if (startTime !== undefined) interview.startTime = startTime;
        if (endTime !== undefined) interview.endTime = endTime;
        interview.meetingLink = finalType === "Online" ? meetingLink?.trim() || interview.meetingLink : "";
        interview.location = finalType === "Offline" ? location?.trim() || interview.location : "";
        if (notes !== undefined) interview.notes = notes.trim();
        if (status !== undefined) interview.status = status;

        await interview.save();

        if (status === "Rescheduled") {
            const job = await Job.findById(interview.job);
            const jobTitle = job?.title || "Job";

            const notification = await Notification.create({
                recipient: interview.candidate,
                sender: interview.recruiter,
                type: "interview",
                title: "Interview Rescheduled",
                message: `Your interview for ${jobTitle} has been rescheduled.`,
                interview: interview._id,
                application: interview.application,
                isRead: false,
            });

            try {
                const io = getIO();
                io.to(interview.candidate.toString()).emit("newNotification", notification);
            } catch (socketError) {
                console.error("Socket notification error:", socketError.message);
            }
        }

        const updatedInterview = await Interview.findById(interview._id)
            .populate("candidate", "name email")
            .populate("recruiter", "name email")
            .populate("job", "title companyName")
            .populate("application");

        res.status(200).json({ message: "Interview updated successfully", interview: updatedInterview });
    } catch (error) {
        console.error("Update Interview Error:", error.message);
        res.status(500).json({ message: "Failed to update interview", error: error.message });
    }
};

const deleteInterview = async (req, res) => {
    try {
        const { interviewId } = req.params;

        const interview = await Interview.findById(interviewId);
        if (!interview) {
            return res.status(404).json({ message: "Interview not found" });
        }

        if (interview.recruiter.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: "You can delete only your own interviews" });
        }

        const job = await Job.findById(interview.job);
        const jobTitle = job?.title || "Job";

        const notification = await Notification.create({
            recipient: interview.candidate,
            sender: interview.recruiter,
            type: "interview",
            title: "Interview Cancelled",
            message: `Your interview for ${jobTitle} has been cancelled.`,
            interview: interview._id,
            application: interview.application,
            isRead: false,
        });

        const io = getIO();
        io.to(interview.candidate.toString()).emit("newNotification", notification);

        console.log("Cancellation notification sent:", notification._id);

        await Interview.findByIdAndDelete(interviewId);

        await Application.findByIdAndUpdate(interview.application, { $set: { status: "Shortlisted" } });

        res.status(200).json({ message: "Interview cancelled successfully" });
    } catch (error) {
        console.error("Delete Interview Error:", error.message);
        res.status(500).json({ message: "Failed to cancel interview", error: error.message });
    }
};

module.exports = {
    createInterview,
    getRecruiterInterviews,
    getCandidateInterviews,
    getInterviewById,
    updateInterview,
    deleteInterview,
};
const Application = require("../models/Application");
const Job = require("../models/Job");
const CandidateProfile = require("../models/CandidateProfile");

const applyForJob = async (req, res) => {
  try {
    const { job, resume, coverLetter } = req.body;

    if (!job) {
      return res.status(400).json({
        message: "Job ID is required",
      });
    }

    // Check candidate profile
    const candidateProfile = await CandidateProfile.findOne({
      user: req.user.id,
    });

    if (!candidateProfile) {
      return res.status(404).json({
        message: "Please create your candidate profile first",
      });
    }

    // Check job
    const jobData = await Job.findById(job);

    if (!jobData) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    if (jobData.status !== "Open") {
      return res.status(400).json({
        message: "This job is not currently open",
      });
    }

    // Check deadline
    if (
      jobData.applicationDeadline &&
      new Date(jobData.applicationDeadline) < new Date()
    ) {
      return res.status(400).json({
        message: "Application deadline has passed",
      });
    }

    // Check duplicate application
    const existingApplication = await Application.findOne({
      candidate: req.user.id,
      job: job,
    });

    if (existingApplication) {
      return res.status(400).json({
        message: "You have already applied for this job",
      });
    }

    // Check resume
    const selectedResume = resume;

    if (!selectedResume) {
      return res.status(400).json({
        message: "Resume is required",
      });
    }

    // Create application
    const application = await Application.create({
      candidate: req.user.id,
      recruiter: jobData.recruiter,
      job: job,
      resume: selectedResume,
      coverLetter: coverLetter || "",
    });

    res.status(201).json({
      message: "Job application submitted successfully",
      application,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to apply for job",
      error: error.message,
    });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({
      candidate: req.user.id,
    })
      .populate({
        path: "job",
        select:
          "title companyName location employmentType workMode salaryMin salaryMax recruiter",
        populate: {
          path: "recruiter",
          select: "name email role",
        },
      })
      .populate("recruiter", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Applications fetched successfully",
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error("Get My Applications Error:", error);

    res.status(500).json({
      message: "Failed to fetch applications",
      error: error.message,
    });
  }
};

const getApplicationById = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(
      applicationId
    )
      .populate("candidate", "name email")
      .populate("recruiter", "name email")
      .populate("job");

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    // Candidate can view own application
    if (
      application.candidate._id.toString() === req.user.id
    ) {
      return res.status(200).json({
        message: "Application fetched successfully",
        application,
      });
    }

    // Recruiter can view their job application
    if (
      application.recruiter._id.toString() === req.user.id
    ) {
      return res.status(200).json({
        message: "Application fetched successfully",
        application,
      });
    }

    return res.status(403).json({
      message: "Access denied",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch application",
      error: error.message,
    });
  }
};

const getRecruiterApplications = async (req, res) => {
  try {
    const applications = await Application.find({ recruiter: req.user.id }).populate("candidate", "name email role").populate("job", "title companyName location employmentType workMode").sort({ createdAt: -1 });

    const applicationsWithProfile = await Promise.all(applications.map(async (application) => {
      const applicationData = application.toObject();

      if (applicationData.candidate?._id) {
        const candidateProfile = await CandidateProfile.findOne({ user: applicationData.candidate._id }).select("fullName profilePhoto headline currentJobTitle");

        applicationData.candidate.profilePhoto = candidateProfile?.profilePhoto || null;
        applicationData.candidate.fullName = candidateProfile?.fullName || "";
        applicationData.candidate.headline = candidateProfile?.headline || "";
        applicationData.candidate.currentJobTitle = candidateProfile?.currentJobTitle || "";
      }

      return applicationData;
    }));

    res.status(200).json({ message: "Recruiter applications fetched successfully", count: applicationsWithProfile.length, applications: applicationsWithProfile });
  } catch (error) {
    console.error("Get recruiter applications error:", error);
    res.status(500).json({ message: "Failed to fetch recruiter applications", error: error.message });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "Applied",
      "Under Review",
      "Shortlisted",
      "Interview",
      "Hired",
      "Rejected",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid application status",
      });
    }

    const application = await Application.findById(
      applicationId
    );

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    // Only job owner can update application status
    if (
      application.recruiter.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message:
          "You can update applications for your jobs only",
      });
    }

    application.status = status;

    await application.save();

    res.status(200).json({
      message: "Application status updated successfully",
      application,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update application status",
      error: error.message,
    });
  }
};

const getApplicationByStatus = async (req, res) => {

  try {
    const applications = await Application.find({
      status: "Interview",
    });

    console.log("applications:", applications);

    if (applications.length === 0) {
      return res.status(404).json({
        message: "No applications found for this status",
        application: [],
      });
    }

    res.status(200).json({
      message: "Applications fetched successfully",
      application: applications,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch applications by status",
      error: error.message,
    });
  }
};

module.exports = {
  applyForJob,
  getMyApplications,
  getApplicationById,
  getRecruiterApplications,
  updateApplicationStatus,
  getApplicationByStatus
};
const SavedJob = require("../models/SavedJob");
const Job = require("../models/Job");


const saveJob = async (req, res) => {
  try {
    const { job } = req.body;

    if (!job) {
      return res.status(400).json({
        message: "Job ID is required",
      });
    }

    // Check whether job exists
    const jobData = await Job.findById(job);

    if (!jobData) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    // Check duplicate
    const existingSavedJob = await SavedJob.findOne({
      candidate: req.user.id,
      job: job,
    });

    if (existingSavedJob) {
      return res.status(400).json({
        message: "Job already saved",
      });
    }

    // Save job
    const savedJob = await SavedJob.create({
      candidate: req.user.id,
      job: job,
    });

    return res.status(201).json({
      message: "Job saved successfully",
      savedJob,
    });
  } catch (error) {
    console.error("Save Job Error:", error);

    return res.status(500).json({
      message: "Failed to save job",
      error: error.message,
    });
  }
};

const getSavedJobs = async (req, res) => {
  try {
    const savedJobs = await SavedJob.find({
      candidate: req.user.id,
    })
      .populate({
        path: "job",
        select:
          "title companyName description skills location employmentType workMode salaryMin salaryMax applicationDeadline recruiter",
        populate: {
          path: "recruiter",
          select: "name email role",
        },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Saved jobs fetched successfully",
      count: savedJobs.length,
      savedJobs,
    });
  } catch (error) {
    console.error("Get Saved Jobs Error:", error);

    return res.status(500).json({
      message: "Failed to fetch saved jobs",
      error: error.message,
    });
  }
};

const removeSavedJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        message: "Job ID is required",
      });
    }

    const savedJob = await SavedJob.findOne({
      candidate: req.user.id,
      job: jobId,
    });

    if (!savedJob) {
      return res.status(404).json({
        message: "Saved job not found",
      });
    }

    await SavedJob.findByIdAndDelete(savedJob._id);

    return res.status(200).json({
      message: "Job removed from saved jobs successfully",
    });
  } catch (error) {
    console.error("Remove Saved Job Error:", error);

    return res.status(500).json({
      message: "Failed to remove saved job",
      error: error.message,
    });
  }
};

module.exports = {
  saveJob,
  getSavedJobs,
  removeSavedJob,
};
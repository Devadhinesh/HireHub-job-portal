const Job = require("../models/Job");

const createJob = async (req, res) => {
  try {
    const job = await Job.create({
      ...req.body,
      recruiter: req.user.id,
    });

    res.status(201).json({
      message: "Job created successfully",
      job,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create job",
      error: error.message,
    });
  }
};

const getAllJobs = async (req, res) => {
  try {
    const {
      search,
      location,
      employmentType,
      workMode,
      category,
      minSalary,
      maxSalary,
      experience,
    } = req.query;

    const filter = {
      status: "Open",
      applicationDeadline: {
        $gte: new Date(),
      },
    };

    // Search
    if (search) {
      filter.$or = [
        {
          title: {
            $regex: search,
            $options: "i",
          },
        },
        {
          companyName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          skills: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // Location
    if (location) {
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            {
              "location.city": {
                $regex: location,
                $options: "i",
              },
            },
            {
              "location.state": {
                $regex: location,
                $options: "i",
              },
            },
            {
              "location.country": {
                $regex: location,
                $options: "i",
              },
            },
          ],
        },
      ];
    }

    // Employment type
    if (employmentType) {
      filter.employmentType = employmentType;
    }

    // Work mode
    if (workMode) {
      filter.workMode = workMode;
    }

    // Category
    if (category) {
      filter.category = {
        $regex: category,
        $options: "i",
      };
    }

    // Salary
    if (minSalary) {
      filter.salaryMax = {
        $gte: Number(minSalary),
      };
    }

    if (maxSalary) {
      filter.salaryMin = {
        $lte: Number(maxSalary),
      };
    }

    // Experience
    if (experience) {
      filter.experienceMin = {
        $lte: Number(experience),
      };

      filter.experienceMax = {
        $gte: Number(experience),
      };
    }

    const jobs = await Job.find(filter)
      .populate("recruiter", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Jobs fetched successfully",
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch jobs",
      error: error.message,
    });
  }
};
const getJobById = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId).populate(
      "recruiter",
      "name email"
    );

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    res.status(200).json({
      message: "Job fetched successfully",
      job,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch job",
      error: error.message,
    });
  }
};

const updateJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    if (job.recruiter.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You can update only your own jobs",
      });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      jobId,
      {
        $set: req.body,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      message: "Job updated successfully",
      job: updatedJob,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update job",
      error: error.message,
    });
  }
};

const deleteJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    if (job.recruiter.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You can delete only your own jobs",
      });
    }

    await Job.findByIdAndDelete(jobId);

    res.status(200).json({
      message: "Job deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete job",
      error: error.message,
    });
  }
};

const getRecruiterJobs = async (req, res) => {
  try {
    const jobs = await Job.find({
      recruiter: req.user.id,
    })
      .populate("recruiter", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Recruiter jobs fetched successfully",
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch recruiter jobs",
      error: error.message,
    });
  }
};

module.exports = {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  getRecruiterJobs
};
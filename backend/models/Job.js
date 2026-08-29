const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    requirements: {
      type: String,
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    location: {
      city: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        trim: true,
      },
    },
    employmentType: {
      type: String,
      enum: [
        "Full-time",
        "Part-time",
        "Contract",
        "Internship",
        "Freelance",
      ],
      required: true,
    },
    workMode: {
      type: String,
      enum: [
        "On-site",
        "Remote",
        "Hybrid",
      ],
      required: true,
    },
    experienceMin: {
      type: Number,
      default: 0,
      min: 0,
    },

    experienceMax: {
      type: Number,
      default: 0,
      min: 0,
    },
    salaryMin: {
      type: Number,
      min: 0,
    },
    salaryMax: {
      type: Number,
      min: 0,
    },
    salaryType: {
      type: String,
      enum: [
        "Per Year",
        "Per Month",
        "Per Hour",
      ],
      default: "Per Year",
    },
    vacancies: {
      type: Number,
      required: true,
      min: 1,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    applicationDeadline: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "Open",
        "Closed",
        "Draft",
      ],
      default: "Open",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Job", jobSchema);
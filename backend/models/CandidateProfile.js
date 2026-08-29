const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
      default: "Beginner",
    },

    type: {
      type: String,
      enum: ["primary", "secondary"],
      default: "secondary",
    },
  },
  { _id: false }
);

const experienceSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
  },

  jobTitle: {
    type: String,
    required: true,
  },

  location: {
    type: String,
  },

  startDate: {
    type: Date,
    required: true,
  },

  endDate: {
    type: Date,
    default: null,
  },

  currentlyWorking: {
    type: Boolean,
    default: false,
  },

  description: {
    type: String,
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
  },
});

const educationSchema = new mongoose.Schema({
  institution: {
    type: String,
    required: true,
  },

  degree: {
    type: String,
    required: true,
  },

  fieldOfStudy: {
    type: String,
  },

  startYear: {
    type: Number,
  },

  endYear: {
    type: Number,
  },

  grade: {
    type: String,
  },
});

const certificationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  issuingOrganization: {
    type: String,
  },

  issueDate: {
    type: Date,
  },

  expiryDate: {
    type: Date,
    default: null,
  },

  credentialUrl: {
    type: String,
  },
});

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  description: {
    type: String,
  },

  techStack: [
    {
      type: String,
    },
  ],

  projectUrl: {
    type: String,
  },

  githubUrl: {
    type: String,
  },
});

const candidateProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
    },

    profilePhoto: {
      type: String,
    },

    location: {
      city: String,
      state: String,
      country: String,
    },

    headline: {
      type: String,
    },

    dateOfBirth: {
      type: Date,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Prefer not to say"],
    },
    bio: {
      type: String,
    },

    currentJobTitle: {
      type: String,
    },

    currentCompany: {
      type: String,
    },

    totalExperience: {
      type: Number,
      default: 0,
    },

    noticePeriod: {
      type: String,
    },

    availabilityDate: {
      type: Date,
    },

    expectedSalary: {
      min: {
        type: Number,
      },

      max: {
        type: Number,
      },
    },

    employmentTypePreference: [
      {
        type: String,
        enum: [
          "Full-time",
          "Part-time",
          "Contract",
          "Internship",
          "Remote",
        ],
      },
    ],
    skills: [skillSchema],
    experience: [experienceSchema],

    education: [educationSchema],
    resume: [
      {
        name: String,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    coverLetterUrl: {
      type: String,
    },

    portfolioUrl: {
      type: String,
    },

    githubUrl: {
      type: String,
    },

    linkedinUrl: {
      type: String,
    },

    personalWebsite: {
      type: String,
    },
    certifications: [certificationSchema],
    projects: [projectSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "CandidateProfile",
  candidateProfileSchema
);
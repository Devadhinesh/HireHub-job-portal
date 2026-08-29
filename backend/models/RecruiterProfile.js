const mongoose = require("mongoose");
const recruiterProfileSchema = new mongoose.Schema(
    {
       user: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: true,
  unique: true,
},
        //basic information
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
            trim: true,
        },

        profilePhoto: {
            type: String,
        },
        //recruiter information
        jobTitle: {
            type: String,
            trim: true,
        },
        about: {
            type: String,
        },
        //comapny information
        companyName: {
            type: String,
            required: true,
            trim: true,
        },
        companyLogo: {
  type: String,
  default: "",
},
        companyWebsite: {
            type: String,
            trim: true,
        },
        industry: {
            type: String,
            trim: true,
        },
        companySize: {
            type: String,
            enum: [
                "1-10",
                "11-50",
                "51-200",
                "201-500",
                "501-1000",
                "1001-5000",
                "5000+",
            ],
        },
        companyDescription: {
            type: String,
        },
        //Loction
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
        //social links
        linkedinUrl: {
            type: String,
            trim: true,
        },
        websiteUrl: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);
module.exports = mongoose.model(
    "RecruiterProfile",
    recruiterProfileSchema
);
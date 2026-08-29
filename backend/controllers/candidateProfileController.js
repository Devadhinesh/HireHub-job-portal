const fs = require("fs");
const path = require("path");
const CandidateProfile = require("../models/CandidateProfile");
const User = require("../models/User");

const createProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const existingProfile = await CandidateProfile.findOne({
            user: userId,
        });
        if (existingProfile) {
            return res.status(400).json({
                message: "Candidate profile already exists",
            });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }
        const profile = await CandidateProfile.create({
            ...req.body,
            user: userId,
            email: user.email,
        });
        res.status(201).json({
            message: "Candidate profile created successfully",
            profile,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to create candidate profile",
            error: error.message,
        });
    }
}
const getMyProfile = async (req, res) => {
    try {
        const profile = await CandidateProfile.findOne({
            user: req.user.id,
        }).populate("user", "name email role");

        res.status(200).json({
            message: "Candidate profile fetched successfully",
            profile: profile || null,
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch profile",
            error: error.message,
        });
    }
};

const updateMyProfile = async (req, res) => {
    try {
        const profile = await CandidateProfile.findOneAndUpdate(
            { user: req.user.id },
            { $set: req.body },
            {
                new: true,
                runValidators: true,
            }
        );
        if (!profile) {
            return res.status(404).json({
                message: "Candidate profile not found",
            });
        }
        res.status(200).json({
            message: "Candidate profile updated successfully",
            profile,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to update profile",
            error: error.message,
        });
    }
}

const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Profile photo is required",
      });
    }
    const profile = await CandidateProfile.findOne({
      user: req.user.id,
    });
    if (!profile) {
      return res.status(404).json({
        message: "Candidate profile not found",
      });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    profile.profilePhoto = fileUrl;
    await profile.save();
    res.status(200).json({
      message: "Profile photo uploaded successfully",
      profilePhoto: fileUrl,
    });
  } catch (error) {
    res.status(500).json({
      message: "Profile photo upload failed",
      error: error.message,
    });
  }
};

const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Resume is required",
      });
    }

    const profile = await CandidateProfile.findOne({
      user: req.user.id,
    });

    if (!profile) {
      return res.status(404).json({
        message: "Candidate profile not found",
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    profile.resume.push({
      name: req.file.originalname,
      url: fileUrl,
    });

    await profile.save();

    res.status(200).json({
      message: "Resume uploaded successfully",
      resume: {
        name: req.file.originalname,
        url: fileUrl,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Resume upload failed",
      error: error.message,
    });
  }
};

const deleteProfilePhoto = async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({
      user: req.user.id,
    });

    if (!profile) {
      return res.status(404).json({
        message: "Candidate profile not found",
      });
    }

    if (!profile.profilePhoto) {
      return res.status(404).json({
        message: "Profile photo not found",
      });
    }

    const filePath = path.join(
      __dirname,
      "..",
      profile.profilePhoto
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    profile.profilePhoto = null;

    await profile.save();

    res.status(200).json({
      message: "Profile photo deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete profile photo",
      error: error.message,
    });
  }
};


const deleteResume = async (req, res) => {
  try {
    const { resumeId } = req.params;

    const profile = await CandidateProfile.findOne({
      user: req.user.id,
    });

    if (!profile) {
      return res.status(404).json({
        message: "Candidate profile not found",
      });
    }

    const resume = profile.resume.id(resumeId);

    if (!resume) {
      return res.status(404).json({
        message: "Resume not found",
      });
    }

    const filePath = path.join(
      __dirname,
      "..",
      resume.url
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    profile.resume.pull(resumeId);

    await profile.save();

    res.status(200).json({
      message: "Resume deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete resume",
      error: error.message,
    });
  }
};

const uploadCoverLetter = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Cover letter is required",
      });
    }

    const profile = await CandidateProfile.findOne({
      user: req.user.id,
    });

    if (!profile) {
      return res.status(404).json({
        message: "Candidate profile not found",
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    profile.coverLetterUrl = fileUrl;

    await profile.save();

    res.status(200).json({
      message: "Cover letter uploaded successfully",
      coverLetterUrl: fileUrl,
    });
  } catch (error) {
    res.status(500).json({
      message: "Cover letter upload failed",
      error: error.message,
    });
  }
};
const deleteCoverLetter = async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({
      user: req.user.id,
    });

    if (!profile) {
      return res.status(404).json({
        message: "Candidate profile not found",
      });
    }

    profile.coverLetterUrl = null;

    await profile.save();

    res.status(200).json({
      message: "Cover letter deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete cover letter",
      error: error.message,
    });
  }
};

const getCandidateProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await CandidateProfile.findOne({
      user: userId,
    }).select(
      "fullName email profilePhoto resume coverLetter"
    );

    if (!profile) {
      return res.status(404).json({
        message: "Candidate profile not found",
      });
    }

    res.status(200).json({
      message: "Candidate profile fetched successfully",
      profile,
    });
  } catch (error) {
    console.error(
      "Get candidate profile error:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch candidate profile",
      error: error.message,
    });
  }
};
module.exports = {
  createProfile,
  getMyProfile,
  updateMyProfile,
  uploadProfilePhoto,
  uploadResume,
  deleteProfilePhoto,
  deleteResume,
  uploadCoverLetter,
  deleteCoverLetter,
  getCandidateProfileByUserId
};
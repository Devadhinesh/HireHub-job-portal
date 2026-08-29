const RecruiterProfile = require("../models/RecruiterProfile");
const User = require("../models/User");

const createRecruiterProfile = async (req, res) => {
  try {
    const existingProfile = await RecruiterProfile.findOne({
      user: req.user.id,
    });

    if (existingProfile) {
      return res.status(400).json({
        message: "Recruiter profile already exists",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    let location = {};

    if (req.body.location) {
      try {
        location = JSON.parse(req.body.location);
      } catch (error) {
        return res.status(400).json({
          message: "Invalid location format",
        });
      }
    }

    const profilePhoto = req.files?.profilePhoto?.[0]
      ? `/uploads/recruiter/profile/${req.files.profilePhoto[0].filename}`
      : "";

    const companyLogo = req.files?.companyLogo?.[0]
      ? `/uploads/recruiter/company/${req.files.companyLogo[0].filename}`
      : "";

    const profile = await RecruiterProfile.create({
      ...req.body,
      user: req.user.id,
      fullName: user.name,
      email: user.email,
      location,
      profilePhoto,
      companyLogo,
    });

    res.status(201).json({
      message: "Recruiter profile created successfully",
      profile,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create recruiter profile",
      error: error.message,
    });
  }
};

const getMyRecruiterProfile = async (req, res) => {
  try {
    const profile = await RecruiterProfile.findOne({
      user: req.user.id,
    }).populate("user", "name email role");

    if (!profile) {
      return res.status(404).json({
        message: "Recruiter profile not found",
      });
    }

    res.status(200).json({
      message: "Recruiter profile fetched successfully",
      profile,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch recruiter profile",
      error: error.message,
    });
  }
};

const updateMyRecruiterProfile = async (req, res) => {
  try {
    const profile = await RecruiterProfile.findOne({
      user: req.user.id,
    });

    if (!profile) {
      return res.status(404).json({
        message: "Recruiter profile not found",
      });
    }

    const updateData = {
      ...req.body,
    };

    if (req.body.location) {
      try {
        updateData.location = JSON.parse(req.body.location);
      } catch (error) {
        return res.status(400).json({
          message: "Invalid location format",
        });
      }
    }

    if (req.files?.profilePhoto?.[0]) {
      updateData.profilePhoto =
        `/uploads/recruiter/profile/${req.files.profilePhoto[0].filename}`;
    }

    if (req.files?.companyLogo?.[0]) {
      updateData.companyLogo =
        `/uploads/recruiter/company/${req.files.companyLogo[0].filename}`;
    }

    const updatedProfile =
      await RecruiterProfile.findOneAndUpdate(
        { user: req.user.id },
        {
          $set: updateData,
        },
        {
          new: true,
          runValidators: true,
        }
      );

    res.status(200).json({
      message: "Recruiter profile updated successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update recruiter profile",
      error: error.message,
    });
  }
};

const deleteMyRecruiterProfile = async (req, res) => {
  try {
    const profile = await RecruiterProfile.findOne({
      user: req.user.id,
    });

    if (!profile) {
      return res.status(404).json({
        message: "Recruiter profile not found",
      });
    }

    await RecruiterProfile.findOneAndDelete({
      user: req.user.id,
    });

    res.status(200).json({
      message: "Recruiter profile deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete recruiter profile",
      error: error.message,
    });
  }
};

const getRecruiterProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        message: "Recruiter user ID is required",
      });
    }

    const profile = await RecruiterProfile.findOne({
      user: userId,
    }).select(
      "fullName email profilePhoto companyLogo companyName"
    );

    if (!profile) {
      return res.status(404).json({
        message: "Recruiter profile not found",
      });
    }

    return res.status(200).json({
      message: "Recruiter profile fetched successfully",
      profile,
    });
  } catch (error) {
    console.error(
      "Get recruiter profile error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch recruiter profile",
      error: error.message,
    });
  }
};

module.exports = {
  createRecruiterProfile,
  getMyRecruiterProfile,
  updateMyRecruiterProfile,
  deleteMyRecruiterProfile,
  getRecruiterProfileByUserId
};
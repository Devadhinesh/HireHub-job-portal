import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiCamera,
  FiSave,
  FiUser,
  FiMail,
  FiPhone,
  FiTag,
  FiMapPin,
  FiCalendar,
  FiUsers,
} from "react-icons/fi";
import { useAuth } from "../../../components/context/AuthContext";
import "./BasicInformation.css";

const SERVER_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const API_URL = `${SERVER_URL}/api/candidates/profile`;

const BasicInformation = () => {
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: { city: "", state: "", country: "" },
    headline: "",
    dateOfBirth: "",
    gender: "",
  });

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [isProfileCreated, setIsProfileCreated] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // GET PROFILE
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const profile = response.data.profile;

        if (profile) {
          setIsProfileCreated(true);

          setFormData({
            fullName: profile.fullName || "",
            email: profile.email || "",
            phone: profile.phone || "",
            location: {
              city: profile.location?.city || "",
              state: profile.location?.state || "",
              country: profile.location?.country || "",
            },
            headline: profile.headline || "",
            dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split("T")[0] : "",
            gender: profile.gender || "",
          });

          if (profile.profilePhoto) {
            const photoPath = profile.profilePhoto.startsWith("http")
              ? profile.profilePhoto
              : `${SERVER_URL}${profile.profilePhoto}`;
            setPhotoPreview(photoPath);
          }
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          setError(error.response?.data?.message || "Failed to fetch profile");
        }
      }
    };

    if (token) fetchProfile();
  }, [token]);

  // HANDLE INPUT CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (["city", "state", "country"].includes(name)) {
      setFormData({
        ...formData,
        location: { ...formData.location, [name]: value },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    setMessage("");
    setError("");
  };

  // PROFILE PHOTO
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "image/png") {
      setError("Only PNG profile photos are allowed.");
      return;
    }

    setProfilePhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setMessage("");
    setError("");
  };

  // SAVE / UPDATE PROFILE
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      let response;

      if (!isProfileCreated) {
        response = await axios.post(API_URL, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setIsProfileCreated(true);
        setMessage("Basic information saved successfully.");
      } else {
        response = await axios.put(API_URL, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setMessage("Basic information updated successfully.");
      }

      const profile = response.data.profile;

      if (profile) {
        setFormData({
          fullName: profile.fullName || "",
          email: profile.email || "",
          phone: profile.phone || "",
          location: {
            city: profile.location?.city || "",
            state: profile.location?.state || "",
            country: profile.location?.country || "",
          },
          headline: profile.headline || "",
          dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split("T")[0] : "",
          gender: profile.gender || "",
        });
      }

      // UPLOAD PROFILE PHOTO
      if (profilePhoto) {
        const photoData = new FormData();
        photoData.append("profilePhoto", profilePhoto);

        const photoResponse = await axios.post(`${API_URL}/photo`, photoData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });

        const uploadedPhoto = photoResponse.data.profilePhoto;

        if (uploadedPhoto) {
          const photoPath = uploadedPhoto.startsWith("http")
            ? uploadedPhoto
            : `${SERVER_URL}${uploadedPhoto}`;
          setPhotoPreview(photoPath);
        }

        setProfilePhoto(null);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save information");
    }
  };

  return (
    <div className="basic-information">
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <form className="basic-information-form" onSubmit={handleSubmit} autoComplete="off">
        {/* PROFILE PHOTO */}
        <div className="profile-photo-section">
          <div className="profile-photo">
            {photoPreview ? <img src={photoPreview} alt="Profile" /> : <FiCamera />}
          </div>

          <div className="photo-content">
            <h3>Profile Photo</h3>
            <span>Upload a PNG image for your profile.</span>

            <label htmlFor="profilePhoto" className="upload-photo-btn">
              <FiCamera />
              Choose Photo
            </label>

            <input
              type="file"
              id="profilePhoto"
              name="profilePhoto"
              accept=".png,image/png"
              onChange={handlePhotoChange}
              hidden
            />
          </div>
        </div>

        {/* FULL NAME + EMAIL */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="fullName"><FiUser /> Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email"><FiMail /> Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* PHONE + HEADLINE */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="phone"><FiPhone /> Phone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="headline"><FiTag /> Headline / Title</label>
            <input
              type="text"
              id="headline"
              name="headline"
              placeholder="e.g. Frontend Developer | React & Node"
              value={formData.headline}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* LOCATION */}
        <div className="location-section">
          <h3><FiMapPin /> Location</h3>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input type="text" id="city" name="city" placeholder="Enter city" value={formData.location.city} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label htmlFor="state">State</label>
              <input type="text" id="state" name="state" placeholder="Enter state" value={formData.location.state} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label htmlFor="country">Country</label>
              <input type="text" id="country" name="country" placeholder="Enter country" value={formData.location.country} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* DATE OF BIRTH + GENDER */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="dateOfBirth"><FiCalendar /> Date of Birth</label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="gender"><FiUsers /> Gender</label>
            <select id="gender" name="gender" value={formData.gender} onChange={handleChange}>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="form-actions">
          <button type="submit" className="save-profile-btn">
            <FiSave />
            {isProfileCreated ? "Update Information" : "Save Information"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BasicInformation;
import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiUser, FiMail, FiBriefcase, FiMapPin, FiGlobe, FiLinkedin, FiEdit, FiSave, FiTrash2, FiX, FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/context/AuthContext";
import Swal from "sweetalert2";
import "./RecruiterProfile.css";

const API_URL = "http://localhost:5000/api/recruiter-profile";
const SERVER_URL = "http://localhost:5000";

const RecruiterProfile = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    phone: "",
    profilePhoto: null,
    jobTitle: "",
    about: "",
    companyName: "",
    companyLogo: null,
    companyWebsite: "",
    industry: "",
    companySize: "",
    companyDescription: "",
    city: "",
    state: "",
    country: "",
    linkedinUrl: "",
    websiteUrl: "",
  });
  const [profilePhotoPreview, setProfilePhotoPreview] = useState("");
  const [companyLogoPreview, setCompanyLogoPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`${API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } });
      const data = response.data.profile;
      setProfile(data);
      setFormData({
        phone: data.phone || "",
        profilePhoto: null,
        jobTitle: data.jobTitle || "",
        about: data.about || "",
        companyName: data.companyName || "",
        companyLogo: null,
        companyWebsite: data.companyWebsite || "",
        industry: data.industry || "",
        companySize: data.companySize || "",
        companyDescription: data.companyDescription || "",
        city: data.location?.city || "",
        state: data.location?.state || "",
        country: data.location?.country || "",
        linkedinUrl: data.linkedinUrl || "",
        websiteUrl: data.websiteUrl || "",
      });
      setProfilePhotoPreview(data.profilePhoto ? `${SERVER_URL}${data.profilePhoto}` : "");
      setCompanyLogoPreview(data.companyLogo ? `${SERVER_URL}${data.companyLogo}` : "");
    } catch (error) {
      console.error(error);
      if (error.response?.status === 404) {
        setProfile(null);
        setProfilePhotoPreview("");
        setCompanyLogoPreview("");
      } else {
        setError(error.response?.data?.message || "Failed to fetch recruiter profile");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchProfile();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormData((prev) => ({ ...prev, profilePhoto: file }));
    setProfilePhotoPreview(URL.createObjectURL(file));
  };

  const handleCompanyLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormData((prev) => ({ ...prev, companyLogo: file }));
    setCompanyLogoPreview(URL.createObjectURL(file));
  };

  const buildFormData = () => {
    const data = new FormData();
    data.append("phone", formData.phone);
    data.append("jobTitle", formData.jobTitle);
    data.append("about", formData.about);
    data.append("companyName", formData.companyName);
    data.append("companyWebsite", formData.companyWebsite);
    data.append("industry", formData.industry);
    data.append("companySize", formData.companySize);
    data.append("companyDescription", formData.companyDescription);
    data.append("location", JSON.stringify({ city: formData.city, state: formData.state, country: formData.country }));
    data.append("linkedinUrl", formData.linkedinUrl);
    data.append("websiteUrl", formData.websiteUrl);
    if (formData.profilePhoto instanceof File) data.append("profilePhoto", formData.profilePhoto);
    if (formData.companyLogo instanceof File) data.append("companyLogo", formData.companyLogo);
    return data;
  };

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      const data = buildFormData();
      const response = await axios.post(API_URL, data, { headers: { Authorization: `Bearer ${token}` } });
      setProfile(response.data.profile);
      setEditing(false);
      await fetchProfile();
      Swal.fire({ position: "top-end", icon: "success", title: "Your profile has been saved", showConfirmButton: false, timer: 1500 });
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.message || "Failed to create recruiter profile");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      const data = buildFormData();
      const response = await axios.put(API_URL, data, { headers: { Authorization: `Bearer ${token}` } });
      setProfile(response.data.profile);
      setEditing(false);
      await fetchProfile();
      Swal.fire({ position: "top-end", icon: "success", title: "Your work has been saved", showConfirmButton: false, timer: 1500 });
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.message || "Failed to update recruiter profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProfile = async () => {
    const confirmed = window.confirm("Are you sure you want to delete your recruiter profile?");
    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");
      await axios.delete(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      setProfile(null);
      setFormData({
        phone: "",
        profilePhoto: null,
        jobTitle: "",
        about: "",
        companyName: "",
        companyLogo: null,
        companyWebsite: "",
        industry: "",
        companySize: "",
        companyDescription: "",
        city: "",
        state: "",
        country: "",
        linkedinUrl: "",
        websiteUrl: "",
      });
      setProfilePhotoPreview("");
      setCompanyLogoPreview("");
      Swal.fire({ position: "top-end", icon: "success", title: "Profile deleted successfully", showConfirmButton: false, timer: 1500 });
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.message || "Failed to delete recruiter profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        phone: profile.phone || "",
        profilePhoto: null,
        jobTitle: profile.jobTitle || "",
        about: profile.about || "",
        companyName: profile.companyName || "",
        companyLogo: null,
        companyWebsite: profile.companyWebsite || "",
        industry: profile.industry || "",
        companySize: profile.companySize || "",
        companyDescription: profile.companyDescription || "",
        city: profile.location?.city || "",
        state: profile.location?.state || "",
        country: profile.location?.country || "",
        linkedinUrl: profile.linkedinUrl || "",
        websiteUrl: profile.websiteUrl || "",
      });
      setProfilePhotoPreview(profile.profilePhoto ? `${SERVER_URL}${profile.profilePhoto}` : "");
      setCompanyLogoPreview(profile.companyLogo ? `${SERVER_URL}${profile.companyLogo}` : "");
    }
    setEditing(false);
    setError("");
  };

  if (loading) {
    return (
      <div className="recruiter-profile">
        <div className="recruiter-profile-loading">
          <FiUser />
          <p>Loading recruiter profile...</p>
        </div>
      </div>
    );
  }

  if (!profile || editing) {
    return (
      <div className="recruiter-profile">
        <div className="recruiter-profile-header">
          <button type="button" className="recruiter-profile-back-btn" onClick={() => navigate("/recruiter")}>
            <FiArrowLeft />
            Dashboard
          </button>
          <div>
            <h1>Profile</h1>
            <p>Manage your recruiter and company information.</p>
          </div>
        </div>

        {error && <div className="recruiter-profile-error">{error}</div>}

        <form className="recruiter-profile-form" onSubmit={profile ? handleUpdateProfile : handleCreateProfile}>
          <div className="recruiter-profile-card">
            <div className="recruiter-profile-card-header recruiter-personal-header">
              <div className="recruiter-profile-photo-preview">
                {profilePhotoPreview ? <img src={profilePhotoPreview} alt="Profile" /> : <FiUser />}
              </div>
              <div>
                <h2>Personal Information</h2>
                <p>Your basic recruiter information.</p>
              </div>
            </div>

            <div className="recruiter-profile-grid">
              <div className="recruiter-profile-group">
                <label>Full Name</label>
                <input type="text" value={profile?.fullName || user?.name || ""} readOnly />
              </div>
              <div className="recruiter-profile-group">
                <label>Email</label>
                <input type="email" value={profile?.email || user?.email || ""} readOnly />
              </div>
              <div className="recruiter-profile-group">
                <label>Phone</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="Enter phone number" />
              </div>
              <div className="recruiter-profile-group">
                <label>Profile Photo</label>
                <div className="recruiter-photo-upload-group">
                  <input type="file" name="profilePhoto" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleProfilePhotoChange} />
                  {profilePhotoPreview && (
                    <div className="recruiter-upload-preview">
                      <img src={profilePhotoPreview} alt="Profile Preview" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="recruiter-profile-card">
            <div className="recruiter-profile-card-header">
              <div>
                <h2>Information</h2>
                <p>Add your professional information.</p>
              </div>
            </div>

            <div className="recruiter-profile-grid">
              <div className="recruiter-profile-group full-width">
                <label>Job Title</label>
                <input type="text" name="jobTitle" value={formData.jobTitle} onChange={handleChange} placeholder="e.g. Senior HR Manager" />
              </div>
              <div className="recruiter-profile-group full-width">
                <label>About</label>
                <textarea name="about" value={formData.about} onChange={handleChange} rows="5" placeholder="Tell candidates about yourself..." />
              </div>
            </div>
          </div>

          <div className="recruiter-profile-card">
            <div className="recruiter-profile-card-header recruiter-company-header">
              <div className="recruiter-company-logo-preview">
                {companyLogoPreview ? <img src={companyLogoPreview} alt="Company Logo" /> : <FiBriefcase />}
              </div>
              <div>
                <h2>Company Information</h2>
                <p>Add your company details.</p>
              </div>
            </div>

            <div className="recruiter-profile-grid">
              <div className="recruiter-profile-group">
                <label>Company Name</label>
                <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Company name" required />
              </div>
              <div className="recruiter-profile-group">
                <label>Industry</label>
                <input type="text" name="industry" value={formData.industry} onChange={handleChange} placeholder="e.g. Information Technology" />
              </div>
              <div className="recruiter-profile-group">
                <label>Company Size</label>
                <select name="companySize" value={formData.companySize} onChange={handleChange}>
                  <option value="">Select company size</option>
                  <option value="1-10">1-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-500">201-500</option>
                  <option value="501-1000">501-1000</option>
                  <option value="1001-5000">1001-5000</option>
                  <option value="5000+">5000+</option>
                </select>
              </div>
              <div className="recruiter-profile-group">
                <label>Company Logo</label>
                <div className="recruiter-logo-upload-group">
                  <input type="file" name="companyLogo" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleCompanyLogoChange} />
                  {companyLogoPreview && (
                    <div className="recruiter-company-upload-preview">
                      <img src={companyLogoPreview} alt="Company Logo Preview" />
                    </div>
                  )}
                </div>
              </div>
              <div className="recruiter-profile-group">
                <label>Company Website</label>
                <input type="text" name="companyWebsite" value={formData.companyWebsite} onChange={handleChange} placeholder="https://company.com" />
              </div>
              <div className="recruiter-profile-group full-width">
                <label>Company Description</label>
                <textarea name="companyDescription" value={formData.companyDescription} onChange={handleChange} rows="5" placeholder="Describe your company..." />
              </div>
            </div>
          </div>

          <div className="recruiter-profile-card">
            <div className="recruiter-profile-card-header">
              <div>
                <h2>Location</h2>
                <p>Add your company location.</p>
              </div>
            </div>

            <div className="recruiter-profile-grid">
              <div className="recruiter-profile-group">
                <label>City</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Coimbatore" />
              </div>
              <div className="recruiter-profile-group">
                <label>State</label>
                <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="Tamil Nadu" />
              </div>
              <div className="recruiter-profile-group">
                <label>Country</label>
                <input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="India" />
              </div>
            </div>
          </div>

          <div className="recruiter-profile-card">
            <div className="recruiter-profile-card-header">
              <div>
                <h2>Social & Web Links</h2>
                <p>Add your professional links.</p>
              </div>
            </div>

            <div className="recruiter-profile-grid">
              <div className="recruiter-profile-group">
                <label>LinkedIn URL</label>
                <div className="recruiter-profile-input-icon">
                  <FiLinkedin />
                  <input type="text" name="linkedinUrl" value={formData.linkedinUrl} onChange={handleChange} placeholder="https://linkedin.com/in/..." />
                </div>
              </div>
              <div className="recruiter-profile-group">
                <label>Website URL</label>
                <div className="recruiter-profile-input-icon">
                  <FiGlobe />
                  <input type="text" name="websiteUrl" value={formData.websiteUrl} onChange={handleChange} placeholder="https://..." />
                </div>
              </div>
            </div>
          </div>

          <div className="recruiter-profile-actions">
            {profile && (
              <button type="button" className="recruiter-profile-cancel-btn" onClick={handleCancel} disabled={saving}>
                <FiX />
                Cancel
              </button>
            )}
            <button type="submit" className="recruiter-profile-save-btn" disabled={saving}>
              <FiSave />
              {saving ? "Saving..." : profile ? "Save Changes" : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="recruiter-profile">
      <div className="recruiter-profile-header">
        <button type="button" className="recruiter-profile-back-btn" onClick={() => navigate("/recruiter")}>
          <FiArrowLeft />
          Dashboard
        </button>
        <div>
          <h1>Profile</h1>
          <p>Manage your recruiter and company information.</p>
        </div>
        <div className="recruiter-profile-header-actions">
          <button type="button" className="recruiter-profile-edit-btn" onClick={() => { setEditing(true); setError(""); }}>
            <FiEdit />
            Edit Profile
          </button>
          <button type="button" className="recruiter-profile-delete-btn" onClick={handleDeleteProfile} disabled={saving}>
            <FiTrash2 />
            Delete
          </button>
        </div>
      </div>

      {error && <div className="recruiter-profile-error">{error}</div>}

      <div className="recruiter-profile-hero">
        <div className="recruiter-profile-avatar">
          {profile.profilePhoto ? <img src={`${SERVER_URL}${profile.profilePhoto}`} alt={profile.fullName} /> : <FiUser />}
        </div>
        <div className="recruiter-profile-hero-content">
          <h1>{profile.fullName}</h1>
          <p>{profile.jobTitle || "Recruiter"}</p>
          <span>
            <FiMail />
            {profile.email}
          </span>
        </div>
      </div>

      <div className="recruiter-profile-view-grid">
        <div className="recruiter-profile-card">
          <div className="recruiter-profile-card-header recruiter-personal-header">
            <div className="recruiter-profile-photo-preview">
              {profile.profilePhoto ? <img src={`${SERVER_URL}${profile.profilePhoto}`} alt={profile.fullName} /> : <FiUser />}
            </div>
            <div>
              <h2>Personal Information</h2>
              {/* <p>Your recruiter information.</p> */}
            </div>
          </div>

          <div className="recruiter-profile-view-list">
            <div>
              <span>Full Name</span>
              <strong>{profile.fullName}</strong>
            </div>
            <div>
              <span>Job Title</span>
              <strong>{profile.jobTitle || "Not provided"}</strong>
            </div>
            <div>
              <span>Phone</span>
              <strong>{profile.phone || "Not provided"}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{profile.email}</strong>
            </div>
          </div>

          {profile.about && (
            <div className="recruiter-profile-about">
              <span>About</span>
              <p>{profile.about}</p>
            </div>
          )}
        </div>

        <div className="recruiter-profile-card">
          <div className="recruiter-profile-card-header recruiter-company-header">
            <div className="recruiter-company-logo-preview">
              {profile.companyLogo ? <img src={`${SERVER_URL}${profile.companyLogo}`} alt={profile.companyName} /> : <FiBriefcase />}
            </div>
            <div>
              <h2>Company Information</h2>
              {/* <p>Your company details.</p> */}
            </div>
          </div>

          <div className="recruiter-profile-view-list">
            <div>
              <span>Company</span>
              <strong>{profile.companyName}</strong>
            </div>
            <div>
              <span>Industry</span>
              <strong>{profile.industry || "Not provided"}</strong>
            </div>
            <div>
              <span>Company Size</span>
              <strong>{profile.companySize || "Not provided"}</strong>
            </div>
            <div>
              <span>Website</span>
              <strong>{profile.companyWebsite || "Not provided"}</strong>
            </div>
          </div>

          {profile.companyDescription && (
            <div className="recruiter-profile-about">
              <span>Company Description</span>
              <p>{profile.companyDescription}</p>
            </div>
          )}
        </div>

        <div className="recruiter-profile-card">
          <div className="recruiter-profile-card-header">
            <div>
              <h2>Location</h2>
              <p>Company location.</p>
            </div>
            <FiMapPin />
          </div>

          <div className="recruiter-profile-location">
            <FiMapPin />
            <span>
              {[profile.location?.city, profile.location?.state, profile.location?.country].filter(Boolean).join(", ") || "Location not provided"}
            </span>
          </div>
        </div>

        <div className="recruiter-profile-card">
          <div className="recruiter-profile-card-header">
            <div>
              <h2>Professional Links</h2>
              {/* <p>Your professional websites.</p> */}
            </div>
            <FiGlobe />
          </div>

          <div className="recruiter-profile-links">
            {profile.linkedinUrl && (
              <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer">
                <FiLinkedin />
                LinkedIn
              </a>
            )}
            {profile.websiteUrl && (
              <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer">
                <FiGlobe />
                Website
              </a>
            )}
            {!profile.linkedinUrl && !profile.websiteUrl && <p>No professional links added.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterProfile;
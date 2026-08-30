import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiBriefcase,
  FiFileText,
  FiMapPin,
  FiDollarSign,
  FiCalendar,
  FiUsers,
  FiArrowLeft,
  FiSave,
} from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../components/context/AuthContext";
import "./RecruiterEditJob.css";

const API_URL =
  `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/jobs`;

const RecruiterEditJob = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    companyName: "",
    description: "",
    requirements: "",
    skills: "",
    city: "",
    state: "",
    country: "",
    employmentType: "Full-time",
    workMode: "On-site",
    experienceMin: 0,
    experienceMax: 0,
    salaryMin: "",
    salaryMax: "",
    salaryType: "Per Year",
    vacancies: 1,
    category: "",
    applicationDeadline: "",
    status: "Open",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch job
  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await axios.get(`${API_URL}/${jobId}`);
        const job = response.data.job;

        setFormData({
          title: job.title || "",
          companyName: job.companyName || "",
          description: job.description || "",
          requirements: job.requirements || "",
          skills: Array.isArray(job.skills) ? job.skills.join(", ") : "",
          city: job.location?.city || "",
          state: job.location?.state || "",
          country: job.location?.country || "",
          employmentType: job.employmentType || "Full-time",
          workMode: job.workMode || "On-site",
          experienceMin: job.experienceMin ?? 0,
          experienceMax: job.experienceMax ?? 0,
          salaryMin: job.salaryMin ?? "",
          salaryMax: job.salaryMax ?? "",
          salaryType: job.salaryType || "Per Year",
          vacancies: job.vacancies ?? 1,
          category: job.category || "",
          applicationDeadline: job.applicationDeadline
            ? new Date(job.applicationDeadline).toISOString().split("T")[0]
            : "",
          status: job.status || "Open",
        });
      } catch (error) {
        console.error(error);
        setError(error.response?.data?.message || "Failed to fetch job details");
      } finally {
        setLoading(false);
      }
    };

    if (jobId) fetchJob();
  }, [jobId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("You are not authenticated. Please login again.");
      return;
    }

    try {
      setSaving(true);

      const jobData = {
        title: formData.title.trim(),
        companyName: formData.companyName.trim(),
        description: formData.description.trim(),
        requirements: formData.requirements.trim(),
        skills: formData.skills.split(",").map((skill) => skill.trim()).filter(Boolean),
        location: {
          city: formData.city.trim(),
          state: formData.state.trim(),
          country: formData.country.trim(),
        },
        employmentType: formData.employmentType,
        workMode: formData.workMode,
        experienceMin: Number(formData.experienceMin),
        experienceMax: Number(formData.experienceMax),
        salaryMin: formData.salaryMin === "" ? undefined : Number(formData.salaryMin),
        salaryMax: formData.salaryMax === "" ? undefined : Number(formData.salaryMax),
        salaryType: formData.salaryType,
        vacancies: Number(formData.vacancies),
        category: formData.category.trim(),
        applicationDeadline: formData.applicationDeadline,
        status: formData.status,
      };

      const response = await axios.put(`${API_URL}/${jobId}`, jobData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setSuccess(response.data.message || "Job updated successfully");

      setTimeout(() => {
        navigate(`/recruiter/my-jobs/${jobId}`);
      }, 1000);
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.message || "Failed to update job");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/recruiter/my-jobs/${jobId}`);
  };

  if (loading) {
    return (
      <div className="recruiter-edit-job">
        <div className="recruiter-edit-job-loading">
          <FiBriefcase />
          <p>Loading job details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recruiter-edit-job">
      {/* HEADER */}
      <div className="recruiter-edit-job-header">
        <div>
          <button type="button" className="recruiter-edit-back-btn" onClick={handleCancel}>
            <FiArrowLeft />
            Back to Job
          </button>
          <h1>Edit Job</h1>
          <p>Update your job posting details.</p>
        </div>
      </div>

      {error && <div className="recruiter-edit-form-error">{error}</div>}
      {success && <div className="recruiter-edit-form-success">{success}</div>}

      <form className="recruiter-edit-job-form" onSubmit={handleSubmit}>
        {/* BASIC INFORMATION */}
        <div className="recruiter-edit-form-card">
          <div className="recruiter-edit-card-header">
            <div className="recruiter-edit-section-icon">
              <FiBriefcase />
            </div>
            <div>
              <h2>Basic Information</h2>
              <p>Update the basic job information.</p>
            </div>
          </div>

          <div className="recruiter-edit-form-grid">
            <div className="recruiter-edit-form-group full-width">
              <label>
                Job Title<span>*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. MERN Stack Developer"
                required
              />
            </div>

            <div className="recruiter-edit-form-group">
              <label>
                Company Name<span>*</span>
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Company name"
                required
              />
            </div>

            <div className="recruiter-edit-form-group">
              <label>
                Category<span>*</span>
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g. Software Development"
                required
              />
            </div>
          </div>
        </div>

        {/* JOB DETAILS */}
        <div className="recruiter-edit-form-card">
          <div className="recruiter-edit-card-header">
            <div className="recruiter-edit-section-icon">
              <FiFileText />
            </div>
            <div>
              <h2>Job Details</h2>
              <p>Update description and requirements.</p>
            </div>
          </div>

          <div className="recruiter-edit-form-group">
            <label>
              Job Description<span>*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the role and responsibilities..."
              rows="6"
              required
            />
          </div>

          <div className="recruiter-edit-form-group">
            <label>Requirements</label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              placeholder="Mention candidate requirements..."
              rows="5"
            />
          </div>

          <div className="recruiter-edit-form-group">
            <label>Skills</label>
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="React, Node.js, MongoDB"
            />
            <small>Separate skills using commas.</small>
          </div>
        </div>

        {/* LOCATION */}
        <div className="recruiter-edit-form-card">
          <div className="recruiter-edit-card-header">
            <div className="recruiter-edit-section-icon">
              <FiMapPin />
            </div>
            <div>
              <h2>Location</h2>
              <p>Update the job location.</p>
            </div>
          </div>

          <div className="recruiter-edit-form-grid">
            <div className="recruiter-edit-form-group">
              <label>City</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Coimbatore" />
            </div>

            <div className="recruiter-edit-form-group">
              <label>State</label>
              <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="Tamil Nadu" />
            </div>

            <div className="recruiter-edit-form-group">
              <label>Country</label>
              <input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="India" />
            </div>
          </div>
        </div>

        {/* EMPLOYMENT DETAILS */}
        <div className="recruiter-edit-form-card">
          <div className="recruiter-edit-card-header">
            <div className="recruiter-edit-section-icon">
              <FiUsers />
            </div>
            <div>
              <h2>Employment Details</h2>
              <p>Update employment and experience.</p>
            </div>
          </div>

          <div className="recruiter-edit-form-grid">
            <div className="recruiter-edit-form-group">
              <label>
                Employment Type<span>*</span>
              </label>
              <select name="employmentType" value={formData.employmentType} onChange={handleChange} required>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>

            <div className="recruiter-edit-form-group">
              <label>
                Work Mode<span>*</span>
              </label>
              <select name="workMode" value={formData.workMode} onChange={handleChange} required>
                <option value="On-site">On-site</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            <div className="recruiter-edit-form-group">
              <label>Minimum Experience</label>
              <input type="number" name="experienceMin" min="0" value={formData.experienceMin} onChange={handleChange} />
            </div>

            <div className="recruiter-edit-form-group">
              <label>Maximum Experience</label>
              <input type="number" name="experienceMax" min="0" value={formData.experienceMax} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* SALARY */}
        <div className="recruiter-edit-form-card">
          <div className="recruiter-edit-card-header">
            <div className="recruiter-edit-section-icon">
              <FiDollarSign />
            </div>
            <div>
              <h2>Salary</h2>
              <p>Update the salary information.</p>
            </div>
          </div>

          <div className="recruiter-edit-form-grid">
            <div className="recruiter-edit-form-group">
              <label>Minimum Salary</label>
              <input
                type="number"
                name="salaryMin"
                min="0"
                value={formData.salaryMin}
                onChange={handleChange}
                placeholder="e.g. 300000"
              />
            </div>

            <div className="recruiter-edit-form-group">
              <label>Maximum Salary</label>
              <input
                type="number"
                name="salaryMax"
                min="0"
                value={formData.salaryMax}
                onChange={handleChange}
                placeholder="e.g. 600000"
              />
            </div>

            <div className="recruiter-edit-form-group">
              <label>Salary Type</label>
              <select name="salaryType" value={formData.salaryType} onChange={handleChange}>
                <option value="Per Year">Per Year</option>
                <option value="Per Month">Per Month</option>
                <option value="Per Hour">Per Hour</option>
              </select>
            </div>

            <div className="recruiter-edit-form-group">
              <label>
                Vacancies<span>*</span>
              </label>
              <input type="number" name="vacancies" min="1" value={formData.vacancies} onChange={handleChange} required />
            </div>
          </div>
        </div>

        {/* APPLICATION SETTINGS */}
        <div className="recruiter-edit-form-card">
          <div className="recruiter-edit-card-header">
            <div className="recruiter-edit-section-icon">
              <FiCalendar />
            </div>
            <div>
              <h2>Application Settings</h2>
              <p>Update deadline and job status.</p>
            </div>
          </div>

          <div className="recruiter-edit-form-grid">
            <div className="recruiter-edit-form-group">
              <label>
                Application Deadline<span>*</span>
              </label>
              <input
                type="date"
                name="applicationDeadline"
                value={formData.applicationDeadline}
                onChange={handleChange}
                required
              />
            </div>

            <div className="recruiter-edit-form-group">
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="Open">Open</option>
                <option value="Draft">Draft</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="recruiter-edit-form-actions">
          <button type="button" className="recruiter-edit-cancel-btn" onClick={handleCancel} disabled={saving}>
            Cancel
          </button>

          <button type="submit" className="recruiter-edit-save-btn" disabled={saving}>
            {saving ? (
              "Saving..."
            ) : (
              <>
                <FiSave />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecruiterEditJob;
import React, { useState } from "react";
import axios from "axios";
import { FiBriefcase, FiFileText, FiMapPin, FiDollarSign, FiCalendar, FiUsers, FiArrowLeft, FiSave } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/context/AuthContext";
import Swal from "sweetalert2";
import "./RecruiterPostJob.css";

const API_URL = "http://localhost:5000/api/jobs";

const RecruiterPostJob = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    title: "", companyName: "", description: "", requirements: "", skills: "",
    city: "", state: "", country: "",
    employmentType: "Full-time", workMode: "On-site",
    experienceMin: 0, experienceMax: 0,
    salaryMin: "", salaryMax: "", salaryType: "Per Year",
    vacancies: 1, category: "",
    applicationDeadline: "",
    status: "Open",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("You are not authenticated. Please login again.");
      return;
    }

    try {
      setLoading(true);

      const jobData = {
        title: formData.title.trim(),
        companyName: formData.companyName.trim(),
        description: formData.description.trim(),
        requirements: formData.requirements.trim(),
        skills: formData.skills.split(",").map((skill) => skill.trim()).filter(Boolean),
        location: { city: formData.city.trim(), state: formData.state.trim(), country: formData.country.trim() },
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

      const response = await axios.post(API_URL, jobData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      await Swal.fire({
        position: "top-end",
        icon: "success",
        title: "Job created successfully",
        showConfirmButton: false,
        timer: 1500,
      });

      navigate("/recruiter/my-jobs");
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.message || "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => navigate("/recruiter");

  return (
    <div className="recruiter-post-job">
      <div className="recruiter-post-job-header">
        <div>
          <button type="button" className="recruiter-back-btn" onClick={handleCancel}>
            <FiArrowLeft />
            Back
          </button>
          <h1>Post a Job</h1>
          <p>Create a new job opportunity and find the right candidates.</p>
        </div>
      </div>

      {error && <div className="recruiter-form-error">{error}</div>}

      <form className="recruiter-job-form" onSubmit={handleSubmit}>
        <div className="recruiter-form-card">
          <div className="recruiter-form-card-header">
            <div className="recruiter-form-section-icon"><FiBriefcase /></div>
            <div>
              <h2>Basic Information</h2>
              <p>Provide the basic details about the job.</p>
            </div>
          </div>

          <div className="recruiter-form-grid">
            <div className="recruiter-form-group full-width">
              <label>Job Title<span>*</span></label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. MERN Stack Developer" required />
            </div>

            <div className="recruiter-form-group">
              <label>Company Name<span>*</span></label>
              <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="e.g. HireHub Technologies" required />
            </div>

            <div className="recruiter-form-group">
              <label>Category<span>*</span></label>
              <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="e.g. Software Development" required />
            </div>
          </div>
        </div>

        <div className="recruiter-form-card">
          <div className="recruiter-form-card-header">
            <div className="recruiter-form-section-icon"><FiFileText /></div>
            <div>
              <h2>Job Details</h2>
              <p>Describe the job and candidate requirements.</p>
            </div>
          </div>

          <div className="recruiter-form-group">
            <label>Job Description<span>*</span></label>
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Describe the role, responsibilities and expectations..." rows="6" required />
          </div>

          <div className="recruiter-form-group">
            <label>Requirements</label>
            <textarea name="requirements" value={formData.requirements} onChange={handleChange} placeholder="Mention education, experience and other requirements..." rows="5" />
          </div>

          <div className="recruiter-form-group">
            <label>Skills</label>
            <input type="text" name="skills" value={formData.skills} onChange={handleChange} placeholder="React, Node.js, MongoDB, Express.js" />
            <small>Separate skills using commas.</small>
          </div>
        </div>

        <div className="recruiter-form-card">
          <div className="recruiter-form-card-header">
            <div className="recruiter-form-section-icon"><FiMapPin /></div>
            <div>
              <h2>Location</h2>
              <p>Where will the candidate work?</p>
            </div>
          </div>

          <div className="recruiter-form-grid">
            <div className="recruiter-form-group">
              <label>City</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="e.g. Coimbatore" />
            </div>

            <div className="recruiter-form-group">
              <label>State</label>
              <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="e.g. Tamil Nadu" />
            </div>

            <div className="recruiter-form-group">
              <label>Country</label>
              <input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="e.g. India" />
            </div>
          </div>
        </div>

        <div className="recruiter-form-card">
          <div className="recruiter-form-card-header">
            <div className="recruiter-form-section-icon"><FiUsers /></div>
            <div>
              <h2>Employment Details</h2>
              <p>Define the type and experience required.</p>
            </div>
          </div>

          <div className="recruiter-form-grid">
            <div className="recruiter-form-group">
              <label>Employment Type<span>*</span></label>
              <select name="employmentType" value={formData.employmentType} onChange={handleChange} required>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>

            <div className="recruiter-form-group">
              <label>Work Mode<span>*</span></label>
              <select name="workMode" value={formData.workMode} onChange={handleChange} required>
                <option value="On-site">On-site</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            <div className="recruiter-form-group">
              <label>Minimum Experience</label>
              <input type="number" name="experienceMin" min="0" value={formData.experienceMin} onChange={handleChange} />
            </div>

            <div className="recruiter-form-group">
              <label>Maximum Experience</label>
              <input type="number" name="experienceMax" min="0" value={formData.experienceMax} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="recruiter-form-card">
          <div className="recruiter-form-card-header">
            <div className="recruiter-form-section-icon"><FiDollarSign /></div>
            <div>
              <h2>Salary</h2>
              <p>Add the salary range for this position.</p>
            </div>
          </div>

          <div className="recruiter-form-grid">
            <div className="recruiter-form-group">
              <label>Minimum Salary</label>
              <input type="number" name="salaryMin" min="0" value={formData.salaryMin} onChange={handleChange} placeholder="e.g. 300000" />
            </div>

            <div className="recruiter-form-group">
              <label>Maximum Salary</label>
              <input type="number" name="salaryMax" min="0" value={formData.salaryMax} onChange={handleChange} placeholder="e.g. 600000" />
            </div>

            <div className="recruiter-form-group">
              <label>Salary Type</label>
              <select name="salaryType" value={formData.salaryType} onChange={handleChange}>
                <option value="Per Year">Per Year</option>
                <option value="Per Month">Per Month</option>
                <option value="Per Hour">Per Hour</option>
              </select>
            </div>

            <div className="recruiter-form-group">
              <label>Vacancies<span>*</span></label>
              <input type="number" name="vacancies" min="1" value={formData.vacancies} onChange={handleChange} required />
            </div>
          </div>
        </div>

        <div className="recruiter-form-card">
          <div className="recruiter-form-card-header">
            <div className="recruiter-form-section-icon"><FiCalendar /></div>
            <div>
              <h2>Application Settings</h2>
              <p>Set the application deadline and job status.</p>
            </div>
          </div>

          <div className="recruiter-form-grid">
            <div className="recruiter-form-group">
              <label>Application Deadline<span>*</span></label>
              <input type="date" name="applicationDeadline" value={formData.applicationDeadline} onChange={handleChange} required />
            </div>

            <div className="recruiter-form-group">
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="Open">Open</option>
                <option value="Draft">Draft</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="recruiter-form-actions">
          <button type="button" className="recruiter-cancel-btn" onClick={handleCancel} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="recruiter-submit-btn" disabled={loading}>
            {loading ? "Creating..." : (
              <>
                <FiSave />
                Create Job
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecruiterPostJob;
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiUser, FiMail, FiLock, FiBriefcase } from "react-icons/fi";
import Swal from "sweetalert2";
import "./Register.css";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "candidate" });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (!formData.role) newErrors.role = "Please select a role";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000";

      const response = await axios.post(
        `${API_URL}/api/auth/register`,
        formData
      );
      await Swal.fire({ title: "Registration Successful!", text: `Welcome to HireHub, ${formData.name}!`, icon: "success", confirmButtonText: "Go to Login" });
      navigate("/login");
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed";
      setErrors({ email: message });
      Swal.fire({ title: "Registration Failed", text: message, icon: "error", confirmButtonText: "Try Again" });
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-header">
          <h1>Create Your HireHub Account</h1>
          <span>Join HireHub and find your next opportunity</span>
        </div>
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="register-form-group">
            <label htmlFor="name">Full Name</label>
            <div className="register-input-group">
              <FiUser className="register-input-icon" />
              <input type="text" id="name" name="name" placeholder="Enter your full name" value={formData.name} onChange={handleChange} />
            </div>
            {errors.name && <span className="register-field-error">{errors.name}</span>}
          </div>
          <div className="register-form-group">
            <label htmlFor="email">Email</label>
            <div className="register-input-group">
              <FiMail className="register-input-icon" />
              <input type="email" id="email" name="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} />
            </div>
            {errors.email && <span className="register-field-error">{errors.email}</span>}
          </div>
          <div className="register-form-group">
            <label htmlFor="password">Password</label>
            <div className="register-input-group">
              <FiLock className="register-input-icon" />
              <input type="password" id="password" name="password" placeholder="Create a password" value={formData.password} onChange={handleChange} />
            </div>
            {errors.password && <span className="register-field-error">{errors.password}</span>}
          </div>
          <div className="register-form-group">
            <label htmlFor="role">I am a</label>
            <div className="register-input-group">
              <FiBriefcase className="register-input-icon" />
              <select id="role" name="role" value={formData.role} onChange={handleChange}>
                <option value="candidate">Candidate</option>
                <option value="recruiter">Recruiter</option>
              </select>
            </div>
            {errors.role && <span className="register-field-error">{errors.role}</span>}
          </div>
          <button type="submit" className="register-submit">Register</button>
        </form>
        <div className="register-login-link">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiMail, FiLock } from "react-icons/fi";
import Swal from "sweetalert2";
import { useAuth } from "../components/context/AuthContext";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "Email is required";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000";

      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        formData
      );
      const { token, user } = response.data;
      login(token, user);

      await Swal.fire({
        title: "Login Successful!",
        text: `Welcome back, ${user.name}!`,
        icon: "success", confirmButtonText: "Continue"
      });

      if (user.role === "candidate") navigate("/candidate");
      else if (user.role === "recruiter") navigate("/recruiter");
      else if (user.role === "admin") navigate("/admin");
    } catch (error) {
      setErrors({ email: error.response?.data?.message || "Invalid email or password" });
      Swal.fire({ title: "Login Failed", text: error.response?.data?.message || "Invalid email or password", icon: "error", confirmButtonText: "Try Again" });
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>Welcome to HireHub</h1>
          <span>Login to continue your job search</span>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="login-form-group">
            <label htmlFor="email">Email</label>
            <div className="login-input-group">
              <FiMail className="login-input-icon" />
              <input type="email" id="email" name="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} />
            </div>
            {errors.email && <span className="login-field-error">{errors.email}</span>}
          </div>

          <div className="login-form-group">
            <label htmlFor="password">Password</label>
            <div className="login-input-group">
              <FiLock className="login-input-icon" />
              <input type="password" id="password" name="password" placeholder="Enter your password" value={formData.password} onChange={handleChange} />
            </div>
            {errors.password && <span className="login-field-error">{errors.password}</span>}
          </div>

          <button type="submit" className="login-submit">Login</button>
        </form>

        <div className="login-register-link">
          Don't have an account? <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
import React from "react";
import { Link } from "react-router-dom";
import { FaSearch, FaUser, FaBriefcase } from "react-icons/fa";
import "./Home.css";

const Home = () => {
  return (
    <div className="home-page">

      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-tag">Find Your Next Opportunity</span>

          <h1>Build Your Career <br /> With HireHub</h1>

          <span className="hero-text">Discover jobs, connect with recruiters, and take the next step in your career.</span>

          <div className="hero-buttons">
            <Link to="/login" className="primary-btn">Find Jobs</Link>
            <Link to="/register" className="secondary-btn">Get Started</Link>
          </div>
        </div>
      </section>

      <section className="features-section">
  <div className="section-heading">
    <h2>Why Choose HireHub?</h2>
    <span>Everything you need to find the right opportunity.</span>
  </div>

  <div className="features-container">
    <div className="feature-card">
      <div className="feature-icon">
        <FaSearch />
      </div>

      <h3>Find Jobs</h3>

      <span>
        Search and discover jobs that match your skills and career goals.
      </span>
    </div>

    <div className="feature-card">
      <div className="feature-icon">
        <FaUser />
      </div>

      <h3>Build Your Profile</h3>

      <span>
        Create a professional profile and showcase your skills, experience,
        and projects.
      </span>
    </div>

    <div className="feature-card">
      <div className="feature-icon">
        <FaBriefcase />
      </div>

      <h3>Connect With Recruiters</h3>

      <span>
        Apply for jobs and connect directly with recruiters.
      </span>
    </div>
  </div>
</section>

      <section className="cta-section">
        <h2>Ready to find your next job?</h2>

        <span>Create your HireHub account and start exploring opportunities today.</span>

        <Link to="/register" className="cta-btn">Create Account</Link>
      </section>

    </div>
  );
};

export default Home;
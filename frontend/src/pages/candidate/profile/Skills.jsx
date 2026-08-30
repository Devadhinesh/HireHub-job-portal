import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiPlus,
  FiTrash2,
  FiSave,
  FiCode,
  FiTrendingUp,
  FiLayers,
  FiZap,
} from "react-icons/fi";
import { useAuth } from "../../../components/context/AuthContext";
import "./Skills.css";

const API_URL =
  `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/candidates/profile`;

const Skills = () => {
  const { token } = useAuth();

  const [skillName, setSkillName] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [skillType, setSkillType] = useState("primary");
  const [skills, setSkills] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // GET SAVED SKILLS
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await axios.get(`${API_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const profile = response.data.profile;
        if (profile) setSkills(profile.skills || []);
      } catch (error) {
        if (error.response?.status !== 404) {
          setError(error.response?.data?.message || "Failed to fetch skills");
        }
      }
    };

    if (token) fetchSkills();
  }, [token]);

  // ADD SKILL
  const handleAddSkill = () => {
    setMessage("");
    setError("");

    if (!skillName.trim()) {
      setError("Skill name is required");
      return;
    }

    if (!skillLevel) {
      setError("Please select proficiency level");
      return;
    }

    const newSkill = { name: skillName.trim(), level: skillLevel, type: skillType };

    setSkills((prev) => [...prev, newSkill]);
    setSkillName("");
    setSkillLevel("");
    setSkillType("primary");
  };

  // DELETE SKILL
  const handleDeleteSkill = async (index) => {
    setMessage("");
    setError("");

    try {
      const updatedSkills = skills.filter((_, skillIndex) => skillIndex !== index);

      const response = await axios.put(API_URL, { skills: updatedSkills }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSkills(response.data.profile?.skills || updatedSkills);
      setMessage("Skill deleted successfully");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to delete skill");
    }
  };

  // SAVE SKILLS
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (skills.length === 0) {
      setError("Please add at least one skill");
      return;
    }

    try {
      const response = await axios.put(API_URL, { skills }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSkills(response.data.profile?.skills || skills);
      setMessage("Skills saved successfully");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save skills");
    }
  };

  return (
    <div className="skills">
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <form className="skills-form" onSubmit={handleSubmit} autoComplete="off">
        {/* ADD SKILL */}
        <div className="skill-input-section">
          <div className="form-group">
            <label htmlFor="skillName"><FiCode /> Skill</label>
            <input
              type="text"
              id="skillName"
              name="skillName"
              placeholder="e.g. React.js"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="skillLevel"><FiTrendingUp /> Proficiency Level</label>
            <select id="skillLevel" name="skillLevel" value={skillLevel} onChange={(e) => setSkillLevel(e.target.value)}>
              <option value="">Select Level</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Expert">Expert</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="skillType"><FiLayers /> Skill Type</label>
            <select id="skillType" name="skillType" value={skillType} onChange={(e) => setSkillType(e.target.value)}>
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
            </select>
          </div>

          <button type="button" className="add-skill-btn" onClick={handleAddSkill}>
            <FiPlus />
            Add Skill
          </button>
        </div>

        {/* SKILL LIST */}
        <div className="skills-list">
          {skills.length === 0 ? (
            <p className="no-skills">No skills added yet.</p>
          ) : (
            skills.map((skill, index) => (
              <div className="skill-card" key={index}>
                <div className="skill-icon">
                  <FiZap />
                </div>

                <div className="skill-info">
                  <h3>{skill.name}</h3>
                  <div className="skill-meta">
                    <span className={`level-badge level-${skill.level.toLowerCase()}`}>
                      {skill.level}
                    </span>
                    <small>{skill.type === "primary" ? "Primary" : "Secondary"}</small>
                  </div>
                </div>

                <button type="button" className="delete-skill-btn" onClick={() => handleDeleteSkill(index)}>
                  <FiTrash2 />
                </button>
              </div>
            ))
          )}
        </div>

        {/* SAVE */}
        <div className="form-actions">
          <button type="submit" className="save-profile-btn">
            <FiSave />
            Save Skills
          </button>
        </div>
      </form>
    </div>
  );
};

export default Skills;
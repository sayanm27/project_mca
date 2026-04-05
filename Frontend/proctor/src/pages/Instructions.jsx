import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectUser, selectToken, logout } from "../store/authSlice";
import "./Instructions.css";

const Instructions = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const token = useSelector(selectToken);

  const [instructions, setInstructions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    const fetchInstructions = async () => {
      if (!user) {
        setError("User session not found. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://127.0.0.1:5000/get_instruct?userid=${user}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 401) {
          dispatch(logout());
          navigate("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch instructions");
        }

        // Backend returns an array of strings e.g. ["Rule 1", "Rule 2", ...]
        const data = await response.json();
        console.log("Instructions from API:", data);
        setInstructions(Array.isArray(data.instructions) ? data.instructions : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInstructions();
  }, [user, token, navigate, dispatch]);

  const handleStartExam = () => {
    if (agreed) {
      navigate("/exam");
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="instructions-page">
        <div className="loader-container">
          <div className="loader-ring"></div>
          <p className="loader-text">Loading your exam details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="instructions-page">
        <div className="error-container">
          <div className="error-icon">⚠</div>
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button className="btn-retry" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="instructions-page">
      {/* Top Bar */}
      <header className="top-bar">
        <div className="brand">
          <span className="brand-icon">⬡</span>
          <span className="brand-name">ProctorAI</span>
        </div>
        <div className="user-info">
          <div className="user-avatar">
            {String(user).charAt(0).toUpperCase()}
          </div>
          <span className="user-name">{user}</span>
          <button className="btn-logout" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="instructions-main">
        {/* Hero Banner */}
        <section className="exam-banner">
          <div className="banner-grid-overlay"></div>
          <div className="banner-content">
            <div className="exam-tag">UPCOMING ASSESSMENT</div>
            <h1 className="exam-title">
              {instructions?.exam_title || "Online Proctored Exam"}
            </h1>
            <div className="exam-meta">
              <span className="meta-pill">
                <span>⏱</span> {instructions?.duration || "90"} mins
              </span>
              <span className="meta-pill">
                <span>📋</span> {instructions?.total_questions || "50"} Questions
              </span>
              <span className="meta-pill">
                <span>🏆</span> {instructions?.total_marks || "100"} Marks
              </span>
              <span className="meta-pill">
                <span>📅</span> {instructions?.date || new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </section>

        <div className="content-grid">
          {/* Proctoring Notice */}
          <div className="proctor-notice">
            <div className="notice-icon">🤖</div>
            <div>
              <strong>AI Proctoring Active</strong>
              <p>
                This exam uses machine learning to monitor your session via
                webcam and screen. Ensure you are in a well-lit, quiet
                environment before starting.
              </p>
            </div>
          </div>

          {/* Instructions List */}
          <section className="instructions-card">
            <h2 className="section-title">
              <span className="title-accent"></span>
              General Instructions
            </h2>
            <ol className="instructions-list">
              {(instructions !== null ? instructions : defaultRules).map(
                (rule, idx) => (
                  <li key={idx} className="instruction-item">
                    <span className="item-index">{String(idx + 1).padStart(2, "0")}</span>
                    <span>{rule}</span>
                  </li>
                )
              )}
            </ol>
          </section>

          {/* System Requirements */}
          <section className="requirements-card">
            <h2 className="section-title">
              <span className="title-accent"></span>
              System Requirements
            </h2>
            <div className="requirements-grid">
              {(instructions?.requirements || defaultRequirements).map(
                (req, idx) => (
                  <div key={idx} className="requirement-item">
                    <span className="req-icon">{req.icon}</span>
                    <div>
                      <p className="req-label">{req.label}</p>
                      <p className="req-value">{req.value}</p>
                    </div>
                  </div>
                )
              )}
            </div>
          </section>

          {/* Agreement + CTA */}
          <section className="cta-section">
            <label className="agreement-check">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span className="custom-checkbox"></span>
              <span>
                I have read and understood all the instructions and agree to the
                exam terms & conditions.
              </span>
            </label>

            <button
              className={`btn-start ${agreed ? "active" : "disabled"}`}
              onClick={handleStartExam}
              disabled={!agreed}
            >
              <span>Begin Exam</span>
              <span className="btn-arrow">→</span>
            </button>
          </section>
        </div>
      </main>
    </div>
  );
};

// Fallback data if API doesn't return specific fields
const defaultRules = [
  "Ensure your webcam and microphone are enabled throughout the exam.",
  "Do not switch browser tabs or minimize the window during the exam.",
  "You must be alone in the room. No other person is allowed.",
  "Mobile phones and external devices must be kept away.",
  "Each question must be answered within the given time limit.",
  "Refreshing or navigating away will be flagged as a violation.",
  "Face must be clearly visible to the camera at all times.",
  "Any suspicious activity will result in automatic disqualification.",
];

const defaultRequirements = [
  { icon: "🌐", label: "Browser", value: "Chrome 90+ or Edge 90+" },
  { icon: "📷", label: "Webcam", value: "720p or higher" },
  { icon: "🔊", label: "Microphone", value: "Required and enabled" },
  { icon: "💡", label: "Lighting", value: "Well-lit environment" },
  { icon: "📶", label: "Internet", value: "Stable broadband (5 Mbps+)" },
  { icon: "🖥", label: "Screen", value: "1280×720 minimum resolution" },
];

export default Instructions;
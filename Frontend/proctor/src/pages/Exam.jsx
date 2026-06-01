import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectUser, selectToken, logout } from "../store/authSlice";
import "./Exam.css";

const Exam = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector(selectUser);
  const token = useSelector(selectToken);

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const detectionRunning = useRef(true);
  const popupShown = useRef(false);

  useEffect(() => {
    let mounted = true;

    const fetchQuestions = async () => {
      try {
        const response = await fetch(
          `http://127.0.0.1:5000/get_questions?userid=${user}`,
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
          throw new Error("Failed to fetch questions");
        }

        const data = await response.json();

        if (mounted) {
          setQuestions(data.questions || []);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const startFaceDetection = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:5000/detect_faces",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (
          mounted &&
          detectionRunning.current &&
          !popupShown.current &&
          data?.message
        ) {
          popupShown.current = true;
          alert(data.message);
        }
      } catch (err) {
        console.error("Face Detection Error:", err);
      }
    };

    fetchQuestions();
    startFaceDetection();

    return () => {
      mounted = false;
      detectionRunning.current = false;
    };
  }, [user, token, navigate, dispatch]);

  const handleOptionSelect = (questionNumber, selectedOption) => {
    setAnswers((prev) => ({
      ...prev,
      [questionNumber]: selectedOption,
    }));
  };

  const handleEndExam = () => {
    detectionRunning.current = false;

    console.log("Submitted Answers:", answers);

    alert("Exam Ended Successfully");

    navigate("/instructions");
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="exam-page">
        <div className="loader-container">
          <div className="loader-ring"></div>
          <p className="loader-text">Loading Questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="exam-page">
        <div className="error-container">
          <div className="error-icon">⚠</div>
          <h2>Something went wrong</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-page">
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

          <button
            className="btn-logout"
            onClick={handleLogout}
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="exam-main">
        <div className="exam-header">
          <h1>Online Examination</h1>

          <button
            className="btn-end-exam"
            onClick={handleEndExam}
          >
            End Exam
          </button>
        </div>

        {questions.length === 0 ? (
          <div className="question-card">
            <h3>No Questions Available</h3>
          </div>
        ) : (
          questions.map((question) => (
            <div
              className="question-card"
              key={question.number}
            >
              <div className="question-number">
                Question {question.number}
              </div>

              <h3 className="question-text">
                {question.question}
              </h3>

              <div className="options-list">
                {[
                  question.option1,
                  question.option2,
                  question.option3,
                  question.option4,
                ].map((option, index) => (
                  <label
                    key={index}
                    className="option-item"
                  >
                    <input
                      type="radio"
                      name={`question-${question.number}`}
                      value={option}
                      checked={
                        answers[question.number] === option
                      }
                      onChange={() =>
                        handleOptionSelect(
                          question.number,
                          option
                        )
                      }
                    />

                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default Exam;
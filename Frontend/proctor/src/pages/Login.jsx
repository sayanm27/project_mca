import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../store/authSlice";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://127.0.0.1:5000/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Invalid credentials");
      }

      const data = await res.json();

      dispatch(
        setCredentials({
          user: data.userid,
          access_token: data.access_token,
        })
      );

      navigate("/instructions");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>ProctorAI</h1>
        <p style={styles.subtitle}>Sign in to access your exam</p>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              type="text"
              name="username"
              placeholder="Enter your username"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
              spellCheck={false}
              required
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </div>

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b0e14",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Times New Roman', Times, serif",
  },
  card: {
    background: "#111520",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
    padding: "2.5rem",
    width: "100%",
    maxWidth: 380,
  },
  title: {
    fontFamily: "'Times New Roman', Times, serif",
    fontSize: "1.8rem",
    fontWeight: "bold",
    color: "#eef0f6",
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: "'Times New Roman', Times, serif",
    color: "#7a8299",
    fontSize: "0.95rem",
    marginBottom: "2rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.2rem",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  label: {
    fontFamily: "'Times New Roman', Times, serif",
    fontSize: "0.9rem",
    color: "#7a8299",
  },
  input: {
    background: "#171c2b",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 10,
    padding: "0.85rem 1rem",
    color: "#eef0f6",
    fontSize: "1rem",
    fontFamily: "'Times New Roman', Times, serif",
    outline: "none",
    width: "100%",
  },
  button: {
    background: "#4f8ef7",
    color: "white",
    border: "none",
    borderRadius: 10,
    padding: "0.95rem",
    fontFamily: "'Times New Roman', Times, serif",
    fontWeight: "bold",
    fontSize: "1rem",
    cursor: "pointer",
    marginTop: "0.5rem",
  },
  error: {
    fontFamily: "'Times New Roman', Times, serif",
    color: "#f75f4f",
    fontSize: "0.9rem",
    background: "rgba(247,95,79,0.1)",
    border: "1px solid rgba(247,95,79,0.2)",
    borderRadius: 8,
    padding: "0.7rem 1rem",
    marginBottom: "0.5rem",
  },
};

export default Login;
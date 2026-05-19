"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { authAPI } from "../lib/api";
import "./login.css";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await authAPI.login({ email, password });

      if (response.success && response.data) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("admin", JSON.stringify(response.data.admin));
        setShowPopup(true);

        setTimeout(() => {
          setIsExiting(true);
        }, 2000);

        setTimeout(() => {
          router.push("/dashboard");
        }, 2800);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login gagal";
      setErrorMessage(message);
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={`login-wrapper ${isExiting ? "is-exiting" : ""}`}>
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />

        <div className="login-card">
          <div className="logo-wrap">
            <div className="logo-box">
              <Image
                src="/images/logo_activelab.png"
                alt="ActiveLab Logo"
                width={50}
                height={50}
                style={{ objectFit: "contain" }}
              />
            </div>
            <p className="logo-title">Welcome Back</p>
            <p className="logo-sub">ActiveLab Admin Panel</p>
          </div>

          {errorMessage && (
            <div className="alert-box alert-error">{errorMessage}</div>
          )}

          <form onSubmit={handleLogin}>
            <div className="field-wrap">
              <label className="field-label">Email</label>
              <input
                type="email"
                className="field-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <div className="field-wrap">
              <label className="field-label">Password</label>
              <input
                type="password"
                className="field-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="btn-signin" disabled={isLoading}>
              {isLoading ? "Authenticating..." : "Sign In"}
            </button>
          </form>

          <div className="divider">
            <div className="divider-line" />
            <span className="divider-text">secured by ActiveLab</span>
            <div className="divider-line" />
          </div>
        </div>

        {showPopup && (
          <div className="success-overlay">
            <div className={`success-popup ${isExiting ? "pop-out" : ""}`}>
              <div className="check-container">
                <svg
                  className="checkmark"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 52 52"
                >
                  <circle
                    className="checkmark-circle"
                    cx="26"
                    cy="26"
                    r="25"
                    fill="none"
                  />
                  <path
                    className="checkmark-check"
                    fill="none"
                    d="M14.1 27.2l7.1 7.2 16.7-16.8"
                  />
                </svg>
              </div>
              <h3 className="success-title">Access Granted</h3>
              <p className="success-desc">
                Welcome back, Admin.
                <br />
                Preparing your workspace...
              </p>
            </div>
          </div>
        )}

        <div className={`page-wipe ${isExiting ? "active" : ""}`} />
      </div>
    </>
  );
}

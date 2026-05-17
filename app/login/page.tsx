"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Image } from "react-bootstrap";
import { authAPI } from "../lib/api";
import Link from "next/link";


export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await authAPI.login({ email, password });

      if (response.success && response.data) {
        // Simpan token & data admin ke localStorage
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("admin", JSON.stringify(response.data.admin));
        //document.cookie = `token=${response.data.token}; path=/; max-age=${7 * 24 * 60 * 60}`;
        // Redirect berdasarkan role
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login gagal";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-gradient min-vh-100 d-flex flex-column justify-content-center align-items-center">
      <div className="mb-3">
        <Image
          src="/images/logo_activelab.png"
          alt="Logo ActiveLab"
          width={120}
          height={120}
        />
      </div>

      <div className="bg-white p-4 rounded shadow" style={{ width: "340px" }}>
        <h4 className="text-center mb-3">Login Admin</h4>

        {/* Error message dari API */}
        {errorMessage && (
          <div className="alert alert-danger py-2 mb-3" role="alert">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              autoComplete="email"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                />
                Memproses...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
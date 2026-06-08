"use client";

import { useState } from "react";
import { Spinner } from "react-bootstrap";
import { FiCheck, FiX } from "react-icons/fi";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface ScanResult {
  success: boolean;
  message?: string;
  data?: {
    id: number;
    status: string;
    checkin_at: string;
    user_name: string;
    user_email: string;
    sched_date: string;
    sched_start: string;
    sched_end: string;
    service_type_name: string;
    service_name_name: string;
    room_name: string;
  };
}

export default function CheckOutPage() {
  const [code, setCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  const handleSubmit = async () => {
    if (code.trim().length !== 6) return;
    setIsProcessing(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/scan/process`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ code: code.trim().toUpperCase(), scan_type: "checkout" }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, message: "Gagal terhubung ke server" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => { 
    setResult(null); 
    setCode(""); 
  };

  return (
    <div className="container-fluid py-4">
      <h4 className="fw-bold mb-1">Check-Out Member</h4>
      <p className="text-muted mb-4">Input kode check-out dari member</p>

      <div className="card border-0 shadow-sm" style={{ maxWidth: 480 }}>
        <div className="card-body p-4">

          {!result ? (
            <>
              <p className="text-muted small mb-3">
                Minta member menampilkan kode check-out di aplikasinya, lalu input di bawah.
              </p>

              <div className="mb-3">
                <label className="form-label fw-semibold">Kode Check-Out</label>
                <input
                  type="text"
                  className="form-control text-uppercase text-center fw-bold"
                  style={{ fontSize: 28, letterSpacing: "8px" }}
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                  placeholder="XXXXXX"
                  autoFocus
                />
                <div className="form-text">6 karakter — contoh: AX7K2P</div>
              </div>

              <button
                className="btn btn-success w-100"
                onClick={handleSubmit}
                disabled={isProcessing || code.trim().length !== 6}
              >
                {isProcessing ? (
                  <><Spinner as="span" animation="border" size="sm" className="me-2" /> Memproses...</>
                ) : "Konfirmasi Check-Out"}
              </button>
            </>
          ) : (
            // Hasil
            <div className="text-center py-2">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                style={{
                  width: 72, height: 72,
                  backgroundColor: result.success ? "#4CAF50" : "#F44336",
                }}
              >
                {result.success
                  ? <FiCheck size={36} color="white" />
                  : <FiX size={36} color="white" />
                }
              </div>

              <h5 className={`fw-bold mb-2 ${result.success ? "text-success" : "text-danger"}`}>
                {result.success ? "Check-Out Berhasil!" : "Check-Out Gagal"}
              </h5>

              {result.success && result.data && (
                <div className="card bg-light border-0 mt-3 text-start">
                  <div className="card-body p-3">
                    <p className="mb-1"><strong>Member:</strong> {result.data.user_name}</p>
                    <p className="mb-1"><strong>Email:</strong> {result.data.user_email}</p>
                    <p className="mb-1"><strong>Layanan:</strong> {result.data.service_type_name} — {result.data.service_name_name}</p>
                    <p className="mb-1"><strong>Ruangan:</strong> {result.data.room_name}</p>
                    <p className="mb-0"><strong>Jadwal:</strong> {result.data.sched_date} {result.data.sched_start}–{result.data.sched_end}</p>
                  </div>
                </div>
              )}

              {!result.success && (
                <p className="text-muted mt-2">{result.message}</p>
              )}

              <button className="btn btn-success w-100 mt-4" onClick={handleReset}>
                Check-Out Berikutnya
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
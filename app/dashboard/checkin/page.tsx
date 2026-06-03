"use client";

import { useState, useEffect, useCallback } from "react";
import { Alert, Spinner } from "react-bootstrap";
import { FiMaximize, FiCheck, FiX } from "react-icons/fi";
import { io, Socket } from "socket.io-client";

// Dynamically import QRCode karena butuh browser
import dynamic from "next/dynamic";
const QRCodeDisplay = dynamic(() => import("react-qr-code"), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const BACKEND_BASE = API_URL?.replace("/api", "") || "http://localhost:5000";

interface ScanResult {
  success: boolean;
  scan_type?: string;
  booking?: {
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
  message?: string;
}

export default function CheckInPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [scannerUrl, setScannerUrl] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [isProcessingManual, setIsProcessingManual] = useState(false);
  const [manualError, setManualError] = useState("");

  // WebSocket connection
  const connectSocket = useCallback((sid: string) => {
    const newSocket = io(BACKEND_BASE, { transports: ["websocket"] });
    newSocket.on("connect", () => {
      newSocket.emit("join_session", sid);
    });
    newSocket.on("scan_result", (data: ScanResult) => {
      setScanResult(data);
    });
    setSocket(newSocket);
  }, []);

  useEffect(() => {
    return () => { socket?.disconnect(); };
  }, [socket]);

  // Buat scan session
  const handleStartScan = async () => {
    setIsCreatingSession(true);
    setScanResult(null);
    setManualCode("");
    setManualError("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/scan/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ scan_type: "checkin" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setSessionId(data.data.session_id);
      setScannerUrl(data.data.scanner_url);
      connectSocket(data.data.session_id);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Manual code submit
  const handleManualSubmit = async () => {
    if (!sessionId || !manualCode.trim()) return;
    setIsProcessingManual(true);
    setManualError("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/scan/sessions/${sessionId}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ manual_code: manualCode.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memproses kode";
      setManualError(msg);
    } finally {
      setIsProcessingManual(false);
    }
  };

  const handleReset = () => {
    socket?.disconnect();
    setSocket(null);
    setSessionId(null);
    setScannerUrl(null);
    setScanResult(null);
    setManualCode("");
    setManualError("");
  };

  return (
    <div className="container-fluid py-4">
      <h4 className="fw-bold mb-1">Scan Check-In</h4>
      <p className="text-muted mb-4">Proses check-in member menggunakan QR code</p>

      {/* ── Step 1: Mulai scan ─────────────────────────────────── */}
      {!sessionId && !scanResult && (
        <div className="card border-0 shadow-sm" style={{ maxWidth: 500 }}>
          <div className="card-body p-4 text-center">
            <div
              className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center mx-auto mb-3"
              style={{ width: 80, height: 80 }}
            >
              <FiMaximize size={36} color="#0d6efd" />
            </div>
            <h5 className="fw-bold mb-2">Mulai Scan Check-in</h5>
            <p className="text-muted small mb-4">
              Klik tombol di bawah, lalu scan QR yang muncul dengan HP admin untuk membuka scanner.
            </p>
            <button
              className="btn btn-primary w-100"
              onClick={handleStartScan}
              disabled={isCreatingSession}
            >
              {isCreatingSession ? (
                <><Spinner as="span" animation="border" size="sm" className="me-2" /> Menyiapkan...</>
              ) : "Mulai Scan Check-in"}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: QR untuk HP admin + input manual ──────────── */}
      {sessionId && !scanResult && (
        <div className="row g-4">
          <div className="col-md-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4 text-center">
                <p className="fw-semibold mb-1">Scan QR ini dengan HP Admin</p>
                <p className="text-muted small mb-3">HP akan membuka halaman scanner</p>
                {scannerUrl && (
                  <div className="d-flex justify-content-center mb-3">
                    <QRCodeDisplay value={scannerUrl} size={220} />
                  </div>
                )}
                <p className="text-muted" style={{ fontSize: 11, wordBreak: "break-all" }}>
                  {scannerUrl}
                </p>
                <div className="mt-2 d-flex align-items-center gap-2 justify-content-center">
                  <Spinner animation="border" size="sm" variant="primary" />
                  <span className="text-muted small">Menunggu scan dari HP admin...</span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <h6 className="fw-bold mb-3">Input Kode Manual (Fallback)</h6>
                <p className="text-muted small mb-3">
                  Jika QR tidak bisa di-scan, minta user untuk memberikan kode 6 huruf mereka.
                </p>
                {manualError && (
                  <Alert variant="danger" className="py-2 small">{manualError}</Alert>
                )}
                <div className="input-group mb-3">
                  <input
                    type="text"
                    className="form-control text-uppercase"
                    placeholder="Masukkan kode (contoh: AX7K2P)"
                    maxLength={6}
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    style={{ letterSpacing: "4px", fontWeight: "bold", fontSize: 18 }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleManualSubmit}
                    disabled={isProcessingManual || manualCode.length !== 6}
                  >
                    {isProcessingManual ? <Spinner as="span" animation="border" size="sm" /> : "Proses"}
                  </button>
                </div>
              </div>
            </div>
            <button className="btn btn-outline-secondary w-100 mt-3" onClick={handleReset}>
              Batal
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Hasil scan ──────────────────────────────────── */}
      {scanResult && (
        <div className="card border-0 shadow-sm" style={{ maxWidth: 500 }}>
          <div className="card-body p-4 text-center">
            {scanResult.success ? (
              <>
                <div
                  className="rounded-circle bg-success d-flex align-items-center justify-content-center mx-auto mb-3"
                  style={{ width: 72, height: 72 }}
                >
                  <FiCheck size={36} color="white" />
                </div>
                <h5 className="fw-bold text-success mb-2">Check-in Berhasil!</h5>
                <div className="card bg-light border-0 mt-3 text-start">
                  <div className="card-body p-3">
                    <p className="mb-1"><strong>User:</strong> {scanResult.booking?.user_name}</p>
                    <p className="mb-1"><strong>Email:</strong> {scanResult.booking?.user_email}</p>
                    <p className="mb-1"><strong>Layanan:</strong> {scanResult.booking?.service_type_name} - {scanResult.booking?.service_name_name}</p>
                    <p className="mb-1"><strong>Ruangan:</strong> {scanResult.booking?.room_name}</p>
                    <p className="mb-0"><strong>Jadwal:</strong> {scanResult.booking?.sched_date} {scanResult.booking?.sched_start} - {scanResult.booking?.sched_end}</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div
                  className="rounded-circle bg-danger d-flex align-items-center justify-content-center mx-auto mb-3"
                  style={{ width: 72, height: 72 }}
                >
                  <FiX size={36} color="white" />
                </div>
                <h5 className="fw-bold text-danger mb-2">Check-in Gagal</h5>
                <p className="text-muted">{scanResult.message}</p>
              </>
            )}
            <button className="btn btn-primary w-100 mt-3" onClick={handleReset}>
              Scan Berikutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
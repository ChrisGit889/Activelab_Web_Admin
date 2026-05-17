"use client";

import { useState, useEffect, useRef } from "react";
import { Pencil, X, Camera } from "lucide-react";
import { Spinner, Alert } from "react-bootstrap";
import {
  profileAPI,
  ProfileData,
  OperationalHourDay,
  getAdminPhotoUrl,
  getBranchPhotoUrl, 
} from "../lib/api";

const DAYS = [
  "senin", "selasa", "rabu", "kamis",
  "jumat", "sabtu", "minggu",
];

// Default operational hours kalau branch belum punya data
const defaultOperationalHours = (): Record<string, OperationalHourDay> =>
  DAYS.reduce(
    (acc, day) => ({
      ...acc,
      [day]: { open: "08:00", close: "17:00", isClosed: false },
    }),
    {}
  );

// ─── Types lokal ────────────────────────────────────────────────

interface FormState {
  email: string;
  phone: string;
  branch_name: string;
  branch_address: string;
  branch_contact: string;
  operational_hours: Record<string, OperationalHourDay>;
  time_slots: string;
  // Foto: kalau null → tidak ada perubahan foto
  photoFile: File | null;
  // Preview URL untuk tampil di UI (bisa dari DB atau object URL lokal)
  photoPreview: string;
  branchPhotoFile: File | null;     // ← tambahkan
  branchPhotoPreview: string;       // ← tambahkan
}

export default function Dashboard() {
  // ── State data dari API ──────────────────────────────────────
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // ── State modal edit ─────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Load profil saat pertama kali render ─────────────────────
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoadingProfile(true);
      setFetchError("");
      try {
        const res = await profileAPI.get();
        setProfile(res.data);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Gagal memuat data profil";
        setFetchError(message);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, []);

  // ─── Buka modal — isi form dari data profil real ──────────────
  const handleOpenModal = () => {
    if (!profile) return;

    // Parse time_slots dari array ke string yang bisa diedit
    const timeSlotsString = Array.isArray(profile.branch?.time_slots)
      ? profile.branch.time_slots.join(", ")
      : "";

    // Merge operational_hours dari DB dengan default (supaya semua hari ada)
    const mergedHours = {
      ...defaultOperationalHours(),
      ...(profile.branch?.operational_hours || {}),
    };

    setForm({
      email: profile.admin.email || "",
      phone: profile.admin.phone || "",
      branch_name: profile.branch?.name || "",
      branch_address: profile.branch?.address || "",
      branch_contact: profile.branch?.contact || "",
      operational_hours: mergedHours,
      time_slots: timeSlotsString,
      photoFile: null,
      photoPreview: getAdminPhotoUrl(profile.admin.photo) || "/images/logo_activelab.png",
      branchPhotoFile: null,          // ← tambahkan
    branchPhotoPreview: getBranchPhotoUrl(profile.branch?.photo) || "", // ← tambahkan
    });

    setSubmitError("");
    setSubmitSuccess("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setShowModal(false);
    setForm(null);
    setSubmitError("");
    setSubmitSuccess("");
  };

  // ─── Handler input teks biasa ─────────────────────────────────
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  // ─── Handler upload foto ──────────────────────────────────────
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi di sisi client sebelum kirim ke server
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setSubmitError("Format foto tidak didukung. Gunakan JPG, PNG, atau WebP.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setSubmitError("Ukuran foto maksimal 2MB.");
      return;
    }

    setSubmitError("");

    // Buat URL sementara untuk preview
    const previewUrl = URL.createObjectURL(file);
    setForm((prev) =>
      prev ? { ...prev, photoFile: file, photoPreview: previewUrl } : prev
    );
  };

  const handleBranchPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    setSubmitError("Format foto tidak didukung. Gunakan JPG, PNG, atau WebP.");
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    setSubmitError("Ukuran foto maksimal 2MB.");
    return;
  }

  setSubmitError("");
  const previewUrl = URL.createObjectURL(file);
  setForm((prev) =>
    prev ? { ...prev, branchPhotoFile: file, branchPhotoPreview: previewUrl } : prev
  );
};

  // ─── Handler toggle hari libur ────────────────────────────────
  const handleHolidayToggle = (day: string) => {
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        operational_hours: {
          ...prev.operational_hours,
          [day]: {
            ...prev.operational_hours[day],
            isClosed: !prev.operational_hours[day].isClosed,
          },
        },
      };
    });
  };

  // ─── Handler ubah jam ─────────────────────────────────────────
  const handleHourChange = (
    day: string,
    type: "open" | "close",
    value: string
  ) => {
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        operational_hours: {
          ...prev.operational_hours,
          [day]: { ...prev.operational_hours[day], [type]: value },
        },
      };
    });
  };

  // ─── Submit update profil ─────────────────────────────────────
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form) return;

    setSubmitError("");
    setSubmitSuccess("");
    setIsSubmitting(true);

    try {
      const result = await profileAPI.update({
        email: form.email,
        phone: form.phone,
        branch_name: form.branch_name,
        branch_address: form.branch_address,
        branch_contact: form.branch_contact,
        operational_hours: form.operational_hours,
        time_slots: form.time_slots,
        photoFile: form.photoFile,
        branchPhotoFile: form.branchPhotoFile, 
      });

      // Update state profile dengan data terbaru dari server
      setProfile(result.data);

      // Update localStorage supaya navbar dll ikut refresh
      const storedAdmin = localStorage.getItem("admin");
      if (storedAdmin) {
        const parsed = JSON.parse(storedAdmin);
        localStorage.setItem(
          "admin",
          JSON.stringify({
            ...parsed,
            email: result.data.admin.email,
            photo: result.data.admin.photo,
          })
        );
      }

      setSubmitSuccess("Perubahan berhasil disimpan!");

      // Tutup modal setelah 1.5 detik
      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Render loading ───────────────────────────────────────────
  if (isLoadingProfile) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div className="text-center">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <p className="text-muted">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  // ─── Render error fetch ───────────────────────────────────────
  if (fetchError) {
    return (
      <div className="p-4">
        <Alert variant="danger">
          {fetchError}
          <button
            className="btn btn-sm btn-outline-danger ms-3"
            onClick={() => window.location.reload()}
          >
            Coba Lagi
          </button>
        </Alert>
      </div>
    );
  }

  // ─── RENDER UTAMA ─────────────────────────────────────────────
  return (
    <div>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Dashboard Admin</h2>
          <p className="mb-0" style={{ color: "#666" }}>
            Welcome to Dashboard 🚀
          </p>
        </div>

        {/* Tombol edit — tampilkan foto profil dari DB */}
        <button
          onClick={handleOpenModal}
          className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2"
        >
          <img
            src={getAdminPhotoUrl(profile?.admin.photo) || "/images/logo_activelab.png"}
            alt="Profile"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              objectFit: "cover",
              background: "#fff",
            }}
          />
          <span>Edit Cabang</span>
          <Pencil size={16} />
        </button>
      </div>

      {/* ── Info cards ringkasan ────────────────────────────────── */}
      <div className="row g-3 mb-4">

         {/* ── Foto Branch ─────────────────────────────────────────── */}
{profile?.branch && (
  <div className="card border-0 shadow-sm mb-4">
    <div className="card-body text-center py-4">

      {/* FOTO */}
      <div
        style={{
          width: "40vh",
          height: "40vh",
          margin: "0 auto",
          borderRadius: 20,
          overflow: "hidden",
          background: "#f1f3f5",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        {profile.branch.photo ? (
          <img
            src={getBranchPhotoUrl(profile.branch.photo)!}
            alt={profile.branch.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            className="d-flex flex-column justify-content-center align-items-center h-100"
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#adb5bd"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>

            <p className="text-muted small mt-2 mb-0">
              Belum ada foto cabang
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
)}

        {/* Nama Cabang */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-muted small mb-1">Nama Cabang</p>
              <h5 className="fw-bold mb-0">
                {profile?.branch?.name || "-"}
              </h5>
            </div>
          </div>
        </div>

        {/* Kontak */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-muted small mb-1">Kontak Cabang</p>
              <h5 className="fw-bold mb-0">
                {profile?.branch?.contact || "-"}
              </h5>
            </div>
          </div>
        </div>

        {/* Role */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-muted small mb-1">Role Admin</p>
              <h5 className="fw-bold mb-0 text-capitalize">
                {profile?.admin.role === "pusat" ? "Admin Pusat" : "Admin Cabang"}
              </h5>
            </div>
          </div>
        </div>
      </div>


      {/* ── Detail info ─────────────────────────────────────────── */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <h6 className="fw-bold mb-3">Informasi Cabang</h6>
          <div className="row g-3">
            <div className="col-md-6">
              <p className="text-muted small mb-1">Email Admin</p>
              <p className="fw-semibold mb-0">{profile?.admin.email}</p>
            </div>
            <div className="col-md-6">
              <p className="text-muted small mb-1">No. Telepon Admin</p>
              <p className="fw-semibold mb-0">{profile?.admin.phone || "-"}</p>
            </div>
            <div className="col-12">
              <p className="text-muted small mb-1">Alamat Cabang</p>
              <p className="fw-semibold mb-0">{profile?.branch?.address || "-"}</p>
            </div>
            <div className="col-12">
              <p className="text-muted small mb-1">Time Slots</p>
              <div className="d-flex flex-wrap gap-1 mt-1">
                {(profile?.branch?.time_slots || []).map((slot) => (
                  <span
                    key={slot}
                    className="badge bg-primary bg-opacity-10 text-primary"
                  >
                    {slot}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL EDIT                                                 */}
      {/* ══════════════════════════════════════════════════════════ */}
      {showModal && form && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            zIndex: 9999,
            padding: "20px",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              background: "#fff",
              width: "100%",
              maxWidth: 900,
              borderRadius: 18,
              overflow: "hidden",
              boxShadow: "0 15px 40px rgba(0,0,0,0.2)",
              margin: "auto",
            }}
          >
            {/* Header modal */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h4 className="fw-bold mb-1">Edit Detail Cabang</h4>
                <small style={{ color: "#666" }}>
                  Perbarui informasi cabang GymABCD
                </small>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={isSubmitting}
                style={{
                  border: "none",
                  background: "#f5f5f5",
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave}>
              <div
                style={{
                  padding: 24,
                  maxHeight: "75vh",
                  overflowY: "auto",
                }}
              >
                {/* Alert error / sukses */}
                {submitError && (
                  <Alert variant="danger" className="py-2 small mb-3">
                    {submitError}
                  </Alert>
                )}
                {submitSuccess && (
                  <Alert variant="success" className="py-2 small mb-3">
                    ✅ {submitSuccess}
                  </Alert>
                )}

                {/* ── Foto Profil ──────────────────────────────── */}
                <div className="mb-5">
                  <h5 className="fw-bold mb-3">Foto Profil Admin</h5>
                  <div className="d-flex align-items-center gap-4 flex-wrap">
                    <div style={{ position: "relative", width: 120, height: 120 }}>
                      <img
                        src={form.photoPreview}
                        alt="Profile"
                        style={{
                          width: 120,
                          height: 120,
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "4px solid #f1f1f1",
                          background: "#fff",
                          
                        }}
                      />
                      <label
                        htmlFor="profile-upload"
                        style={{
                          position: "absolute",
                          bottom: 0,
                          right: 0,
                          width: 38,
                          height: 38,
                          borderRadius: "50%",
                          background: "#0d6efd",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          cursor: "pointer",
                          color: "#fff",
                          border: "3px solid white",
                        }}
                      >
                        <Camera size={18} />
                      </label>
                      <input
                        id="profile-upload"
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        style={{ display: "none" }}
                        onChange={handlePhotoChange}
                      />
                    </div>
                    <div>
                      <h6 className="fw-bold mb-1">Upload Foto Admin</h6>
                      <p style={{ margin: 0, color: "#666", fontSize: 14 }}>
                        Format: JPG, PNG, WebP. Maks: 2MB.
                      </p>
                      {form.photoFile && (
                        <span className="badge bg-success mt-1">
                          ✓ {form.photoFile.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

    {/* ── Foto Branch ──────────────────────────────────── */}
{form.branch_name !== undefined && (
  <div className="mb-5">
    <h5 className="fw-bold mb-3">Foto Cabang</h5>
    <div
      style={{
        border: "2px dashed #dee2e6",
        borderRadius: 14,
        overflow: "hidden",
        background: "#f8f9fa",
        position: "relative",
      }}
    >
      {form.branchPhotoPreview ? (
        /* Preview foto yang sudah ada atau baru dipilih */
        <div style={{ position: "relative", height: 200 }}>
          <img
            src={form.branchPhotoPreview}
            alt="Branch Preview"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          {/* Tombol ganti foto di atas preview */}
          <label
            htmlFor="branch-photo-upload"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0)",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLLabelElement).style.background =
                "rgba(0,0,0,0.4)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLLabelElement).style.background =
                "rgba(0,0,0,0)";
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.9)",
                borderRadius: 8,
                padding: "8px 16px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                opacity: 0,
                transition: "opacity 0.2s",
              }}
              className="hover-visible"
            >
              <Camera size={16} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                Ganti Foto
              </span>
            </div>
          </label>
        </div>
      ) : (
        /* Area upload kosong */
        <label
          htmlFor="branch-photo-upload"
          style={{
            height: 180,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            gap: 8,
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#adb5bd"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <p className="text-muted small mb-0 fw-semibold">
            Klik untuk upload foto cabang
          </p>
          <p className="text-muted mb-0" style={{ fontSize: 12 }}>
            JPG, PNG, WebP — Maks. 2MB
          </p>
        </label>
      )}

      {/* Input file tersembunyi */}
      <input
        id="branch-photo-upload"
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={handleBranchPhotoChange}
        disabled={isSubmitting}
      />
    </div>

    {/* Badge nama file setelah dipilih */}
    {form.branchPhotoFile && (
      <div className="mt-2 d-flex align-items-center gap-2">
        <span className="badge bg-success">✓ File baru dipilih</span>
        <span className="text-muted small">{form.branchPhotoFile.name}</span>
        {/* Tombol cancel — kembali ke foto sebelumnya */}
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary py-0 ms-1"
          style={{ fontSize: 11 }}
          onClick={() =>
            setForm((prev) =>
              prev
                ? {
                    ...prev,
                    branchPhotoFile: null,
                    branchPhotoPreview:
                      getBranchPhotoUrl(profile?.branch?.photo) || "",
                  }
                : prev
            )
          }
        >
          Batalkan
        </button>
      </div>
    )}
  </div>
)}

                {/* ── Info Admin & Cabang ──────────────────────── */}
                <div className="row g-3">
                  <div className="col-12">
                    <h5 className="fw-bold">Informasi Admin</h5>
                    <hr className="mt-1 mb-3" />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Email Admin</label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      value={form.email}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Nomor Telepon Admin</label>
                    <input
                      type="tel"
                      name="phone"
                      className="form-control"
                      value={form.phone}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="col-12 mt-4">
                    <h5 className="fw-bold">Informasi Cabang</h5>
                    <hr className="mt-1 mb-3" />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Nama Cabang</label>
                    <input
                      type="text"
                      name="branch_name"
                      className="form-control"
                      value={form.branch_name}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Kontak Cabang</label>
                    <input
                      type="tel"
                      name="branch_contact"
                      className="form-control"
                      value={form.branch_contact}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Alamat</label>
                    <textarea
                      name="branch_address"
                      className="form-control"
                      rows={3}
                      value={form.branch_address}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* ── Jam Operasional ──────────────────────────── */}
                <div className="mt-5">
                  <h5 className="fw-bold mb-3">Jam Operasional</h5>
                  <div className="row g-3">
                    {DAYS.map((day) => (
                      <div key={day} className="col-md-6 col-lg-4">
                        <div
                          style={{
                            border: "1px solid #e5e5e5",
                            borderRadius: 14,
                            padding: 14,
                            background: form.operational_hours[day]?.isClosed
                              ? "#f8f9fa"
                              : "#fff",
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <span className="fw-semibold text-capitalize">
                              {day}
                            </span>
                            <div className="form-check form-switch m-0">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={form.operational_hours[day]?.isClosed || false}
                                onChange={() => handleHolidayToggle(day)}
                                disabled={isSubmitting}
                              />
                              <label className="form-check-label small text-muted">
                                Libur
                              </label>
                            </div>
                          </div>

                          {form.operational_hours[day]?.isClosed ? (
                            <div
                              style={{
                                textAlign: "center",
                                padding: 10,
                                borderRadius: 8,
                                background: "#f1f3f5",
                                color: "#888",
                                fontSize: 14,
                                fontWeight: 500,
                              }}
                            >
                              Hari Libur
                            </div>
                          ) : (
                            <div className="d-flex align-items-center gap-2">
                              <input
                                type="time"
                                className="form-control"
                                value={form.operational_hours[day]?.open || ""}
                                onChange={(e) =>
                                  handleHourChange(day, "open", e.target.value)
                                }
                                disabled={isSubmitting}
                              />
                              <span className="text-muted">-</span>
                              <input
                                type="time"
                                className="form-control"
                                value={form.operational_hours[day]?.close || ""}
                                onChange={(e) =>
                                  handleHourChange(day, "close", e.target.value)
                                }
                                disabled={isSubmitting}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Time Slots ───────────────────────────────── */}
                <div className="mt-5">
                  <h5 className="fw-bold mb-3">Time Slots Operasional</h5>
                  <div
                    style={{
                      border: "1px solid #e5e5e5",
                      borderRadius: 14,
                      padding: 18,
                      background: "#fff",
                    }}
                  >
                    <label className="form-label fw-semibold">
                      Daftar Time Slots
                    </label>
                    <textarea
                      name="time_slots"
                      className="form-control"
                      rows={3}
                      disabled={isSubmitting}
                      value={form.time_slots}
                      onChange={handleInputChange}
                      placeholder="06:00, 07:00, 08:00, 09:00"
                      style={{ resize: "none" }}
                    />
                    <div className="form-text">
                      Pisahkan dengan koma. Contoh: 06:00, 07:00, 08:00
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer modal */}
              <div
                style={{
                  borderTop: "1px solid #eee",
                  padding: "16px 24px",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 12,
                  background: "#fff",
                }}
              >
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn btn-light px-4"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-success px-4"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        className="me-2"
                      />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Perubahan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
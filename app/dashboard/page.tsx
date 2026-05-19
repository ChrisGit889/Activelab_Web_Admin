"use client";
import "./dashboard.css";
import { useState, useEffect, useRef } from "react";
import {
  Pencil,
  X,
  Camera,
  MapPin,
  Phone,
  Mail,
  Clock,
  Building2,
  Shield,
  Zap,
} from "lucide-react";
import { Spinner, Alert } from "react-bootstrap";
import {
  profileAPI,
  ProfileData,
  OperationalHourDay,
  getAdminPhotoUrl,
  getBranchPhotoUrl,
} from "../lib/api";

const DAYS = ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu"];

const defaultOperationalHours = (): Record<string, OperationalHourDay> =>
  DAYS.reduce(
    (acc, day) => ({
      ...acc,
      [day]: { open: "08:00", close: "17:00", isClosed: false },
    }),
    {}
  );

interface FormState {
  email: string;
  phone: string;
  branch_name: string;
  branch_address: string;
  branch_contact: string;
  operational_hours: Record<string, OperationalHourDay>;
  time_slots: string;
  photoFile: File | null;
  photoPreview: string;
  branchPhotoFile: File | null;
  branchPhotoPreview: string;
}

export default function Dashboard() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleOpenModal = () => {
    if (!profile) return;
    const timeSlotsString = Array.isArray(profile.branch?.time_slots)
      ? profile.branch.time_slots.join(", ")
      : "";
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
      photoPreview:
        getAdminPhotoUrl(profile.admin.photo) || "/images/logo_activelab.png",
      branchPhotoFile: null,
      branchPhotoPreview: getBranchPhotoUrl(profile.branch?.photo) || "",
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setSubmitError(
        "Format foto tidak didukung. Gunakan JPG, PNG, atau WebP."
      );
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setSubmitError("Ukuran foto maksimal 2MB.");
      return;
    }
    setSubmitError("");
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
      setSubmitError(
        "Format foto tidak didukung. Gunakan JPG, PNG, atau WebP."
      );
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setSubmitError("Ukuran foto maksimal 2MB.");
      return;
    }
    setSubmitError("");
    const previewUrl = URL.createObjectURL(file);
    setForm((prev) =>
      prev
        ? { ...prev, branchPhotoFile: file, branchPhotoPreview: previewUrl }
        : prev
    );
  };

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
      setProfile(result.data);
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

  // Loading State
  if (isLoadingProfile) {
    return (
      <>
        <div className="dash-loading">
          <div className="dash-loading-inner">
            <div className="dash-spinner" />
            <p className="dash-loading-text">Memuat dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  // Error State
  if (fetchError) {
    return (
      <>
        <div className="dash-error">
          <div className="dash-error-card">
            <p className="dash-error-msg">{fetchError}</p>
            <button
              className="dash-btn-primary"
              onClick={() => window.location.reload()}
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </>
    );
  }

  // RENDER UTAMA
  return (
    <>
      <div className="dash-root">
        <div className="dash-header">
          <div className="dash-header-left">
            <div className="dash-header-eyebrow">
              <span className="dash-dot" />
              Panel Admin Aktif
            </div>
            <h1 className="dash-title">Dashboard Admin</h1>
            <p className="dash-subtitle">Selamat datang kembali 🚀</p>
          </div>
          <button className="dash-edit-btn" onClick={handleOpenModal}>
            <img
              src={
                getAdminPhotoUrl(profile?.admin.photo) ||
                "/images/logo_activelab.png"
              }
              alt="Profile"
              className="dash-edit-avatar"
            />
            <span>Edit Cabang</span>
            <Pencil size={14} />
          </button>
        </div>

        {/* Branch Hero Card */}
        {profile?.branch && (
          <div className="dash-hero-card">
            <div className="dash-hero-img-wrap">
              {profile.branch.photo ? (
                <img
                  src={getBranchPhotoUrl(profile.branch.photo)!}
                  alt={profile.branch.name}
                  className="dash-hero-img"
                />
              ) : (
                <div className="dash-hero-placeholder">
                  <Building2 size={48} color="#94a3b8" strokeWidth={1.2} />
                  <span>Belum ada foto cabang</span>
                </div>
              )}
              <div className="dash-hero-overlay">
                <div className="dash-hero-badge">
                  <Shield size={12} />
                  {profile?.admin.role === "pusat"
                    ? "Admin Pusat"
                    : "Admin Cabang"}
                </div>
                <h2 className="dash-hero-name">{profile.branch.name}</h2>
                <div className="dash-hero-address">
                  <MapPin size={13} />
                  {profile.branch.address || "Alamat belum diatur"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stat Cards */}
        <div className="dash-stats">
          <div className="dash-stat-card dash-stat-blue">
            <div className="dash-stat-icon">
              <Building2 size={18} />
            </div>
            <div>
              <p className="dash-stat-label">Nama Cabang</p>
              <h3 className="dash-stat-value">
                {profile?.branch?.name || "—"}
              </h3>
            </div>
          </div>

          <div className="dash-stat-card dash-stat-teal">
            <div className="dash-stat-icon">
              <Phone size={18} />
            </div>
            <div>
              <p className="dash-stat-label">Kontak Cabang</p>
              <h3 className="dash-stat-value">
                {profile?.branch?.contact || "—"}
              </h3>
            </div>
          </div>

          <div className="dash-stat-card dash-stat-violet">
            <div className="dash-stat-icon">
              <Shield size={18} />
            </div>
            <div>
              <p className="dash-stat-label">Role Admin</p>
              <h3 className="dash-stat-value">
                {profile?.admin.role === "pusat"
                  ? "Admin Pusat"
                  : "Admin Cabang"}
              </h3>
            </div>
          </div>
        </div>

        {/* Info Detail Card */}
        <div className="dash-info-card">
          <div className="dash-info-header">
            <Zap size={16} />
            <span>Informasi Cabang</span>
          </div>

          <div className="dash-info-grid">
            <div className="dash-info-item">
              <div className="dash-info-icon-wrap">
                <Mail size={15} />
              </div>
              <div>
                <p className="dash-info-label">Email Admin</p>
                <p className="dash-info-val">{profile?.admin.email || "—"}</p>
              </div>
            </div>

            <div className="dash-info-item">
              <div className="dash-info-icon-wrap">
                <Phone size={15} />
              </div>
              <div>
                <p className="dash-info-label">No. Telepon Admin</p>
                <p className="dash-info-val">{profile?.admin.phone || "—"}</p>
              </div>
            </div>

            <div className="dash-info-item dash-info-item-full">
              <div className="dash-info-icon-wrap">
                <MapPin size={15} />
              </div>
              <div>
                <p className="dash-info-label">Alamat Cabang</p>
                <p className="dash-info-val">
                  {profile?.branch?.address || "—"}
                </p>
              </div>
            </div>

            <div className="dash-info-item dash-info-item-full">
              <div className="dash-info-icon-wrap">
                <Clock size={15} />
              </div>
              <div>
                <p className="dash-info-label">Time Slots Operasional</p>
                <div className="dash-slots-wrap">
                  {(profile?.branch?.time_slots || []).length > 0 ? (
                    (profile?.branch?.time_slots || []).map((slot) => (
                      <span key={slot} className="dash-slot-badge">
                        {slot}
                      </span>
                    ))
                  ) : (
                    <span className="dash-info-val">Belum ada time slot</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && form && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd">
              <div>
                <p className="modal-hd-eyebrow">Edit Profil</p>
                <h3 className="modal-hd-title">Kelola Data Cabang</h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={handleCloseModal}
                disabled={isSubmitting}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {submitError && (
                  <div className="modal-alert modal-alert-err">
                    {submitError}
                  </div>
                )}
                {submitSuccess && (
                  <div className="modal-alert modal-alert-ok">
                    ✅ {submitSuccess}
                  </div>
                )}

                {/* Foto Profil Admin */}
                <section className="modal-section">
                  <h4 className="modal-section-title">Foto Profil Admin</h4>
                  <div className="modal-photo-row">
                    <div className="modal-avatar-wrap">
                      <img
                        src={form.photoPreview}
                        alt="Profile"
                        className="modal-avatar"
                      />
                      <label
                        htmlFor="profile-upload"
                        className="modal-avatar-cam"
                      >
                        <Camera size={16} />
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
                      <p className="modal-photo-hint">Upload Foto Admin</p>
                      <p className="modal-photo-sub">
                        Format: JPG, PNG, WebP. Maks: 2MB.
                      </p>
                      {form.photoFile && (
                        <span className="modal-badge-ok">
                          ✓ {form.photoFile.name}
                        </span>
                      )}
                    </div>
                  </div>
                </section>

                {/* Foto Cabang */}
                {form.branch_name !== undefined && (
                  <section className="modal-section">
                    <h4 className="modal-section-title">Foto Cabang</h4>
                    <div className="modal-branch-photo-wrap">
                      {form.branchPhotoPreview ? (
                        <div style={{ position: "relative", height: 200 }}>
                          <img
                            src={form.branchPhotoPreview}
                            alt="Branch Preview"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              borderRadius: 12,
                            }}
                          />
                          <label
                            htmlFor="branch-photo-upload"
                            className="modal-branch-overlay"
                          >
                            <span className="modal-branch-change-btn">
                              <Camera size={14} /> Ganti Foto
                            </span>
                          </label>
                        </div>
                      ) : (
                        <label
                          htmlFor="branch-photo-upload"
                          className="modal-branch-empty"
                        >
                          <Building2
                            size={36}
                            color="#94a3b8"
                            strokeWidth={1.2}
                          />
                          <p className="modal-photo-hint">
                            Klik untuk upload foto cabang
                          </p>
                          <p className="modal-photo-sub">
                            JPG, PNG, WebP — Maks. 2MB
                          </p>
                        </label>
                      )}
                      <input
                        id="branch-photo-upload"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        style={{ display: "none" }}
                        onChange={handleBranchPhotoChange}
                        disabled={isSubmitting}
                      />
                    </div>
                    {form.branchPhotoFile && (
                      <div className="modal-file-row">
                        <span className="modal-badge-ok">
                          ✓ File baru dipilih
                        </span>
                        <span className="modal-photo-sub">
                          {form.branchPhotoFile.name}
                        </span>
                        <button
                          type="button"
                          className="modal-cancel-file"
                          onClick={() =>
                            setForm((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    branchPhotoFile: null,
                                    branchPhotoPreview:
                                      getBranchPhotoUrl(
                                        profile?.branch?.photo
                                      ) || "",
                                  }
                                : prev
                            )
                          }
                        >
                          Batalkan
                        </button>
                      </div>
                    )}
                  </section>
                )}

                {/* Info Admin */}
                <section className="modal-section">
                  <h4 className="modal-section-title">Informasi Admin</h4>
                  <div className="modal-form-grid">
                    <div className="modal-field">
                      <label className="modal-label">Email Admin</label>
                      <input
                        type="email"
                        name="email"
                        className="modal-input"
                        value={form.email}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                    <div className="modal-field">
                      <label className="modal-label">Nomor Telepon Admin</label>
                      <input
                        type="tel"
                        name="phone"
                        className="modal-input"
                        value={form.phone}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </section>

                {/* Info Cabang */}
                <section className="modal-section">
                  <h4 className="modal-section-title">Informasi Cabang</h4>
                  <div className="modal-form-grid">
                    <div className="modal-field">
                      <label className="modal-label">Nama Cabang</label>
                      <input
                        type="text"
                        name="branch_name"
                        className="modal-input"
                        value={form.branch_name}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="modal-field">
                      <label className="modal-label">Kontak Cabang</label>
                      <input
                        type="tel"
                        name="branch_contact"
                        className="modal-input"
                        value={form.branch_contact}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="modal-field modal-field-full">
                      <label className="modal-label">Alamat</label>
                      <textarea
                        name="branch_address"
                        className="modal-input modal-textarea"
                        rows={3}
                        value={form.branch_address}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </section>

                {/* Jam Operasional */}
                <section className="modal-section">
                  <h4 className="modal-section-title">Jam Operasional</h4>
                  <div className="modal-hours-grid">
                    {DAYS.map((day) => (
                      <div
                        key={day}
                        className={`modal-day-card ${
                          form.operational_hours[day]?.isClosed
                            ? "modal-day-closed"
                            : ""
                        }`}
                      >
                        <div className="modal-day-header">
                          <span className="modal-day-name">{day}</span>
                          <label className="modal-toggle">
                            <input
                              type="checkbox"
                              checked={
                                form.operational_hours[day]?.isClosed || false
                              }
                              onChange={() => handleHolidayToggle(day)}
                              disabled={isSubmitting}
                            />
                            <span className="modal-toggle-track" />
                            <span className="modal-toggle-label">Libur</span>
                          </label>
                        </div>
                        {form.operational_hours[day]?.isClosed ? (
                          <div className="modal-day-off">Hari Libur</div>
                        ) : (
                          <div className="modal-time-row">
                            <input
                              type="time"
                              className="modal-time-input"
                              value={form.operational_hours[day]?.open || ""}
                              onChange={(e) =>
                                handleHourChange(day, "open", e.target.value)
                              }
                              disabled={isSubmitting}
                            />
                            <span className="modal-time-sep">–</span>
                            <input
                              type="time"
                              className="modal-time-input"
                              value={form.operational_hours[day]?.close || ""}
                              onChange={(e) =>
                                handleHourChange(day, "close", e.target.value)
                              }
                              disabled={isSubmitting}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Time Slots */}
                <section className="modal-section">
                  <h4 className="modal-section-title">
                    Time Slots Operasional
                  </h4>
                  <div className="modal-timeslot-wrap">
                    <label className="modal-label">Daftar Time Slots</label>
                    <textarea
                      name="time_slots"
                      className="modal-input modal-textarea"
                      rows={3}
                      disabled={isSubmitting}
                      value={form.time_slots}
                      onChange={handleInputChange}
                      placeholder="06:00, 07:00, 08:00, 09:00"
                    />
                    <p className="modal-photo-sub">
                      Pisahkan dengan koma. Contoh: 06:00, 07:00, 08:00
                    </p>
                  </div>
                </section>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="modal-btn-cancel"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="modal-btn-save"
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
    </>
  );
}
"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Spinner, Alert } from "react-bootstrap";
import { branchAPI, Branch, CreateBranchPayload, OperationalHours } from "../lib/api";

// ─── Types ────────────────────────────────────────────────────────

interface FormData {
  admin_email: string;
  admin_password: string;
  admin_phone: string;
  admin_role: "pusat" | "cabang";
  branch_name: string;
  branch_address: string;
  branch_contact: string;
  operational_hours: OperationalHours;
  time_slots: string; // String di form, di-parse saat submit
  services: string[];
}

interface DeleteConfirm {
  show: boolean;
  branchId: number | null;
  branchName: string;
}

// ─── Nilai awal form ───────────────────────────────────────────────

const initialFormData: FormData = {
  admin_email: "",
  admin_password: "",
  admin_phone: "",
  admin_role: "cabang",
  branch_name: "",
  branch_address: "",
  branch_contact: "",
  operational_hours: {
    senin:  { open: "06:00", close: "22:00", isClosed: false },
    selasa: { open: "06:00", close: "22:00", isClosed: false },
    rabu:   { open: "06:00", close: "22:00", isClosed: false },
    kamis:  { open: "06:00", close: "22:00", isClosed: false },
    jumat:  { open: "06:00", close: "22:00", isClosed: false },
    sabtu:  { open: "07:00", close: "21:00", isClosed: false },
    minggu: { open: "08:00", close: "20:00", isClosed: false },
  },
  time_slots:
    "06:00, 07:00, 08:00, 09:00, 10:00, 11:00, 13:00, 14:00, 15:00, 16:00, 17:00, 18:00, 19:00, 20:00",
  services: ["appointment", "class", "facility"],
};

const DAYS = ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu"];

// ─── Komponen utama ────────────────────────────────────────────────

export default function KelolaCabang() {
  const router = useRouter();

  // ── State data ────────────────────────────────────────────────
  const [branches, setBranches] = useState<Branch[]>([]);
  const [totalAll, setTotalAll] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // ── State modal tambah ────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ── State konfirmasi hapus ────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm>({
    show: false,
    branchId: null,
    branchName: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // ─── Guard: hanya admin pusat yang boleh masuk ─────────────────
  useEffect(() => {
    const adminRaw = localStorage.getItem("admin");
    const token = localStorage.getItem("token");

    if (!adminRaw || !token) {
      router.push("/login");
      return;
    }

    const admin = JSON.parse(adminRaw);
    if (admin.role !== "pusat") {
      router.push("/dashboard");
    }
  }, [router]);

  // ─── Fetch data cabang ─────────────────────────────────────────
  const fetchBranches = useCallback(async () => {
    setIsLoadingData(true);
    setFetchError("");
    try {
      const res = await branchAPI.getAll();
      setBranches(res.data.branches);
      setTotalAll(res.data.total_all);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Gagal memuat data cabang";
      setFetchError(message);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  // ─── Handler form input ────────────────────────────────────────
  const handleInputChange = (
  e: React.ChangeEvent< // Tambahkan tanda kurung sudut pembuka di sini
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >
) => {
  const { name, value } = e.target;
  setFormData((prev) => ({ ...prev, [name]: value }));
};

  const handleHourChange = (day: string, type: "open" | "close", value: string) => {
    setFormData((prev) => ({
      ...prev,
      operational_hours: {
        ...prev.operational_hours,
        [day]: { ...prev.operational_hours[day], [type]: value },
      },
    }));
  };

  const handleHolidayToggle = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      operational_hours: {
        ...prev.operational_hours,
        [day]: {
          ...prev.operational_hours[day],
          isClosed: !prev.operational_hours[day].isClosed,
        },
      },
    }));
  };

  // ─── Reset form saat modal ditutup ─────────────────────────────
  const handleCloseModal = () => {
    setShowModal(false);
    setFormData(initialFormData);
    setSubmitError("");
    setSubmitSuccess("");
  };

  // ─── Submit tambah cabang ──────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");
    setIsSubmitting(true);

    try {
      const payload: CreateBranchPayload = {
        branch_name: formData.branch_name,
        branch_address: formData.branch_address,
        branch_contact: formData.branch_contact,
        operational_hours: formData.operational_hours,
        time_slots: formData.time_slots
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        services: formData.services,
        admin_email: formData.admin_email,
        admin_password: formData.admin_password,
        admin_phone: formData.admin_phone,
        admin_role: formData.admin_role,
      };

      const res = await branchAPI.create(payload);
      setSubmitSuccess(res.message || "Cabang berhasil ditambahkan!");

      // Refresh tabel setelah berhasil
      await fetchBranches();

      // Tutup modal setelah 1.5 detik supaya user sempat baca pesan sukses
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

  // ─── Konfirmasi hapus ──────────────────────────────────────────
  const handleDeleteClick = (branch: Branch) => {
    setDeleteError("");
    setDeleteConfirm({
      show: true,
      branchId: branch.id,
      branchName: branch.name,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.branchId) return;
    setIsDeleting(true);
    setDeleteError("");

    try {
      await branchAPI.delete(deleteConfirm.branchId);

      // Refresh tabel
      await fetchBranches();

      // Tutup modal konfirmasi
      setDeleteConfirm({ show: false, branchId: null, branchName: "" });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Gagal menghapus cabang";
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── RENDER ────────────────────────────────────────────────────
  return (
    <div className="container-fluid py-4 bg-light min-vh-100">

      {/* Back link */}
      <div className="mb-3">
        <Link
          href="/dashboard"
          className="text-decoration-none text-secondary d-inline-flex align-items-center gap-2 small fw-medium"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Kembali ke Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2 className="fw-bold mb-1">Manajemen Cabang</h2>
          <p className="text-secondary mb-0">
            Kelola operasional cabang dalam satu tampilan.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-dark d-flex align-items-center gap-2 px-3 py-2"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="fw-medium">Tambah Cabang</span>
        </button>
      </div>

      {/* Stats cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body d-flex align-items-center gap-3">
              <div
                className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center"
                style={{ width: 52, height: 52 }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0d6efd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div>
                <p className="text-muted small mb-0">Total Semua Cabang</p>
                <h3 className="fw-bold mb-0">
                  {isLoadingData ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    totalAll
                  )}
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error saat fetch */}
      {fetchError && (
        <Alert
          variant="danger"
          className="d-flex align-items-center gap-2"
          dismissible
          onClose={() => setFetchError("")}
        >
          {fetchError}
          <button
            className="btn btn-sm btn-outline-danger ms-auto"
            onClick={fetchBranches}
          >
            Coba Lagi
          </button>
        </Alert>
      )}

      {/* Tabel cabang */}
      <div className="card border-0 shadow-sm overflow-hidden">
        <div className="card-header bg-white border-0 py-3 px-4">
          <h6 className="fw-bold mb-0">
            Daftar Cabang Lain{" "}
            <span className="badge bg-secondary ms-1">
              {branches.length}
            </span>
          </h6>
          <p className="text-muted small mb-0">
            Menampilkan semua cabang kecuali cabang Anda sendiri
          </p>
        </div>
        <div className="card-body p-0">
          {isLoadingData ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted mt-2 mb-0">Memuat data cabang...</p>
            </div>
          ) : branches.length === 0 ? (
            <div className="text-center py-5">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#adb5bd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <p className="text-muted mb-1">Belum ada cabang lain</p>
              <p className="text-muted small">Tambahkan cabang baru dengan menekan tombol di atas</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4 py-3 text-muted small fw-semibold" style={{ width: 50 }}>
                      No
                    </th>
                    <th className="py-3 text-muted small fw-semibold">Nama Cabang</th>
                    <th className="py-3 text-muted small fw-semibold">Alamat</th>
                    <th className="py-3 text-muted small fw-semibold">Nomor Telepon</th>
                    <th className="py-3 text-muted small fw-semibold text-center" style={{ width: 120 }}>
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map((branch, index) => (
                    <tr key={branch.id}>
                      <td className="ps-4 text-muted small">{index + 1}</td>
                      <td>
                        <div className="fw-semibold">{branch.name}</div>
                        
                      </td>
                      <td>
                        <div
                          className="text-muted small"
                          style={{ maxWidth: 280 }}
                        >
                          {branch.address}
                        </div>
                      </td>
                      <td className="small">{branch.contact || "-"}</td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                          onClick={() => handleDeleteClick(branch)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4h6v2" />
                          </svg>
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL: TAMBAH CABANG                                       */}
      {/* ══════════════════════════════════════════════════════════ */}
      {showModal && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)", overflowY: "auto" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered my-4">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Form Tambah Cabang Baru</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                />
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">

                  {/* Alert error / sukses di dalam modal */}
                  {submitError && (
                    <Alert variant="danger" className="py-2 small">
                      {submitError}
                    </Alert>
                  )}
                  {submitSuccess && (
                    <Alert variant="success" className="py-2 small">
                      ✅ {submitSuccess}
                    </Alert>
                  )}

                  <div className="row g-3">

                    {/* ── Informasi Admin ─────────────────────────── */}
                    <div className="col-12">
                      <h6 className="fw-bold text-primary mt-2">
                        Informasi Admin Cabang
                      </h6>
                      <hr className="my-1" />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">
                        Email Admin <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        name="admin_email"
                        className="form-control shadow-none"
                        required
                        disabled={isSubmitting}
                        value={formData.admin_email}
                        onChange={handleInputChange}
                        placeholder="admin@gymabcd.com"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">
                        Nomor Telepon Admin <span className="text-danger">*</span>
                      </label>
                      <input
                        type="tel"
                        name="admin_phone"
                        className="form-control shadow-none"
                        required
                        disabled={isSubmitting}
                        value={formData.admin_phone}
                        onChange={handleInputChange}
                        placeholder="08xxxxxxxxxx"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">
                        Password Admin <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="admin_password"
                          className="form-control shadow-none"
                          required
                          disabled={isSubmitting}
                          value={formData.admin_password}
                          onChange={handleInputChange}
                          placeholder="Min. 8 karakter"
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                      <div className="form-text">
                        Min. 8 karakter, huruf besar, huruf kecil, dan angka
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">
                        Role Admin <span className="text-danger">*</span>
                      </label>
                      <select
                        name="admin_role"
                        className="form-select shadow-none"
                        disabled={isSubmitting}
                        value={formData.admin_role}
                        onChange={handleInputChange}
                      >
                        <option value="cabang">Admin Cabang</option>
                        <option value="pusat">Admin Pusat</option>
                      </select>
                    </div>

                    {/* ── Detail Cabang ────────────────────────────── */}
                    <div className="col-12">
                      <h6 className="fw-bold text-primary mt-4">
                        Detail Cabang
                      </h6>
                      <hr className="my-1" />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">
                        Nama Cabang <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="branch_name"
                        className="form-control shadow-none"
                        required
                        disabled={isSubmitting}
                        value={formData.branch_name}
                        onChange={handleInputChange}
                        placeholder="GymABCD Bandung"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">
                        Kontak Cabang <span className="text-danger">*</span>
                      </label>
                      <input
                        type="tel"
                        name="branch_contact"
                        className="form-control shadow-none"
                        required
                        disabled={isSubmitting}
                        value={formData.branch_contact}
                        onChange={handleInputChange}
                        placeholder="02xxxxxxxxx"
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold">
                        Alamat Cabang <span className="text-danger">*</span>
                      </label>
                      <textarea
                        name="branch_address"
                        className="form-control shadow-none"
                        rows={2}
                        required
                        disabled={isSubmitting}
                        value={formData.branch_address}
                        onChange={handleInputChange}
                        placeholder="Jl. ..."
                      />
                    </div>

                    {/* ── Jam Operasional ──────────────────────────── */}
                    <div className="col-12">
                      <h6 className="fw-bold text-primary mt-4">
                        Jam Operasional
                      </h6>
                      <hr className="my-1" />
                    </div>

                    {DAYS.map((day) => (
                      <div key={day} className="col-md-6 col-lg-4">
                        <div
                          className={`p-2 border rounded ${
                            formData.operational_hours[day].isClosed
                              ? "bg-light"
                              : "bg-white shadow-sm"
                          }`}
                        >
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <label className="small fw-bold text-capitalize m-0">
                              {day}
                            </label>
                            <div className="form-check form-switch m-0">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={formData.operational_hours[day].isClosed}
                                onChange={() => handleHolidayToggle(day)}
                                disabled={isSubmitting}
                              />
                              <label className="form-check-label small">
                                Libur
                              </label>
                            </div>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <input
                              type="time"
                              className="form-control form-control-sm"
                              value={
                                formData.operational_hours[day].isClosed
                                  ? ""
                                  : formData.operational_hours[day].open
                              }
                              disabled={
                                formData.operational_hours[day].isClosed ||
                                isSubmitting
                              }
                              onChange={(e) =>
                                handleHourChange(day, "open", e.target.value)
                              }
                            />
                            <span className="small text-muted">–</span>
                            <input
                              type="time"
                              className="form-control form-control-sm"
                              value={
                                formData.operational_hours[day].isClosed
                                  ? ""
                                  : formData.operational_hours[day].close
                              }
                              disabled={
                                formData.operational_hours[day].isClosed ||
                                isSubmitting
                              }
                              onChange={(e) =>
                                handleHourChange(day, "close", e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* ── Time Slots ───────────────────────────────── */}
                    <div className="col-12 mt-2">
                      <label className="form-label small fw-bold">
                        Time Slots Operasional
                      </label>
                      <textarea
                        name="time_slots"
                        className="form-control shadow-none text-muted"
                        style={{ fontSize: "13px" }}
                        rows={2}
                        disabled={isSubmitting}
                        value={formData.time_slots}
                        onChange={handleInputChange}
                      />
                      <div className="form-text">
                        Pisahkan dengan koma. Contoh: 06:00, 07:00, 08:00
                      </div>
                    </div>

                  </div>
                </div>

                <div className="modal-footer border-0">
                  <button
                    type="button"
                    className="btn btn-light px-4"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-dark px-4"
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
                      "Simpan Cabang"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL: KONFIRMASI HAPUS                                    */}
      {/* ══════════════════════════════════════════════════════════ */}
      {deleteConfirm.show && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-body p-4 text-center">

                {/* Ikon warning */}
                <div
                  className="rounded-circle bg-danger bg-opacity-10 d-flex align-items-center justify-content-center mx-auto mb-3"
                  style={{ width: 64, height: 64 }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                </div>

                <h5 className="fw-bold mb-2">Hapus Cabang?</h5>
                <p className="text-muted mb-1">
                  Anda yakin ingin menghapus cabang
                </p>
                <p className="fw-semibold mb-3">
                  &ldquo;{deleteConfirm.branchName}&rdquo;?
                </p>

                <div className="alert alert-warning py-2 small text-start">
                  ⚠️ Tindakan ini akan menghapus cabang beserta seluruh akun
                  admin yang terdaftar di cabang tersebut dan{" "}
                  <strong>tidak bisa dibatalkan</strong>.
                </div>

                {/* Error saat hapus */}
                {deleteError && (
                  <Alert variant="danger" className="py-2 small text-start">
                    {deleteError}
                  </Alert>
                )}
              </div>

              <div className="modal-footer border-0 pt-0 justify-content-center gap-2">
                <button
                  className="btn btn-light px-4"
                  onClick={() => {
                    setDeleteConfirm({ show: false, branchId: null, branchName: "" });
                    setDeleteError("");
                  }}
                  disabled={isDeleting}
                >
                  Batal
                </button>
                <button
                  className="btn btn-danger px-4"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" className="me-2" />
                      Menghapus...
                    </>
                  ) : (
                    "Ya, Hapus"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
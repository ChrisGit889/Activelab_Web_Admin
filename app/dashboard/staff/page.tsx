"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";
import { Camera } from "lucide-react";
import { Spinner } from "react-bootstrap";
import { staffAPI, Staff, getStaffPhotoUrl } from "../../lib/api";

// ─── Placeholder kalau tidak ada foto ─────────────────────────
const PLACEHOLDER = "/images/logo_activelab.png";

interface ModalState {
  isOpen: boolean;
  type: "add" | "edit";
  staffId?: number;
  inputName: string;
  inputContact: string;
  inputDescription: string;
  // File baru yang dipilih user (null = tidak ganti foto)
  imageFile: File | null;
  // URL untuk preview di UI
  imagePreview: string;
  isLoading: boolean;
  error: string;
}

interface DeleteModalState {
  isOpen: boolean;
  staffId: number;
  targetName: string;
  isLoading: boolean;
  error: string;
}

const defaultModal: ModalState = {
  isOpen: false,
  type: "add",
  inputName: "",
  inputContact: "",
  inputDescription: "",
  imageFile: null,
  imagePreview: "",
  isLoading: false,
  error: "",
};

export default function StaffManagementPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [modal, setModal] = useState<ModalState>(defaultModal);

  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    staffId: 0,
    targetName: "",
    isLoading: false,
    error: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Fetch data staff ──────────────────────────────────────────
  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    setPageError("");
    try {
      const res = await staffAPI.getAll();
      setStaffList(res.data);
    } catch (err: unknown) {
      setPageError(err instanceof Error ? err.message : "Gagal memuat data staff");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // ─── Buka modal tambah ─────────────────────────────────────────
  const openAddModal = () => {
    setModal({ ...defaultModal, isOpen: true, type: "add" });
  };

  // ─── Buka modal edit — isi form dengan data staff yang dipilih ──
  const openEditModal = (staff: Staff) => {
    setModal({
      isOpen: true,
      type: "edit",
      staffId: staff.id,
      inputName: staff.name,
      inputContact: staff.contact || "",
      inputDescription: staff.description || "",
      imageFile: null,
      // Preview pakai foto dari DB (kalau ada)
      imagePreview: getStaffPhotoUrl(staff.image) || "",
      isLoading: false,
      error: "",
    });
  };

  // ─── Handler pilih file gambar ─────────────────────────────────
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setModal((prev) => ({
        ...prev,
        error: "Format tidak didukung. Gunakan JPG, PNG, atau WebP.",
      }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setModal((prev) => ({ ...prev, error: "Ukuran foto maksimal 2MB." }));
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setModal((prev) => ({
      ...prev,
      imageFile: file,
      imagePreview: previewUrl,
      error: "",
    }));
  };

  // ─── Hapus pilihan foto  ────────
  const handleRemoveImage = (staff?: Staff) => {
    setModal((prev) => ({
      ...prev,
      imageFile: null,
      imagePreview: staff ? getStaffPhotoUrl(staff.image) || "" : "",
    }));
    // Reset input file supaya bisa pilih file yang sama lagi
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Submit form (tambah/edit) ──────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!modal.inputName.trim()) {
      setModal((prev) => ({ ...prev, error: "Nama staff wajib diisi" }));
      return;
    }

    setModal((prev) => ({ ...prev, isLoading: true, error: "" }));

    try {
      const payload = {
        name: modal.inputName.trim(),
        contact: modal.inputContact.trim(),
        description: modal.inputDescription.trim(),
        imageFile: modal.imageFile,
      };

      if (modal.type === "add") {
        const res = await staffAPI.create(payload);
        // Prepend ke list supaya yang baru muncul paling atas
        setStaffList((prev) => [res.data, ...prev]);
      } else if (modal.type === "edit" && modal.staffId) {
        const res = await staffAPI.update(modal.staffId, payload);
        setStaffList((prev) =>
          prev.map((s) => (s.id === modal.staffId ? res.data : s))
        );
      }

      setModal(defaultModal);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      setModal((prev) => ({ ...prev, error: message, isLoading: false }));
    }
  };

  // ─── Buka modal konfirmasi hapus ───────────────────────────────
  const openDeleteModal = (id: number, name: string) => {
    setDeleteModal({ isOpen: true, staffId: id, targetName: name, isLoading: false, error: "" });
  };

  // ─── Konfirmasi hapus ──────────────────────────────────────────
  const confirmDelete = async () => {
    setDeleteModal((prev) => ({ ...prev, isLoading: true, error: "" }));
    try {
      await staffAPI.delete(deleteModal.staffId);
      setStaffList((prev) => prev.filter((s) => s.id !== deleteModal.staffId));
      setDeleteModal((prev) => ({ ...prev, isOpen: false }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal menghapus staff";
      setDeleteModal((prev) => ({ ...prev, error: message, isLoading: false }));
    }
  };

  // ─── Render loading ────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="container py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-2">Memuat data staff...</p>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">
          {pageError}
          <button className="btn btn-sm btn-outline-danger ms-3" onClick={fetchStaff}>
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // ─── RENDER UTAMA ──────────────────────────────────────────────
  return (
    <div className="container py-4">

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="m-0 fw-bold">Staff Management</h4>
          <p className="text-muted small mb-0">{staffList.length} staff terdaftar</p>
        </div>
        <button
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={openAddModal}
        >
          <FiPlus /> Tambah Staff
        </button>
      </div>

      {/* Tabel staff */}
      <div className="card border-0 shadow-sm rounded overflow-hidden">
        <div className="table-responsive">
          <table className="table align-middle mb-0" style={{ minWidth: 800 }}>
            <thead className="table-light">
              <tr>
                <th className="ps-4 py-3" style={{ width: 70 }}>Foto</th>
                <th className="py-3" style={{ width: 200 }}>Nama Staff</th>
                <th className="py-3" style={{ width: 160 }}>Kontak</th>
                <th className="py-3">Deskripsi</th>
                <th className="py-3 text-center pe-4" style={{ width: 120 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {staffList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted">
                    <div className="d-flex flex-column align-items-center gap-2">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#adb5bd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <span>Belum ada data staff. Tambahkan staff pertama!</span>
                    </div>
                  </td>
                </tr>
              ) : (
                staffList.map((staff) => (
                  <tr key={staff.id}>
                    {/* Foto */}
                    <td className="ps-4">
                      <img
                        src={getStaffPhotoUrl(staff.image) || PLACEHOLDER}
                        alt={staff.name}
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "2px solid #e9ecef",
                        }}
                        onError={(e) => {
                          // Fallback kalau gambar gagal load
                          (e.target as HTMLImageElement).src = PLACEHOLDER;
                        }}
                      />
                    </td>

                    {/* Nama */}
                    <td>
                      <span className="fw-semibold" style={{ color: "#333" }}>
                        {staff.name}
                      </span>
                      <div className="text-muted" style={{ fontSize: 11 }}>
                        ID #{staff.id}
                      </div>
                    </td>

                    {/* Kontak */}
                    <td>
                      <span className="text-secondary">{staff.contact || "-"}</span>
                    </td>

                    {/* Deskripsi */}
                    <td>
                      <p
                        className="text-muted m-0"
                        style={{
                          fontSize: 14,
                          maxWidth: 380,
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {staff.description || "-"}
                      </p>
                    </td>

                    {/* Aksi */}
                    <td className="text-center pe-4">
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary rounded-circle p-2 d-flex align-items-center"
                          title="Edit"
                          onClick={() => openEditModal(staff)}
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger rounded-circle p-2 d-flex align-items-center"
                          title="Hapus"
                          onClick={() => openDeleteModal(staff.id, staff.name)}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL FORM TAMBAH / EDIT                                   */}
      {/* ══════════════════════════════════════════════════════════ */}
      {modal.isOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
        >
          <div
            className="bg-white rounded shadow"
            style={{ width: 520, maxHeight: "90vh", overflowY: "auto" }}
          >
            {/* Header modal */}
            <div className="px-4 pt-4 pb-3 border-bottom">
              <h5 className="fw-bold mb-0">
                {modal.type === "add" ? "Tambah Data Staff" : "Ubah Data Staff"}
              </h5>
            </div>

            <form onSubmit={handleSave}>
              <div className="p-4">

                {/* Alert error */}
                {modal.error && (
                  <div className="alert alert-danger py-2 small mb-3">
                    {modal.error}
                  </div>
                )}

                {/* ── Upload Foto Staff ─────────────────────────── */}
                <div className="mb-4">
                  <label className="form-label fw-semibold" style={{ fontSize: 14 }}>
                    Foto Staff
                  </label>

                  {/* Area upload foto */}
                  <div className="d-flex align-items-center gap-4">
                    {/* Preview foto */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <img
                        src={modal.imagePreview || PLACEHOLDER}
                        alt="Preview"
                        style={{
                          width: 100,
                          height: 100,
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "3px solid #e9ecef",
                          background: "#f8f9fa",
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER;
                        }}
                      />
                      {/* Tombol kamera untuk trigger input file */}
                      <label
                        htmlFor="staff-image-upload"
                        title="Ganti foto"
                        style={{
                          position: "absolute",
                          bottom: 0,
                          right: 0,
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background: "#0d6efd",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "#fff",
                          border: "2px solid white",
                        }}
                      >
                        <Camera size={16} />
                      </label>
                      <input
                        id="staff-image-upload"
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        style={{ display: "none" }}
                        onChange={handleImageChange}
                        disabled={modal.isLoading}
                      />
                    </div>

                    {/* Info & aksi foto */}
                    <div className="flex-grow-1">
                      <p className="mb-1 fw-semibold" style={{ fontSize: 13 }}>
                        Upload Foto Staff
                      </p>
                      <p className="text-muted mb-2" style={{ fontSize: 12 }}>
                        Format: JPG, PNG, WebP. Maks. 2MB.
                      </p>

                      {modal.imageFile ? (
                        // Setelah pilih file baru
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <span className="badge bg-success" style={{ fontSize: 11 }}>
                            ✓ {modal.imageFile.name}
                          </span>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary py-0"
                            style={{ fontSize: 11 }}
                            onClick={() => handleRemoveImage()}
                            disabled={modal.isLoading}
                          >
                            Batalkan
                          </button>
                        </div>
                      ) : (
                        // Belum pilih file
                        <label
                          htmlFor="staff-image-upload"
                          className="btn btn-sm btn-outline-primary"
                          style={{ cursor: "pointer", fontSize: 12 }}
                        >
                          Pilih Foto
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Input Nama ────────────────────────────────── */}
                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ fontSize: 14 }}>
                    Nama Staff <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Contoh: Andi Wijaya"
                    value={modal.inputName}
                    onChange={(e) => setModal((prev) => ({ ...prev, inputName: e.target.value }))}
                    disabled={modal.isLoading}
                    required
                    autoFocus
                  />
                </div>

                {/* ── Input Kontak ──────────────────────────────── */}
                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ fontSize: 14 }}>
                    Kontak / No. HP
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Contoh: 08123456789"
                    value={modal.inputContact}
                    onChange={(e) => setModal((prev) => ({ ...prev, inputContact: e.target.value }))}
                    disabled={modal.isLoading}
                  />
                </div>

                {/* ── Input Deskripsi ───────────────────────────── */}
                <div className="mb-4">
                  <label className="form-label fw-semibold" style={{ fontSize: 14 }}>
                    Deskripsi / Bio
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Ceritakan singkat mengenai latar belakang staff..."
                    value={modal.inputDescription}
                    onChange={(e) => setModal((prev) => ({ ...prev, inputDescription: e.target.value }))}
                    disabled={modal.isLoading}
                  />
                </div>
              </div>

              {/* Footer modal */}
              <div className="px-4 pb-4 d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-light border px-4"
                  onClick={() => setModal(defaultModal)}
                  disabled={modal.isLoading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary px-4"
                  disabled={modal.isLoading}
                >
                  {modal.isLoading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" className="me-2" />
                      Menyimpan...
                    </>
                  ) : (
                    modal.type === "add" ? "Tambah Staff" : "Simpan Perubahan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL KONFIRMASI HAPUS                                     */}
      {/* ══════════════════════════════════════════════════════════ */}
      {deleteModal.isOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}
        >
          <div className="bg-white p-4 rounded shadow-sm border" style={{ width: 400 }}>
            {/* Ikon danger */}
            <div
              className="rounded-circle bg-danger bg-opacity-10 d-flex align-items-center justify-content-center mx-auto mb-3"
              style={{ width: 60, height: 60 }}
            >
              <FiTrash2 size={26} color="#dc3545" />
            </div>

            <h5 className="fw-bold text-center mb-2">Hapus Staff?</h5>

            {deleteModal.error && (
              <div className="alert alert-danger py-2 small mb-3">
                {deleteModal.error}
              </div>
            )}

            <p className="text-secondary text-center mb-1" style={{ fontSize: 15 }}>
              Anda yakin ingin menghapus staff
            </p>
            <p className="fw-semibold text-center mb-3">
              &ldquo;{deleteModal.targetName}&rdquo;?
            </p>

            <div className="alert alert-warning py-2 small">
              ⚠️ Foto staff juga akan dihapus secara permanen.
            </div>

            <div className="d-flex justify-content-center gap-2 mt-3">
              <button
                className="btn btn-light border px-4"
                onClick={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
                disabled={deleteModal.isLoading}
              >
                Batal
              </button>
              <button
                className="btn btn-danger px-4"
                onClick={confirmDelete}
                disabled={deleteModal.isLoading}
              >
                {deleteModal.isLoading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Menghapus...
                  </>
                ) : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
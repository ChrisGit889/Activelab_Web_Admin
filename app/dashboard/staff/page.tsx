"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiX,
  FiAlertTriangle,
  FiUsers,
} from "react-icons/fi";
import { Camera } from "lucide-react";
import { staffAPI, Staff, getStaffPhotoUrl } from "../../lib/api";
import "./staff.css";

const PLACEHOLDER = "/images/logo_activelab.png";

interface ModalState {
  isOpen: boolean;
  type: "add" | "edit";
  staffId?: number;
  inputName: string;
  inputContact: string;
  inputDescription: string;
  imageFile: File | null;
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

/* Spinner */
const Spinner = ({ size = 28 }: { size?: number }) => (
  <div
    className="st-spinner"
    style={{ width: size, height: size, borderWidth: size < 20 ? 2 : 3 }}
  />
);

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

  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    setPageError("");
    try {
      const res = await staffAPI.getAll();
      setStaffList(res.data);
    } catch (err: unknown) {
      setPageError(
        err instanceof Error ? err.message : "Gagal memuat data staff"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const openAddModal = () =>
    setModal({ ...defaultModal, isOpen: true, type: "add" });

  const openEditModal = (staff: Staff) => {
    setModal({
      isOpen: true,
      type: "edit",
      staffId: staff.id,
      inputName: staff.name,
      inputContact: staff.contact || "",
      inputDescription: staff.description || "",
      imageFile: null,
      imagePreview: getStaffPhotoUrl(staff.image) || "",
      isLoading: false,
      error: "",
    });
  };

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

  const handleRemoveImage = () => {
    setModal((prev) => ({ ...prev, imageFile: null, imagePreview: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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

  const openDeleteModal = (id: number, name: string) => {
    setDeleteModal({
      isOpen: true,
      staffId: id,
      targetName: name,
      isLoading: false,
      error: "",
    });
  };

  const confirmDelete = async () => {
    setDeleteModal((prev) => ({ ...prev, isLoading: true, error: "" }));
    try {
      await staffAPI.delete(deleteModal.staffId);
      setStaffList((prev) => prev.filter((s) => s.id !== deleteModal.staffId));
      setDeleteModal((prev) => ({ ...prev, isOpen: false }));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Gagal menghapus staff";
      setDeleteModal((prev) => ({ ...prev, error: message, isLoading: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="st-page">
        <div className="st-loading">
          <Spinner />
          <p className="st-loading-text">Memuat data staff...</p>
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="st-page">
        <div className="st-alert st-alert-danger">
          <FiAlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>
            {pageError}{" "}
            <button
              className="st-btn st-btn-sm st-btn-light"
              style={{ marginLeft: 8 }}
              onClick={fetchStaff}
            >
              Coba Lagi
            </button>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="st-page">
      {/* Header */}
      <div className="st-header">
        <div className="st-header-left">
          <h1>Staff Management</h1>
          <p>{staffList.length} staff terdaftar</p>
        </div>
        <button className="st-btn st-btn-primary" onClick={openAddModal}>
          <FiPlus size={15} /> Tambah Staff
        </button>
      </div>

      {/* Tabel */}
      <div className="st-table-card">
        <div style={{ overflowX: "auto" }}>
          <table className="st-table">
            <thead>
              <tr>
                <th style={{ width: 64 }}>Foto</th>
                <th style={{ width: 200 }}>Nama Staff</th>
                <th style={{ width: 160 }}>Kontak</th>
                <th>Deskripsi</th>
                <th style={{ width: 110 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {staffList.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="st-empty">
                      <div className="st-empty-icon">
                        <FiUsers size={26} color="#9ca3af" />
                      </div>
                      <p className="st-empty-title">Belum ada data staff</p>
                      <p className="st-empty-desc">
                        Tambahkan staff pertama untuk memulai.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                staffList.map((staff) => (
                  <tr key={staff.id}>
                    <td>
                      <img
                        src={getStaffPhotoUrl(staff.image) || PLACEHOLDER}
                        alt={staff.name}
                        className="st-avatar"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER;
                        }}
                      />
                    </td>
                    <td>
                      <div className="st-name-cell">
                        <span className="st-name">{staff.name}</span>
                        <span className="st-id">ID #{staff.id}</span>
                      </div>
                    </td>
                    <td>
                      <span className="st-contact">{staff.contact || "—"}</span>
                    </td>
                    <td>
                      <p className="st-desc">{staff.description || "—"}</p>
                    </td>
                    <td>
                      <div className="st-actions">
                        <button
                          className="st-btn-icon st-btn-icon-edit"
                          title="Edit"
                          onClick={() => openEditModal(staff)}
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          className="st-btn-icon st-btn-icon-delete"
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

      {/* ══════════════════════════════════════════════
      Tambah / Edit
      ══════════════════════════════════════════════ */}
      {modal.isOpen && (
        <div
          className="st-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget && !modal.isLoading)
              setModal(defaultModal);
          }}
        >
          <div className="st-modal">
            <div className="st-modal-header">
              <h2 className="st-modal-title">
                {modal.type === "add" ? (
                  <>
                    <FiPlus size={16} /> Tambah Data Staff
                  </>
                ) : (
                  <>
                    <FiEdit2 size={16} /> Ubah Data Staff
                  </>
                )}
              </h2>
              <button
                className="st-modal-close"
                onClick={() => !modal.isLoading && setModal(defaultModal)}
              >
                <FiX size={15} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: "contents" }}>
              <div className="st-modal-body">
                {modal.error && (
                  <div className="st-alert st-alert-danger">
                    <FiAlertTriangle size={15} style={{ flexShrink: 0 }} />
                    {modal.error}
                  </div>
                )}

                {/* Upload Foto */}
                <div className="st-form-group">
                  <label className="st-label">Foto Staff</label>
                  <div className="st-photo-upload">
                    <div className="st-photo-preview-wrap">
                      <img
                        src={modal.imagePreview || PLACEHOLDER}
                        alt="Preview"
                        className="st-photo-preview"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER;
                        }}
                      />
                      <label
                        htmlFor="staff-image-upload"
                        className="st-photo-camera-btn"
                        title="Ganti foto"
                      >
                        <Camera size={14} />
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
                    <div className="st-photo-info">
                      <p className="st-photo-title">Upload Foto Staff</p>
                      <p className="st-photo-hint">
                        Format: JPG, PNG, WebP. Maks. 2MB.
                      </p>
                      {modal.imageFile ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span className="st-photo-file-badge">
                            ✓ {modal.imageFile.name}
                          </span>
                          <button
                            type="button"
                            className="st-btn st-btn-sm st-btn-light"
                            onClick={handleRemoveImage}
                            disabled={modal.isLoading}
                          >
                            Batalkan
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="staff-image-upload"
                          className="st-btn st-btn-sm st-btn-light"
                          style={{ cursor: "pointer" }}
                        >
                          Pilih Foto
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nama */}
                <div className="st-form-group">
                  <label className="st-label">
                    Nama Staff <span className="st-required">*</span>
                  </label>
                  <input
                    type="text"
                    className="st-input"
                    placeholder="Contoh: Andi Wijaya"
                    value={modal.inputName}
                    onChange={(e) =>
                      setModal((prev) => ({
                        ...prev,
                        inputName: e.target.value,
                      }))
                    }
                    disabled={modal.isLoading}
                    required
                    autoFocus
                  />
                </div>

                {/* Kontak */}
                <div className="st-form-group">
                  <label className="st-label">Kontak / No. HP</label>
                  <input
                    type="text"
                    className="st-input"
                    placeholder="Contoh: 08123456789"
                    value={modal.inputContact}
                    onChange={(e) =>
                      setModal((prev) => ({
                        ...prev,
                        inputContact: e.target.value,
                      }))
                    }
                    disabled={modal.isLoading}
                  />
                </div>

                {/* Deskripsi */}
                <div className="st-form-group" style={{ marginBottom: 0 }}>
                  <label className="st-label">Deskripsi / Bio</label>
                  <textarea
                    className="st-textarea"
                    rows={3}
                    placeholder="Ceritakan singkat mengenai latar belakang staff..."
                    value={modal.inputDescription}
                    onChange={(e) =>
                      setModal((prev) => ({
                        ...prev,
                        inputDescription: e.target.value,
                      }))
                    }
                    disabled={modal.isLoading}
                  />
                </div>
              </div>

              <div className="st-modal-footer">
                <button
                  type="button"
                  className="st-btn st-btn-light"
                  onClick={() => setModal(defaultModal)}
                  disabled={modal.isLoading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="st-btn st-btn-primary"
                  disabled={modal.isLoading}
                >
                  {modal.isLoading ? (
                    <>
                      <Spinner size={14} />
                      &nbsp;Menyimpan...
                    </>
                  ) : modal.type === "add" ? (
                    "Tambah Staff"
                  ) : (
                    "Simpan Perubahan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
        Konfirmasi Hapus
      ══════════════════════════════════════════════ */}
      {deleteModal.isOpen && (
        <div className="st-modal-backdrop">
          <div className="st-modal st-modal-sm">
            <div
              className="st-modal-body"
              style={{ padding: "32px 28px 20px", textAlign: "center" }}
            >
              <div className="st-confirm-icon st-confirm-icon-danger">
                <FiTrash2 size={26} color="var(--st-danger)" />
              </div>
              <p className="st-confirm-title">Hapus Staff?</p>
              <p className="st-confirm-name">
                &ldquo;{deleteModal.targetName}&rdquo;
              </p>
              <p className="st-confirm-desc">
                Tindakan ini tidak bisa dibatalkan.
              </p>
              {deleteModal.error && (
                <div
                  className="st-alert st-alert-danger"
                  style={{ marginTop: 14, textAlign: "left" }}
                >
                  <FiAlertTriangle size={14} />
                  {deleteModal.error}
                </div>
              )}
              <div
                className="st-alert st-alert-warning"
                style={{ marginTop: 14, textAlign: "left" }}
              >
                <FiAlertTriangle size={14} style={{ flexShrink: 0 }} />
                Foto staff juga akan dihapus secara permanen.
              </div>
            </div>
            <div
              className="st-modal-footer"
              style={{ justifyContent: "center" }}
            >
              <button
                className="st-btn st-btn-light"
                onClick={() =>
                  setDeleteModal((prev) => ({ ...prev, isOpen: false }))
                }
                disabled={deleteModal.isLoading}
              >
                Batal
              </button>
              <button
                className="st-btn st-btn-danger"
                onClick={confirmDelete}
                disabled={deleteModal.isLoading}
              >
                {deleteModal.isLoading ? (
                  <>
                    <Spinner size={14} />
                    &nbsp;Menghapus...
                  </>
                ) : (
                  "Ya, Hapus"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import styles from "./service.module.css";

// Types
interface ServiceItem {
  id: number;
  name: string;
  created_at: string;
}

interface ServiceType {
  id: number;
  name: string;
  created_at: string;
  services: ServiceItem[];
}

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"
).replace(/\/\/$/, "");

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("token") ?? "" : "";

async function apiFetch(path: string, options: RequestInit = {}) {
  const cleanPath = path.replace(/^\/api/, "");
  const res = await fetch(`${API_BASE}${cleanPath}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers ?? {}),
    },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? "Request gagal");
  return json;
}

// Modal
function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!open) return null;
  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>{title}</span>
          <button className={styles.modalClose} onClick={onClose}>
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Toast
function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return (
    <div
      className={type === "success" ? styles.toastSuccess : styles.toastError}
    >
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {type === "success" ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        )}
      </svg>
      {msg}
    </div>
  );
}

// Spinner
function Spinner() {
  return (
    <div
      style={{ display: "flex", justifyContent: "center", padding: "3rem 0" }}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#2563eb"
        strokeWidth="2.5"
        style={{ animation: "spin 0.7s linear infinite" }}
      >
        <path strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10" />
      </svg>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// Main Page
export default function ServiceManagementPage() {
  const [data, setData] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const [addTypeOpen, setAddTypeOpen] = useState(false);
  const [addTypeInput, setAddTypeInput] = useState("");
  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const [addServiceInput, setAddServiceInput] = useState("");
  const [editServiceOpen, setEditServiceOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ServiceItem | null>(null);
  const [editInput, setEditInput] = useState("");

  const [deleteTypeConfirm, setDeleteTypeConfirm] = useState<number | null>(
    null
  );
  const [deleteServiceConfirm, setDeleteServiceConfirm] = useState<
    number | null
  >(null);

  // Toast helper
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  // Fetch all services on mount
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const json = await apiFetch("/api/services");
      setData(json.data ?? []);
    } catch (err: any) {
      showToast(err.message ?? "Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  };

  const current = data[activeTab];
  const filtered = current?.services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );
  const totalServices = data.flatMap((t) => t.services).length;

  // Add Service Type
  const handleAddType = async () => {
    const name = addTypeInput.trim();
    if (!name || submitting) return;
    setSubmitting(true);
    try {
      const json = await apiFetch("/api/services/types", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      const newType: ServiceType = { ...json.data, services: [] };
      setData((prev) => [...prev, newType]);
      setActiveTab(data.length);
      setAddTypeInput("");
      setAddTypeOpen(false);
      showToast(`Service type "${name}" berhasil ditambahkan`);
    } catch (err: any) {
      showToast(err.message ?? "Gagal menambah type", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Service Type
  const handleDeleteType = async (typeId: number) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/services/types/${typeId}`, { method: "DELETE" });
      const newData = data.filter((t) => t.id !== typeId);
      setData(newData);
      if (activeTab >= newData.length)
        setActiveTab(Math.max(0, newData.length - 1));
      setDeleteTypeConfirm(null);
      showToast("Service type berhasil dihapus");
    } catch (err: any) {
      showToast(err.message ?? "Gagal menghapus type", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Add Service Name
  const handleAddService = async () => {
    const name = addServiceInput.trim();
    if (!name || !current || submitting) return;
    setSubmitting(true);
    try {
      const json = await apiFetch(`/api/services/types/${current.id}/names`, {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      setData((prev) =>
        prev.map((t) =>
          t.id === current.id
            ? { ...t, services: [...t.services, json.data] }
            : t
        )
      );
      setAddServiceInput("");
      setAddServiceOpen(false);
      showToast(`Service "${name}" berhasil ditambahkan`);
    } catch (err: any) {
      showToast(err.message ?? "Gagal menambah service", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Service Name
  const handleEditOpen = (service: ServiceItem) => {
    setEditTarget(service);
    setEditInput(service.name);
    setEditServiceOpen(true);
  };

  const handleEditSave = async () => {
    if (!editTarget || !editInput.trim() || submitting) return;
    setSubmitting(true);
    try {
      const json = await apiFetch(`/api/services/names/${editTarget.id}`, {
        method: "PUT",
        body: JSON.stringify({ name: editInput.trim() }),
      });
      setData((prev) =>
        prev.map((t) => ({
          ...t,
          services: t.services.map((s) =>
            s.id === editTarget.id ? { ...s, name: json.data.name } : s
          ),
        }))
      );
      setEditServiceOpen(false);
      showToast("Nama service berhasil diperbarui");
    } catch (err: any) {
      showToast(err.message ?? "Gagal memperbarui service", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Service Name
  const handleDeleteService = async (serviceId: number) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/services/names/${serviceId}`, { method: "DELETE" });
      setData((prev) =>
        prev.map((t) => ({
          ...t,
          services: t.services.filter((s) => s.id !== serviceId),
        }))
      );
      setDeleteServiceConfirm(null);
      showToast("Service berhasil dihapus");
    } catch (err: any) {
      showToast(err.message ?? "Gagal menghapus service", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Render
  return (
    <div className={styles.page}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Header */}
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>Service Management</h1>
          <p className={styles.pageSubtitle}>
            Kelola semua tipe dan nama service cabang
          </p>
        </div>
        <button
          className={styles.btnPrimary}
          onClick={() => setAddTypeOpen(true)}
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Tambah Service Type
        </button>
      </div>

      <div className={styles.statRow}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "#eff6ff" }}>
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="#2563eb"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <div>
            <p className={styles.statLabel}>Total Type</p>
            <p className={styles.statValue}>{data.length}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "#f0fdf4" }}>
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="#16a34a"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <div>
            <p className={styles.statLabel}>Total Service</p>
            <p className={styles.statValue} style={{ color: "#16a34a" }}>
              {totalServices}
            </p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "#fefce8" }}>
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="#ca8a04"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h10"
              />
            </svg>
          </div>
          <div>
            <p className={styles.statLabel}>Service di Tab Ini</p>
            <p className={styles.statValue} style={{ color: "#ca8a04" }}>
              {current?.services.length ?? 0}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : data.length === 0 ? (
        <div className={styles.empty}>
          <svg
            width="48"
            height="48"
            fill="none"
            stroke="#d1d5db"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p>Belum ada service type</p>
          <span>Klik "Tambah Service Type" untuk memulai</span>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className={styles.tabsWrapper}>
            <div className={styles.tabs}>
              {data.map((t, i) => (
                <button
                  key={t.id}
                  className={`${styles.tab} ${
                    activeTab === i ? styles.tabActive : ""
                  }`}
                  onClick={() => {
                    setActiveTab(i);
                    setSearch("");
                  }}
                >
                  {t.name}
                  <span
                    className={`${styles.tabBadge} ${
                      activeTab === i ? styles.tabBadgeActive : ""
                    }`}
                  >
                    {t.services.length}
                  </span>
                  <span
                    className={styles.tabX}
                    title="Hapus type"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTypeConfirm(t.id);
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Section header */}
          <div className={styles.sectionBar}>
            <div className={styles.sectionLeft}>
              <span className={styles.sectionDot} />
              <span className={styles.sectionLabel}>
                Daftar service di <strong>{current?.name}</strong>
                <span className={styles.sectionCount}>
                  {current?.services.length} service
                </span>
              </span>
            </div>
            <button
              className={styles.btnOutline}
              onClick={() => setAddServiceOpen(true)}
            >
              <svg
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Tambah Nama Service
            </button>
          </div>

          {/* Search */}
          <div className={styles.searchWrap}>
            <svg
              width="15"
              height="15"
              fill="none"
              stroke="#9ca3af"
              viewBox="0 0 24 24"
              style={{ flexShrink: 0 }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1111 5a6 6 0 016 6z"
              />
            </svg>
            <input
              className={styles.searchInput}
              type="text"
              placeholder={`Cari service di ${current?.name}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className={styles.searchClear}
                onClick={() => setSearch("")}
              >
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* List */}
          <div className={styles.list}>
            {filtered?.length === 0 && (
              <div className={styles.empty}>
                <svg
                  width="40"
                  height="40"
                  fill="none"
                  stroke="#d1d5db"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p>Tidak ada service ditemukan</p>
                <span>Coba kata kunci lain atau tambah service baru</span>
              </div>
            )}

            {filtered?.map((svc, idx) => (
              <div
                key={svc.id}
                className={`${styles.card} ${
                  deleteServiceConfirm === svc.id ? styles.cardDanger : ""
                }`}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {/* Avatar */}
                <div
                  className={`${styles.cardAvatar} ${styles.cardAvatarActive}`}
                >
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="#2563eb"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>

                {/* Body */}
                <div className={styles.cardBody}>
                  <p className={styles.cardName}>{svc.name}</p>
                  <p className={styles.cardMeta}>
                    Ditambahkan:{" "}
                    {new Date(svc.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                {/* Actions */}
                {deleteServiceConfirm === svc.id ? (
                  <div className={styles.confirmRow}>
                    <span className={styles.confirmText}>Hapus?</span>
                    <button
                      className={styles.btnConfirmYes}
                      onClick={() => handleDeleteService(svc.id)}
                      disabled={submitting}
                    >
                      {submitting ? "..." : "Ya"}
                    </button>
                    <button
                      className={styles.btnConfirmNo}
                      onClick={() => setDeleteServiceConfirm(null)}
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <div className={styles.cardActions}>
                    <button
                      className={styles.iconBtn}
                      title="Edit nama"
                      onClick={() => handleEditOpen(svc)}
                    >
                      <svg
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536M9 13l6.5-6.5a2 2 0 012.828 2.828L11.828 15.828a4 4 0 01-1.414.828L7 17l.344-3.414a4 4 0 01.828-1.414z"
                        />
                      </svg>
                    </button>
                    <button
                      className={`${styles.iconBtn} ${styles.iconBtnRed}`}
                      title="Hapus"
                      onClick={() => setDeleteServiceConfirm(svc.id)}
                    >
                      <svg
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a1 1 0 00-1-1h-4a1 1 0 00-1 1m-4 0h10"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Tambah Service Type */}
      <Modal
        open={addTypeOpen}
        onClose={() => {
          setAddTypeOpen(false);
          setAddTypeInput("");
        }}
        title="Tambah Service Type"
      >
        <div className={styles.modalBody}>
          <label className={styles.fieldLabel}>Nama Type</label>
          <input
            className={styles.fieldInput}
            type="text"
            placeholder="contoh: Yoga, Zumba, Aquatic..."
            value={addTypeInput}
            onChange={(e) => setAddTypeInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddType()}
            autoFocus
          />
        </div>
        <div className={styles.modalFooter}>
          <button
            className={styles.btnGhost}
            onClick={() => {
              setAddTypeOpen(false);
              setAddTypeInput("");
            }}
          >
            Batal
          </button>
          <button
            className={styles.btnPrimary}
            onClick={handleAddType}
            disabled={!addTypeInput.trim() || submitting}
          >
            {submitting ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </Modal>

      {/* Tambah Nama Service */}
      <Modal
        open={addServiceOpen}
        onClose={() => {
          setAddServiceOpen(false);
          setAddServiceInput("");
        }}
        title={`Tambah Service ke ${current?.name}`}
      >
        <div className={styles.modalBody}>
          <label className={styles.fieldLabel}>Nama Service</label>
          <input
            className={styles.fieldInput}
            type="text"
            placeholder="contoh: Treadmill, Dumbbell, Reformer..."
            value={addServiceInput}
            onChange={(e) => setAddServiceInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddService()}
            autoFocus
          />
        </div>
        <div className={styles.modalFooter}>
          <button
            className={styles.btnGhost}
            onClick={() => {
              setAddServiceOpen(false);
              setAddServiceInput("");
            }}
          >
            Batal
          </button>
          <button
            className={styles.btnPrimary}
            onClick={handleAddService}
            disabled={!addServiceInput.trim() || submitting}
          >
            {submitting ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </Modal>

      {/* Edit Nama Service */}
      <Modal
        open={editServiceOpen}
        onClose={() => setEditServiceOpen(false)}
        title="Edit Nama Service"
      >
        <div className={styles.modalBody}>
          <label className={styles.fieldLabel}>Nama Service</label>
          <input
            className={styles.fieldInput}
            type="text"
            value={editInput}
            onChange={(e) => setEditInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEditSave()}
            autoFocus
          />
        </div>
        <div className={styles.modalFooter}>
          <button
            className={styles.btnGhost}
            onClick={() => setEditServiceOpen(false)}
          >
            Batal
          </button>
          <button
            className={styles.btnPrimary}
            onClick={handleEditSave}
            disabled={!editInput.trim() || submitting}
          >
            {submitting ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </Modal>

      {/* Konfirmasi Hapus Type */}
      <Modal
        open={deleteTypeConfirm !== null}
        onClose={() => setDeleteTypeConfirm(null)}
        title="Hapus Service Type"
      >
        <div className={styles.modalBody}>
          <p className={styles.confirmMsg}>
            Semua service di dalam type ini akan ikut terhapus. Tindakan ini
            tidak bisa dibatalkan.
          </p>
        </div>
        <div className={styles.modalFooter}>
          <button
            className={styles.btnGhost}
            onClick={() => setDeleteTypeConfirm(null)}
          >
            Batal
          </button>
          <button
            className={styles.btnDanger}
            onClick={() =>
              deleteTypeConfirm !== null && handleDeleteType(deleteTypeConfirm)
            }
            disabled={submitting}
          >
            {submitting ? "Menghapus..." : "Ya, Hapus"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

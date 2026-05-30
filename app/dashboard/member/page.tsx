"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FiEdit2, FiTrash2, FiPlus, FiCheck, FiX } from "react-icons/fi";
import { BsCreditCard2Front } from "react-icons/bs";
import {
  membershipAPI,
  serviceAPI,
  Membership,
  ServiceType,
} from "../../lib/api";
import "./member.css";

interface FormState {
  name: string;
  price: string;
  active_days: string;
  description: string;
  benefit_ids: Set<number>;
}

interface ModalState {
  isOpen: boolean;
  mode: "add" | "edit";
  editId?: number;
  form: FormState;
  isLoading: boolean;
  error: string;
}

interface DeleteModalState {
  isOpen: boolean;
  membershipId: number;
  targetName: string;
  isLoading: boolean;
  error: string;
}

const emptyForm = (): FormState => ({
  name: "",
  price: "",
  active_days: "",
  description: "",
  benefit_ids: new Set<number>(),
});

const formatRupiah = (num: number) => "Rp " + num.toLocaleString("id-ID");

const LEVEL_THEMES = [
  { gradient: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)", badge: "#dbeafe", badgeText: "#1e40af" },
  { gradient: "linear-gradient(135deg, #065f46 0%, #10b981 100%)", badge: "#d1fae5", badgeText: "#065f46" },
  { gradient: "linear-gradient(135deg, #92400e 0%, #f59e0b 100%)", badge: "#fef3c7", badgeText: "#92400e" },
  { gradient: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)", badge: "#ede9fe", badgeText: "#5b21b6" },
  { gradient: "linear-gradient(135deg, #be185d 0%, #f472b6 100%)", badge: "#fce7f3", badgeText: "#9d174d" },
  { gradient: "linear-gradient(135deg, #0e7490 0%, #22d3ee 100%)", badge: "#cffafe", badgeText: "#0e7490" },
];

export default function MembershipPage() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    mode: "add",
    form: emptyForm(),
    isLoading: false,
    error: "",
  });

  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    membershipId: 0,
    targetName: "",
    isLoading: false,
    error: "",
  });

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setPageError("");
    try {
      const [membershipRes, serviceRes] = await Promise.all([
        membershipAPI.getAll(),
        serviceAPI.getAll(),
      ]);
      setMemberships(membershipRes.data);
      setServiceTypes(serviceRes.data);
    } catch (err: unknown) {
      setPageError(err instanceof Error ? err.message : "Gagal memuat data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAddModal = () =>
    setModal({ isOpen: true, mode: "add", form: emptyForm(), isLoading: false, error: "" });

  const openEditModal = (m: Membership) =>
    setModal({
      isOpen: true,
      mode: "edit",
      editId: m.id,
      form: {
        name: m.name,
        price: String(m.price),
        active_days: String(m.active_days),
        description: m.description || "",
        benefit_ids: new Set(m.benefits.map((b) => b.id)),
      },
      isLoading: false,
      error: "",
    });

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setModal((prev) => ({ ...prev, form: { ...prev.form, [name]: value } }));
  };

  const handleBenefitToggle = (id: number) => {
    setModal((prev) => {
      const newSet = new Set(prev.form.benefit_ids);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return { ...prev, form: { ...prev.form, benefit_ids: newSet } };
    });
  };

  const handleSave = async () => {
    const { name, price, active_days, description, benefit_ids } = modal.form;
    if (!name.trim()) { setModal((p) => ({ ...p, error: "Nama membership wajib diisi" })); return; }
    if (!price || isNaN(Number(price)) || Number(price) < 0) { setModal((p) => ({ ...p, error: "Harga tidak valid" })); return; }
    if (!active_days || isNaN(Number(active_days)) || Number(active_days) < 1) { setModal((p) => ({ ...p, error: "Masa aktif minimal 1 hari" })); return; }

    setModal((p) => ({ ...p, isLoading: true, error: "" }));
    const payload = {
      name: name.trim(), price: Number(price),
      active_days: Number(active_days),
      description: description.trim(),
      benefit_ids: Array.from(benefit_ids),
    };

    try {
      if (modal.mode === "add") {
        const res = await membershipAPI.create(payload);
        setMemberships((p) => [...p, res.data]);
      } else if (modal.mode === "edit" && modal.editId) {
        const res = await membershipAPI.update(modal.editId, payload);
        setMemberships((p) => p.map((m) => (m.id === modal.editId ? res.data : m)));
      }
      setModal((p) => ({ ...p, isOpen: false }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      setModal((p) => ({ ...p, error: message, isLoading: false }));
    }
  };

  const openDeleteModal = (m: Membership) =>
    setDeleteModal({ isOpen: true, membershipId: m.id, targetName: m.name, isLoading: false, error: "" });

  const confirmDelete = async () => {
    setDeleteModal((p) => ({ ...p, isLoading: true, error: "" }));
    try {
      await membershipAPI.delete(deleteModal.membershipId);
      setMemberships((p) => {
        const filtered = p.filter((m) => m.id !== deleteModal.membershipId);
        return filtered.map((m, idx) => ({ ...m, level: idx + 1 }));
      });
      setDeleteModal((p) => ({ ...p, isOpen: false }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal menghapus";
      setDeleteModal((p) => ({ ...p, error: message, isLoading: false }));
    }
  };

  const getTheme = (level: number) => LEVEL_THEMES[(level - 1) % LEVEL_THEMES.length];

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
        <div style={{ width: 48, height: 48, border: "3px solid #e5e7eb", borderTop: "3px solid #3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>Memuat data membership...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (pageError) {
    return (
      <div style={{ padding: "32px 24px" }}>
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <FiX color="#ef4444" size={20} />
          <span style={{ color: "#dc2626", fontSize: 14, flex: 1 }}>{pageError}</span>
          <button onClick={fetchAll} style={{ background: "white", border: "1px solid #fecaca", borderRadius: 8, padding: "6px 16px", fontSize: 13, color: "#dc2626", cursor: "pointer" }}>
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="membership-page member-root">
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div className="page-header-accent" />
            <h4 className="page-title">Manajemen Membership</h4>
          </div>
          <p className="page-subtitle">{memberships.length} paket membership terdaftar</p>
        </div>
        <button className="btn-primary-custom" onClick={openAddModal}>
          <FiPlus size={16} /> Tambah Membership
        </button>
      </div>

      {/*Empty*/}
      {memberships.length === 0 ? (
        <div className="empty-state-wrapper">
          <div className="empty-state">
            <div className="empty-icon-wrap">
              <BsCreditCard2Front size={36} color="#3b82f6" />
            </div>
            <h6 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
              Belum ada paket membership
            </h6>
            <p style={{ fontSize: 14, color: "#9ca3af", margin: "0 0 20px", maxWidth: 280 }}>
              Mulai buat paket membership pertama untuk gym Anda sekarang.
            </p>
            <button className="btn-primary-custom" onClick={openAddModal}>
              <FiPlus size={15} /> Tambah Membership
            </button>
          </div>
        </div>
      ) : (
        <div className="grid-container">
          {memberships.map((m) => {
            const theme = getTheme(m.level);
            return (
              <div className="membership-card" key={m.id}>
                <div className="card-header-band" style={{ background: theme.gradient }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <span className="level-pill">✦ Level {m.level}</span>
                    <span className="days-pill">{m.active_days} Hari</span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "white", marginBottom: 2, position: "relative", zIndex: 1 }}>
                    {m.name}
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "rgba(255,255,255,0.85)", position: "relative", zIndex: 1 }}>
                    {formatRupiah(m.price)}
                  </div>
                </div>

                <div className="card-body-section">
                  {m.description && <p className="card-desc">{m.description}</p>}
                  {m.benefits.length > 0 && (
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.6px", margin: "0 0 8px" }}>
                        Keuntungan
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {m.benefits.map((b) => (
                          <span key={b.id} className="benefit-chip" style={{ background: theme.badge, color: theme.badgeText }}>
                            <FiCheck size={11} style={{ flexShrink: 0 }} /> {b.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="card-actions">
                  <button className="btn-edit" onClick={() => openEditModal(m)}>
                    <FiEdit2 size={14} /> Edit
                  </button>
                  <button className="btn-delete" onClick={() => openDeleteModal(m)}>
                    <FiTrash2 size={14} /> Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/*EDIT*/}
      {modal.isOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !modal.isLoading) setModal((p) => ({ ...p, isOpen: false })); }}>
          <div className="modal-box">
            <div className="modal-header-custom">
              <div>
                <p className="modal-title-custom">
                  {modal.mode === "add" ? "Tambah Membership Baru" : "Edit Membership"}
                </p>
                <p className="modal-subtitle">
                  {modal.mode === "add" ? "Isi detail paket membership baru" : "Perbarui informasi paket membership"}
                </p>
              </div>
              <button className="btn-close-custom" onClick={() => !modal.isLoading && setModal((p) => ({ ...p, isOpen: false }))}>
                <FiX size={16} />
              </button>
            </div>

            <div className="modal-body-custom">
              {modal.error && (
                <div className="error-alert">
                  <FiX size={15} style={{ flexShrink: 0 }} /> {modal.error}
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label className="form-label-custom">Nama Membership <span style={{ color: "#ef4444" }}>*</span></label>
                <input type="text" className="form-input-custom" name="name" value={modal.form.name} onChange={handleInput} placeholder="Contoh: Paket Pemula" disabled={modal.isLoading} autoFocus />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="form-label-custom">Harga <span style={{ color: "#ef4444" }}>*</span></label>
                <div className="input-group-custom">
                  <span className="input-addon">Rp</span>
                  <input type="number" className="form-input-custom" name="price" value={modal.form.price} onChange={handleInput} placeholder="150000" min={0} disabled={modal.isLoading} style={{ borderRadius: "0 12px 12px 0" }} />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="form-label-custom">Masa Aktif <span style={{ color: "#ef4444" }}>*</span></label>
                <div className="input-group-custom">
                  <input type="number" className="form-input-custom" name="active_days" value={modal.form.active_days} onChange={handleInput} placeholder="30" min={1} disabled={modal.isLoading} style={{ borderRadius: "12px 0 0 12px" }} />
                  <span className="input-addon input-addon-right">Hari</span>
                </div>
                <p className="form-hint">Contoh: 28 hari, 90 hari, 365 hari</p>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="form-label-custom">Deskripsi</label>
                <textarea className="form-input-custom" name="description" rows={2} value={modal.form.description} onChange={handleInput} placeholder="Deskripsi singkat paket..." disabled={modal.isLoading} style={{ resize: "vertical" }} />
              </div>

              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <label className="form-label-custom" style={{ margin: 0 }}>Keuntungan Membership</label>
                  {modal.form.benefit_ids.size > 0 && (
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#3b82f6", background: "#eff6ff", padding: "2px 10px", borderRadius: 100 }}>
                      {modal.form.benefit_ids.size} dipilih
                    </span>
                  )}
                </div>

                {serviceTypes.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#9ca3af" }}>Belum ada service. Tambahkan service terlebih dahulu.</p>
                ) : (
                  <div className="benefit-scroll-box">
                    {serviceTypes.map((type, ti) => (
                      <div key={type.id}>
                        {ti > 0 && <div className="divider" />}
                        <p className="benefit-type-header">{type.name}</p>
                        {type.services.length === 0 ? (
                          <p style={{ fontSize: 12, color: "#9ca3af", padding: "4px 16px 10px" }}>Belum ada service</p>
                        ) : (
                          type.services.map((sn) => {
                            const checked = modal.form.benefit_ids.has(sn.id);
                            return (
                              <div key={sn.id} className="benefit-item" onClick={() => !modal.isLoading && handleBenefitToggle(sn.id)}>
                                <div className={`custom-checkbox ${checked ? "checked" : ""}`}>
                                  {checked && <FiCheck size={11} color="white" />}
                                </div>
                                <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{sn.name}</span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer-custom">
              <button className="btn-cancel" onClick={() => !modal.isLoading && setModal((p) => ({ ...p, isOpen: false }))} disabled={modal.isLoading}>
                Batal
              </button>
              <button className="btn-save" onClick={handleSave} disabled={modal.isLoading}>
                {modal.isLoading ? (
                  <><div className="modal-spinner" /> Menyimpan...</>
                ) : (
                  <>{modal.mode === "add" ? <FiPlus size={16} /> : <FiCheck size={16} />} {modal.mode === "add" ? "Tambah Membership" : "Simpan Perubahan"}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal.isOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !deleteModal.isLoading) setDeleteModal((p) => ({ ...p, isOpen: false })); }}>
          <div className="modal-box" style={{ maxWidth: 400 }}>
            <div style={{ padding: "32px 28px 20px", textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: "linear-gradient(135deg, #fef2f2, #fee2e2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <FiTrash2 size={28} color="#dc2626" />
              </div>
              <h5 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: "0 0 8px" }}>Hapus Membership?</h5>
              <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 4px" }}>Anda yakin ingin menghapus</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: "0 0 16px" }}>
                &ldquo;{deleteModal.targetName}&rdquo;?
              </p>

              {deleteModal.error && (
                <div className="error-alert" style={{ textAlign: "left" }}>
                  <FiX size={14} style={{ flexShrink: 0 }} /> {deleteModal.error}
                </div>
              )}

              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#92400e", textAlign: "left" }}>
                ⚠️ Level membership di atasnya akan otomatis diperbarui.
              </div>
            </div>

            <div className="modal-footer-custom" style={{ paddingTop: 0 }}>
              <button className="btn-cancel" onClick={() => !deleteModal.isLoading && setDeleteModal((p) => ({ ...p, isOpen: false }))} disabled={deleteModal.isLoading}>
                Batal
              </button>
              <button className="btn-danger-custom" onClick={confirmDelete} disabled={deleteModal.isLoading}>
                {deleteModal.isLoading ? (
                  <><div className="modal-spinner" /> Menghapus...</>
                ) : (
                  <><FiTrash2 size={15} /> Ya, Hapus</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
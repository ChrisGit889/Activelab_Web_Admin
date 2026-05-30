"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Spinner } from "react-bootstrap";
import { FiEdit2, FiTrash2, FiPlus, FiCheck, FiX } from "react-icons/fi";
import { BsCreditCard2Front } from "react-icons/bs";
import {
  membershipAPI,
  serviceAPI,
  Membership,
  ServiceType,
} from "../../lib/api";

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
  {
    gradient: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
    accent: "#60a5fa",
    badge: "#dbeafe",
    badgeText: "#1e40af",
  },
  {
    gradient: "linear-gradient(135deg, #065f46 0%, #10b981 100%)",
    accent: "#34d399",
    badge: "#d1fae5",
    badgeText: "#065f46",
  },
  {
    gradient: "linear-gradient(135deg, #92400e 0%, #f59e0b 100%)",
    accent: "#fcd34d",
    badge: "#fef3c7",
    badgeText: "#92400e",
  },
  {
    gradient: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
    accent: "#c4b5fd",
    badge: "#ede9fe",
    badgeText: "#5b21b6",
  },
  {
    gradient: "linear-gradient(135deg, #be185d 0%, #f472b6 100%)",
    accent: "#fbcfe8",
    badge: "#fce7f3",
    badgeText: "#9d174d",
  },
  {
    gradient: "linear-gradient(135deg, #0e7490 0%, #22d3ee 100%)",
    accent: "#67e8f9",
    badge: "#cffafe",
    badgeText: "#0e7490",
  },
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

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openAddModal = () => {
    setModal({
      isOpen: true,
      mode: "add",
      form: emptyForm(),
      isLoading: false,
      error: "",
    });
  };

  const openEditModal = (m: Membership) => {
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
  };

  const handleInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setModal((prev) => ({ ...prev, form: { ...prev.form, [name]: value } }));
  };

  const handleBenefitToggle = (serviceNameId: number) => {
    setModal((prev) => {
      const newSet = new Set(prev.form.benefit_ids);
      if (newSet.has(serviceNameId)) newSet.delete(serviceNameId);
      else newSet.add(serviceNameId);
      return { ...prev, form: { ...prev.form, benefit_ids: newSet } };
    });
  };

  const handleSave = async () => {
    const { name, price, active_days, description, benefit_ids } = modal.form;
    if (!name.trim()) {
      setModal((prev) => ({ ...prev, error: "Nama membership wajib diisi" }));
      return;
    }
    if (!price || isNaN(Number(price)) || Number(price) < 0) {
      setModal((prev) => ({ ...prev, error: "Harga tidak valid" }));
      return;
    }
    if (!active_days || isNaN(Number(active_days)) || Number(active_days) < 1) {
      setModal((prev) => ({ ...prev, error: "Masa aktif minimal 1 hari" }));
      return;
    }

    setModal((prev) => ({ ...prev, isLoading: true, error: "" }));
    const payload = {
      name: name.trim(),
      price: Number(price),
      active_days: Number(active_days),
      description: description.trim(),
      benefit_ids: Array.from(benefit_ids),
    };

    try {
      if (modal.mode === "add") {
        const res = await membershipAPI.create(payload);
        setMemberships((prev) => [...prev, res.data]);
      } else if (modal.mode === "edit" && modal.editId) {
        const res = await membershipAPI.update(modal.editId, payload);
        setMemberships((prev) =>
          prev.map((m) => (m.id === modal.editId ? res.data : m))
        );
      }
      setModal((prev) => ({ ...prev, isOpen: false }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      setModal((prev) => ({ ...prev, error: message, isLoading: false }));
    }
  };

  const openDeleteModal = (m: Membership) => {
    setDeleteModal({
      isOpen: true,
      membershipId: m.id,
      targetName: m.name,
      isLoading: false,
      error: "",
    });
  };

  const confirmDelete = async () => {
    setDeleteModal((prev) => ({ ...prev, isLoading: true, error: "" }));
    try {
      await membershipAPI.delete(deleteModal.membershipId);
      setMemberships((prev) => {
        const filtered = prev.filter((m) => m.id !== deleteModal.membershipId);
        return filtered.map((m, idx) => ({ ...m, level: idx + 1 }));
      });
      setDeleteModal((prev) => ({ ...prev, isOpen: false }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal menghapus";
      setDeleteModal((prev) => ({ ...prev, error: message, isLoading: false }));
    }
  };

  const getTheme = (level: number) =>
    LEVEL_THEMES[(level - 1) % LEVEL_THEMES.length];

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            border: "3px solid #e5e7eb",
            borderTop: "3px solid #3b82f6",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>
          Memuat data membership...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (pageError) {
    return (
      <div style={{ padding: "32px 24px" }}>
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 12,
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <FiX color="#ef4444" size={20} />
          <span style={{ color: "#dc2626", fontSize: 14, flex: 1 }}>
            {pageError}
          </span>
          <button
            onClick={fetchAll}
            style={{
              background: "white",
              border: "1px solid #fecaca",
              borderRadius: 8,
              padding: "6px 16px",
              fontSize: 13,
              color: "#dc2626",
              cursor: "pointer",
            }}
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .membership-page * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }

        /* ── Page header ── */
        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
          gap: 16px;
          flex-wrap: wrap;
        }

        /* ── Empty state: full-height centering ── */
        .empty-state-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 180px);
          padding: 40px 16px;
        }

        .membership-card {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.06);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          display: flex;
          flex-direction: column;
        }
        .membership-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        }

        .card-header-band {
          padding: 24px 24px 20px;
          position: relative;
          overflow: hidden;
        }
        .card-header-band::after {
          content: '';
          position: absolute;
          bottom: -24px;
          right: -24px;
          width: 100px;
          height: 100px;
          background: rgba(255,255,255,0.1);
          border-radius: 50%;
        }
        .card-header-band::before {
          content: '';
          position: absolute;
          top: -20px;
          right: 40px;
          width: 60px;
          height: 60px;
          background: rgba(255,255,255,0.08);
          border-radius: 50%;
        }

        .level-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          background: rgba(255,255,255,0.2);
          color: white;
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.25);
        }

        .days-pill {
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 600;
          background: rgba(255,255,255,0.2);
          color: white;
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.25);
        }

        .card-body-section {
          padding: 20px 24px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .card-name {
          font-size: 18px;
          font-weight: 800;
          color: #111827;
          margin: 0;
          line-height: 1.3;
        }

        .card-price {
          font-size: 22px;
          font-weight: 800;
          margin: 0;
        }

        .card-desc {
          font-size: 13px;
          color: #6b7280;
          line-height: 1.6;
          margin: 0;
        }

        .benefit-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
        }

        .card-actions {
          padding: 0 24px 20px;
          display: flex;
          gap: 10px;
        }

        .btn-edit {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          border: 1.5px solid #e5e7eb;
          background: white;
          color: #374151;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-edit:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
        }

        .btn-delete {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          border: 1.5px solid #fee2e2;
          background: #fff5f5;
          color: #dc2626;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-delete:hover {
          background: #fee2e2;
          border-color: #fca5a5;
        }

        .btn-primary-custom {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 22px;
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(59,130,246,0.35);
          font-family: 'Plus Jakarta Sans', sans-serif;
          white-space: nowrap;
        }
        .btn-primary-custom:hover {
          background: linear-gradient(135deg, #1d4ed8, #2563eb);
          box-shadow: 0 6px 20px rgba(59,130,246,0.45);
          transform: translateY(-1px);
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15,23,42,0.55);
          backdrop-filter: blur(4px);
          z-index: 1050;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: fadeIn 0.2s ease;
          overflow-y: auto;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .modal-box {
          background: white;
          border-radius: 24px;
          width: 100%;
          max-width: 520px;
          max-height: 92vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 24px 64px rgba(0,0,0,0.2);
          animation: slideUp 0.25s ease;
          margin: auto;
        }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .modal-header-custom {
          padding: 24px 28px 0;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }

        .modal-title-custom {
          font-size: 20px;
          font-weight: 800;
          color: #111827;
          margin: 0;
        }

        .modal-subtitle {
          font-size: 13px;
          color: #9ca3af;
          margin: 4px 0 0;
        }

        .btn-close-custom {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1.5px solid #e5e7eb;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .btn-close-custom:hover { background: #f3f4f6; color: #111827; }

        .modal-body-custom {
          padding: 20px 28px;
          overflow-y: auto;
          flex: 1;
        }

        .form-label-custom {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 6px;
          display: block;
        }

        .form-input-custom {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          font-size: 14px;
          color: #111827;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: white;
        }
        .form-input-custom:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        .form-input-custom::placeholder { color: #d1d5db; }

        .input-group-custom {
          display: flex;
          gap: 0;
        }
        .input-addon {
          padding: 11px 14px;
          background: #f9fafb;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px 0 0 12px;
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
          white-space: nowrap;
        }
        .input-addon-right {
          border-radius: 0 12px 12px 0;
          border-left: none;
        }
        .input-addon + .form-input-custom {
          border-radius: 0 12px 12px 0;
          border-left: none;
        }
        .form-input-custom + .input-addon {
          border-radius: 0 12px 12px 0;
          border-left: none;
        }

        .benefit-scroll-box {
          border: 1.5px solid #e5e7eb;
          border-radius: 14px;
          max-height: 220px;
          overflow-y: auto;
          background: #fafafa;
        }
        .benefit-scroll-box::-webkit-scrollbar { width: 4px; }
        .benefit-scroll-box::-webkit-scrollbar-track { background: transparent; }
        .benefit-scroll-box::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }

        .benefit-type-header {
          padding: 10px 16px 6px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #3b82f6;
          position: sticky;
          top: 0;
          background: #fafafa;
        }

        .benefit-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          cursor: pointer;
          transition: background 0.12s;
        }
        .benefit-item:hover { background: #f3f4f6; }

        .custom-checkbox {
          width: 18px;
          height: 18px;
          border-radius: 5px;
          border: 1.5px solid #d1d5db;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.15s;
        }
        .custom-checkbox.checked {
          background: #3b82f6;
          border-color: #3b82f6;
        }

        .modal-footer-custom {
          padding: 16px 28px 24px;
          display: flex;
          gap: 10px;
        }

        .btn-cancel {
          flex: 1;
          padding: 12px;
          border: 1.5px solid #e5e7eb;
          border-radius: 14px;
          background: white;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          transition: all 0.15s;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .btn-cancel:hover { background: #f3f4f6; }

        .btn-save {
          flex: 2;
          padding: 12px;
          border: none;
          border-radius: 14px;
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          font-size: 14px;
          font-weight: 700;
          color: white;
          cursor: pointer;
          transition: all 0.15s;
          font-family: 'Plus Jakarta Sans', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(59,130,246,0.3);
        }
        .btn-save:hover { opacity: 0.92; }
        .btn-save:disabled, .btn-cancel:disabled { opacity: 0.6; cursor: not-allowed; }

        .btn-danger-custom {
          flex: 2;
          padding: 12px;
          border: none;
          border-radius: 14px;
          background: linear-gradient(135deg, #dc2626, #ef4444);
          font-size: 14px;
          font-weight: 700;
          color: white;
          cursor: pointer;
          transition: all 0.15s;
          font-family: 'Plus Jakarta Sans', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(239,68,68,0.3);
        }
        .btn-danger-custom:hover { opacity: 0.92; }
        .btn-danger-custom:disabled { opacity: 0.6; cursor: not-allowed; }

        .error-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          font-size: 13px;
          color: #dc2626;
          margin-bottom: 16px;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .empty-icon-wrap {
          width: 80px;
          height: 80px;
          border-radius: 24px;
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .form-hint {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 5px;
        }

        .divider { height: 1px; background: #f3f4f6; margin: 4px 0; }

        .grid-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        /* ── Responsive breakpoints ── */

        /* Tablet (768px ke bawah) */
        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .page-header .btn-primary-custom {
            width: 100%;
          }
          .grid-container {
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          .empty-state-wrapper {
            min-height: calc(100vh - 140px);
          }
          .modal-box {
            border-radius: 20px;
            max-height: 95vh;
          }
        }

        /* Mobile (640px ke bawah) */
        @media (max-width: 640px) {
          .grid-container { grid-template-columns: 1fr; }
          .modal-overlay { padding: 0; align-items: flex-end; }
          .modal-box {
            border-radius: 24px 24px 0 0;
            max-height: 95vh;
            max-width: 100%;
          }
        }

        /* Small mobile (480px ke bawah) */
        @media (max-width: 480px) {
          .card-header-band { padding: 18px 18px 16px; }
          .card-body-section { padding: 16px 18px; }
          .card-actions { padding: 0 18px 16px; }
        }
      `}</style>

      <div
        className="membership-page"
        style={{ padding: "24px 20px", width: "100%", maxWidth: 1100 }}
      >
        {/* ── Header ── */}
        <div className="page-header">
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  width: 4,
                  height: 28,
                  background: "linear-gradient(to bottom, #2563eb, #60a5fa)",
                  borderRadius: 4,
                  flexShrink: 0,
                }}
              />
              <h4
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#111827",
                  margin: 0,
                }}
              >
                Manajemen Membership
              </h4>
            </div>
            <p
              style={{
                fontSize: 14,
                color: "#9ca3af",
                margin: 0,
                paddingLeft: 14,
              }}
            >
              {memberships.length} paket membership terdaftar
            </p>
          </div>
          <button className="btn-primary-custom" onClick={openAddModal}>
            <FiPlus size={16} />
            Tambah Membership
          </button>
        </div>

        {/* ── Grid / Empty ── */}
        {memberships.length === 0 ? (
          <div className="empty-state-wrapper">
            <div className="empty-state" style={{ padding: 0 }}>
              <div className="empty-icon-wrap">
                <BsCreditCard2Front size={36} color="#3b82f6" />
              </div>
              <h6
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#111827",
                  margin: "0 0 8px",
                }}
              >
                Belum ada paket membership
              </h6>
              <p
                style={{
                  fontSize: 14,
                  color: "#9ca3af",
                  margin: "0 0 20px",
                  maxWidth: 280,
                }}
              >
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
                  <div
                    className="card-header-band"
                    style={{ background: theme.gradient }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 16,
                      }}
                    >
                      <span className="level-pill">✦ Level {m.level}</span>
                      <span className="days-pill">{m.active_days} Hari</span>
                    </div>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: "white",
                        marginBottom: 2,
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      {m.name}
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.85)",
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      {formatRupiah(m.price)}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="card-body-section">
                    {m.description && (
                      <p className="card-desc">{m.description}</p>
                    )}
                    {m.benefits.length > 0 && (
                      <div>
                        <p
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: "0.6px",
                            margin: "0 0 8px",
                          }}
                        >
                          Keuntungan
                        </p>
                        <div
                          style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
                        >
                          {m.benefits.map((b) => (
                            <span
                              key={b.id}
                              className="benefit-chip"
                              style={{
                                background: theme.badge,
                                color: theme.badgeText,
                              }}
                            >
                              <FiCheck size={11} style={{ flexShrink: 0 }} />
                              {b.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="card-actions">
                    <button
                      className="btn-edit"
                      onClick={() => openEditModal(m)}
                    >
                      <FiEdit2 size={14} /> Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => openDeleteModal(m)}
                    >
                      <FiTrash2 size={14} /> Hapus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {modal.isOpen && (
          <div
            className="modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget && !modal.isLoading)
                setModal((p) => ({ ...p, isOpen: false }));
            }}
          >
            <div className="modal-box">
              <div className="modal-header-custom">
                <div>
                  <p className="modal-title-custom">
                    {modal.mode === "add"
                      ? "Tambah Membership Baru"
                      : "Edit Membership"}
                  </p>
                  <p className="modal-subtitle">
                    {modal.mode === "add"
                      ? "Isi detail paket membership baru"
                      : "Perbarui informasi paket membership"}
                  </p>
                </div>
                <button
                  className="btn-close-custom"
                  onClick={() =>
                    !modal.isLoading &&
                    setModal((p) => ({ ...p, isOpen: false }))
                  }
                >
                  <FiX size={16} />
                </button>
              </div>

              <div className="modal-body-custom">
                {modal.error && (
                  <div className="error-alert">
                    <FiX size={15} style={{ flexShrink: 0 }} />
                    {modal.error}
                  </div>
                )}

                {/* Nama */}
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label-custom">
                    Nama Membership <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input-custom"
                    name="name"
                    value={modal.form.name}
                    onChange={handleInput}
                    placeholder="Contoh: Paket Pemula"
                    disabled={modal.isLoading}
                    autoFocus
                  />
                </div>

                {/* Harga */}
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label-custom">
                    Harga <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div className="input-group-custom">
                    <span className="input-addon">Rp</span>
                    <input
                      type="number"
                      className="form-input-custom"
                      name="price"
                      value={modal.form.price}
                      onChange={handleInput}
                      placeholder="150000"
                      min={0}
                      disabled={modal.isLoading}
                      style={{ borderRadius: "0 12px 12px 0" }}
                    />
                  </div>
                </div>

                {/* Masa aktif */}
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label-custom">
                    Masa Aktif <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div className="input-group-custom">
                    <input
                      type="number"
                      className="form-input-custom"
                      name="active_days"
                      value={modal.form.active_days}
                      onChange={handleInput}
                      placeholder="30"
                      min={1}
                      disabled={modal.isLoading}
                      style={{ borderRadius: "12px 0 0 12px" }}
                    />
                    <span className="input-addon input-addon-right">Hari</span>
                  </div>
                  <p className="form-hint">
                    Contoh: 28 hari, 90 hari, 365 hari
                  </p>
                </div>

                {/* Deskripsi */}
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label-custom">Deskripsi</label>
                  <textarea
                    className="form-input-custom"
                    name="description"
                    rows={2}
                    value={modal.form.description}
                    onChange={handleInput}
                    placeholder="Deskripsi singkat paket..."
                    disabled={modal.isLoading}
                    style={{ resize: "vertical" }}
                  />
                </div>

                {/* Keuntungan */}
                <div style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <label className="form-label-custom" style={{ margin: 0 }}>
                      Keuntungan Membership
                    </label>
                    {modal.form.benefit_ids.size > 0 && (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#3b82f6",
                          background: "#eff6ff",
                          padding: "2px 10px",
                          borderRadius: 100,
                        }}
                      >
                        {modal.form.benefit_ids.size} dipilih
                      </span>
                    )}
                  </div>

                  {serviceTypes.length === 0 ? (
                    <p style={{ fontSize: 13, color: "#9ca3af" }}>
                      Belum ada service. Tambahkan service terlebih dahulu.
                    </p>
                  ) : (
                    <div className="benefit-scroll-box">
                      {serviceTypes.map((type, ti) => (
                        <div key={type.id}>
                          {ti > 0 && <div className="divider" />}
                          <p className="benefit-type-header">{type.name}</p>
                          {type.services.length === 0 ? (
                            <p
                              style={{
                                fontSize: 12,
                                color: "#9ca3af",
                                padding: "4px 16px 10px",
                              }}
                            >
                              Belum ada service
                            </p>
                          ) : (
                            type.services.map((sn) => {
                              const checked = modal.form.benefit_ids.has(sn.id);
                              return (
                                <div
                                  key={sn.id}
                                  className="benefit-item"
                                  onClick={() =>
                                    !modal.isLoading &&
                                    handleBenefitToggle(sn.id)
                                  }
                                >
                                  <div
                                    className={`custom-checkbox ${
                                      checked ? "checked" : ""
                                    }`}
                                  >
                                    {checked && (
                                      <FiCheck size={11} color="white" />
                                    )}
                                  </div>
                                  <span
                                    style={{
                                      fontSize: 13,
                                      color: "#374151",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {sn.name}
                                  </span>
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
                <button
                  className="btn-cancel"
                  onClick={() =>
                    !modal.isLoading &&
                    setModal((p) => ({ ...p, isOpen: false }))
                  }
                  disabled={modal.isLoading}
                >
                  Batal
                </button>
                <button
                  className="btn-save"
                  onClick={handleSave}
                  disabled={modal.isLoading}
                >
                  {modal.isLoading ? (
                    <>
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          border: "2px solid rgba(255,255,255,0.4)",
                          borderTop: "2px solid white",
                          borderRadius: "50%",
                          animation: "spin 0.7s linear infinite",
                        }}
                      />{" "}
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      {modal.mode === "add" ? (
                        <FiPlus size={16} />
                      ) : (
                        <FiCheck size={16} />
                      )}{" "}
                      {modal.mode === "add"
                        ? "Tambah Membership"
                        : "Simpan Perubahan"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteModal.isOpen && (
          <div
            className="modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget && !deleteModal.isLoading)
                setDeleteModal((p) => ({ ...p, isOpen: false }));
            }}
          >
            <div className="modal-box" style={{ maxWidth: 400 }}>
              <div style={{ padding: "32px 28px 20px", textAlign: "center" }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 20,
                    background: "linear-gradient(135deg, #fef2f2, #fee2e2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                  }}
                >
                  <FiTrash2 size={28} color="#dc2626" />
                </div>
                <h5
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#111827",
                    margin: "0 0 8px",
                  }}
                >
                  Hapus Membership?
                </h5>
                <p
                  style={{ fontSize: 14, color: "#6b7280", margin: "0 0 4px" }}
                >
                  Anda yakin ingin menghapus
                </p>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#111827",
                    margin: "0 0 16px",
                  }}
                >
                  &ldquo;{deleteModal.targetName}&rdquo;?
                </p>

                {deleteModal.error && (
                  <div className="error-alert" style={{ textAlign: "left" }}>
                    <FiX size={14} style={{ flexShrink: 0 }} />{" "}
                    {deleteModal.error}
                  </div>
                )}

                <div
                  style={{
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    borderRadius: 10,
                    padding: "10px 14px",
                    fontSize: 13,
                    color: "#92400e",
                    textAlign: "left",
                  }}
                >
                  ⚠️ Level membership di atasnya akan otomatis diperbarui.
                </div>
              </div>

              <div className="modal-footer-custom" style={{ paddingTop: 0 }}>
                <button
                  className="btn-cancel"
                  onClick={() =>
                    !deleteModal.isLoading &&
                    setDeleteModal((p) => ({ ...p, isOpen: false }))
                  }
                  disabled={deleteModal.isLoading}
                >
                  Batal
                </button>
                <button
                  className="btn-danger-custom"
                  onClick={confirmDelete}
                  disabled={deleteModal.isLoading}
                >
                  {deleteModal.isLoading ? (
                    <>
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          border: "2px solid rgba(255,255,255,0.4)",
                          borderTop: "2px solid white",
                          borderRadius: "50%",
                          animation: "spin 0.7s linear infinite",
                        }}
                      />{" "}
                      Menghapus...
                    </>
                  ) : (
                    <>
                      <FiTrash2 size={15} /> Ya, Hapus
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

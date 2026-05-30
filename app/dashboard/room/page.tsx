"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiAlertTriangle,
  FiRefreshCw,
  FiUsers,
  FiGrid,
  FiX,
} from "react-icons/fi";
import { Spinner } from "react-bootstrap";
import { roomAPI, RoomType } from "../../lib/api";

/* ─── Design Tokens ─────────────────────────────────────────── */
const C = {
  primary: "#2563EB",
  primaryHover: "#1D4ED8",
  primaryLight: "#EFF6FF",
  primaryBorder: "#BFDBFE",
  danger: "#DC2626",
  dangerLight: "#FEF2F2",
  dangerBorder: "#FECACA",
  text: "#111827",
  textMuted: "#6B7280",
  textLight: "#9CA3AF",
  border: "#E5E7EB",
  borderHover: "#D1D5DB",
  surface: "#FFFFFF",
  bg: "#F9FAFB",
  bgHover: "#F3F4F6",
  success: "#059669",
  successLight: "#ECFDF5",
};

const styles = {
  page: {
    padding: "2rem 2.5rem",
    minHeight: "100vh",
    background: C.bg,
    fontFamily: "'DM Sans', system-ui, sans-serif",
  } as React.CSSProperties,

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
  } as React.CSSProperties,

  title: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: C.text,
    margin: 0,
    letterSpacing: "-0.02em",
  } as React.CSSProperties,

  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.625rem 1.25rem",
    background: C.primary,
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.15s, transform 0.1s",
    boxShadow: "0 1px 3px rgba(37,99,235,0.3)",
  } as React.CSSProperties,

  tabsWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    flexWrap: "wrap" as const,
    padding: "0.375rem",
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: "14px",
    marginBottom: "1.5rem",
  } as React.CSSProperties,

  tab: (active: boolean): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 1rem",
    borderRadius: "10px",
    border: "none",
    background: active ? C.primary : "transparent",
    color: active ? "#fff" : C.textMuted,
    fontSize: "0.875rem",
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    transition: "all 0.15s",
  }),

  tabActions: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",
    marginLeft: "0.25rem",
    opacity: 0.75,
  } as React.CSSProperties,

  tabIconBtn: (danger?: boolean): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "20px",
    height: "20px",
    padding: 0,
    border: "none",
    background: "rgba(255,255,255,0.2)",
    borderRadius: "5px",
    color: "#fff",
    cursor: "pointer",
    lineHeight: 1,
  }),

  tabIconBtnInactive: (danger?: boolean): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "20px",
    height: "20px",
    padding: 0,
    border: "none",
    background: "transparent",
    borderRadius: "5px",
    color: danger ? C.danger : C.primary,
    cursor: "pointer",
  }),

  panel: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: "16px",
    padding: "1.5rem",
  } as React.CSSProperties,

  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.25rem",
  } as React.CSSProperties,

  panelTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    color: C.text,
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "0.625rem",
  } as React.CSSProperties,

  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "22px",
    height: "22px",
    padding: "0 6px",
    background: C.primaryLight,
    color: C.primary,
    borderRadius: "6px",
    fontSize: "0.75rem",
    fontWeight: 700,
  } as React.CSSProperties,

  btnOutline: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.375rem",
    padding: "0.5rem 1rem",
    background: "transparent",
    color: C.primary,
    border: `1.5px solid ${C.primaryBorder}`,
    borderRadius: "10px",
    fontSize: "0.8125rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
  } as React.CSSProperties,

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "0.875rem",
  } as React.CSSProperties,

  roomCard: {
    background: C.bg,
    border: `1px solid ${C.border}`,
    borderRadius: "12px",
    padding: "1rem 1.125rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    transition: "border-color 0.15s, box-shadow 0.15s",
  } as React.CSSProperties,

  roomName: {
    fontSize: "0.9375rem",
    fontWeight: 600,
    color: C.text,
    margin: 0,
    marginBottom: "0.25rem",
  } as React.CSSProperties,

  roomCapacity: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
    fontSize: "0.8125rem",
    color: C.textMuted,
  } as React.CSSProperties,

  cardActions: {
    display: "flex",
    gap: "0.375rem",
  } as React.CSSProperties,

  iconBtn: (danger?: boolean): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    border: `1px solid ${danger ? C.dangerBorder : C.border}`,
    background: danger ? C.dangerLight : C.surface,
    color: danger ? C.danger : C.primary,
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.15s",
  }),

  empty: {
    textAlign: "center" as const,
    padding: "3rem 1rem",
    color: C.textMuted,
  } as React.CSSProperties,

  emptyIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "48px",
    background: C.bgHover,
    borderRadius: "12px",
    marginBottom: "0.875rem",
    color: C.textLight,
  } as React.CSSProperties,

  /* ── Modal ── */
  overlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1050,
    backdropFilter: "blur(2px)",
  } as React.CSSProperties,

  modal: {
    background: C.surface,
    borderRadius: "18px",
    padding: "1.75rem",
    width: "420px",
    maxWidth: "calc(100vw - 2rem)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
    border: `1px solid ${C.border}`,
  } as React.CSSProperties,

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1.25rem",
  } as React.CSSProperties,

  modalTitle: {
    fontSize: "1.0625rem",
    fontWeight: 700,
    color: C.text,
    margin: 0,
    letterSpacing: "-0.01em",
  } as React.CSSProperties,

  closeBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "30px",
    height: "30px",
    border: `1px solid ${C.border}`,
    background: "transparent",
    borderRadius: "8px",
    color: C.textMuted,
    cursor: "pointer",
  } as React.CSSProperties,

  label: {
    display: "block",
    fontSize: "0.8125rem",
    fontWeight: 500,
    color: C.textMuted,
    marginBottom: "0.375rem",
  } as React.CSSProperties,

  input: {
    width: "100%",
    padding: "0.625rem 0.875rem",
    border: `1.5px solid ${C.border}`,
    borderRadius: "10px",
    fontSize: "0.9375rem",
    color: C.text,
    background: C.surface,
    outline: "none",
    transition: "border-color 0.15s",
    boxSizing: "border-box" as const,
  } as React.CSSProperties,

  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.625rem 0.875rem",
    background: C.dangerLight,
    border: `1px solid ${C.dangerBorder}`,
    borderRadius: "10px",
    color: C.danger,
    fontSize: "0.8125rem",
    marginBottom: "1rem",
  } as React.CSSProperties,

  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.625rem",
    marginTop: "1.5rem",
  } as React.CSSProperties,

  btnSecondary: {
    padding: "0.625rem 1.25rem",
    background: C.bg,
    color: C.text,
    border: `1.5px solid ${C.border}`,
    borderRadius: "10px",
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer",
    transition: "background 0.15s",
  } as React.CSSProperties,

  btnDanger: {
    padding: "0.625rem 1.25rem",
    background: C.danger,
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.15s",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.375rem",
  } as React.CSSProperties,
};

/* ─── Component ─────────────────────────────────────────────── */
export default function RoomManagementPage() {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: "add-type" | "edit-type" | "add-room" | "edit-room";
    typeId?: number;
    roomId?: number;
    inputName: string;
    inputCapacity: string;
    isLoading: boolean;
    error: string;
  }>({
    isOpen: false,
    type: "add-type",
    inputName: "",
    inputCapacity: "",
    isLoading: false,
    error: "",
  });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    mode: "type" | "room";
    typeId: number;
    roomId?: number;
    targetName: string;
    isLoading: boolean;
    error: string;
  }>({
    isOpen: false,
    mode: "type",
    typeId: 0,
    targetName: "",
    isLoading: false,
    error: "",
  });

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    setPageError("");
    try {
      const res = await roomAPI.getAll();
      setRoomTypes(res.data);
      if (res.data.length > 0 && activeTabId === null) {
        setActiveTabId(res.data[0].id);
      }
    } catch (err: unknown) {
      setPageError(err instanceof Error ? err.message : "Gagal memuat data");
    } finally {
      setIsLoading(false);
    }
  }, [activeTabId]);

  useEffect(() => {
    fetchRooms();
  }, []); // eslint-disable-line

  const activeTab =
    roomTypes.find((t) => t.id === activeTabId) ?? roomTypes[0] ?? null;

  const openModal = (
    type: "add-type" | "edit-type" | "add-room" | "edit-room",
    typeId?: number,
    roomId?: number,
    initialName = "",
    initialCapacity = ""
  ) => {
    setModalConfig({
      isOpen: true,
      type,
      typeId,
      roomId,
      inputName: initialName,
      inputCapacity: initialCapacity,
      isLoading: false,
      error: "",
    });
  };

  const handleSave = async () => {
    const name = modalConfig.inputName.trim();
    if (!name) {
      setModalConfig((p) => ({ ...p, error: "Nama tidak boleh kosong" }));
      return;
    }
    const capacity = parseInt(modalConfig.inputCapacity);
    if (modalConfig.type === "add-room" || modalConfig.type === "edit-room") {
      if (!modalConfig.inputCapacity || isNaN(capacity) || capacity < 1) {
        setModalConfig((p) => ({ ...p, error: "Kapasitas minimal 1" }));
        return;
      }
    }
    setModalConfig((p) => ({ ...p, isLoading: true, error: "" }));
    try {
      if (modalConfig.type === "add-type") {
        const res = await roomAPI.createType(name);
        setRoomTypes((p) => [...p, res.data]);
        setActiveTabId(res.data.id);
      } else if (modalConfig.type === "edit-type" && modalConfig.typeId) {
        await roomAPI.updateType(modalConfig.typeId, name);
        setRoomTypes((p) =>
          p.map((t) => (t.id === modalConfig.typeId ? { ...t, name } : t))
        );
      } else if (modalConfig.type === "add-room" && modalConfig.typeId) {
        const res = await roomAPI.createRoom(
          modalConfig.typeId,
          name,
          capacity
        );
        setRoomTypes((p) =>
          p.map((t) =>
            t.id === modalConfig.typeId
              ? { ...t, rooms: [...t.rooms, res.data] }
              : t
          )
        );
      } else if (modalConfig.type === "edit-room" && modalConfig.roomId) {
        await roomAPI.updateRoom(modalConfig.roomId, name, capacity);
        setRoomTypes((p) =>
          p.map((t) => ({
            ...t,
            rooms: t.rooms.map((r) =>
              r.id === modalConfig.roomId ? { ...r, name, capacity } : r
            ),
          }))
        );
      }
      setModalConfig((p) => ({
        ...p,
        isOpen: false,
        inputName: "",
        inputCapacity: "",
      }));
    } catch (err: unknown) {
      setModalConfig((p) => ({
        ...p,
        error: err instanceof Error ? err.message : "Terjadi kesalahan",
        isLoading: false,
      }));
    }
  };

  const openDeleteModal = (
    mode: "type" | "room",
    typeId: number,
    roomId?: number,
    targetName = ""
  ) => {
    setDeleteModal({
      isOpen: true,
      mode,
      typeId,
      roomId,
      targetName,
      isLoading: false,
      error: "",
    });
  };

  const confirmDelete = async () => {
    setDeleteModal((p) => ({ ...p, isLoading: true, error: "" }));
    try {
      if (deleteModal.mode === "type") {
        await roomAPI.deleteType(deleteModal.typeId);
        const remaining = roomTypes.filter((t) => t.id !== deleteModal.typeId);
        setRoomTypes(remaining);
        if (activeTabId === deleteModal.typeId)
          setActiveTabId(remaining.length > 0 ? remaining[0].id : null);
      } else if (deleteModal.roomId) {
        await roomAPI.deleteRoom(deleteModal.roomId);
        setRoomTypes((p) =>
          p.map((t) => ({
            ...t,
            rooms: t.rooms.filter((r) => r.id !== deleteModal.roomId),
          }))
        );
      }
      setDeleteModal((p) => ({ ...p, isOpen: false }));
    } catch (err: unknown) {
      setDeleteModal((p) => ({
        ...p,
        error: err instanceof Error ? err.message : "Gagal menghapus",
        isLoading: false,
      }));
    }
  };

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div
        style={{
          ...styles.page,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <Spinner
          animation="border"
          style={{ color: C.primary, width: "2rem", height: "2rem" }}
        />
        <p style={{ color: C.textMuted, margin: 0, fontSize: "0.9375rem" }}>
          Memuat data ruangan…
        </p>
      </div>
    );
  }

  /* ── Error ── */
  if (pageError) {
    return (
      <div style={styles.page}>
        <div
          style={{
            ...styles.errorBox,
            padding: "1rem 1.25rem",
            borderRadius: "14px",
          }}
        >
          <FiAlertTriangle size={18} />
          <span style={{ flex: 1 }}>{pageError}</span>
          <button
            style={{
              ...styles.btnOutline,
              fontSize: "0.8125rem",
              padding: "0.375rem 0.875rem",
            }}
            onClick={fetchRooms}
          >
            <FiRefreshCw size={13} /> Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  /* ── Modal title map ── */
  const modalTitle: Record<string, string> = {
    "add-type": "Tambah Room Type",
    "edit-type": "Ubah Room Type",
    "add-room": "Tambah Ruangan Baru",
    "edit-room": "Ubah Ruangan",
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h4 style={styles.title}>Room Management</h4>
          <p
            style={{
              margin: 0,
              color: C.textMuted,
              fontSize: "0.875rem",
              marginTop: "0.25rem",
            }}
          >
            Kelola tipe dan daftar ruangan cabang Anda
          </p>
        </div>
        <button
          style={styles.btnPrimary}
          onClick={() => openModal("add-type")}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = C.primaryHover)
          }
          onMouseLeave={(e) => (e.currentTarget.style.background = C.primary)}
        >
          <FiPlus size={16} /> Tambah Room Type
        </button>
      </div>

      {/* Empty state */}
      {roomTypes.length === 0 ? (
        <div style={{ ...styles.panel, ...styles.empty }}>
          <div style={{ ...styles.emptyIcon, margin: "0 auto 0.875rem" }}>
            <FiGrid size={22} />
          </div>
          <p style={{ fontWeight: 600, color: C.text, margin: "0 0 0.375rem" }}>
            Belum ada room type
          </p>
          <p style={{ fontSize: "0.875rem", margin: 0 }}>
            Mulai dengan menambahkan tipe ruangan pertama Anda
          </p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div style={styles.tabsWrapper}>
            {roomTypes.map((tab) => {
              const isActive = activeTabId === tab.id;
              return (
                <button
                  key={tab.id}
                  style={styles.tab(isActive)}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  <span>{tab.name}</span>
                  <div style={styles.tabActions}>
                    <button
                      style={
                        isActive
                          ? styles.tabIconBtn()
                          : styles.tabIconBtnInactive()
                      }
                      title="Edit tipe"
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal("edit-type", tab.id, undefined, tab.name);
                      }}
                    >
                      <FiEdit2 size={11} />
                    </button>
                    <button
                      style={
                        isActive
                          ? styles.tabIconBtn(true)
                          : styles.tabIconBtnInactive(true)
                      }
                      title="Hapus tipe"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal("type", tab.id, undefined, tab.name);
                      }}
                    >
                      <FiTrash2 size={11} />
                    </button>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Panel */}
          {activeTab && (
            <div style={styles.panel}>
              <div style={styles.panelHeader}>
                <h5 style={styles.panelTitle}>
                  Ruangan di
                  <span style={{ color: C.primary }}>{activeTab.name}</span>
                  <span style={styles.badge}>{activeTab.rooms.length}</span>
                </h5>
                <button
                  style={styles.btnOutline}
                  onClick={() => openModal("add-room", activeTab.id)}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = C.primaryLight)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <FiPlus size={14} /> Tambah Ruangan
                </button>
              </div>

              {activeTab.rooms.length === 0 ? (
                <div style={styles.empty}>
                  <div
                    style={{ ...styles.emptyIcon, margin: "0 auto 0.875rem" }}
                  >
                    <FiUsers size={22} />
                  </div>
                  <p
                    style={{
                      fontWeight: 600,
                      color: C.text,
                      margin: "0 0 0.25rem",
                      fontSize: "0.9375rem",
                    }}
                  >
                    Belum ada ruangan
                  </p>
                  <p style={{ fontSize: "0.875rem", margin: 0 }}>
                    Tambahkan ruangan ke tipe ini
                  </p>
                </div>
              ) : (
                <div style={styles.grid}>
                  {activeTab.rooms.map((room) => (
                    <div
                      key={room.id}
                      style={styles.roomCard}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.borderColor =
                          C.primaryBorder;
                        (e.currentTarget as HTMLDivElement).style.boxShadow =
                          "0 2px 12px rgba(37,99,235,0.08)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.borderColor =
                          C.border;
                        (e.currentTarget as HTMLDivElement).style.boxShadow =
                          "none";
                      }}
                    >
                      <div>
                        <p style={styles.roomName}>{room.name}</p>
                        <span style={styles.roomCapacity}>
                          <FiUsers size={12} />
                          {room.capacity} orang
                        </span>
                      </div>
                      <div style={styles.cardActions}>
                        <button
                          style={styles.iconBtn()}
                          title="Edit ruangan"
                          onClick={() =>
                            openModal(
                              "edit-room",
                              activeTab.id,
                              room.id,
                              room.name,
                              room.capacity.toString()
                            )
                          }
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = C.primaryLight)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = C.surface)
                          }
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          style={styles.iconBtn(true)}
                          title="Hapus ruangan"
                          onClick={() =>
                            openDeleteModal(
                              "room",
                              activeTab.id,
                              room.id,
                              room.name
                            )
                          }
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = C.dangerLight;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = C.dangerLight;
                          }}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Modal: Tambah / Edit ── */}
      {modalConfig.isOpen && (
        <div
          style={styles.overlay}
          onClick={() =>
            !modalConfig.isLoading &&
            setModalConfig((p) => ({ ...p, isOpen: false }))
          }
        >
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h5 style={styles.modalTitle}>{modalTitle[modalConfig.type]}</h5>
              <button
                style={styles.closeBtn}
                onClick={() => setModalConfig((p) => ({ ...p, isOpen: false }))}
                disabled={modalConfig.isLoading}
              >
                <FiX size={15} />
              </button>
            </div>

            {modalConfig.error && (
              <div style={styles.errorBox}>
                <FiAlertTriangle size={15} />
                <span>{modalConfig.error}</span>
              </div>
            )}

            <div style={{ marginBottom: "1rem" }}>
              <label style={styles.label}>Nama</label>
              <input
                type="text"
                style={styles.input}
                value={modalConfig.inputName}
                onChange={(e) =>
                  setModalConfig((p) => ({ ...p, inputName: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                disabled={modalConfig.isLoading}
                autoFocus
                onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
                onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
                placeholder="Masukkan nama..."
              />
            </div>

            {(modalConfig.type === "add-room" ||
              modalConfig.type === "edit-room") && (
              <div style={{ marginBottom: "1rem" }}>
                <label style={styles.label}>Kapasitas (Orang)</label>
                <input
                  type="number"
                  min={1}
                  style={styles.input}
                  value={modalConfig.inputCapacity}
                  onChange={(e) =>
                    setModalConfig((p) => ({
                      ...p,
                      inputCapacity: e.target.value,
                    }))
                  }
                  disabled={modalConfig.isLoading}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = C.primary)
                  }
                  onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
                  placeholder="Contoh: 20"
                />
              </div>
            )}

            <div style={styles.modalFooter}>
              <button
                style={styles.btnSecondary}
                onClick={() => setModalConfig((p) => ({ ...p, isOpen: false }))}
                disabled={modalConfig.isLoading}
              >
                Batal
              </button>
              <button
                style={styles.btnPrimary}
                onClick={handleSave}
                disabled={modalConfig.isLoading}
              >
                {modalConfig.isLoading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      style={{ marginRight: "0.375rem" }}
                    />{" "}
                    Menyimpan…
                  </>
                ) : (
                  "Simpan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Konfirmasi Hapus ── */}
      {deleteModal.isOpen && (
        <div
          style={{ ...styles.overlay, zIndex: 1060 }}
          onClick={() =>
            !deleteModal.isLoading &&
            setDeleteModal((p) => ({ ...p, isOpen: false }))
          }
        >
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: C.dangerLight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: C.danger,
                  }}
                >
                  <FiTrash2 size={17} />
                </div>
                <h5 style={{ ...styles.modalTitle, color: C.danger }}>
                  Konfirmasi Hapus
                </h5>
              </div>
              <button
                style={styles.closeBtn}
                onClick={() => setDeleteModal((p) => ({ ...p, isOpen: false }))}
                disabled={deleteModal.isLoading}
              >
                <FiX size={15} />
              </button>
            </div>

            {deleteModal.error && (
              <div style={styles.errorBox}>
                <FiAlertTriangle size={15} />
                <span>{deleteModal.error}</span>
              </div>
            )}

            <p
              style={{
                color: C.textMuted,
                fontSize: "0.9375rem",
                margin: "0 0 0.375rem",
              }}
            >
              {deleteModal.mode === "type" ? (
                <>
                  Hapus tipe ruangan{" "}
                  <strong style={{ color: C.text }}>
                    &ldquo;{deleteModal.targetName}&rdquo;
                  </strong>{" "}
                  beserta semua ruangan di dalamnya?
                </>
              ) : (
                <>
                  Hapus ruangan{" "}
                  <strong style={{ color: C.text }}>
                    &ldquo;{deleteModal.targetName}&rdquo;
                  </strong>
                  ?
                </>
              )}
            </p>
            <p style={{ color: C.textLight, fontSize: "0.8125rem", margin: 0 }}>
              Tindakan ini tidak bisa dibatalkan.
            </p>

            <div style={styles.modalFooter}>
              <button
                style={styles.btnSecondary}
                onClick={() => setDeleteModal((p) => ({ ...p, isOpen: false }))}
                disabled={deleteModal.isLoading}
              >
                Batal
              </button>
              <button
                style={styles.btnDanger}
                onClick={confirmDelete}
                disabled={deleteModal.isLoading}
              >
                {deleteModal.isLoading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      style={{ marginRight: "0.375rem" }}
                    />{" "}
                    Menghapus…
                  </>
                ) : (
                  <>
                    <FiTrash2 size={14} /> Hapus
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

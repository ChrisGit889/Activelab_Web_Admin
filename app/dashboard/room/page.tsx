"use client";

import { useState, useEffect, useCallback } from "react";
import { FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";
import { Spinner } from "react-bootstrap";
import { roomAPI, RoomType } from "../../lib/api";

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

  const activeTab = roomTypes.find((t) => t.id === activeTabId) ?? roomTypes[0] ?? null;

  const openModal = (
    type: "add-type" | "edit-type" | "add-room" | "edit-room",
    typeId?: number,
    roomId?: number,
    initialName = "",
    initialCapacity = ""
  ) => {
    setModalConfig({ isOpen: true, type, typeId, roomId, inputName: initialName, inputCapacity: initialCapacity, isLoading: false, error: "" });
  };

  const handleSave = async () => {
    const name = modalConfig.inputName.trim();
    if (!name) {
      setModalConfig((prev) => ({ ...prev, error: "Nama tidak boleh kosong" }));
      return;
    }

    const capacity = parseInt(modalConfig.inputCapacity);
    if ((modalConfig.type === "add-room" || modalConfig.type === "edit-room")) {
      if (!modalConfig.inputCapacity || isNaN(capacity) || capacity < 1) {
        setModalConfig((prev) => ({ ...prev, error: "Kapasitas minimal 1" }));
        return;
      }
    }

    setModalConfig((prev) => ({ ...prev, isLoading: true, error: "" }));

    try {
      if (modalConfig.type === "add-type") {
        const res = await roomAPI.createType(name);
        setRoomTypes((prev) => [...prev, res.data]);
        setActiveTabId(res.data.id);

      } else if (modalConfig.type === "edit-type" && modalConfig.typeId) {
        await roomAPI.updateType(modalConfig.typeId, name);
        setRoomTypes((prev) =>
          prev.map((t) => t.id === modalConfig.typeId ? { ...t, name } : t)
        );

      } else if (modalConfig.type === "add-room" && modalConfig.typeId) {
        const res = await roomAPI.createRoom(modalConfig.typeId, name, capacity);
        setRoomTypes((prev) =>
          prev.map((t) =>
            t.id === modalConfig.typeId
              ? { ...t, rooms: [...t.rooms, res.data] }
              : t
          )
        );

      } else if (modalConfig.type === "edit-room" && modalConfig.roomId) {
        await roomAPI.updateRoom(modalConfig.roomId, name, capacity);
        setRoomTypes((prev) =>
          prev.map((t) => ({
            ...t,
            rooms: t.rooms.map((r) =>
              r.id === modalConfig.roomId ? { ...r, name, capacity } : r
            ),
          }))
        );
      }

      setModalConfig((prev) => ({ ...prev, isOpen: false, inputName: "", inputCapacity: "" }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      setModalConfig((prev) => ({ ...prev, error: message, isLoading: false }));
    }
  };

  const openDeleteModal = (mode: "type" | "room", typeId: number, roomId?: number, targetName = "") => {
    setDeleteModal({ isOpen: true, mode, typeId, roomId, targetName, isLoading: false, error: "" });
  };

  const confirmDelete = async () => {
    setDeleteModal((prev) => ({ ...prev, isLoading: true, error: "" }));

    try {
      if (deleteModal.mode === "type") {
        await roomAPI.deleteType(deleteModal.typeId);
        const remaining = roomTypes.filter((t) => t.id !== deleteModal.typeId);
        setRoomTypes(remaining);
        if (activeTabId === deleteModal.typeId) {
          setActiveTabId(remaining.length > 0 ? remaining[0].id : null);
        }
      } else if (deleteModal.roomId) {
        await roomAPI.deleteRoom(deleteModal.roomId);
        setRoomTypes((prev) =>
          prev.map((t) => ({
            ...t,
            rooms: t.rooms.filter((r) => r.id !== deleteModal.roomId),
          }))
        );
      }
      setDeleteModal((prev) => ({ ...prev, isOpen: false }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal menghapus";
      setDeleteModal((prev) => ({ ...prev, error: message, isLoading: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="container py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-2">Memuat data ruangan...</p>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">
          {pageError}
          <button className="btn btn-sm btn-outline-danger ms-3" onClick={fetchRooms}>Coba Lagi</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="m-0 fw-bold">Room Management</h4>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => openModal("add-type")}>
          <FiPlus /> Tambah Room Type
        </button>
      </div>

      {roomTypes.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <p>Belum ada room type.</p>
        </div>
      ) : (
        <>
          <div
            className="d-flex align-items-center gap-2 flex-wrap mb-4"
            style={{ borderBottom: "2px solid #dee2e6", paddingBottom: "10px" }}
          >
            {roomTypes.map((tab) => (
              <div
                key={tab.id}
                className="d-flex align-items-center gap-2 px-3 py-2 rounded-top"
                style={{
                  cursor: "pointer",
                  backgroundColor: activeTabId === tab.id ? "#f8f9fa" : "transparent",
                  borderBottom: activeTabId === tab.id ? "3px solid #0d6efd" : "3px solid transparent",
                  fontWeight: activeTabId === tab.id ? 600 : "normal",
                }}
                onClick={() => setActiveTabId(tab.id)}
              >
                <span>{tab.name}</span>
                <div className="d-flex gap-1 ms-2">
                  <button
                    className="btn btn-sm text-primary p-0 border-0 bg-transparent"
                    onClick={(e) => { e.stopPropagation(); openModal("edit-type", tab.id, undefined, tab.name); }}
                  >
                    <FiEdit2 size={13} />
                  </button>
                  <button
                    className="btn btn-sm text-danger p-0 border-0 bg-transparent"
                    onClick={(e) => { e.stopPropagation(); openDeleteModal("type", tab.id, undefined, tab.name); }}
                  >
                    <FiTrash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {activeTab && (
            <div className="p-4 bg-light rounded shadow-sm">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="m-0 fw-semibold">
                  Daftar Ruangan di <span className="text-primary">{activeTab.name}</span>
                  <span className="badge bg-secondary ms-2">{activeTab.rooms.length}</span>
                </h5>
                <button
                  className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                  onClick={() => openModal("add-room", activeTab.id)}
                >
                  <FiPlus /> Tambah Ruangan
                </button>
              </div>

              {activeTab.rooms.length === 0 ? (
                <p className="text-muted text-center py-3">Belum ada ruangan di tipe ini.</p>
              ) : (
                <div className="row row-cols-1 row-cols-md-3 g-3">
                  {activeTab.rooms.map((room) => (
                    <div key={room.id} className="col">
                      <div className="card h-100 border-0 shadow-sm">
                        <div className="card-body d-flex justify-content-between align-items-center">
                          <div>
                            <span className="d-block fw-medium">{room.name}</span>
                            <small className="text-muted">Kapasitas: {room.capacity} orang</small>
                          </div>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-light text-primary rounded-circle"
                              onClick={() => openModal("edit-room", activeTab.id, room.id, room.name, room.capacity.toString())}
                            >
                              <FiEdit2 size={14} />
                            </button>
                            <button
                              className="btn btn-sm btn-light text-danger rounded-circle"
                              onClick={() => openDeleteModal("room", activeTab.id, room.id, room.name)}
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal Tambah / Edit */}
      {modalConfig.isOpen && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="bg-white p-4 rounded shadow" style={{ width: 400 }}>
            <h5 className="mb-3">
              {modalConfig.type === "add-type" && "Tambah Room Type"}
              {modalConfig.type === "edit-type" && "Ubah Room Type"}
              {modalConfig.type === "add-room" && "Tambah Ruangan Baru"}
              {modalConfig.type === "edit-room" && "Ubah Ruangan"}
            </h5>

            {modalConfig.error && (
              <div className="alert alert-danger py-2 small mb-3">{modalConfig.error}</div>
            )}

            <div className="mb-3">
              <label className="form-label small">Nama</label>
              <input
                type="text"
                className="form-control"
                value={modalConfig.inputName}
                onChange={(e) => setModalConfig((prev) => ({ ...prev, inputName: e.target.value }))}
                disabled={modalConfig.isLoading}
                autoFocus
              />
            </div>

            {(modalConfig.type === "add-room" || modalConfig.type === "edit-room") && (
              <div className="mb-4">
                <label className="form-label small">Kapasitas (Orang)</label>
                <input
                  type="number"
                  min={1}
                  className="form-control"
                  value={modalConfig.inputCapacity}
                  onChange={(e) => setModalConfig((prev) => ({ ...prev, inputCapacity: e.target.value }))}
                  disabled={modalConfig.isLoading}
                />
              </div>
            )}

            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-secondary"
                onClick={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
                disabled={modalConfig.isLoading}
              >
                Batal
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={modalConfig.isLoading}>
                {modalConfig.isLoading ? (
                  <><Spinner as="span" animation="border" size="sm" className="me-1" /> Menyimpan...</>
                ) : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteModal.isOpen && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}>
          <div className="bg-white p-4 rounded shadow-sm border" style={{ width: 380 }}>
            <h5 className="mb-3 fw-semibold" style={{ color: "#dc3545" }}>Konfirmasi Hapus</h5>

            {deleteModal.error && (
              <div className="alert alert-danger py-2 small mb-3">{deleteModal.error}</div>
            )}

            <p className="text-secondary mb-4" style={{ fontSize: 15 }}>
              {deleteModal.mode === "type" ? (
                <>Hapus tipe ruangan <strong>&ldquo;{deleteModal.targetName}&rdquo;</strong> beserta semua ruangan di dalamnya?</>
              ) : (
                <>Hapus ruangan <strong>&ldquo;{deleteModal.targetName}&rdquo;</strong>?</>
              )}
            </p>

            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-light border"
                onClick={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
                disabled={deleteModal.isLoading}
              >
                Batal
              </button>
              <button className="btn btn-danger" onClick={confirmDelete} disabled={deleteModal.isLoading}>
                {deleteModal.isLoading ? (
                  <><Spinner as="span" animation="border" size="sm" className="me-1" /> Menghapus...</>
                ) : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
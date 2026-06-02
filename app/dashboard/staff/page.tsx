"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiX,
  FiAlertTriangle,
  FiUsers,
  FiMessageSquare,
  FiSend,
  FiSearch,
  FiUser,
} from "react-icons/fi";
import { Camera } from "lucide-react";
import { staffAPI, chatAPI, Staff, getStaffPhotoUrl } from "../../lib/api";
import "./staff.css";

const PLACEHOLDER = "/images/logo_activelab.png";

interface ClientChatThread {
  id: string;
  name: string;
  lastMessage: string;
  updatedAt: string;
  unreadCount: number;
}

interface ChatMessage {
  id: string;
  text: string;
  isAdmin: boolean;
  timestamp: string;
}

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

  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [activeClient, setActiveClient] = useState<ClientChatThread | null>(null);
  const [typeMessage, setTypeMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [clients, setClients] = useState<ClientChatThread[]>([]);
  const [activeChatHistory, setActiveChatHistory] = useState<ChatMessage[]>([]);

  const fetchChatThreads = useCallback(async () => {
    try {
      const res = await chatAPI.getThreads();
      if (res.success) {
        setClients(res.data);
      }
    } catch (err) {
      console.error("Gagal sinkronisasi database chat:", err);
    }
  }, []);

  const fetchMessagesForActiveClient = useCallback(async () => {
    if (!activeClient) return;
    try {
      const res = await chatAPI.getMessages(activeClient.id);
      if (res.success) {
        setActiveChatHistory(res.data);
      }
    } catch (err) {
      console.error("Gagal memuat isi chat dari database:", err);
    }
  }, [activeClient]);

  useEffect(() => {
    fetchChatThreads();
    const interval = setInterval(fetchChatThreads, 5000);
    return () => clearInterval(interval);
  }, [fetchChatThreads]);

  useEffect(() => {
    fetchMessagesForActiveClient();
    const interval = setInterval(fetchMessagesForActiveClient, 3000);
    return () => clearInterval(interval);
  }, [fetchMessagesForActiveClient, activeClient]);

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

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeMessage.trim() || !activeClient) return;

    try {
      await fetch('http://localhost:5000/api/chats/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: activeClient.id,
          message: typeMessage.trim(),
          isAdmin: true
        })
      });
      
      setTypeMessage("");
      fetchMessagesForActiveClient(); 
    } catch (err) {
      console.error("Gagal mengirim pesan ke database:", err);
    }
  };

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    <div className="st-page" style={{ position: "relative", overflowX: "hidden" }}>
      <div style={{ marginRight: isChatPanelOpen ? "340px" : "0px", transition: "margin 0.3s ease" }}>
        <div className="st-header">
          <div className="st-header-left">
            <h1>Staff Management</h1>
            <p>{staffList.length} staff terdaftar</p>
          </div>
          <button className="st-btn st-btn-primary" onClick={openAddModal}>
            <FiPlus size={15} /> Tambah Staff
          </button>
        </div>

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
      </div>

      {!isChatPanelOpen && (
        <button 
          onClick={() => setIsChatPanelOpen(true)}
          style={{
            position: "fixed",
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            backgroundColor: "#4285F4",
            color: "white",
            border: "none",
            padding: "16px 12px",
            borderRadius: "16px 0 0 16px",
            boxShadow: "-2px 4px 12px rgba(0,0,0,0.15)",
            cursor: "pointer",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.2s ease"
          }}
        >
          <FiMessageSquare size={20} />
          <span style={{ fontSize: "10px", fontWeight: "bold", writingMode: "vertical-lr" }}>CHAT CLIENT</span>
          {clients.some(c => c.unreadCount > 0) && (
            <span style={{ width: "8px", height: "8px", backgroundColor: "#ff4d4f", borderRadius: "50%" }}></span>
          )}
        </button>
      )}

      <div 
        style={{
          position: "fixed",
          right: isChatPanelOpen ? "0" : "-340px",
          top: "0",
          height: "100vh",
          width: "320px",
          backgroundColor: "#ffffff",
          boxShadow: "-4px 0 16px rgba(0,0,0,0.08)",
          zIndex: 101,
          transition: "right 0.3s ease",
          display: "flex",
          flexDirection: "column",
          borderLeft: "1px solid #e5e7eb"
        }}
      >
        <div style={{ padding: "20px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FiMessageSquare color="#4285F4" size={18} />
            <h3 style={{ fontSize: "16px", fontWeight: "bold", margin: 0, color: "#1f2937" }}>Daftar Pesan Client</h3>
          </div>
          <button 
            onClick={() => { setIsChatPanelOpen(false); setActiveClient(null); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
          >
            <FiX size={18} />
          </button>
        </div>

        <div style={{ padding: "12px 16px", backgroundColor: "#f9fafb" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <FiSearch style={{ position: "absolute", left: "10px", color: "#9ca3af" }} size={14} />
            <input 
              type="text"
              placeholder="Cari nama client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 8px 8px 32px",
                fontSize: "13px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                outline: "none",
                backgroundColor: "#ffffff",
                color: "#1f2937"
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {filteredClients.length === 0 ? (
            <p style={{ textAlign: "center", color: "#9ca3af", fontSize: "13px", marginTop: "32px" }}>Tidak ada chat ditemukan</p>
          ) : (
            filteredClients.map((client) => (
              <div 
                key={client.id}
                onClick={() => setActiveClient(client)}
                style={{
                  padding: "14px 16px",
                  borderBottom: "1px solid #f9fafb",
                  cursor: "pointer",
                  backgroundColor: activeClient?.id === client.id ? "#eff6ff" : "transparent",
                  display: "flex",
                  gap: "12px",
                  transition: "background 0.2s ease"
                }}
              >
                <div style={{ width: "36px", height: "36px", backgroundColor: "#e0e7ff", borderRadius: "50%", display: "flex", alignItems: "center", flexShrink: 0, justifyContent: "center", color: "#4f46e5" }}>
                  <FiUser size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <h4 style={{ fontSize: "13px", fontWeight: "bold", margin: 0, color: "#1f2937", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{client.name}</h4>
                    <span style={{ fontSize: "10px", color: "#9ca3af" }}>{client.updatedAt}</span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#6b7280", margin: 0, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{client.lastMessage}</p>
                </div>
                {client.unreadCount > 0 && (
                  <span style={{ backgroundColor: "#ff4d4f", color: "white", fontSize: "10px", fontWeight: "bold", padding: "2px 6px", borderRadius: "10px", alignSelf: "center" }}>
                    {client.unreadCount}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {activeClient && isChatPanelOpen && (
        <div 
          style={{
            position: "fixed",
            right: "330px",
            bottom: "20px",
            width: "360px",
            height: "460px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            zIndex: 102,
            border: "1px solid #e5e7eb",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}
        >
          <div style={{ padding: "12px 16px", backgroundColor: "#4285F4", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "bold" }}>{activeClient.name}</h4>
              <p style={{ margin: 0, fontSize: "11px", color: "#e0e7ff" }}>Percakapan Aktif Client</p>
            </div>
            <button 
              onClick={() => setActiveClient(null)}
              style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}
            >
              <FiX size={16} />
            </button>
          </div>

          <div style={{ flex: 1, padding: "16px", backgroundColor: "#f8fafc", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
            {activeChatHistory.length === 0 ? (
              <p style={{ textAlign: "center", color: "#9ca3af", fontSize: "12px", marginTop: "20px" }}>Belum ada riwayat obrolan</p>
            ) : (
              activeChatHistory.map((msg) => (
                <div 
                  key={msg.id}
                  style={{
                    alignSelf: msg.isAdmin ? "flex-end" : "flex-start",
                    maxWidth: "80%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: msg.isAdmin ? "flex-end" : "flex-start"
                  }}
                >
                  <div 
                    style={{
                      backgroundColor: msg.isAdmin ? "#4285F4" : "#ffffff",
                      color: msg.isAdmin ? "#ffffff" : "#1f2937",
                      padding: "8px 12px",
                      borderRadius: msg.isAdmin ? "12px 12px 0 12px" : "12px 12px 12px 0",
                      fontSize: "13px",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      border: msg.isAdmin ? "none" : "1px solid #e5e7eb"
                    }}
                  >
                    {msg.text}
                  </div>
                  <span style={{ fontSize: "10px", color: "#9ca3af", marginTop: "2px", padding: "0 2px" }}>{msg.timestamp}</span>
                </div>
              ))
            )}
          </div>

          <form 
            onSubmit={handleSendChat}
            style={{ padding: "12px", borderTop: "1px solid #e5e7eb", display: "flex", gap: "8px", backgroundColor: "#ffffff" }}
          >
            <input 
              type="text"
              placeholder="Tulis balasan pesan..."
              value={typeMessage}
              onChange={(e) => setTypeMessage(e.target.value)}
              style={{
                flex: 1,
                padding: "8px 12px",
                fontSize: "13px",
                border: "1px solid #e5e7eb",
                borderRadius: "20px",
                outline: "none",
                backgroundColor: "#f3f4f6",
                color: "#1f2937"
              }}
            />
            <button 
              type="submit"
              style={{
                backgroundColor: "#4285F4",
                color: "white",
                border: "none",
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0
              }}
            >
              <FiSend size={14} />
            </button>
          </form>
        </div>
      )}

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
                  <><FiPlus size={16} /> Tambah Data Staff</>
                ) : (
                  <><FiEdit2 size={16} /> Ubah Data Staff</>
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
                      <p className="st-photo-hint">Format: JPG, PNG, WebP. Maks. 2MB.</p>
                      {modal.imageFile ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="st-photo-file-badge">✓ {modal.imageFile.name}</span>
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

                <div className="st-form-group">
                  <label className="st-label">Nama Staff <span className="st-required">*</span></label>
                  <input
                    type="text"
                    className="st-input"
                    placeholder="Contoh: Andi Wijaya"
                    value={modal.inputName}
                    onChange={(e) => setModal((prev) => ({ ...prev, inputName: e.target.value }))}
                    disabled={modal.isLoading}
                    required
                    autoFocus
                  />
                </div>

                <div className="st-form-group">
                  <label className="st-label">Kontak / No. HP</label>
                  <input
                    type="text"
                    className="st-input"
                    placeholder="Contoh: 08123456789"
                    value={modal.inputContact}
                    onChange={(e) => setModal((prev) => ({ ...prev, inputContact: e.target.value }))}
                    disabled={modal.isLoading}
                  />
                </div>

                <div className="st-form-group" style={{ marginBottom: 0 }}>
                  <label className="st-label">Deskripsi / Bio</label>
                  <textarea
                    className="st-textarea"
                    rows={3}
                    placeholder="Ceritakan singkat mengenai latar belakang staff..."
                    value={modal.inputDescription}
                    onChange={(e) => setModal((prev) => ({ ...prev, inputDescription: e.target.value }))}
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
                <button type="submit" className="st-btn st-btn-primary" disabled={modal.isLoading}>
                  {modal.isLoading ? (
                    <><Spinner size={14} />&nbsp;Menyimpan...</>
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

      {deleteModal.isOpen && (
        <div className="st-modal-backdrop">
          <div className="st-modal st-modal-sm">
            <div className="st-modal-body" style={{ padding: "32px 28px 20px", textAlign: "center" }}>
              <div className="st-confirm-icon st-confirm-icon-danger">
                <FiTrash2 size={26} color="var(--st-danger)" />
              </div>
              <p className="st-confirm-title">Hapus Staff?</p>
              <p className="st-confirm-name">&ldquo;{deleteModal.targetName}&rdquo;</p>
              <p className="st-confirm-desc">Tindakan ini tidak bisa dibatalkan.</p>
              {deleteModal.error && (
                <div className="st-alert st-alert-danger" style={{ marginTop: 14, textAlign: "left" }}>
                  <FiAlertTriangle size={14} />{deleteModal.error}
                </div>
              )}
              <div className="st-alert st-alert-warning" style={{ marginTop: 14, textAlign: "left" }}>
                <FiAlertTriangle size={14} style={{ flexShrink: 0 }} />Foto staff juga akan dihapus secara permanen.
              </div>
            </div>
            <div className="st-modal-footer" style={{ justifyContent: "center" }}>
              <button
                className="st-btn st-btn-light"
                onClick={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
                disabled={deleteModal.isLoading}
              >
                Batal
              </button>
              <button className="st-btn st-btn-danger" onClick={confirmDelete} disabled={deleteModal.isLoading}>
                {deleteModal.isLoading ? (
                  <><Spinner size={14} />&nbsp;Menghapus...</>
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
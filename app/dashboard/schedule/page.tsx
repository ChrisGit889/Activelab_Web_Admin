"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiCopy,
  FiAlertTriangle,
  FiClock,
  FiHome,
  FiUsers,
  FiCalendar,
  FiX,
} from "react-icons/fi";
import {
  scheduleAPI,
  serviceAPI,
  roomAPI,
  staffAPI,
  Schedule,
  ServiceType,
  RoomType,
  Staff,
  ClashError,
  CopyClashError,
} from "../../lib/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./schedule.css";

/* ── Types ─────────────────────────────────────────────── */
interface FormState {
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  timezone: string;
  room_type_id: number | "";
  room_name_id: number | "";
  staff_count: number;
  staff_ids: (number | "")[];
}

interface ModalState {
  isOpen: boolean;
  mode: "add" | "edit";
  editId?: number;
  form: FormState;
  isLoading: boolean;
  clashes: ClashError[];
  error: string;
}

interface DeleteModalState {
  isOpen: boolean;
  scheduleId: number;
  isLoading: boolean;
  error: string;
}

interface CopyModalState {
  isOpen: boolean;
  targetDate: string;
  isLoading: boolean;
  clashes: CopyClashError[];
  error: string;
  successMsg: string;
}

/* ── Helpers ───────────────────────────────────────────── */
const calcDuration = (start: string, end: string): number => {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const diff = eh * 60 + em - (sh * 60 + sm);
  return diff > 0 ? diff : 0;
};

const defaultForm = (date = ""): FormState => ({
  date,
  start_time: "",
  end_time: "",
  duration_minutes: 0,
  timezone: "WIB",
  room_type_id: "",
  room_name_id: "",
  staff_count: 0,
  staff_ids: [],
});

const formatDate = (date: Date | null) =>
  date ? date.toISOString().split("T")[0] : "";

const parseDate = (dateStr: string) =>
  dateStr ? new Date(dateStr) : null;

/* ── Spinner ───────────────────────────────────────────── */
const Spinner = ({ size = 28 }: { size?: number }) => (
  <div
    className="sched-spinner"
    style={{ width: size, height: size, borderWidth: size < 20 ? 2 : 3 }}
  />
);

/* ═══════════════════════════════════════════════════════ */
export default function SchedulePage() {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [roomTypes, setRoomTypes]       = useState<RoomType[]>([]);
  const [staffList, setStaffList]       = useState<Staff[]>([]);
  const [isInitLoading, setIsInitLoading] = useState(true);
  const [initError, setInitError]         = useState("");

  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [selectedNameId, setSelectedNameId] = useState<number | null>(null);
  const [filterDate, setFilterDate]         = useState("");

  const [schedules, setSchedules]               = useState<Schedule[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [scheduleError, setScheduleError]           = useState("");

  const [modal, setModal] = useState<ModalState>({
    isOpen: false, mode: "add", form: defaultForm(),
    isLoading: false, clashes: [], error: "",
  });

  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false, scheduleId: 0, isLoading: false, error: "",
  });

  const [copyModal, setCopyModal] = useState<CopyModalState>({
    isOpen: false, targetDate: "", isLoading: false,
    clashes: [], error: "", successMsg: "",
  });

  /* ── Init ──────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      setIsInitLoading(true);
      try {
        const [svcRes, roomRes, staffRes] = await Promise.all([
          serviceAPI.getAll(), roomAPI.getAll(), staffAPI.getAll(),
        ]);
        setServiceTypes(svcRes.data);
        setRoomTypes(roomRes.data);
        setStaffList(staffRes.data);
      } catch (err: unknown) {
        setInitError(err instanceof Error ? err.message : "Gagal memuat data awal");
      } finally {
        setIsInitLoading(false);
      }
    })();
  }, []);

  /* ── Fetch schedules ───────────────────────────────── */
  const fetchSchedules = useCallback(async () => {
    if (!selectedNameId || !filterDate) return;
    setIsLoadingSchedules(true);
    setScheduleError("");
    try {
      const res = await scheduleAPI.getByDate(selectedNameId, filterDate);
      setSchedules(res.data);
    } catch (err: unknown) {
      setScheduleError(err instanceof Error ? err.message : "Gagal memuat jadwal");
    } finally {
      setIsLoadingSchedules(false);
    }
  }, [selectedNameId, filterDate]);

  useEffect(() => {
    if (selectedNameId && filterDate) fetchSchedules();
    else setSchedules([]);
  }, [selectedNameId, filterDate, fetchSchedules]);

  /* ── Handlers ──────────────────────────────────────── */
  const handleSelectType = (id: number) => {
    setSelectedTypeId(id); setSelectedNameId(null);
    setFilterDate(""); setSchedules([]);
  };
  const handleSelectName = (id: number) => {
    setSelectedNameId(id); setFilterDate(""); setSchedules([]);
  };

  const activeType = serviceTypes.find((t) => t.id === selectedTypeId) ?? null;
  const activeName = activeType?.services.find((s) => s.id === selectedNameId) ?? null;

  const filteredRoomNames = (roomTypeId: number | "") =>
    roomTypeId ? (roomTypes.find((rt) => rt.id === roomTypeId)?.rooms ?? []) : [];

  const openAddModal = () => {
    if (!selectedTypeId || !selectedNameId || !filterDate) return;
    setModal({ isOpen: true, mode: "add", form: defaultForm(filterDate), isLoading: false, clashes: [], error: "" });
  };

  const openEditModal = (sch: Schedule) => {
    setModal({
      isOpen: true, mode: "edit", editId: sch.id,
      form: {
        date: sch.date,
        start_time: sch.start_time,
        end_time: sch.end_time,
        duration_minutes: sch.duration_minutes,
        timezone: sch.timezone,
        room_type_id: sch.room_type.id,
        room_name_id: sch.room_name.id,
        staff_count: sch.staffs.length,
        staff_ids: sch.staffs.map((s) => s.id),
      },
      isLoading: false, clashes: [], error: "",
    });
  };

  const handleFormInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setModal((prev) => {
      const updated = { ...prev.form, [name]: value };
      if (name === "start_time" || name === "end_time")
        updated.duration_minutes = calcDuration(
          name === "start_time" ? value : updated.start_time,
          name === "end_time" ? value : updated.end_time
        );
      if (name === "room_type_id") { updated.room_name_id = ""; updated.room_type_id = value ? Number(value) : ""; }
      if (name === "room_name_id") updated.room_name_id = value ? Number(value) : "";
      if (name === "staff_count") {
        const count = Math.max(0, parseInt(value) || 0);
        updated.staff_count = count;
        const ids = [...prev.form.staff_ids];
        while (ids.length < count) ids.push("");
        ids.splice(count);
        updated.staff_ids = ids;
      }
      return { ...prev, form: updated };
    });
  };

  const handleStaffSelect = (index: number, value: string) => {
    setModal((prev) => {
      const newIds = [...prev.form.staff_ids];
      newIds[index] = value ? Number(value) : "";
      return { ...prev, form: { ...prev.form, staff_ids: newIds } };
    });
  };

  /* ── Save ──────────────────────────────────────────── */
  const handleSave = async () => {
    const { form, mode, editId } = modal;
    if (!form.date) { setModal((p) => ({ ...p, error: "Tanggal wajib dipilih" })); return; }
    if (!form.start_time || !form.end_time) { setModal((p) => ({ ...p, error: "Waktu mulai dan selesai wajib diisi" })); return; }
    if (form.duration_minutes <= 0) { setModal((p) => ({ ...p, error: "Waktu selesai harus lebih besar dari waktu mulai" })); return; }
    if (!form.room_type_id || !form.room_name_id) { setModal((p) => ({ ...p, error: "Ruangan wajib dipilih" })); return; }
    const validStaff = form.staff_ids.filter((id) => id !== "");
    if (validStaff.length !== form.staff_count) { setModal((p) => ({ ...p, error: "Harap lengkapi semua pilihan staff" })); return; }
    if (new Set(validStaff).size !== validStaff.length) { setModal((p) => ({ ...p, error: "Staff yang sama tidak boleh dipilih lebih dari sekali" })); return; }

    setModal((p) => ({ ...p, isLoading: true, clashes: [], error: "" }));
    const payload = {
      service_type_id: selectedTypeId!, service_name_id: selectedNameId!,
      room_type_id: Number(form.room_type_id), room_name_id: Number(form.room_name_id),
      date: form.date, start_time: form.start_time, end_time: form.end_time,
      timezone: form.timezone, staff_ids: validStaff as number[],
    };
    try {
      const res = mode === "add"
        ? await scheduleAPI.create(payload)
        : await scheduleAPI.update(editId!, payload);
      if (!res.success && res.clashes?.length) { setModal((p) => ({ ...p, clashes: res.clashes!, isLoading: false })); return; }
      if (res.success && res.data) {
        if (mode === "add") setSchedules((p) => [...p, res.data!].sort((a, b) => a.start_time.localeCompare(b.start_time)));
        else setSchedules((p) => p.map((s) => (s.id === editId ? res.data! : s)));
        setModal((p) => ({ ...p, isOpen: false }));
      }
    } catch (err: unknown) {
      setModal((p) => ({ ...p, error: err instanceof Error ? err.message : "Terjadi kesalahan", isLoading: false }));
    }
  };

  /* ── Delete ────────────────────────────────────────── */
  const confirmDelete = async () => {
    setDeleteModal((p) => ({ ...p, isLoading: true, error: "" }));
    try {
      await scheduleAPI.delete(deleteModal.scheduleId);
      setSchedules((p) => p.filter((s) => s.id !== deleteModal.scheduleId));
      setDeleteModal((p) => ({ ...p, isOpen: false }));
    } catch (err: unknown) {
      setDeleteModal((p) => ({ ...p, error: err instanceof Error ? err.message : "Gagal menghapus", isLoading: false }));
    }
  };

  /* ── Copy ──────────────────────────────────────────── */
  const handleCopy = async () => {
    if (!copyModal.targetDate) { setCopyModal((p) => ({ ...p, error: "Pilih tanggal tujuan terlebih dahulu" })); return; }
    setCopyModal((p) => ({ ...p, isLoading: true, clashes: [], error: "", successMsg: "" }));
    try {
      const res = await scheduleAPI.copy(selectedNameId!, filterDate, copyModal.targetDate);
      if (!res.success && res.copy_clashes?.length) { setCopyModal((p) => ({ ...p, clashes: res.copy_clashes!, isLoading: false })); return; }
      if (res.success) setCopyModal((p) => ({ ...p, isLoading: false, successMsg: res.message, clashes: [] }));
    } catch (err: unknown) {
      setCopyModal((p) => ({ ...p, error: err instanceof Error ? err.message : "Terjadi kesalahan", isLoading: false }));
    }
  };

  /* ── Init loading ──────────────────────────────────── */
  if (isInitLoading)
    return (
      <div className="sched-page">
        <div className="sched-loading">
          <Spinner />
          <p className="sched-empty-desc" style={{ marginTop: 10 }}>Memuat data...</p>
        </div>
      </div>
    );

  if (initError)
    return (
      <div className="sched-page">
        <div className="sched-alert sched-alert-danger"><FiAlertTriangle />{initError}</div>
      </div>
    );

  /* ═══════════════════════════════════════════════════ */
  return (
    <div className="sched-page">

      {/* ── Header ──────────────────────────────────── */}
      <div className="sched-header">
        <h1 className="sched-title">Manajemen Schedule Layanan</h1>
        <p className="sched-subtitle">Kelola jadwal berdasarkan tipe layanan, nama layanan, dan tanggal.</p>
      </div>

      {/* ── Filter Panel ────────────────────────────── */}
      <div className="sched-filter-panel">

        {/* Service Type */}
        <div style={{ marginBottom: 18 }}>
          <p className="sched-section-label">Service Type</p>
          <div className="sched-chip-group">
            {serviceTypes.length === 0 ? (
              <span style={{ fontSize: "0.82rem", color: "var(--sched-text-muted)" }}>
                Belum ada service type. Tambahkan di halaman Service.
              </span>
            ) : (
              serviceTypes.map((t) => (
                <button
                  key={t.id}
                  className={`sched-chip${selectedTypeId === t.id ? " active-type" : ""}`}
                  onClick={() => handleSelectType(t.id)}
                >
                  {t.name}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Service Name */}
        {activeType && (
          <div style={{ marginBottom: 18 }}>
            <p className="sched-section-label">Service Name — {activeType.name}</p>
            <div className="sched-chip-group">
              {activeType.services.length === 0 ? (
                <span style={{ fontSize: "0.82rem", color: "var(--sched-text-muted)" }}>
                  Belum ada service name.
                </span>
              ) : (
                activeType.services.map((sn) => (
                  <button
                    key={sn.id}
                    className={`sched-chip${selectedNameId === sn.id ? " active-name" : ""}`}
                    onClick={() => handleSelectName(sn.id)}
                  >
                    {sn.name}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Date picker */}
        {activeName && (
          <div>
            <p className="sched-section-label">Pilih Tanggal</p>
            <div className="sched-datepicker-wrapper">
              <FiCalendar size={14} className="sched-datepicker-icon" />
              <DatePicker
                selected={parseDate(filterDate)}
                onChange={(date: Date | null) => setFilterDate(formatDate(date))}
                className="sched-datepicker-input"
                placeholderText="Pilih tanggal"
                dateFormat="yyyy-MM-dd"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Schedule List ────────────────────────────── */}
      {activeName && filterDate && (
        <>
          <div className="sched-section-header">
            <div>
              <h2 className="sched-section-title">Jadwal {activeName.name}</h2>
              <p className="sched-section-date">{filterDate}</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="sched-btn sched-btn-outline-info"
                onClick={() => setCopyModal({ isOpen: true, targetDate: "", isLoading: false, clashes: [], error: "", successMsg: "" })}
                disabled={schedules.length === 0}
              >
                <FiCopy size={14} /> Salin Jadwal ({schedules.length})
              </button>
              <button className="sched-btn sched-btn-primary" onClick={openAddModal}>
                <FiPlus size={14} /> Tambah Schedule
              </button>
            </div>
          </div>

          {scheduleError && (
            <div className="sched-alert sched-alert-danger">
              <FiAlertTriangle size={15} /> {scheduleError}
            </div>
          )}

          {isLoadingSchedules ? (
            <div className="sched-loading">
              <Spinner />
              <p className="sched-empty-desc" style={{ marginTop: 10 }}>Memuat jadwal...</p>
            </div>
          ) : schedules.length === 0 ? (
            <div className="sched-empty">
              <div className="sched-empty-icon">
                <FiCalendar size={24} color="var(--sched-text-muted)" />
              </div>
              <p className="sched-empty-title">Belum ada jadwal</p>
              <p className="sched-empty-desc">Tambahkan jadwal baru untuk tanggal ini.</p>
            </div>
          ) : (
            <div className="sched-grid">
              {schedules.map((sch) => (
                <div className="sched-card" key={sch.id}>
                  <div className="sched-card-body">
                    {/* Time strip */}
                    <div className="sched-time-strip">
                      <span className="sched-badge sched-badge-time">
                        <FiClock size={10} />
                        {sch.start_time} – {sch.end_time} {sch.timezone}
                      </span>
                      <span className="sched-badge sched-badge-duration">{sch.duration_minutes} mnt</span>
                      <span className="sched-badge sched-badge-slot">{sch.slot} orang</span>
                    </div>

                    {/* Room */}
                    <div className="sched-meta-item">
                      <FiHome size={13} className="sched-meta-icon" />
                      <span>
                        <span className="sched-meta-label">Ruangan:</span>
                        <span className="sched-meta-value">{sch.room_name.name}</span>
                        <span className="sched-meta-label"> ({sch.room_type.name})</span>
                      </span>
                    </div>

                    {/* Staff */}
                    <div className="sched-meta-item">
                      <FiUsers size={13} className="sched-meta-icon" />
                      <div>
                        <span className="sched-meta-label">Staff:</span>
                        {sch.staffs.length > 0 ? (
                          <div className="sched-staff-chips">
                            {sch.staffs.map((s) => (
                              <span key={s.id} className="sched-staff-chip">{s.name}</span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontStyle: "italic", color: "var(--sched-text-muted)", fontSize: "0.78rem" }}>
                            Tanpa staff
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="sched-card-footer">
                    <button
                      className="sched-btn sched-btn-sm sched-btn-edit"
                      onClick={() => openEditModal(sch)}
                    >
                      <FiEdit2 size={12} /> Edit
                    </button>
                    <button
                      className="sched-btn sched-btn-sm sched-btn-delete"
                      onClick={() => setDeleteModal({ isOpen: true, scheduleId: sch.id, isLoading: false, error: "" })}
                    >
                      <FiTrash2 size={12} /> Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════
          Modal: Add / Edit Schedule
      ══════════════════════════════════════════════ */}
      {modal.isOpen && (
        <div className="sched-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget && !modal.isLoading) setModal((p) => ({ ...p, isOpen: false })); }}>
          <div className="sched-modal">
            <div className="sched-modal-header">
              <h2 className="sched-modal-title">
                {modal.mode === "add" ? <><FiPlus size={16} /> Tambah Jadwal</> : <><FiEdit2 size={16} /> Edit Jadwal</>}
              </h2>
              <button className="sched-modal-close" onClick={() => !modal.isLoading && setModal((p) => ({ ...p, isOpen: false }))}>
                <FiX size={15} />
              </button>
            </div>

            <div className="sched-modal-body">
              {/* Clash alert */}
              {modal.clashes.length > 0 && (
                <div className="sched-alert sched-alert-danger">
                  <FiAlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <strong>Bentrok Jadwal Terdeteksi</strong>
                    {modal.clashes.map((c, i) => (
                      <div key={i} style={{ marginTop: 6, display: "flex", alignItems: "flex-start", gap: 6 }}>
                        <span className={`sched-clash-badge ${c.type === "room" ? "sched-clash-room" : "sched-clash-staff"}`}>
                          {c.type === "room" ? "Ruangan" : "Staff"}
                        </span>
                        <span style={{ fontSize: "0.78rem" }}>{c.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {modal.error && (
                <div className="sched-alert sched-alert-danger"><FiAlertTriangle size={15} />{modal.error}</div>
              )}

              {/* Row 1a: date + time */}
              <div className="sched-form-row sched-form-row-2">
                <div className="sched-form-group">
                  <label className="sched-label">Tanggal<span className="sched-required">*</span></label>
                  <div className="sched-datepicker-wrapper" style={{ width: "100%" }}>
                    <FiCalendar size={13} className="sched-datepicker-icon" />
                    <DatePicker
                      selected={parseDate(modal.form.date)}
                      onChange={(date: Date | null) => setModal((p) => ({ ...p, form: { ...p.form, date: formatDate(date) } }))}
                      className="sched-datepicker-input"
                      minDate={new Date()}
                      placeholderText="Pilih tanggal"
                      dateFormat="yyyy-MM-dd"
                      disabled={modal.isLoading}
                    />
                  </div>
                </div>

                <div className="sched-form-group">
                  <label className="sched-label">Waktu Mulai – Selesai<span className="sched-required">*</span></label>
                  <div className="sched-input-group">
                    <input type="time" className="sched-input" name="start_time" value={modal.form.start_time} onChange={handleFormInput} disabled={modal.isLoading} />
                    <span className="sched-input-sep">s/d</span>
                    <input type="time" className="sched-input" name="end_time" value={modal.form.end_time} onChange={handleFormInput} disabled={modal.isLoading} />
                  </div>
                </div>
              </div>

              {/* Row 1b: timezone + duration */}
              <div className="sched-form-row sched-form-row-2">
                <div className="sched-form-group">
                  <label className="sched-label">Zona Waktu</label>
                  <select className="sched-select" name="timezone" value={modal.form.timezone} onChange={handleFormInput} disabled={modal.isLoading}>
                    <option value="WIB">WIB — Waktu Indonesia Barat</option>
                    <option value="WITA">WITA — Waktu Indonesia Tengah</option>
                    <option value="WIT">WIT — Waktu Indonesia Timur</option>
                  </select>
                </div>

                <div className="sched-form-group">
                  <label className="sched-label">Durasi</label>
                  <div className="sched-duration-display">
                    {modal.form.duration_minutes > 0 ? `${modal.form.duration_minutes} menit` : "–"}
                  </div>
                </div>
              </div>

              <div className="sched-form-divider" />

              {/* Row 2: room type + room name */}
              <div className="sched-form-row sched-form-row-2">
                <div className="sched-form-group">
                  <label className="sched-label">Room Type<span className="sched-required">*</span></label>
                  <select className="sched-select" name="room_type_id" value={modal.form.room_type_id} onChange={handleFormInput} disabled={modal.isLoading}>
                    <option value="">-- Pilih Room Type --</option>
                    {roomTypes.map((rt) => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                  </select>
                </div>
                <div className="sched-form-group">
                  <label className="sched-label">Room Name<span className="sched-required">*</span></label>
                  <select className="sched-select" name="room_name_id" value={modal.form.room_name_id} onChange={handleFormInput} disabled={modal.isLoading || !modal.form.room_type_id}>
                    <option value="">-- Pilih Room --</option>
                    {filteredRoomNames(modal.form.room_type_id).map((rn) => (
                      <option key={rn.id} value={rn.id}>{rn.name} (kapasitas: {rn.capacity} orang)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sched-form-divider" />

              {/* Staff count */}
              <div className="sched-form-row sched-form-row-2" style={{ maxWidth: 320 }}>
                <div className="sched-form-group">
                  <label className="sched-label">Jumlah Staff</label>
                  <input
                    type="number"
                    className="sched-input"
                    name="staff_count"
                    min={0}
                    max={staffList.length}
                    value={modal.form.staff_count}
                    onChange={handleFormInput}
                    disabled={modal.isLoading}
                  />
                  <p className="sched-help-text">0 = tanpa staff</p>
                </div>
              </div>

              {/* Staff selects */}
              {modal.form.staff_count > 0 && (
                <div className="sched-staff-panel">
                  <p className="sched-staff-panel-title">Pilih Nama Staff</p>
                  <div className="sched-form-row sched-form-row-2">
                    {Array.from({ length: modal.form.staff_count }).map((_, idx) => {
                      const otherSelected = modal.form.staff_ids.filter((_, i) => i !== idx).filter((id) => id !== "");
                      return (
                        <div key={idx} className="sched-form-group" style={{ marginBottom: 8 }}>
                          <select
                            className="sched-select"
                            value={modal.form.staff_ids[idx] ?? ""}
                            onChange={(e) => handleStaffSelect(idx, e.target.value)}
                            disabled={modal.isLoading}
                          >
                            <option value="">-- Staff {idx + 1} --</option>
                            {staffList.map((st) => (
                              <option key={st.id} value={st.id} disabled={otherSelected.includes(st.id)}>
                                {st.name}{otherSelected.includes(st.id) ? " (sudah dipilih)" : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="sched-modal-footer">
              <button className="sched-btn sched-btn-light" onClick={() => !modal.isLoading && setModal((p) => ({ ...p, isOpen: false }))} disabled={modal.isLoading}>
                Batal
              </button>
              <button className="sched-btn sched-btn-primary" onClick={handleSave} disabled={modal.isLoading}>
                {modal.isLoading ? <><Spinner size={14} /> &nbsp;Menyimpan...</> : "Simpan Jadwal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          Modal: Delete Confirm
      ══════════════════════════════════════════════ */}
      {deleteModal.isOpen && (
        <div className="sched-modal-backdrop">
          <div className="sched-modal sched-modal-sm">
            <div className="sched-modal-body" style={{ padding: "28px 26px 20px", textAlign: "center" }}>
              <div className="sched-confirm-icon sched-confirm-icon-danger">
                <FiTrash2 size={24} color="var(--sched-danger)" />
              </div>
              <p className="sched-confirm-title">Hapus Jadwal?</p>
              <p className="sched-confirm-desc">Tindakan ini tidak bisa dibatalkan.</p>
              {deleteModal.error && (
                <div className="sched-alert sched-alert-danger" style={{ marginTop: 14, textAlign: "left" }}>
                  <FiAlertTriangle size={14} />{deleteModal.error}
                </div>
              )}
            </div>
            <div className="sched-modal-footer" style={{ justifyContent: "center" }}>
              <button className="sched-btn sched-btn-light" onClick={() => setDeleteModal((p) => ({ ...p, isOpen: false }))} disabled={deleteModal.isLoading}>
                Batal
              </button>
              <button className="sched-btn sched-btn-danger" onClick={confirmDelete} disabled={deleteModal.isLoading}>
                {deleteModal.isLoading ? <><Spinner size={14} /> &nbsp;Menghapus...</> : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          Modal: Copy Schedule
      ══════════════════════════════════════════════ */}
      {copyModal.isOpen && (
        <div className="sched-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget && !copyModal.isLoading) setCopyModal((p) => ({ ...p, isOpen: false })); }}>
          <div className="sched-modal" style={{ maxWidth: 480 }}>
            <div className="sched-modal-header">
              <h2 className="sched-modal-title"><FiCopy size={15} /> Salin {schedules.length} Jadwal</h2>
              <button className="sched-modal-close" onClick={() => !copyModal.isLoading && setCopyModal((p) => ({ ...p, isOpen: false }))}><FiX size={15} /></button>
            </div>

            <div className="sched-modal-body">
              {copyModal.successMsg && (
                <div className="sched-alert sched-alert-success">✅ {copyModal.successMsg}</div>
              )}

              {copyModal.clashes.length > 0 && (
                <div className="sched-alert sched-alert-danger">
                  <FiAlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <strong>Bentrok Jadwal Saat Penyalinan</strong>
                    {copyModal.clashes.map((cc, i) => (
                      <div key={i} style={{ marginTop: 8 }}>
                        <p style={{ fontWeight: 600, fontSize: "0.78rem", marginBottom: 4 }}>Sesi {cc.schedule}:</p>
                        {cc.clashes.map((c, j) => (
                          <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginLeft: 8 }}>
                            <span className={`sched-clash-badge ${c.type === "room" ? "sched-clash-room" : "sched-clash-staff"}`}>
                              {c.type === "room" ? "Ruangan" : "Staff"}
                            </span>
                            <span style={{ fontSize: "0.78rem" }}>{c.message}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {copyModal.error && (
                <div className="sched-alert sched-alert-danger"><FiAlertTriangle size={15} />{copyModal.error}</div>
              )}

              {!copyModal.successMsg && (
                <>
                  <div className="sched-alert sched-alert-info" style={{ marginBottom: 16 }}>
                    Semua jadwal dari tanggal <strong>{filterDate}</strong> akan disalin ke tanggal yang dipilih. Hanya tanggalnya yang berubah.
                  </div>
                  <div className="sched-form-group">
                    <label className="sched-label">Tanggal Tujuan<span className="sched-required">*</span></label>
                    <div className="sched-datepicker-wrapper">
                      <FiCalendar size={13} className="sched-datepicker-icon" />
                      <DatePicker
                        selected={parseDate(copyModal.targetDate)}
                        onChange={(date: Date | null) => setCopyModal((p) => ({ ...p, targetDate: formatDate(date), clashes: [], error: "" }))}
                        className="sched-datepicker-input"
                        minDate={new Date()}
                        placeholderText="Pilih tanggal"
                        dateFormat="yyyy-MM-dd"
                        disabled={copyModal.isLoading}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="sched-modal-footer">
              <button className="sched-btn sched-btn-light" onClick={() => setCopyModal((p) => ({ ...p, isOpen: false }))} disabled={copyModal.isLoading}>
                {copyModal.successMsg ? "Tutup" : "Batal"}
              </button>
              {!copyModal.successMsg && (
                <button className="sched-btn sched-btn-info" onClick={handleCopy} disabled={copyModal.isLoading || !copyModal.targetDate}>
                  {copyModal.isLoading ? <><Spinner size={14} /> &nbsp;Menyalin...</> : "Salin & Simpan"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
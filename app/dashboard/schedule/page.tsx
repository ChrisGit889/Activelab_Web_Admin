"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Spinner } from "react-bootstrap";
import { FiEdit2, FiTrash2, FiPlus, FiCopy, FiAlertTriangle } from "react-icons/fi";
import {
  scheduleAPI, serviceAPI, roomAPI, staffAPI,
  Schedule, ServiceType, RoomType, Staff,
  ClashError, CopyClashError,
} from "../../lib/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";


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


const getTodayDate = () => new Date().toISOString().split("T")[0];

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

const formatDate = (date: Date | null) => {
  if (!date) return "";
  return date.toISOString().split("T")[0];
};

const parseDate = (dateStr: string) => {
  return dateStr ? new Date(dateStr) : null;
};


export default function SchedulePage() {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isInitLoading, setIsInitLoading] = useState(true);
  const [initError, setInitError] = useState("");

  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [selectedNameId, setSelectedNameId] = useState<number | null>(null);
  const [filterDate, setFilterDate] = useState("");

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [scheduleError, setScheduleError] = useState("");

  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    mode: "add",
    form: defaultForm(),
    isLoading: false,
    clashes: [],
    error: "",
  });

  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    scheduleId: 0,
    isLoading: false,
    error: "",
  });

  const [copyModal, setCopyModal] = useState<CopyModalState>({
    isOpen: false,
    targetDate: "",
    isLoading: false,
    clashes: [],
    error: "",
    successMsg: "",
  });

  useEffect(() => {
    const init = async () => {
      setIsInitLoading(true);
      setInitError("");
      try {
        const [svcRes, roomRes, staffRes] = await Promise.all([
          serviceAPI.getAll(),
          roomAPI.getAll(),
          staffAPI.getAll(),
        ]);
        setServiceTypes(svcRes.data);
        setRoomTypes(roomRes.data);
        setStaffList(staffRes.data);
      } catch (err: unknown) {
        setInitError(err instanceof Error ? err.message : "Gagal memuat data awal");
      } finally {
        setIsInitLoading(false);
      }
    };
    init();
  }, []);

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
    if (selectedNameId && filterDate) {
      fetchSchedules();
    } else {
      setSchedules([]);
    }
  }, [selectedNameId, filterDate, fetchSchedules]);

  const handleSelectType = (typeId: number) => {
    setSelectedTypeId(typeId);
    setSelectedNameId(null);
    setFilterDate("");
    setSchedules([]);
  };

  const handleSelectName = (nameId: number) => {
    setSelectedNameId(nameId);
    setFilterDate("");
    setSchedules([]);
  };

  const activeType = serviceTypes.find((t) => t.id === selectedTypeId) ?? null;
  const activeName = activeType?.services.find((s) => s.id === selectedNameId) ?? null;

  const filteredRoomNames = (roomTypeId: number | "") => {
    if (!roomTypeId) return [];
    return roomTypes.find((rt) => rt.id === roomTypeId)?.rooms ?? [];
  };

  const openAddModal = () => {
    if (!selectedTypeId || !selectedNameId || !filterDate) return;
    setModal({
      isOpen: true,
      mode: "add",
      form: defaultForm(filterDate),
      isLoading: false,
      clashes: [],
      error: "",
    });
  };

  const openEditModal = (sch: Schedule) => {
    setModal({
      isOpen: true,
      mode: "edit",
      editId: sch.id,
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
      isLoading: false,
      clashes: [],
      error: "",
    });
  };


  const handleFormInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setModal((prev) => {
      const updated = { ...prev.form, [name]: value };

   
      if (name === "start_time" || name === "end_time") {
        updated.duration_minutes = calcDuration(
          name === "start_time" ? value : updated.start_time,
          name === "end_time" ? value : updated.end_time
        );
      }

      if (name === "room_type_id") {
        updated.room_name_id = "";
        updated.room_type_id = value ? Number(value) : "";
      }
      if (name === "room_name_id") {
        updated.room_name_id = value ? Number(value) : "";
      }

      if (name === "staff_count") {
        const count = Math.max(0, parseInt(value) || 0);
        updated.staff_count = count;
        const current = [...prev.form.staff_ids];
        if (count > current.length) {
          while (current.length < count) current.push("");
        } else {
          current.splice(count);
        }
        updated.staff_ids = current;
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

  const handleSave = async () => {
    const { form, mode, editId } = modal;


    if (!form.date) {
      setModal((p) => ({ ...p, error: "Tanggal wajib dipilih" }));
      return;
    }
    if (!form.start_time || !form.end_time) {
      setModal((p) => ({ ...p, error: "Waktu mulai dan selesai wajib diisi" }));
      return;
    }
    if (form.duration_minutes <= 0) {
      setModal((p) => ({ ...p, error: "Waktu selesai harus lebih besar dari waktu mulai" }));
      return;
    }
    if (!form.room_type_id || !form.room_name_id) {
      setModal((p) => ({ ...p, error: "Ruangan wajib dipilih" }));
      return;
    }

    const validStaff = form.staff_ids.filter((id) => id !== "");
    if (validStaff.length !== form.staff_count) {
      setModal((p) => ({ ...p, error: "Harap lengkapi semua pilihan staff" }));
      return;
    }
    if (new Set(validStaff).size !== validStaff.length) {
      setModal((p) => ({ ...p, error: "Staff yang sama tidak boleh dipilih lebih dari sekali" }));
      return;
    }

    setModal((p) => ({ ...p, isLoading: true, clashes: [], error: "" }));

    const payload = {
      service_type_id: selectedTypeId!,
      service_name_id: selectedNameId!,
      room_type_id: Number(form.room_type_id),
      room_name_id: Number(form.room_name_id),
      date: form.date,
      start_time: form.start_time,
      end_time: form.end_time,
      timezone: form.timezone,
      staff_ids: validStaff as number[],
    };

    try {
      const res =
        mode === "add"
          ? await scheduleAPI.create(payload)
          : await scheduleAPI.update(editId!, payload);

      if (!res.success && res.clashes && res.clashes.length > 0) {
  
        setModal((p) => ({ ...p, clashes: res.clashes!, isLoading: false }));
        return;
      }

      if (res.success && res.data) {
        if (mode === "add") {
          setSchedules((prev) => [...prev, res.data!].sort((a, b) =>
            a.start_time.localeCompare(b.start_time)
          ));
        } else {
          setSchedules((prev) =>
            prev.map((s) => (s.id === editId ? res.data! : s))
          );
        }
        setModal((p) => ({ ...p, isOpen: false }));
      }
    } catch (err: unknown) {
      setModal((p) => ({
        ...p,
        error: err instanceof Error ? err.message : "Terjadi kesalahan",
        isLoading: false,
      }));
    }
  };

  const confirmDelete = async () => {
    setDeleteModal((p) => ({ ...p, isLoading: true, error: "" }));
    try {
      await scheduleAPI.delete(deleteModal.scheduleId);
      setSchedules((prev) => prev.filter((s) => s.id !== deleteModal.scheduleId));
      setDeleteModal((p) => ({ ...p, isOpen: false }));
    } catch (err: unknown) {
      setDeleteModal((p) => ({
        ...p,
        error: err instanceof Error ? err.message : "Gagal menghapus",
        isLoading: false,
      }));
    }
  };

  const handleCopy = async () => {
    if (!copyModal.targetDate) {
      setCopyModal((p) => ({ ...p, error: "Pilih tanggal tujuan terlebih dahulu" }));
      return;
    }
    setCopyModal((p) => ({ ...p, isLoading: true, clashes: [], error: "", successMsg: "" }));
    try {
      const res = await scheduleAPI.copy(selectedNameId!, filterDate, copyModal.targetDate);

      if (!res.success && res.copy_clashes && res.copy_clashes.length > 0) {
        setCopyModal((p) => ({ ...p, clashes: res.copy_clashes!, isLoading: false }));
        return;
      }

      if (res.success) {
        setCopyModal((p) => ({
          ...p,
          isLoading: false,
          successMsg: res.message,
          clashes: [],
        }));
      }
    } catch (err: unknown) {
      setCopyModal((p) => ({
        ...p,
        error: err instanceof Error ? err.message : "Terjadi kesalahan",
        isLoading: false,
      }));
    }
  };

  if (isInitLoading) {
    return (
      <div className="container py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-2">Memuat data...</p>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">{initError}</div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h4 className="fw-bold mb-4">Manajemen Schedule Layanan</h4>

      <div className="mb-4">
        <p className="fw-semibold small text-muted text-uppercase mb-2" style={{ letterSpacing: "0.5px" }}>
          Service Type
        </p>
        <div className="d-flex gap-2 flex-wrap">
          {serviceTypes.length === 0 ? (
            <p className="text-muted small">Belum ada service type. Tambahkan di halaman Service.</p>
          ) : (
            serviceTypes.map((t) => (
              <button
                key={t.id}
                className={`btn text-capitalize ${selectedTypeId === t.id ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => handleSelectType(t.id)}
              >
                {t.name}
              </button>
            ))
          )}
        </div>
      </div>

      {activeType && (
        <div className="mb-4">
          <p className="fw-semibold small text-muted text-uppercase mb-2" style={{ letterSpacing: "0.5px" }}>
            Service Name — {activeType.name}
          </p>
          <div className="d-flex gap-2 flex-wrap">
            {activeType.services.length === 0 ? (
              <p className="text-muted small">Belum ada service name.</p>
            ) : (
              activeType.services.map((sn) => (
                <button
                  key={sn.id}
                  className={`btn text-capitalize ${selectedNameId === sn.id ? "btn-success" : "btn-outline-success"}`}
                  onClick={() => handleSelectName(sn.id)}
                >
                  {sn.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {activeName && (
        <div className="mb-4">
          <p className="fw-semibold small text-muted text-uppercase mb-2" style={{ letterSpacing: "0.5px" }}>
            Pilih Tanggal
          </p>
         <DatePicker
  selected={parseDate(filterDate)}
  onChange={(date: Date | null) => setFilterDate(formatDate(date))}
  className="form-control"
  placeholderText="Pilih tanggal"
  dateFormat="yyyy-MM-dd"
/>
        </div>
      )}

      {activeName && filterDate && (
        <>
          <hr />
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
            <div>
              <h5 className="fw-bold mb-0 text-capitalize">
                Jadwal {activeName.name}
              </h5>
              <p className="text-muted small mb-0">{filterDate}</p>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-info d-flex align-items-center gap-2"
                onClick={() => setCopyModal({ isOpen: true, targetDate: "", isLoading: false, clashes: [], error: "", successMsg: "" })}
                disabled={schedules.length === 0}
              >
                <FiCopy size={15} /> Salin Jadwal ({schedules.length})
              </button>
              <button
                className="btn btn-primary d-flex align-items-center gap-2"
                onClick={openAddModal}
              >
                <FiPlus /> Tambah Schedule
              </button>
            </div>
          </div>


          {scheduleError && (
            <div className="alert alert-danger py-2 small">{scheduleError}</div>
          )}

          {isLoadingSchedules ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" size="sm" />
              <span className="ms-2 text-muted small">Memuat jadwal...</span>
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <p>Belum ada jadwal pada tanggal ini.</p>
            </div>
          ) : (
            <div className="row g-3">
              {schedules.map((sch) => (
                <div className="col-md-6 col-lg-4" key={sch.id}>
                  <div className="card border-0 shadow-sm border-start border-primary border-4 h-100">
                    <div className="card-body">
                      {/* Waktu & durasi */}
                      <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
  <span className="badge bg-primary">
    {sch.start_time} – {sch.end_time} {sch.timezone}
  </span>
  <span className="badge bg-light text-secondary border" style={{ fontSize: 11 }}>
    {sch.duration_minutes} menit
  </span>
  <span className="badge bg-success" style={{ fontSize: 11 }}>
    {sch.slot} orang
  </span>
</div>

                      {/* Room */}
                      <p className="mb-1 small">
                        <span className="text-muted">Ruangan: </span>
                        <span className="fw-semibold text-capitalize">
                          {sch.room_name.name}
                        </span>
                        <span className="text-muted"> ({sch.room_type.name})</span>
                      </p>

                      {/* Staff */}
                      <p className="mb-2 small">
                        <span className="text-muted">Staff: </span>
                        {sch.staffs.length > 0 ? (
                          <span className="fw-semibold">
                            {sch.staffs.map((s) => s.name).join(", ")}
                          </span>
                        ) : (
                          <span className="text-muted fst-italic">Tanpa staff</span>
                        )}
                      </p>
                    </div>

                    <div className="card-footer bg-transparent border-0 d-flex gap-2 pb-3 px-3">
                      <button
                        className="btn btn-sm btn-outline-warning flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                        onClick={() => openEditModal(sch)}
                      >
                        <FiEdit2 size={13} /> Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                        onClick={() => setDeleteModal({ isOpen: true, scheduleId: sch.id, isLoading: false, error: "" })}
                      >
                        <FiTrash2 size={13} /> Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {modal.isOpen && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.6)", overflowY: "auto" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered my-4">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">
                  {modal.mode === "add" ? "Tambah Jadwal Layanan" : "Edit Jadwal Layanan"}
                </h5>
                <button
                  className="btn-close"
                  onClick={() => setModal((p) => ({ ...p, isOpen: false }))}
                  disabled={modal.isLoading}
                />
              </div>

              <div className="modal-body px-4">


                {modal.clashes.length > 0 && (
                  <div className="alert alert-danger">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <FiAlertTriangle />
                      <strong>Bentrok Jadwal Terdeteksi</strong>
                    </div>
                    {modal.clashes.map((c, i) => (
                      <div key={i} className="d-flex align-items-start gap-2 small">
                        <span className={`badge ${c.type === "room" ? "bg-warning text-dark" : "bg-danger"}`}>
                          {c.type === "room" ? "Ruangan" : "Staff"}
                        </span>
                        <span>{c.message}</span>
                      </div>
                    ))}
                  </div>
                )}


                {modal.error && (
                  <div className="alert alert-danger py-2 small">{modal.error}</div>
                )}


                <div className="row g-3 mb-3">
                  <div className="col-md-3">
                    <label className="form-label small fw-semibold">Tanggal <span className="text-danger">*</span></label>
                    <DatePicker
  selected={parseDate(modal.form.date)}
  onChange={(date: Date | null) =>
    setModal((prev) => ({
      ...prev,
      form: { ...prev.form, date: formatDate(date) },
    }))
  }
  className="form-control"
  minDate={new Date()}
  placeholderText="Pilih tanggal"
  dateFormat="yyyy-MM-dd"
  disabled={modal.isLoading}
/>
                  </div>
                  <div className="col-md-5">
                    <label className="form-label small fw-semibold">Waktu Mulai – Selesai <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <input
                        type="time"
                        className="form-control"
                        name="start_time"
                        value={modal.form.start_time}
                        onChange={handleFormInput}
                        disabled={modal.isLoading}
                      />
                      <span className="input-group-text">s/d</span>
                      <input
                        type="time"
                        className="form-control"
                        name="end_time"
                        value={modal.form.end_time}
                        onChange={handleFormInput}
                        disabled={modal.isLoading}
                      />
                    </div>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small fw-semibold">Zona Waktu</label>
                    <select
                      className="form-select"
                      name="timezone"
                      value={modal.form.timezone}
                      onChange={handleFormInput}
                      disabled={modal.isLoading}
                    >
                      <option value="WIB">WIB</option>
                      <option value="WITA">WITA</option>
                      <option value="WIT">WIT</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small fw-semibold">Durasi</label>
                    <div
                      className="form-control bg-light text-info fw-bold"
                      style={{ cursor: "default" }}
                    >
                      {modal.form.duration_minutes > 0
                        ? `${modal.form.duration_minutes} mnt`
                        : "–"}
                    </div>
                  </div>
                </div>

                <hr />


                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Room Type <span className="text-danger">*</span></label>
                    <select
                      className="form-select"
                      name="room_type_id"
                      value={modal.form.room_type_id}
                      onChange={handleFormInput}
                      disabled={modal.isLoading}
                    >
                      <option value="">-- Pilih Room Type --</option>
                      {roomTypes.map((rt) => (
                        <option key={rt.id} value={rt.id}>{rt.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Room Name <span className="text-danger">*</span></label>
                    <select
                      className="form-select"
                      name="room_name_id"
                      value={modal.form.room_name_id}
                      onChange={handleFormInput}
                      disabled={modal.isLoading || !modal.form.room_type_id}
                    >
                      <option value="">-- Pilih Room --</option>
                      {filteredRoomNames(modal.form.room_type_id).map((rn) => (
                        <option key={rn.id} value={rn.id}>
                          {rn.name} (kapasitas :  {rn.capacity} orang)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <hr />

                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Jumlah Staff</label>
                    <input
                      type="number"
                      className="form-control"
                      name="staff_count"
                      min={0}
                      max={staffList.length}
                      value={modal.form.staff_count}
                      onChange={handleFormInput}
                      disabled={modal.isLoading}
                    />
                    <div className="form-text">0 = tanpa staff</div>
                  </div>
                </div>

                {modal.form.staff_count > 0 && (
                  <div className="p-3 bg-light rounded mt-3">
                    <label className="form-label small fw-semibold mb-2">Pilih Nama Staff</label>
                    <div className="row g-2">
                      {Array.from({ length: modal.form.staff_count }).map((_, idx) => {
                        const otherSelected = modal.form.staff_ids
                          .filter((_, i) => i !== idx)
                          .filter((id) => id !== "");

                        return (
                          <div className="col-md-6" key={idx}>
                            <select
                              className="form-select form-select-sm"
                              value={modal.form.staff_ids[idx] ?? ""}
                              onChange={(e) => handleStaffSelect(idx, e.target.value)}
                              disabled={modal.isLoading}
                            >
                              <option value="">-- Pilih Staff {idx + 1} --</option>
                              {staffList.map((st) => (
                                <option
                                  key={st.id}
                                  value={st.id}
                                  disabled={otherSelected.includes(st.id)}
                                >
                                  {st.name}
                                  {otherSelected.includes(st.id) ? " (sudah dipilih)" : ""}
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

              <div className="modal-footer border-0">
                <button
                  className="btn btn-light border px-4"
                  onClick={() => setModal((p) => ({ ...p, isOpen: false }))}
                  disabled={modal.isLoading}
                >
                  Batal
                </button>
                <button
                  className="btn btn-primary px-4"
                  onClick={handleSave}
                  disabled={modal.isLoading}
                >
                  {modal.isLoading ? (
                    <><Spinner as="span" animation="border" size="sm" className="me-2" /> Menyimpan...</>
                  ) : "Simpan Jadwal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {deleteModal.isOpen && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 400 }}>
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-body p-4 text-center">
                <div
                  className="rounded-circle bg-danger bg-opacity-10 d-flex align-items-center justify-content-center mx-auto mb-3"
                  style={{ width: 56, height: 56 }}
                >
                  <FiTrash2 size={24} color="#dc3545" />
                </div>
                <h5 className="fw-bold mb-2">Hapus Jadwal?</h5>
                <p className="text-muted small mb-3">Tindakan ini tidak bisa dibatalkan.</p>
                {deleteModal.error && (
                  <div className="alert alert-danger py-2 small">{deleteModal.error}</div>
                )}
              </div>
              <div className="modal-footer border-0 pt-0 justify-content-center gap-2">
                <button
                  className="btn btn-light border px-4"
                  onClick={() => setDeleteModal((p) => ({ ...p, isOpen: false }))}
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
                    <><Spinner as="span" animation="border" size="sm" className="me-2" /> Menghapus...</>
                  ) : "Ya, Hapus"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {copyModal.isOpen && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 480 }}>
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">
                  <FiCopy className="me-2" />
                  Salin {schedules.length} Jadwal ke Tanggal Lain
                </h5>
                <button
                  className="btn-close"
                  onClick={() => setCopyModal((p) => ({ ...p, isOpen: false }))}
                  disabled={copyModal.isLoading}
                />
              </div>

              <div className="modal-body px-4">

                {copyModal.successMsg && (
                  <div className="alert alert-success py-2 small">
                    ✅ {copyModal.successMsg}
                  </div>
                )}

                {/* Error bentrok */}
                {copyModal.clashes.length > 0 && (
                  <div className="alert alert-danger">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <FiAlertTriangle />
                      <strong>Bentrok Jadwal Saat Penyalinan</strong>
                    </div>
                    {copyModal.clashes.map((cc, i) => (
                      <div key={i} className="mb-2">
                        <p className="small fw-semibold mb-1">
                          Sesi {cc.schedule}:
                        </p>
                        {cc.clashes.map((c, j) => (
                          <div key={j} className="d-flex align-items-start gap-2 small ms-2">
                            <span className={`badge ${c.type === "room" ? "bg-warning text-dark" : "bg-danger"}`}>
                              {c.type === "room" ? "Ruangan" : "Staff"}
                            </span>
                            <span>{c.message}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* Error umum */}
                {copyModal.error && (
                  <div className="alert alert-danger py-2 small">{copyModal.error}</div>
                )}

                {!copyModal.successMsg && (
                  <>
                    <div className="alert alert-info py-2 small mb-3">
                      Semua jadwal dari tanggal <strong>{filterDate}</strong> akan
                      disalin ke tanggal yang dipilih. Hanya tanggalnya yang berubah.
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold">
                        Tanggal Tujuan <span className="text-danger">*</span>
                      </label>
                      <DatePicker
  selected={parseDate(copyModal.targetDate)}
  onChange={(date: Date | null) =>
    setCopyModal((p) => ({
      ...p,
      targetDate: formatDate(date),
      clashes: [],
      error: "",
    }))
  }
  className="form-control"
  minDate={new Date()}
  placeholderText="Pilih tanggal"
  dateFormat="yyyy-MM-dd"
  disabled={copyModal.isLoading}
/>
                    </div>
                  </>
                )}
              </div>

              <div className="modal-footer border-0">
                <button
                  className="btn btn-light border px-4"
                  onClick={() => setCopyModal((p) => ({ ...p, isOpen: false }))}
                  disabled={copyModal.isLoading}
                >
                  {copyModal.successMsg ? "Tutup" : "Batal"}
                </button>
                {!copyModal.successMsg && (
                  <button
                    className="btn btn-info text-white px-4"
                    onClick={handleCopy}
                    disabled={copyModal.isLoading || !copyModal.targetDate}
                  >
                    {copyModal.isLoading ? (
                      <><Spinner as="span" animation="border" size="sm" className="me-2" /> Menyalin...</>
                    ) : "Salin & Simpan"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
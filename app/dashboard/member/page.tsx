"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Spinner } from "react-bootstrap";
import { FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";
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



const formatRupiah = (num: number) =>
  "Rp " + num.toLocaleString("id-ID");

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
    setModal((prev) => ({
      ...prev,
      form: { ...prev.form, [name]: value },
    }));
  };


  const handleBenefitToggle = (serviceNameId: number) => {
    setModal((prev) => {
      const newSet = new Set(prev.form.benefit_ids);
      if (newSet.has(serviceNameId)) {
        newSet.delete(serviceNameId);
      } else {
        newSet.add(serviceNameId);
      }
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


  const getLevelColor = (level: number) => {
    const colors = ["primary", "success", "warning", "danger", "info", "secondary"];
    return colors[(level - 1) % colors.length];
  };


  if (isLoading) {
    return (
      <div className="container py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-2">Memuat data membership...</p>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">
          {pageError}
          <button className="btn btn-sm btn-outline-danger ms-3" onClick={fetchAll}>
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="container py-4">

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Manajemen Membership</h4>
          <p className="text-muted small mb-0">
            {memberships.length} paket membership terdaftar
          </p>
        </div>
        <button
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={openAddModal}
        >
          <FiPlus /> Tambah Membership
        </button>
      </div>

      {/* Grid card membership */}
      {memberships.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#adb5bd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
          <p className="mb-1">Belum ada paket membership.</p>
          <p className="small">Klik &ldquo;Tambah Membership&rdquo; untuk mulai.</p>
        </div>
      ) : (
        <div className="row g-4">
          {memberships.map((m) => (
            <div className="col-md-4" key={m.id}>
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body">
                  {/* Badge level */}
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className={`badge bg-${getLevelColor(m.level)}`}>
                      Level {m.level}
                    </span>
                    <span className="badge bg-light text-secondary border" style={{ fontSize: 11 }}>
                      {m.active_days} Hari
                    </span>
                  </div>

                  {/* Nama & harga */}
                  <h5 className="fw-bold mb-1">{m.name}</h5>
                  <p className="text-success fw-semibold mb-2" style={{ fontSize: 18 }}>
                    {formatRupiah(m.price)}
                  </p>
                  <p className="text-muted small mb-3">
                    {m.description || "-"}
                  </p>

                  {/* Benefits */}
                  {m.benefits.length > 0 && (
                    <div>
                      <p className="fw-semibold small mb-1">Keuntungan:</p>
                      <div className="d-flex flex-wrap gap-1">
                        {m.benefits.map((b) => (
                          <span
                            key={b.id}
                            className="badge bg-primary bg-opacity-10 text-primary"
                            style={{ fontSize: 11 }}
                          >
                            {b.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="card-footer bg-transparent border-0 d-flex gap-2 pt-0 pb-3 px-3">
                  <button
                    className="btn btn-outline-primary btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                    onClick={() => openEditModal(m)}
                  >
                    <FiEdit2 size={13} /> Edit
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                    onClick={() => openDeleteModal(m)}
                  >
                    <FiTrash2 size={13} /> Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL FORM TAMBAH / EDIT                                   */}
      {/* ══════════════════════════════════════════════════════════ */}
      {modal.isOpen && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)", overflowY: "auto" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable my-4">
            <div className="modal-content border-0 shadow-lg">

              {/* Header */}
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">
                  {modal.mode === "add" ? "Tambah Membership Baru" : "Edit Membership"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setModal((prev) => ({ ...prev, isOpen: false }))}
                  disabled={modal.isLoading}
                />
              </div>

              <div className="modal-body px-4 pb-0">

                {/* Alert error */}
                {modal.error && (
                  <div className="alert alert-danger py-2 small mb-3">
                    {modal.error}
                  </div>
                )}

                {/* Nama */}
                <div className="mb-3">
                  <label className="form-label fw-semibold small">
                    Nama Membership <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={modal.form.name}
                    onChange={handleInput}
                    placeholder="Contoh: Paket Pemula"
                    disabled={modal.isLoading}
                    autoFocus
                  />
                </div>

                {/* Harga */}
                <div className="mb-3">
                  <label className="form-label fw-semibold small">
                    Harga <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">Rp</span>
                    <input
                      type="number"
                      className="form-control"
                      name="price"
                      value={modal.form.price}
                      onChange={handleInput}
                      placeholder="150000"
                      min={0}
                      disabled={modal.isLoading}
                    />
                  </div>
                </div>

                {/* Masa aktif */}
                <div className="mb-3">
                  <label className="form-label fw-semibold small">
                    Masa Aktif <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <input
                      type="number"
                      className="form-control"
                      name="active_days"
                      value={modal.form.active_days}
                      onChange={handleInput}
                      placeholder="30"
                      min={1}
                      disabled={modal.isLoading}
                    />
                    <span className="input-group-text">Hari</span>
                  </div>
                  <div className="form-text">Contoh: 28 hari, 90 hari, 365 hari</div>
                </div>

                {/* Deskripsi */}
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Deskripsi</label>
                  <textarea
                    className="form-control"
                    name="description"
                    rows={2}
                    value={modal.form.description}
                    onChange={handleInput}
                    placeholder="Deskripsi singkat paket..."
                    disabled={modal.isLoading}
                  />
                </div>

                {/* Keuntungan — checkbox dari service_name */}
                <div className="mb-3">
                  <label className="form-label fw-semibold small d-block mb-2">
                    Keuntungan Membership
                  </label>

                  {serviceTypes.length === 0 ? (
                    <p className="text-muted small">
                      Belum ada service. Tambahkan service terlebih dahulu di halaman Service.
                    </p>
                  ) : (
                    <div
                      className="border rounded p-3"
                      style={{ maxHeight: 240, overflowY: "auto", background: "#f8f9fa" }}
                    >
                      {serviceTypes.map((type) => (
                        <div key={type.id} className="mb-3">
                          {/* Nama service type — tidak bisa dicentang */}
                          <p
                            className="fw-bold small text-uppercase text-primary mb-1"
                            style={{ letterSpacing: "0.5px" }}
                          >
                            {type.name}
                          </p>

                          {type.services.length === 0 ? (
                            <p className="text-muted small ms-2">Belum ada service name</p>
                          ) : (
                            <div className="ms-2">
                              {type.services.map((sn) => (
                                <div className="form-check mb-1" key={sn.id}>
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`benefit-${sn.id}`}
                                    checked={modal.form.benefit_ids.has(sn.id)}
                                    onChange={() => handleBenefitToggle(sn.id)}
                                    disabled={modal.isLoading}
                                  />
                                  <label
                                    className="form-check-label small"
                                    htmlFor={`benefit-${sn.id}`}
                                  >
                                    {sn.name}
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tampilkan jumlah yang dicentang */}
                  {modal.form.benefit_ids.size > 0 && (
                    <p className="text-muted small mt-1">
                      {modal.form.benefit_ids.size} keuntungan dipilih
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="modal-footer border-0 pt-0">
                {modal.mode === "add" ? (

                  <button
                    type="button"
                    className="btn btn-success w-100 d-flex align-items-center justify-content-center gap-2"
                    onClick={handleSave}
                    disabled={modal.isLoading}
                  >
                    {modal.isLoading ? (
                      <><Spinner as="span" animation="border" size="sm" /> Menyimpan...</>
                    ) : (
                      <><FiPlus size={18} /> Tambah Membership</>
                    )}
                  </button>
                ) : (

                  <div className="d-flex gap-2 w-100 justify-content-end">
                    <button
                      type="button"
                      className="btn btn-light border px-4"
                      onClick={() => setModal((prev) => ({ ...prev, isOpen: false }))}
                      disabled={modal.isLoading}
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary px-4"
                      onClick={handleSave}
                      disabled={modal.isLoading}
                    >
                      {modal.isLoading ? (
                        <><Spinner as="span" animation="border" size="sm" className="me-2" /> Menyimpan...</>
                      ) : "Simpan"}
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL KONFIRMASI HAPUS                                     */}
      {/* ══════════════════════════════════════════════════════════ */}
      {deleteModal.isOpen && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-body p-4 text-center">
                <div
                  className="rounded-circle bg-danger bg-opacity-10 d-flex align-items-center justify-content-center mx-auto mb-3"
                  style={{ width: 60, height: 60 }}
                >
                  <FiTrash2 size={26} color="#dc3545" />
                </div>

                <h5 className="fw-bold mb-2">Hapus Membership?</h5>

                {deleteModal.error && (
                  <div className="alert alert-danger py-2 small mb-3">
                    {deleteModal.error}
                  </div>
                )}

                <p className="text-muted mb-1">Anda yakin ingin menghapus</p>
                <p className="fw-semibold mb-3">
                  &ldquo;{deleteModal.targetName}&rdquo;?
                </p>

                <div className="alert alert-warning py-2 small text-start">
                  ⚠️ Level membership di atasnya akan otomatis diperbarui.
                </div>
              </div>

              <div className="modal-footer border-0 pt-0 justify-content-center gap-2">
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
                    <><Spinner as="span" animation="border" size="sm" className="me-2" /> Menghapus...</>
                  ) : "Ya, Hapus"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
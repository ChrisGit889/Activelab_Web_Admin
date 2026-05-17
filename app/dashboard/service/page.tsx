"use client";

import { useState } from "react";
import { FiPlus } from "react-icons/fi";

const colors = ["#F8D7DA", "#FFF3CD", "#D1E7DD", "#E2D9F3"];

// 🔹 SECTION COMPONENT
function Section({
  title,
  role,
  name,
  schedules,
  setSchedules,
}: any) {
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    date: "",
    time: "",
    person: "",
    capacity: "",
  });

  const data = schedules[title] || [];

  // 🔥 VALIDASI + SIMPAN GLOBAL
  const handleSubmit = () => {
    if (!form.date) return alert("Tanggal harus diisi");
    if (!form.time) return alert("Jam harus diisi");
    if (role && !form.person) return alert(`Pilih ${role}`);
    if (!form.capacity || Number(form.capacity) <= 0)
      return alert("Kapasitas minimal 1");

    const newData = {
      ...form,
      id: Date.now(),
    };

    setSchedules({
      ...schedules,
      [title]: [...data, newData],
    });

    alert("Jadwal berhasil ditambahkan!");
    setShowModal(false);

    setForm({
      date: "",
      time: "",
      person: "",
      capacity: "",
    });
  };

  return (
    <div className="service-section">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 style={{ fontWeight: 600 }}>{title}</h5>

          {role && (
            <span style={{ fontSize: "12px", opacity: 0.5 }}>
              {role === "mentor" ? "Need Mentor" : "Need Staff"}
            </span>
          )}
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn btn-light rounded-circle shadow-sm d-flex align-items-center justify-content-center"
          style={{ width: "35px", height: "35px" }}
        >
          <FiPlus />
        </button>
      </div>

      {/* LIST */}
      <div className="d-flex gap-3 flex-wrap">
        {data.length === 0 ? (
          <p style={{ fontSize: "12px", opacity: 0.5 }}>
            Belum ada jadwal
          </p>
        ) : (
          data.map((item: any, i: number) => (
            <div
              key={item.id}
              className="service-card"
              style={{
                backgroundColor: colors[i % colors.length],
              }}
            >
              <div className="d-flex justify-content-between">
                <span className="service-title">{title}</span>
                <span style={{ fontSize: "11px" }}>
                  {item.capacity}
                </span>
              </div>

              <p className="service-status mt-1">
                {item.date} | {item.time}
              </p>

              {role && (
                <div style={{ fontSize: "12px" }}>
                  {role === "mentor" ? "Mentor" : "Staff"} :{" "}
                  {item.person}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h5 className="mb-3">Tambah Jadwal - {title}</h5>

            <input
              type="date"
              className="form-control mb-2"
              value={form.date}
              onChange={(e) =>
                setForm({ ...form, date: e.target.value })
              }
            />

            <input
              type="time"
              className="form-control mb-2"
              value={form.time}
              onChange={(e) =>
                setForm({ ...form, time: e.target.value })
              }
            />

            {role && (
              <select
                className="form-control mb-2"
                value={form.person}
                onChange={(e) =>
                  setForm({ ...form, person: e.target.value })
                }
              >
                <option value="">Pilih {role}</option>
                <option>{name}</option>
              </select>
            )}

            <input
              type="number"
              placeholder="Kapasitas"
              className="form-control mb-3"
              value={form.capacity}
              onChange={(e) =>
                setForm({ ...form, capacity: e.target.value })
              }
            />

            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Batal
              </button>

              <button
                className="btn btn-primary"
                onClick={handleSubmit}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 🔹 MAIN PAGE
export default function ServicePage() {
  const [activeTab, setActiveTab] = useState("facility");

  // 🔥 GLOBAL STATE (FIX UTAMA)
  const [schedules, setSchedules] = useState<any>({});

  return (
    <div>
      <h4 className="mb-4">Service Management</h4>

      {/* TAB */}
      <div className="custom-tabs">
        {["appointment", "class", "facility", "consultation"].map((tab) => (
          <button
            key={tab}
            className={`tab-item ${
              activeTab === tab ? "tab-active" : ""
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* APPOINTMENT */}
      {activeTab === "appointment" && (
        <>
          <Section
            title="Massage"
            role="staff"
            name="andi"
            schedules={schedules}
            setSchedules={setSchedules}
          />
          <Section
            title="Spa"
            role="staff"
            name="andi"
            schedules={schedules}
            setSchedules={setSchedules}
          />
          <Section
            title="Fisioterapi"
            role="staff"
            name="andi"
            schedules={schedules}
            setSchedules={setSchedules}
          />
        </>
      )}

      {/* CLASS */}
      {activeTab === "class" && (
        <>
          <Section
            title="Yoga"
            role="mentor"
            name="annuel"
            schedules={schedules}
            setSchedules={setSchedules}
          />
          <Section
            title="HIIT"
            role="mentor"
            name="annuel"
            schedules={schedules}
            setSchedules={setSchedules}
          />
          <Section
            title="Pilates"
            role="mentor"
            name="annuel"
            schedules={schedules}
            setSchedules={setSchedules}
          />
        </>
      )}

      {/* FACILITY */}
      {activeTab === "facility" && (
        <>
          <Section
            title="Shower"
            schedules={schedules}
            setSchedules={setSchedules}
          />
          <Section
            title="Sauna"
            schedules={schedules}
            setSchedules={setSchedules}
          />
          <Section
            title="Recovery Pod"
            schedules={schedules}
            setSchedules={setSchedules}
          />
        </>
      )}

      {/* CONSULTATION */}
      {activeTab === "consultation" && (
        <>
          <Section
            title="Therapy & Consultation"
            role="staff"
            name="andi"
            schedules={schedules}
            setSchedules={setSchedules}
          />
        </>
      )}
    </div>
  );
}
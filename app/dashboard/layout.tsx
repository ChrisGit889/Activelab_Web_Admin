"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    router.push("/login");
  };

  // ─── Cek role sebelum navigasi ke kelola-cabang ───────────────
  const handleKelolaCabang = () => {
    const adminRaw = localStorage.getItem("admin");
    if (!adminRaw) {
      router.push("/login");
      return;
    }

    const admin = JSON.parse(adminRaw);

    if (admin.role !== "pusat") {
      alert("Maaf, hanya admin pusat yang bisa mengakses fitur Kelola Cabang.");
      return;
    }

    router.push("/kelola-cabang");
  };

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      {/* SIDEBAR */}
      <div
        className="text-white p-3 d-flex flex-column"
        style={{
          width: "230px",
          background: "linear-gradient(to bottom, #0D47A1, #42A5F5, #B3E5FC)",
        }}
      >
        {/* LOGO */}
        <div className="text-center mb-4">
          <Image
            src="/images/logo_activelab.png"
            alt="Logo"
            width={80}
            height={80}
          />
        </div>

        {/* MENU */}
        <ul className="nav flex-column gap-2 flex-grow-1">
          {[
            { name: "Dashboard", path: "/dashboard" },
            { name: "Service", path: "/dashboard/service" },
            { name: "Membership", path: "/dashboard/member" },
            { name: "Schedule", path: "/dashboard/schedule" },
            { name: "Staff", path: "/dashboard/staff" },
            { name: "Room", path: "/dashboard/room" },
          ].map((item) => (
            <li key={item.name}>
              <Link
                href={item.path}
                className="menu-item text-white text-decoration-none d-block p-2 rounded"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>

        {/* Kelola Cabang — pakai onClick, bukan Link langsung */}
        <button onClick={handleKelolaCabang} className="btn btn-warning mt-3">
          Kelola Cabang
        </button>

        {/* LOGOUT */}
        <button onClick={handleLogout} className="btn btn-danger mt-3">
          Keluar
        </button>
      </div>

      {/* CONTENT */}
      <div className="flex-grow-1 p-4 bg-light">{children}</div>
    </div>
  );
}

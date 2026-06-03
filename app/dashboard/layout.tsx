"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  FiGrid,
  FiSettings,
  FiCreditCard,
  FiCalendar,
  FiUsers,
  FiHome,
  FiLogOut,
  FiMapPin,
  FiCheckCircle, // Menambahkan icon baru untuk Check-in/Check-out
} from "react-icons/fi";

// Mengisi semua properti icon agar konsisten dan menghindari error 'undefined'
const NAV_ITEMS = [
  { name: "Dashboard", path: "/dashboard", icon: FiGrid },
  { name: "Service", path: "/dashboard/service", icon: FiSettings },
  { name: "Membership", path: "/dashboard/member", icon: FiCreditCard },
  { name: "Schedule", path: "/dashboard/schedule", icon: FiCalendar },
  { name: "Staff", path: "/dashboard/staff", icon: FiUsers },
  { name: "Room", path: "/dashboard/room", icon: FiHome },
  { name: "Check-in", path: "/dashboard/checkin", icon: FiCheckCircle },
  { name: "Check-out", path: "/dashboard/checkout", icon: FiLogOut },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    router.push("/login");
  };

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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }

        .sidebar {
          width: 240px;
          min-height: 100vh;
          background: linear-gradient(180deg, #0f172a 0%, #1e3a8a 60%, #1d4ed8 100%);
          display: flex;
          flex-direction: column;
          padding: 0;
          position: relative;
          flex-shrink: 0;
        }

        .sidebar::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='20'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          pointer-events: none;
        }

        .sidebar-logo {
          padding: 28px 20px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          margin-bottom: 8px;
        }

        .sidebar-logo img {
          filter: brightness(1.1);
        }

        .nav-section {
          padding: 8px 12px;
          flex: 1;
        }

        .nav-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          padding: 4px 8px 10px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 11px 12px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          color: rgba(255,255,255,0.65);
          text-decoration: none;
          transition: all 0.15s;
          margin-bottom: 2px;
          position: relative;
        }
        .nav-item:hover {
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.95);
          text-decoration: none;
        }
        .nav-item.active {
          background: rgba(255,255,255,0.15);
          color: white;
          font-weight: 600;
        }
        .nav-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 20px;
          background: #60a5fa;
          border-radius: 0 4px 4px 0;
        }

        .nav-icon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: rgba(255,255,255,0.07);
          transition: background 0.15s;
        }
        .nav-item:hover .nav-icon {
          background: rgba(255,255,255,0.12);
        }
        .nav-item.active .nav-icon {
          background: rgba(96,165,250,0.25);
        }

        .sidebar-footer {
          padding: 12px;
          border-top: 1px solid rgba(255,255,255,0.08);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .btn-branch {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 14px;
          border-radius: 12px;
          border: 1.5px solid rgba(251,191,36,0.4);
          background: rgba(251,191,36,0.1);
          color: #fbbf24;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          font-family: 'Plus Jakarta Sans', sans-serif;
          width: 100%;
        }
        .btn-branch:hover {
          background: rgba(251,191,36,0.18);
          border-color: rgba(251,191,36,0.6);
        }

        .btn-logout {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 14px;
          border-radius: 12px;
          border: 1.5px solid rgba(239,68,68,0.3);
          background: rgba(239,68,68,0.08);
          color: #f87171;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          font-family: 'Plus Jakarta Sans', sans-serif;
          width: 100%;
        }
        .btn-logout:hover {
          background: rgba(239,68,68,0.15);
          border-color: rgba(239,68,68,0.5);
        }

        .main-content {
          flex: 1;
          background: #f8fafc;
          min-height: 100vh;
          overflow-x: hidden;
        }

        .layout-wrapper {
          display: flex;
          min-height: 100vh;
        }
      `}</style>

      <div className="layout-wrapper">
        {/* Sidebar */}
        <aside className="sidebar">
          {/* Logo */}
          <div className="sidebar-logo">
            <Image
              src="/images/logo_activelab.png"
              alt="Logo ActiveLab"
              width={90}
              height={90}
              style={{ objectFit: "contain" }}
            />
          </div>

          {/* Nav */}
          <nav className="nav-section">
            <p className="nav-label">Menu Utama</p>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.path ||
                (item.path !== "/dashboard" && pathname?.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`nav-item ${isActive ? "active" : ""}`}
                >
                  <span className="nav-icon">
                    {/* Menggunakan kondisional rendering agar aman dari tipe data 'undefined' */}
                    {Icon && <Icon size={16} />}
                  </span>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer buttons */}
          <div className="sidebar-footer">
            <button onClick={handleKelolaCabang} className="btn-branch">
              <FiMapPin size={15} />
              Kelola Cabang
            </button>
            <button onClick={handleLogout} className="btn-logout">
              <FiLogOut size={15} />
              Keluar
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="main-content">{children}</main>
      </div>
    </>
  );
}

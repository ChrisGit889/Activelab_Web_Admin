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
  FiCheckCircle,
} from "react-icons/fi";
import "./slidebar.css";

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
    <div className="layout-wrapper">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-img-wrap">
            <Image
              src="/images/logo_activelab.png"
              alt="Logo ActiveLab"
              width={28}
              height={28}
              style={{ objectFit: "contain" }}
            />
          </div>
          <div className="logo-text">
            <span className="logo-text-name">ActiveLab</span>
            <span className="logo-text-sub">Web Admin</span>
          </div>
        </div>

        <div className="divider" />

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
                <span className="nav-icon">{Icon && <Icon size={15} />}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <p className="footer-label">Aksi</p>

          <button onClick={handleKelolaCabang} className="btn-branch">
            <span className="btn-branch-icon">
              <FiMapPin size={13} />
            </span>
            Kelola Cabang
          </button>

          <button onClick={handleLogout} className="btn-logout">
            <span className="btn-logout-icon">
              <FiLogOut size={13} />
            </span>
            Keluar
          </button>
        </div>

        {/* Version badge */}
        <div className="version-badge">
          <div className="version-pill">
            <span className="version-dot" />
            PANEL AKTIF
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">{children}</main>
    </div>
  );
}
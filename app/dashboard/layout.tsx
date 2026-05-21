"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Dumbbell,
  Users,
  CalendarDays,
  UserSquare2,
  MapPin,
  LogOut,
} from "lucide-react";

const menuItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    badge: "New",
  },
  { name: "Service", href: "/dashboard/service", icon: Dumbbell },
  { name: "Membership", href: "/dashboard/membership", icon: Users },
  { name: "Schedule", href: "/dashboard/schedule", icon: CalendarDays },
  { name: "Staff", href: "/dashboard/staff", icon: UserSquare2 },
  { name: "room", href: "/dashboard/room", icon: UserSquare2 },
];

type Theme = "light" | "dark";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "1") setTheme("light");
      if (e.altKey && e.key === "2") setTheme("dark");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const isDark = theme === "dark";

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <style>{`
        :root {
          --font-main: 'Plus Jakarta Sans', sans-serif;

          /* DARK */
          --dark-bg-root:    #0b0f1a;
          --dark-bg-sidebar: #0d1221;
          --dark-bg-main:    #0f1520;
          --dark-border:     rgba(255,255,255,0.06);
          --dark-text-hi:    #f0f4ff;
          --dark-text-mid:   rgba(255,255,255,0.55);
          --dark-text-lo:    rgba(255,255,255,0.25);
          --dark-nav-active-bg:     rgba(56,139,253,0.13);
          --dark-nav-active-color:  #6ab4ff;
          --dark-nav-active-border: rgba(56,139,253,0.2);
          --dark-nav-hover-bg:      rgba(255,255,255,0.05);
          --dark-profile-bg:        rgba(255,255,255,0.04);
          --dark-profile-border:    rgba(255,255,255,0.06);
          --dark-badge-bg:          rgba(56,139,253,0.2);
          --dark-badge-color:       #6ab4ff;
          --dark-btn-branch-bg:     rgba(239,159,39,0.1);
          --dark-btn-branch-border: rgba(239,159,39,0.22);
          --dark-btn-branch-color:  #F5C75D;
          --dark-btn-logout-border: rgba(255,255,255,0.08);
          --dark-btn-logout-color:  rgba(255,255,255,0.35);
          --dark-label-color:       rgba(255,255,255,0.2);

          /* LIGHT */
          --light-bg-root:    #f0f2f7;
          --light-bg-sidebar: #ffffff;
          --light-bg-main:    #f4f6fb;
          --light-border:     rgba(0,0,0,0.07);
          --light-text-hi:    #111827;
          --light-text-mid:   #4b5563;
          --light-text-lo:    #9ca3af;
          --light-nav-active-bg:     rgba(56,139,253,0.09);
          --light-nav-active-color:  #2563eb;
          --light-nav-active-border: rgba(56,139,253,0.18);
          --light-nav-hover-bg:      rgba(0,0,0,0.04);
          --light-profile-bg:        rgba(0,0,0,0.03);
          --light-profile-border:    rgba(0,0,0,0.07);
          --light-badge-bg:          rgba(37,99,235,0.1);
          --light-badge-color:       #2563eb;
          --light-btn-branch-bg:     rgba(217,119,6,0.08);
          --light-btn-branch-border: rgba(217,119,6,0.2);
          --light-btn-branch-color:  #b45309;
          --light-btn-logout-border: rgba(0,0,0,0.09);
          --light-btn-logout-color:  #6b7280;
          --light-label-color:       #9ca3af;
        }

        /* ── Assign active theme vars ── */
        .theme-dark {
          --bg-root:    var(--dark-bg-root);
          --bg-sidebar: var(--dark-bg-sidebar);
          --bg-main:    var(--dark-bg-main);
          --border:     var(--dark-border);
          --text-hi:    var(--dark-text-hi);
          --text-mid:   var(--dark-text-mid);
          --text-lo:    var(--dark-text-lo);
          --nav-active-bg:     var(--dark-nav-active-bg);
          --nav-active-color:  var(--dark-nav-active-color);
          --nav-active-border: var(--dark-nav-active-border);
          --nav-hover-bg:      var(--dark-nav-hover-bg);
          --profile-bg:        var(--dark-profile-bg);
          --profile-border:    var(--dark-profile-border);
          --badge-bg:          var(--dark-badge-bg);
          --badge-color:       var(--dark-badge-color);
          --btn-branch-bg:     var(--dark-btn-branch-bg);
          --btn-branch-border: var(--dark-btn-branch-border);
          --btn-branch-color:  var(--dark-btn-branch-color);
          --btn-logout-border: var(--dark-btn-logout-border);
          --btn-logout-color:  var(--dark-btn-logout-color);
          --label-color:       var(--dark-label-color);
        }

        .theme-light {
          --bg-root:    var(--light-bg-root);
          --bg-sidebar: var(--light-bg-sidebar);
          --bg-main:    var(--light-bg-main);
          --border:     var(--light-border);
          --text-hi:    var(--light-text-hi);
          --text-mid:   var(--light-text-mid);
          --text-lo:    var(--light-text-lo);
          --nav-active-bg:     var(--light-nav-active-bg);
          --nav-active-color:  var(--light-nav-active-color);
          --nav-active-border: var(--light-nav-active-border);
          --nav-hover-bg:      var(--light-nav-hover-bg);
          --profile-bg:        var(--light-profile-bg);
          --profile-border:    var(--light-profile-border);
          --badge-bg:          var(--light-badge-bg);
          --badge-color:       var(--light-badge-color);
          --btn-branch-bg:     var(--light-btn-branch-bg);
          --btn-branch-border: var(--light-btn-branch-border);
          --btn-branch-color:  var(--light-btn-branch-color);
          --btn-logout-border: var(--light-btn-logout-border);
          --btn-logout-color:  var(--light-btn-logout-color);
          --label-color:       var(--light-label-color);
        }

        /* ── Layout ── */
        .al-root {
          display: flex;
          min-height: 100vh;
          background: var(--bg-root);
          font-family: var(--font-main);
          transition: background 0.25s ease;
        }

        /* ── Sidebar ── */
        .al-sidebar {
          width: 264px;
          min-height: 100vh;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          background: var(--bg-sidebar);
          border-right: 1px solid var(--border);
          position: relative;
          overflow: hidden;
          transition: background 0.25s ease, border-color 0.25s ease;
        }

        /* decorative glow blobs */
        .theme-dark .al-sidebar::before {
          content: '';
          position: absolute;
          width: 220px; height: 220px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(56,139,253,0.09) 0%, transparent 70%);
          top: 30px; left: -70px;
          pointer-events: none;
        }
        .theme-dark .al-sidebar::after {
          content: '';
          position: absolute;
          width: 180px; height: 180px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(79,209,197,0.06) 0%, transparent 70%);
          bottom: 90px; left: 10px;
          pointer-events: none;
        }

        /* ── Sidebar header ── */
        .al-header {
          padding: 24px 20px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid var(--border);
          position: relative;
          z-index: 1;
          transition: border-color 0.25s ease;
        }

        .al-logo-mark {
          width: 38px; height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #388BFD 0%, #1E6FD9 100%);
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 14px;
          color: #fff; letter-spacing: -0.5px;
          flex-shrink: 0;
          box-shadow: 0 4px 14px rgba(56,139,253,0.3);
        }

        .al-logo-name {
          font-size: 15px; font-weight: 700;
          color: var(--text-hi);
          letter-spacing: -0.3px; line-height: 1;
          transition: color 0.25s ease;
        }
        .al-logo-tag {
          font-size: 11px; font-weight: 400;
          color: var(--text-lo);
          letter-spacing: 0.3px; margin-top: 3px;
          transition: color 0.25s ease;
        }

        /* ── Theme badge ── */
        .al-theme-badge {
          margin-left: auto;
          font-size: 10px; font-weight: 600;
          color: var(--text-lo);
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 2px 8px;
          letter-spacing: 0.5px;
          white-space: nowrap;
          transition: all 0.25s ease;
        }

        /* ── Nav ── */
        .al-nav {
          flex: 1;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          position: relative;
          z-index: 1;
        }

        .al-nav-label {
          font-size: 10px; font-weight: 600;
          color: var(--label-color);
          letter-spacing: 1.3px;
          text-transform: uppercase;
          padding: 12px 8px 6px;
          transition: color 0.25s ease;
        }

        .al-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          cursor: pointer;
          text-decoration: none !important;
          color: var(--text-mid);
          font-size: 13.5px; font-weight: 400;
          border: 1px solid transparent;
          transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
          position: relative;
        }

        .al-nav-item:hover {
          background: var(--nav-hover-bg);
          color: var(--text-hi);
        }

        .al-nav-item.active {
          background: var(--nav-active-bg);
          color: var(--nav-active-color);
          border-color: var(--nav-active-border);
          font-weight: 600;
        }

        .al-nav-item.active::before {
          content: '';
          position: absolute; left: 0; top: 50%;
          transform: translateY(-50%);
          width: 3px; height: 60%;
          background: #388BFD;
          border-radius: 0 3px 3px 0;
          box-shadow: 0 0 8px rgba(56,139,253,0.55);
        }

        .al-badge {
          margin-left: auto;
          background: var(--badge-bg);
          color: var(--badge-color);
          font-size: 10px; font-weight: 600;
          padding: 2px 7px; border-radius: 20px;
          transition: background 0.25s, color 0.25s;
        }

        /* ── Footer ── */
        .al-footer {
          padding: 12px;
          border-top: 1px solid var(--border);
          display: flex; flex-direction: column; gap: 6px;
          position: relative; z-index: 1;
          transition: border-color 0.25s ease;
        }

        .al-profile {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          background: var(--profile-bg);
          border: 1px solid var(--profile-border);
          cursor: pointer;
          transition: background 0.18s, border-color 0.18s;
        }
        .al-profile:hover { background: var(--nav-hover-bg); }

        .al-avatar {
          width: 30px; height: 30px;
          border-radius: 8px;
          background: linear-gradient(135deg, #4FD1C5 0%, #388BFD 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700;
          color: #fff; flex-shrink: 0;
        }

        .al-profile-name {
          font-size: 13px; font-weight: 600;
          color: var(--text-hi);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          transition: color 0.25s ease;
        }
        .al-profile-role {
          font-size: 11px;
          color: var(--text-lo);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          transition: color 0.25s ease;
        }

        .al-online {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #4FD1C5;
          flex-shrink: 0;
          box-shadow: 0 0 6px rgba(79,209,197,0.7);
        }

        .al-btn-branch {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 10px 16px;
          border-radius: 10px;
          background: var(--btn-branch-bg);
          border: 1px solid var(--btn-branch-border);
          color: var(--btn-branch-color);
          font-size: 13px; font-weight: 500;
          cursor: pointer;
          font-family: var(--font-main);
          text-decoration: none !important;
          transition: background 0.18s, border-color 0.18s;
        }
        .al-btn-branch:hover {
          filter: brightness(1.1);
        }

        .al-btn-logout {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 10px 16px;
          border-radius: 10px;
          background: transparent;
          border: 1px solid var(--btn-logout-border);
          color: var(--btn-logout-color);
          font-size: 13px; font-weight: 400;
          cursor: pointer;
          font-family: var(--font-main);
          width: 100%;
          transition: background 0.18s, border-color 0.18s, color 0.18s;
        }
        .al-btn-logout:hover {
          background: rgba(220,38,38,0.08);
          border-color: rgba(220,38,38,0.2);
          color: #f87171;
        }

        /* ── Main ── */
        .al-main {
          flex: 1;
          background: var(--bg-main);
          overflow: auto;
          font-family: var(--font-main);
          transition: background 0.25s ease;
        }
        .al-main-inner {
          padding: 32px 40px;
        }

        /* ── Shortcut hint toast ── */
        .al-hint {
          position: fixed;
          bottom: 20px;
          right: 24px;
          background: var(--bg-sidebar);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 8px 14px;
          font-size: 12px;
          color: var(--text-lo);
          font-family: var(--font-main);
          z-index: 999;
          display: flex; gap: 10px; align-items: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          transition: background 0.25s, border-color 0.25s;
        }
        .al-hint kbd {
          background: var(--nav-hover-bg);
          border: 1px solid var(--border);
          border-radius: 5px;
          padding: 1px 6px;
          font-size: 11px;
          font-family: monospace;
          color: var(--text-mid);
        }
      `}</style>

      <div className={`al-root theme-${theme}`}>
        <aside className="al-sidebar">
          <div className="al-header">
            <div className="al-logo-mark">AL</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="al-logo-name">ActiveLab</div>
              <div className="al-logo-tag">Fitness Management</div>
            </div>
            <span className="al-theme-badge">
              {isDark ? "🌙 Dark" : "☀️ Light"}
            </span>
          </div>

          {/* Nav */}
          <nav className="al-nav">
            <span className="al-nav-label">Main Menu</span>
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`al-nav-item${isActive ? " active" : ""}`}
                >
                  <item.icon size={17} style={{ flexShrink: 0 }} />
                  {item.name}
                  {item.badge && <span className="al-badge">{item.badge}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="al-footer">
            <div className="al-profile">
              <div className="al-avatar">AD</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="al-profile-name">Admin</div>
                <div className="al-profile-role">Super Administrator</div>
              </div>
              <div className="al-online" />
            </div>

            <Link href="/dashboard/kelola-cabang" className="al-btn-branch">
              <MapPin size={14} />
              Kelola Cabang
            </Link>

            <button
              className="al-btn-logout"
              onClick={() => {
                localStorage.removeItem("token");
                window.location.href = "/login";
              }}
            >
              <LogOut size={14} />
              Keluar Sistem
            </button>
          </div>
        </aside>

        {/*MAIN CONTENT*/}
        <main className="al-main">
          <div className="al-main-inner">{children}</div>
        </main>

        {/* Shortcut hint */}
        <div className="al-hint">
          <kbd>Alt+1</kbd> Light &nbsp;·&nbsp; <kbd>Alt+2</kbd> Dark
        </div>
      </div>
    </>
  );
}
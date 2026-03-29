import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { to: "/grammar-help", label: "Grammar Help" },
  { to: "/translation", label: "Translation" },
  { to: "/dictionary", label: "Dictionary" },
  { to: "/", label: "Smart Editor" },
  { to: "/vibhakti-table", label: "Tables -> Vibhakti" },
  { to: "/dhatu-table", label: "Tables -> Dhaturupa" },
];

function AppShell({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">shiksha sanskrutam</h1>
        <nav className="top-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item.to}
              type="button"
              className={`nav-link ${location.pathname === item.to ? "active" : ""}`}
              onClick={() => navigate(item.to)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="main-view">{children}</main>
    </div>
  );
}

export default AppShell;

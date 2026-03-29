const navItems = [
  { href: "#hero", label: "Home" },
  { href: "#grammar-help", label: "Grammar Help" },
  { href: "#translation", label: "Translation" },
  { href: "#dictionary", label: "Dictionary" },
  { href: "#smart-editor", label: "Smart Editor" },
  { href: "#vibhakti-table", label: "Tables -> Vibhakti" },
  { href: "#dhatu-table", label: "Tables -> Dhaturupa" },
];

function AppShell({ children }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">shiksha sanskrutam</h1>
        <nav className="top-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <a key={item.href} className="nav-link" href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
      </header>
      <main className="main-view">{children}</main>
    </div>
  );
}

export default AppShell;

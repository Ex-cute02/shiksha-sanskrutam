import { useEffect, useState } from "react";

const navItems = [
  { href: "#sandhi-helper", label: "Sandhi Helper" },
  { href: "#translation", label: "Translation" },
  { href: "#dictionary", label: "Dictionary" },
  { href: "#smart-editor", label: "Smart Editor" },
  { href: "#noun-table", label: "Tables -> Noun" },
  { href: "#dhatu-table", label: "Tables -> Dhaturupa" },
];

function AppShell({ children }) {
  const [headerVisible, setHeaderVisible] = useState(false);

  useEffect(() => {
    const heroSection = document.getElementById("hero");
    if (!heroSection) {
      setHeaderVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setHeaderVisible(!entry.isIntersecting);
        });
      },
      { threshold: 0.4 }
    );

    observer.observe(heroSection);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="app-shell">
      <header className={`app-header ${headerVisible ? "is-visible" : ""}`}>
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

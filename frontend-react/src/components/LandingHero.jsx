const navLinks = [
  { href: "#sandhi-helper", label: "Sandhi Helper" },
  { href: "#translation", label: "Translation" },
  { href: "#dictionary", label: "Dictionary" },
  { href: "#smart-editor", label: "Smart Editor" },
  { href: "#dhatu-table", label: "Tables -> Dhaturupa" },
];

function LandingHero() {
  return (
    <section id="hero" className="full-section hero-section" aria-labelledby="landing-title">
      <div className="hero-card">
        <h1 id="landing-title" className="hero-title-main">shiksha sanskrutam</h1>
        <p className="hero-subtitle-main">Sanskrit Helper</p>
        <p className="hero-intro">
          A focused learning space for school students to explore Sanskrit grammar,
          translation, word meaning, and practice tables in one calm interface.
        </p>
      </div>

      <nav className="hero-nav" aria-label="Feature navigation">
        {navLinks.map((link) => (
          <a key={link.href} href={link.href} className="nav-link">
            {link.label}
          </a>
        ))}
      </nav>
    </section>
  );
}

export default LandingHero;

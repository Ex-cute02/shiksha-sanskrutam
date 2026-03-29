const quickLinks = [
  { href: "#grammar-help", label: "Explore Grammar" },
  { href: "#translation", label: "Start Translation" },
  { href: "#smart-editor", label: "Open Smart Editor" },
];

const featurePills = [
  "Grammar Rules",
  "Dictionary Meanings",
  "Vibhakti and Dhaturupa Tables",
  "Guided Sentence Fixes",
];

function LandingHero() {
  return (
    <section id="hero" className="hero-landing" aria-labelledby="landing-title">
      <div className="hero-content">
        <p className="hero-kicker">Ancient Language, Modern Learning Flow</p>
        <h1 id="landing-title" className="hero-title-main">shiksha sanskrutam</h1>
        <p className="hero-subtitle-main sanskrit-text">संस्कृत अध्ययन सहायिका</p>
        <p className="hero-intro">
          Practice grammar, discover meanings, translate in both directions, and refine writing in
          one focused learning workspace.
        </p>

        <div className="hero-actions" aria-label="Quick actions">
          {quickLinks.map((link) => (
            <a key={link.href} href={link.href} className="search-btn hero-link-btn">
              {link.label}
            </a>
          ))}
        </div>
      </div>

      <div className="hero-pills" aria-label="Capabilities overview">
        {featurePills.map((pill) => (
          <span key={pill} className="hero-pill">
            {pill}
          </span>
        ))}
      </div>
    </section>
  );
}

export default LandingHero;

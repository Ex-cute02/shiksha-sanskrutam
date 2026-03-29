import { useMemo, useState } from "react";
import { grammarRules } from "../services/dataService";

function GrammarHelpView() {
  const [query, setQuery] = useState("");

  const filteredRules = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return grammarRules;
    }

    return grammarRules.filter((rule) => {
      return (
        rule.id.toLowerCase().includes(normalizedQuery) ||
        rule.title.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [query]);

  return (
    <div className="section-card panel-grid">
      <h2 className="panel-title">
        Grammer Helper <span className="title-suffix">- व्याकरण सहायता</span>
      </h2>
      <p className="panel-subtext">Search rules quickly and review examples while practicing.</p>

      <div className="input-shell">
        <input
          id="search-rule"
          type="text"
          placeholder="Enter rule name (e.g., sandhi, vibhakti)"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="result-grid" id="rule-result">
        {filteredRules.length === 0 ? (
          <div className="result-card">
            <p>No matching grammar rule found.</p>
          </div>
        ) : (
          filteredRules.map((rule) => (
            <article key={rule.id} className="result-card">
              <h3 className="sanskrit-text">{rule.title}</h3>
              <p>{rule.summary}</p>
              {rule.examples.length > 0 ? (
                <ul>
                  {rule.examples.map((example) => (
                    <li key={example} className="sanskrit-text">
                      {example}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="sanskrit-text">Examples will be added soon.</p>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export default GrammarHelpView;

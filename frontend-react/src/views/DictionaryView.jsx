import { useMemo, useState } from "react";
import { dictionary } from "../services/dataService";
import { playPronunciation } from "../services/ttsService";

function DictionaryView() {
  const [query, setQuery] = useState("");

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return dictionary;
    }

    return dictionary.filter((entry) => entry.word.includes(normalizedQuery));
  }, [query]);

  const primaryWord = filteredEntries[0]?.word ?? "";

  return (
    <div className="section-card panel-grid">
      <h2 className="panel-title">
        Dictionary <span className="title-suffix">- शब्दार्थः</span>
      </h2>
      <p className="panel-subtext">Find meanings and grammatical tags for common words.</p>

      <div className="input-shell">
        <input
          id="search-word"
          type="text"
          placeholder="Enter Sanskrit word"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="result-grid" id="definition-result">
        {filteredEntries.length === 0 ? (
          <div className="result-card">
            <p>No matching word found.</p>
          </div>
        ) : (
          filteredEntries.map((entry, index) => (
            <article key={`${entry.word}-${index}`} className="result-card">
              <h3 className="sanskrit-text" id={index === 0 ? "result-word" : undefined}>
                {entry.word}
              </h3>
              <span className="pill-pos">{entry.pos}</span>
              <p>{entry.meaning}</p>
            </article>
          ))
        )}
      </div>

      <button
        id="pronounce-btn"
        type="button"
        className="search-btn"
        onClick={() => playPronunciation(primaryWord)}
      >
        Pronounce
      </button>
    </div>
  );
}

export default DictionaryView;

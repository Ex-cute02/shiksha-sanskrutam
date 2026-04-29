import { useState } from "react";
import { getDictionary } from "../services/api";
import { playPronunciation } from "../services/ttsService";

function DictionaryView() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [nearbyWords, setNearbyWords] = useState([]);
  const [inputTranslit, setInputTranslit] = useState("deva");
  const [outputFilter, setOutputFilter] = useState("deva");
  const [accent, setAccent] = useState("no");
  const [direction, setDirection] = useState("CENTER");
  const [nprev, setNprev] = useState(12);
  const [nnext, setNnext] = useState(12);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function searchDictionary() {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      setResult(null);
      setNearbyWords([]);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await getDictionary(normalizedQuery, {
        direction,
        nprev,
        nnext,
        transLit: inputTranslit,
        filter: outputFilter,
        accent,
      });
      setResult(data);
      setNearbyWords(data.nearby_words ?? []);
    } catch (fetchError) {
      setResult(null);
      setNearbyWords([]);
      setError(fetchError.message || "Failed to fetch dictionary entry");
    } finally {
      setLoading(false);
    }
  }

  function handleNearbyWordClick(word) {
    setQuery(word);
    setTimeout(() => {
      searchDictionary();
    }, 0);
  }

  const primaryWord = result?.word ?? query.trim();

  return (
    <div className="section-card panel-grid">
      <h2 className="panel-title">
        Dictionary <span className="title-suffix">- शब्दार्थः</span>
      </h2>
      <p className="panel-subtext">Find lexicon entries and nearby headwords from the Sanskrit dictionary engine.</p>

      <div className="input-shell">
        <input
          id="search-word"
          type="text"
          placeholder="Enter Sanskrit word"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              searchDictionary();
            }
          }}
        />
      </div>

      <div className="selector-block" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        <label htmlFor="dict-input" className="sanskrit-text">Input</label>
        <label htmlFor="dict-output" className="sanskrit-text">Output</label>
        <label htmlFor="dict-accent" className="sanskrit-text">Accent</label>

        <select id="dict-input" className="glass-select" value={inputTranslit} onChange={(event) => setInputTranslit(event.target.value)}>
          <option value="deva">Devanagari Unicode</option>
          <option value="hk">Kyoto-Harvard</option>
          <option value="slp1">SLP1</option>
          <option value="itrans">ITRANS</option>
          <option value="roman">Roman Unicode</option>
        </select>

        <select id="dict-output" className="glass-select" value={outputFilter} onChange={(event) => setOutputFilter(event.target.value)}>
          <option value="deva">Devanagari Unicode</option>
          <option value="hk">Kyoto-Harvard</option>
          <option value="slp1">SLP1</option>
          <option value="itrans">ITRANS</option>
          <option value="roman">Roman Unicode</option>
        </select>

        <select id="dict-accent" className="glass-select" value={accent} onChange={(event) => setAccent(event.target.value)}>
          <option value="yes">Show Accents</option>
          <option value="no">Ignore Accents</option>
        </select>

        <label htmlFor="dict-direction" className="sanskrit-text">List Direction</label>
        <label htmlFor="dict-prev" className="sanskrit-text">Previous Words</label>
        <label htmlFor="dict-next" className="sanskrit-text">Next Words</label>

        <select
          id="dict-direction"
          className="glass-select"
          value={direction}
          onChange={(event) => setDirection(event.target.value)}
        >
          <option value="CENTER">CENTER</option>
          <option value="UP">UP</option>
          <option value="DOWN">DOWN</option>
        </select>

        <input
          id="dict-prev"
          type="number"
          min="0"
          max="100"
          className="glass-select"
          value={nprev}
          onChange={(event) => setNprev(Number(event.target.value) || 0)}
        />

        <input
          id="dict-next"
          type="number"
          min="0"
          max="100"
          className="glass-select"
          value={nnext}
          onChange={(event) => setNnext(Number(event.target.value) || 0)}
        />
      </div>

      <button id="dict-search-btn" type="button" className="search-btn" onClick={searchDictionary} disabled={loading}>
        {loading ? "Searching..." : "Search"}
      </button>

      {loading ? <p className="panel-subtext">Searching dictionary...</p> : null}
      {error ? <p className="panel-subtext" style={{ color: "#9b2226" }}>{error}</p> : null}

      <div className="monier-output-box" id="definition-result">
        <div id="disp" className="disp mw-text-theme">
          {!result ? (
            <div id="CologneBasic">
              <p className="monier-muted">{query.trim() ? "No matching word found." : "Search a Sanskrit word to view the dictionary entry."}</p>
            </div>
          ) : null}

          {result ? (
            <div id="CologneBasic">
              <h1 id="result-word">
                <span className={outputFilter === "deva" ? "sdata_siddhanta" : "sdata"}>{result.word}</span>
              </h1>

              <table className="display">
                <tbody>
                  <tr>
                    <td className="display">{result.excerpt ?? result.meaning}</td>
                    <td className="display">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
                  </tr>

                  {Array.isArray(result.entries) && result.entries.length > 1
                    ? result.entries.slice(1).map((entry, index) => (
                        <tr key={`${result.word}-${index}`}>
                          <td className="display">{entry}</td>
                          <td className="display">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
                        </tr>
                      ))
                    : null}

                  {nearbyWords.length ? (
                    <tr>
                      <td className="display">
                        <span className="ls">Nearby headwords: </span>
                        {nearbyWords.map((word) => (
                          <button
                            key={word}
                            type="button"
                            className="monier-nav-link"
                            onClick={() => handleNearbyWordClick(word)}
                          >
                            {word}
                          </button>
                        ))}
                      </td>
                      <td className="display">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
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

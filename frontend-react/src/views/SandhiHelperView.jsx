import { useState } from "react";
import { getSandhiJoin, getSandhiSplit } from "../services/api";

const ENCODING_OPTIONS = ["Unicode", "WX", "Itrans", "VH", "SLP", "KH", "IAST"];
const OUTPUT_OPTIONS = ["Unicode", "IAST"];

function SandhiHelperView() {
  const [joinWord1, setJoinWord1] = useState("rAmaH");
  const [joinWord2, setJoinWord2] = useState("AlayaH");
  const [joinEncoding, setJoinEncoding] = useState("WX");
  const [joinOutencoding, setJoinOutencoding] = useState("Unicode");
  const [joinResult, setJoinResult] = useState(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");

  const [splitWord, setSplitWord] = useState("rAmAlayaH");
  const [splitEncoding, setSplitEncoding] = useState("WX");
  const [splitOutencoding, setSplitOutencoding] = useState("Unicode");
  const [splitMode, setSplitMode] = useState("word");
  const [splitResult, setSplitResult] = useState(null);
  const [splitLoading, setSplitLoading] = useState(false);
  const [splitError, setSplitError] = useState("");

  async function handleJoin(event) {
    event.preventDefault();

    if (!joinWord1.trim() || !joinWord2.trim()) {
      setJoinResult(null);
      setJoinError("Enter both words to join them.");
      return;
    }

    setJoinLoading(true);
    setJoinError("");
    try {
      const data = await getSandhiJoin({
        word1: joinWord1.trim(),
        word2: joinWord2.trim(),
        encoding: joinEncoding,
        outencoding: joinOutencoding,
      });
      setJoinResult(data);
    } catch (error) {
      setJoinResult(null);
      setJoinError(error.message || "Failed to join words");
    } finally {
      setJoinLoading(false);
    }
  }

  async function handleSplit(event) {
    event.preventDefault();

    if (!splitWord.trim()) {
      setSplitResult(null);
      setSplitError("Enter a word to split.");
      return;
    }

    setSplitLoading(true);
    setSplitError("");
    try {
      const data = await getSandhiSplit({
        word: splitWord.trim(),
        encoding: splitEncoding,
        outencoding: splitOutencoding,
        mode: splitMode,
      });
      setSplitResult(data);
    } catch (error) {
      setSplitResult(null);
      setSplitError(error.message || "Failed to split the word");
    } finally {
      setSplitLoading(false);
    }
  }

  const joinResults = Array.isArray(joinResult?.results) ? joinResult.results : [];
  const splitSegments = Array.isArray(splitResult?.segmentation) ? splitResult.segmentation : [];

  return (
    <div className="section-card panel-grid sandhi-shell">
      <h2 className="panel-title">
        Sandhi Helper <span className="title-suffix">- सन्धिः / सन्धिविच्छेदः</span>
      </h2>
      <p className="panel-subtext">
        Join two Sanskrit words or split a compounded word using the same sandhi flow as the CGI tools.
      </p>

      <details className="sandhi-notes" open>
        <summary>Usage notes</summary>
        <ol>
          <li>Use <span className="sanskrit-text">word1</span> and <span className="sanskrit-text">word2</span> for joining words.</li>
          <li>Use <span className="sanskrit-text">mode = word</span> for a single compounded word, or <span className="sanskrit-text">sent</span> for a sentence.</li>
          <li>Supported encodings follow the sandhi CGI: Unicode, WX, Itrans, VH, SLP, KH, and IAST.</li>
        </ol>
      </details>

      <div className="sandhi-grid">
        <article className="result-card sandhi-card">
          <h3 className="sanskrit-text">Joining Words</h3>
          <form className="sandhi-form" onSubmit={handleJoin}>
            <div className="sandhi-row">
              <div>
                <label htmlFor="sandhi-word1" className="sandhi-label sanskrit-text">Word 1</label>
                <input id="sandhi-word1" className="glass-select sandhi-input" value={joinWord1} onChange={(event) => setJoinWord1(event.target.value)} />
              </div>
              <div>
                <label htmlFor="sandhi-word2" className="sandhi-label sanskrit-text">Word 2</label>
                <input id="sandhi-word2" className="glass-select sandhi-input" value={joinWord2} onChange={(event) => setJoinWord2(event.target.value)} />
              </div>
            </div>

            <div className="sandhi-row sandhi-row--triple">
              <div>
                <label htmlFor="sandhi-join-encoding" className="sandhi-label">Encoding</label>
                <select id="sandhi-join-encoding" className="glass-select" value={joinEncoding} onChange={(event) => setJoinEncoding(event.target.value)}>
                  {ENCODING_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="sandhi-join-outencoding" className="sandhi-label">Output</label>
                <select id="sandhi-join-outencoding" className="glass-select" value={joinOutencoding} onChange={(event) => setJoinOutencoding(event.target.value)}>
                  {OUTPUT_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="search-btn sandhi-button" disabled={joinLoading}>
                {joinLoading ? "Joining..." : "Join"}
              </button>
            </div>
          </form>

          {joinError ? <p className="sandhi-status error">{joinError}</p> : null}

          {joinResults.length ? (
            <div className="sandhi-result-panel">
              {joinResults.map((item, index) => (
                <div key={`${item.saMhiwapaxam ?? index}`} className="sandhi-result-item">
                  <div className="sandhi-result-head">
                    <span className="sanskrit-text">{item.saMhiwapaxam ?? `${item.word1} + ${item.word2}`}</span>
                    <span className="sandhi-rule">{item.sUwram ?? ""}</span>
                  </div>
                  <div className="sandhi-result-body">
                    <div><span className="sandhi-key">Word 1:</span> {item.word1}</div>
                    <div><span className="sandhi-key">Word 2:</span> {item.word2}</div>
                    <div><span className="sandhi-key">Sandhi:</span> {item.sanXiH}</div>
                    <div><span className="sandhi-key">Last letter:</span> {item.last_letter}</div>
                    <div><span className="sandhi-key">First letter:</span> {item.first_letter}</div>
                    <div><span className="sandhi-key">Modified letter:</span> {item.modified_letter}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="sandhi-status">No join result yet.</p>
          )}
        </article>

        <article className="result-card sandhi-card">
          <h3 className="sanskrit-text">Sandhi Splitter</h3>
          <form className="sandhi-form" onSubmit={handleSplit}>
            <div className="sandhi-row">
              <div>
                <label htmlFor="sandhi-word" className="sandhi-label sanskrit-text">Word</label>
                <input id="sandhi-word" className="glass-select sandhi-input" value={splitWord} onChange={(event) => setSplitWord(event.target.value)} />
              </div>
            </div>

            <div className="sandhi-row sandhi-row--triple">
              <div>
                <label htmlFor="sandhi-split-encoding" className="sandhi-label">Encoding</label>
                <select id="sandhi-split-encoding" className="glass-select" value={splitEncoding} onChange={(event) => setSplitEncoding(event.target.value)}>
                  {ENCODING_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="sandhi-split-outencoding" className="sandhi-label">Output</label>
                <select id="sandhi-split-outencoding" className="glass-select" value={splitOutencoding} onChange={(event) => setSplitOutencoding(event.target.value)}>
                  {OUTPUT_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="sandhi-mode" className="sandhi-label">Mode</label>
                <select id="sandhi-mode" className="glass-select" value={splitMode} onChange={(event) => setSplitMode(event.target.value)}>
                  <option value="word">word</option>
                  <option value="sent">sent</option>
                </select>
              </div>
            </div>

            <button type="submit" className="search-btn sandhi-button" disabled={splitLoading}>
              {splitLoading ? "Splitting..." : "Split"}
            </button>
          </form>

          {splitError ? <p className="sandhi-status error">{splitError}</p> : null}

          {splitSegments.length ? (
            <div className="sandhi-result-panel">
              <p className="sandhi-status">{splitResult?.input?.word ?? splitWord}</p>
              <ul className="sandhi-segmentation-list">
                {splitSegments.map((segment) => (
                  <li key={segment} className="sandhi-segmentation-item sanskrit-text">{segment}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="sandhi-status">No split result yet.</p>
          )}
        </article>
      </div>
    </div>
  );
}

export default SandhiHelperView;
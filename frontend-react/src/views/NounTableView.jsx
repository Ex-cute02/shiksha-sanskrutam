import { useEffect, useMemo, useState } from "react";
import ResultTable from "../components/ResultTable";
import { getNounTable } from "../services/api";

function NounTableView() {
  const [params, setParams] = useState({
    rt: "राम",
    gen: "puM",
    jAwi: "nA",
    level: 1,
    encoding: "Unicode",
    outencoding: "Unicode",
  });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tableRows = useMemo(
    () =>
      rows.map((row) => ({
        key: row.caseName,
        cells: [
          { content: row.caseName },
          { content: row.singular, sanskrit: true },
          { content: row.dual, sanskrit: true },
          { content: row.plural, sanskrit: true },
        ],
      })),
    [rows]
  );

  async function loadTable(nextParams) {
    setLoading(true);
    setError("");
    try {
      const data = await getNounTable(nextParams);
      setRows(data?.rows ?? []);
    } catch (err) {
      setRows([]);
      setError(err.message || "Failed to load noun table");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTable(params);
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    loadTable(params);
  }

  return (
    <div className="section-card panel-grid">
      <h2 className="panel-title">
        Noun Table <span className="title-suffix">- नामरूप तालिका</span>
      </h2>
      <p className="panel-subtext">Generate case-number forms from noun base and grammatical settings.</p>

      <form className="selector-block" onSubmit={handleSubmit}>
        <label htmlFor="noun-rt" className="sanskrit-text">Pratipadika</label>
        <input
          id="noun-rt"
          className="glass-select sanskrit-text"
          value={params.rt}
          onChange={(event) => setParams((prev) => ({ ...prev, rt: event.target.value }))}
        />

        <label htmlFor="noun-gen" className="sanskrit-text">Gender</label>
        <select
          id="noun-gen"
          className="glass-select sanskrit-text"
          value={params.gen}
          onChange={(event) => setParams((prev) => ({ ...prev, gen: event.target.value }))}
        >
          <option value="puM">पुंलिङ्गम्</option>
          <option value="napuM">नपुंसकलिङ्गम्</option>
          <option value="swrI">स्त्रीलिङ्गम्</option>
          <option value="a">विशेष (अस्मद्/युष्मद्)</option>
        </select>

        <label htmlFor="noun-jAwi" className="sanskrit-text">Jati</label>
        <select
          id="noun-jAwi"
          className="glass-select sanskrit-text"
          value={params.jAwi}
          onChange={(event) => setParams((prev) => ({ ...prev, jAwi: event.target.value }))}
        >
          <option value="nA">नाम</option>
          <option value="sarva">सर्वनाम</option>
          <option value="saMKyA">सङ्ख्या</option>
          <option value="saMKyeyam">सङ्ख्येय</option>
          <option value="pUraNam">पूरण</option>
        </select>

        <button type="submit" className="search-btn" disabled={loading}>
          {loading ? "Loading..." : "Generate"}
        </button>
      </form>

      {error ? <p className="panel-subtext" style={{ color: "#9b2226" }}>{error}</p> : null}

      <ResultTable
        id="noun-table-body"
        headers={["Case", "Singular", "Dual", "Plural"]}
        rows={tableRows}
      />
    </div>
  );
}

export default NounTableView;

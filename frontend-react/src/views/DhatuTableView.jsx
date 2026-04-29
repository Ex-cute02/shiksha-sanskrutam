import { useEffect, useMemo, useState } from "react";
import ResultTable from "../components/ResultTable";
import { getVerbTable } from "../services/api";

const VERB_OPTIONS = {
  gam: "gam1_gamLz_BvAxiH_gawO",
  bhu: "BU1_BU_sattAyAm",
  kri: "qukfY_karaNe",
};

function DhatuTableView() {
  const [selectedRoot, setSelectedRoot] = useState("gam");
  const [lakaras, setLakaras] = useState([]);
  const [selectedLakaraId, setSelectedLakaraId] = useState("lakAra_0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadVerbTable(rootKey) {
    setLoading(true);
    setError("");
    try {
      const data = await getVerbTable({
        vb: VERB_OPTIONS[rootKey] ?? VERB_OPTIONS.gam,
        prayoga_paxI: "karwari-parasmEpaxI",
        upasarga: "-",
        encoding: "WX",
        outencoding: "Unicode",
      });

      const nextLakaras = data?.lakaras ?? [];
      setLakaras(nextLakaras);
      setSelectedLakaraId(nextLakaras[0]?.id ?? "lakAra_0");
    } catch (err) {
      setLakaras([]);
      setError(err.message || "Failed to load verb table");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVerbTable(selectedRoot);
  }, [selectedRoot]);

  const rows = useMemo(() => {
    const block = lakaras.find((item) => item.id === selectedLakaraId);
    return block?.rows ?? [];
  }, [lakaras, selectedLakaraId]);

  const tableRows = rows.map((row) => ({
    key: row.person,
    cells: [
      { content: row.person },
      { content: row.singular, sanskrit: true },
      { content: row.dual, sanskrit: true },
      { content: row.plural, sanskrit: true },
    ],
  }));

  const selectedLakaraLabel =
    lakaras.find((item) => item.id === selectedLakaraId)?.label ?? "-";

  return (
    <div className="section-card panel-grid">
      <h2 className="panel-title">
        Verb Table <span className="title-suffix">- धातुरूप तालिका</span>
      </h2>
      <p className="panel-subtext">Generate dynamic lakara-wise forms from scratch verb source API.</p>

      <div className="selector-block">
        <label htmlFor="dhatu-root" className="sanskrit-text">
          Select Verb Root
        </label>
        <select
          id="dhatu-root"
          className="glass-select sanskrit-text"
          value={selectedRoot}
          onChange={(event) => setSelectedRoot(event.target.value)}
          disabled={loading}
        >
          <option value="gam">गम्/गच्छ - to go</option>
          <option value="bhu">भू - to be</option>
          <option value="kri">कृ - to do</option>
        </select>

        <label htmlFor="lakara-select" className="sanskrit-text">
          Select Lakara
        </label>
        <select
          id="lakara-select"
          className="glass-select sanskrit-text"
          value={selectedLakaraId}
          onChange={(event) => setSelectedLakaraId(event.target.value)}
          disabled={loading || lakaras.length === 0}
        >
          {lakaras.map((lakara) => (
            <option key={lakara.id} value={lakara.id}>
              {lakara.label}
            </option>
          ))}
        </select>
      </div>

      <p className="panel-subtext">Active Lakara: {selectedLakaraLabel}</p>
      {error ? <p className="panel-subtext" style={{ color: "#9b2226" }}>{error}</p> : null}

      <ResultTable
        id="dhatu-table-body"
        headers={["Person", "Singular", "Dual", "Plural"]}
        rows={tableRows}
      />
    </div>
  );
}

export default DhatuTableView;

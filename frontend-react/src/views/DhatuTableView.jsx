import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { dhatuData } from "../services/dataService";

function DhatuTableView() {
  const [searchParams] = useSearchParams();
  const requestedRoot = searchParams.get("root");
  const resolvedRoot = requestedRoot && dhatuData[requestedRoot] ? requestedRoot : "bhu";
  const [selectedRoot, setSelectedRoot] = useState(() => resolvedRoot);

  useEffect(() => {
    if (selectedRoot !== resolvedRoot) {
      setSelectedRoot(resolvedRoot);
    }
  }, [resolvedRoot, selectedRoot]);

  const rows = useMemo(() => {
    const data = dhatuData[selectedRoot];
    if (!data) {
      return [];
    }

    return data.persons.map((person) => ({
      person,
      present: data.present[person],
      perfect: data.perfect[person],
      future: data.future[person],
    }));
  }, [selectedRoot]);

  return (
    <section className="panel-grid">
      <h2 className="panel-title">Verb Table - धातुरूप तालिका</h2>

      <div className="selector-block">
        <label htmlFor="dhatu-root" className="sanskrit-text">
          Select Root (धातुः)
        </label>
        <select
          id="dhatu-root"
          className="glass-select sanskrit-text"
          value={selectedRoot}
          onChange={(event) => setSelectedRoot(event.target.value)}
        >
          <option value="bhu">भू (to be)</option>
          <option value="kri">कृ (to do)</option>
          <option value="gam">गम् (to go)</option>
        </select>
      </div>

      <div className="result-card table-wrap">
        <table className="declension-table" id="dhatu-table-body">
          <thead>
            <tr>
              <th>Person</th>
              <th>Present</th>
              <th>Perfect</th>
              <th>Future</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.person}>
                <td>{row.person}</td>
                <td className="sanskrit-text">{row.present}</td>
                <td className="sanskrit-text">{row.perfect}</td>
                <td className="sanskrit-text">{row.future}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default DhatuTableView;

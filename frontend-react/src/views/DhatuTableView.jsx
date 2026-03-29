import { useMemo, useState } from "react";
import ResultTable from "../components/ResultTable";
import { dhatuData } from "../services/dataService";

function DhatuTableView() {
  const [selectedRoot, setSelectedRoot] = useState("bhu");

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

  const tableRows = rows.map((row) => ({
    key: row.person,
    cells: [
      { content: row.person },
      { content: row.present, sanskrit: true },
      { content: row.perfect, sanskrit: true },
      { content: row.future, sanskrit: true },
    ],
  }));

  return (
    <div className="section-card panel-grid">
      <h2 className="panel-title">
        Verb Table <span className="title-suffix">- धातुरूप तालिका</span>
      </h2>
      <p className="panel-subtext">Review tense forms for each person across key roots.</p>

      <div className="selector-block">
        <label htmlFor="dhatu-root" className="sanskrit-text">
          Select Verb Root
        </label>
        <select
          id="dhatu-root"
          className="glass-select sanskrit-text"
          value={selectedRoot}
          onChange={(event) => setSelectedRoot(event.target.value)}
        >
          <option value="bhu">भू - to be</option>
          <option value="kri">कृ - to do</option>
          <option value="gam">गम्/गच्छ - to go</option>
        </select>
      </div>

      <ResultTable
        id="dhatu-table-body"
        headers={["Person", "Present", "Perfect", "Future"]}
        rows={tableRows}
      />
    </div>
  );
}

export default DhatuTableView;

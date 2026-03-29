import { useMemo, useState } from "react";
import ResultTable from "../components/ResultTable";
import { vibhaktiData } from "../services/dataService";

const caseNames = [
  "1st (Nominative)",
  "2nd (Accusative)",
  "3rd (Instrumental)",
  "4th (Dative)",
  "5th (Ablative)",
  "6th (Genitive)",
  "7th (Locative)",
];

function VibhaktiTableView() {
  const [selectedWord, setSelectedWord] = useState("ram");

  const rows = useMemo(() => {
    const data = vibhaktiData[selectedWord];
    if (!data) {
      return [];
    }

    return caseNames.map((caseName, index) => ({
      caseName,
      singular: data.singular[index],
      dual: data.dual[index],
      plural: data.plural[index],
    }));
  }, [selectedWord]);

  const tableRows = rows.map((row) => ({
    key: row.caseName,
    cells: [
      { content: row.caseName },
      { content: row.singular, sanskrit: true },
      { content: row.dual, sanskrit: true },
      { content: row.plural, sanskrit: true },
    ],
  }));

  return (
    <div className="section-card panel-grid">
      <h2 className="panel-title">
        Case Table <span className="title-suffix">- विभक्ति तालिका</span>
      </h2>
      <p className="panel-subtext">Compare singular, dual, and plural forms by case.</p>

      <div className="selector-block">
        <label htmlFor="vibhakti-word" className="sanskrit-text">
          Select Word
        </label>
        <select
          id="vibhakti-word"
          className="glass-select sanskrit-text"
          value={selectedWord}
          onChange={(event) => setSelectedWord(event.target.value)}
        >
          <option value="ram">रामः</option>
          <option value="sita">सीता</option>
          <option value="phalam">फलम्</option>
        </select>
      </div>

      <ResultTable
        id="vibhakti-table-body"
        headers={["Case", "Singular", "Dual", "Plural"]}
        rows={tableRows}
      />
    </div>
  );
}

export default VibhaktiTableView;

import { useMemo, useState } from "react";
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

  return (
    <section className="panel-grid">
      <h2 className="panel-title">Case Table - विभक्ति तालिका</h2>

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

      <div className="result-card table-wrap">
        <table className="declension-table" id="vibhakti-table-body">
          <thead>
            <tr>
              <th>Case</th>
              <th>Singular</th>
              <th>Dual</th>
              <th>Plural</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.caseName}>
                <td>{row.caseName}</td>
                <td className="sanskrit-text">{row.singular}</td>
                <td className="sanskrit-text">{row.dual}</td>
                <td className="sanskrit-text">{row.plural}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default VibhaktiTableView;

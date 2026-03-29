function ResultTable({ id, headers, rows }) {
  return (
    <div className="result-card table-wrap">
      <table className="declension-table" id={id}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              {row.cells.map((cell, index) => (
                <td
                  key={`${row.key}-${index}`}
                  className={cell.sanskrit ? "sanskrit-text" : undefined}
                >
                  {cell.content}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ResultTable;

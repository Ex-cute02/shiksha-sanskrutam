function EditorWorkspace({
  text,
  showHighlight,
  highlightedContent,
  onTextChange,
  onAnalyze,
}) {
  return (
    <div className="editor-column panel-grid">
      {!showHighlight ? (
        <textarea
          id="editor-input"
          className="translate-textarea sanskrit-text"
          rows={7}
          placeholder="Type here in English (e.g., aham gachhati) to see magic..."
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
        />
      ) : null}

      {showHighlight ? (
        <div id="editor-highlight-display" className="editor-highlight-box sanskrit-text">
          {highlightedContent}
        </div>
      ) : null}

      <button id="analyze-btn" type="button" className="search-btn" onClick={onAnalyze}>
        Analyze Text
      </button>
    </div>
  );
}

export default EditorWorkspace;

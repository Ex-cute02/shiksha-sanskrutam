import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { analyzeSmartEditorText } from "../services/analysisService";
import { transliterateToDevanagari } from "../services/transliterationService";

function renderHighlightedText(text, issueWord) {
  if (!issueWord || !text.includes(issueWord)) {
    return text;
  }

  const parts = text.split(issueWord);
  const nodes = [];

  parts.forEach((part, index) => {
    nodes.push(<span key={`part-${index}`}>{part}</span>);

    if (index < parts.length - 1) {
      nodes.push(
        <span key={`issue-${index}`} className="highlight-grammar" data-error-id="1">
          {issueWord}
        </span>
      );
    }
  });

  return nodes;
}

function SmartEditorView() {
  const navigate = useNavigate();
  const [editorText, setEditorText] = useState("अहम् विद्यालयं गच्छति");
  const [analysis, setAnalysis] = useState(() => analyzeSmartEditorText(""));
  const [showHighlight, setShowHighlight] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const sourceText = editorText;

    const timerId = setTimeout(async () => {
      const convertedText = await transliterateToDevanagari(sourceText);
      if (cancelled || convertedText === sourceText) {
        return;
      }

      setEditorText((currentText) => (currentText === sourceText ? convertedText : currentText));
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timerId);
    };
  }, [editorText]);

  const suggestionText = useMemo(() => {
    if (!analysis.hasGrammarIssue) {
      return "No major grammar suggestions for now.";
    }

    return analysis.reason;
  }, [analysis]);

  const handleAnalyze = () => {
    const nextAnalysis = analyzeSmartEditorText(editorText);
    setAnalysis(nextAnalysis);
    setShowHighlight(nextAnalysis.hasGrammarIssue);
  };

  const handleApplyFix = () => {
    if (!analysis.hasGrammarIssue) {
      return;
    }

    const nextText = editorText.replaceAll(analysis.issueWord, analysis.suggestion);
    const nextAnalysis = analyzeSmartEditorText(nextText);

    setEditorText(nextText);
    setAnalysis(nextAnalysis);
    setShowHighlight(nextAnalysis.hasGrammarIssue);
  };

  return (
    <section className="panel-grid">
      <h2 className="panel-title">रचना-सहायकः (Smart Editor)</h2>

      <div className="editor-layout">
        <div className="editor-column panel-grid">
          {!showHighlight ? (
            <textarea
              id="editor-input"
              className="translate-textarea sanskrit-text"
              rows={7}
              placeholder="Type or paste Sanskrit text for grammar analysis"
              value={editorText}
              onChange={(event) => setEditorText(event.target.value)}
            />
          ) : null}

          {showHighlight ? (
            <div id="editor-highlight-display" className="editor-highlight-box sanskrit-text">
              {renderHighlightedText(editorText, analysis.issueWord)}
            </div>
          ) : null}

          <button id="analyze-btn" type="button" className="search-btn" onClick={handleAnalyze}>
            Analyze Sentence
          </button>
        </div>

        <aside id="suggestions-sidebar" className="suggestions-sidebar">
          <h3>AI Suggestions</h3>
          {analysis.hasGrammarIssue ? (
            <div className="suggestion-card">
              <h4 className="sanskrit-text">Error: {analysis.issueWord}</h4>
              <p>
                <strong>Suggestion:</strong>{" "}
                <span className="sanskrit-text">{analysis.suggestion}</span>
              </p>
              <p>{suggestionText}</p>
              <div className="suggestion-actions">
                <button id="apply-fix-btn" type="button" className="search-btn" onClick={handleApplyFix}>
                  Apply Fix
                </button>
                <button
                  id="view-dhaturupa-btn"
                  type="button"
                  className="search-btn"
                  onClick={() => navigate("/dhatu-table?root=gam")}
                >
                  View Dhaturupa
                </button>
              </div>
            </div>
          ) : (
            <div className="suggestion-card">
              <p>{suggestionText}</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

export default SmartEditorView;

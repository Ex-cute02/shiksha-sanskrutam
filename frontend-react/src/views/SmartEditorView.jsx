import { useEffect, useMemo, useState } from "react";
import EditorWorkspace from "../components/EditorWorkspace";
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
      <p className="panel-subtext">Analyze sentence agreement and apply contextual grammar fixes.</p>

      <div className="editor-layout">
        <EditorWorkspace
          text={editorText}
          showHighlight={showHighlight}
          highlightedContent={renderHighlightedText(editorText, analysis.issueWord)}
          onTextChange={setEditorText}
          onAnalyze={handleAnalyze}
        />

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

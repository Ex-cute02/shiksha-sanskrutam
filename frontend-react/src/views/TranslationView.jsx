import { useState } from "react";
import { translateText } from "../services/api";

function TranslationView() {
  const [sanskritText, setSanskritText] = useState("");
  const [englishText, setEnglishText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [secondaryText, setSecondaryText] = useState("");
  const [engineUsed, setEngineUsed] = useState("");
  const [confidence, setConfidence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [outputIsSanskrit, setOutputIsSanskrit] = useState(false);

  const handleTranslate = async () => {
    if (!sanskritText.trim()) {
      setOutputText("Please enter a Sanskrit sentence first.");
      setSecondaryText("");
      setEngineUsed("");
      setConfidence(null);
      setOutputIsSanskrit(false);
      return;
    }

    setLoading(true);
    try {
      const translated = await translateText({
        text: sanskritText,
        sourceLang: "sa",
        targetLang: "en",
        includeSecondary: true,
      });
      setOutputText(translated.primary ?? "");
      setSecondaryText(translated.secondary ?? "");
      setEngineUsed(translated.engine_used ?? "");
      setConfidence(typeof translated.confidence === "number" ? translated.confidence : null);
      setOutputIsSanskrit(false);
    } catch (error) {
      setOutputText(error.message || "Translation failed.");
      setSecondaryText("");
      setEngineUsed("");
      setConfidence(null);
      setOutputIsSanskrit(false);
    } finally {
      setLoading(false);
    }
  };

  const handleReverseTranslate = async () => {
    if (!englishText.trim()) {
      setOutputText("Please enter an English sentence first.");
      setSecondaryText("");
      setEngineUsed("");
      setConfidence(null);
      setOutputIsSanskrit(false);
      return;
    }

    setLoading(true);
    try {
      const translated = await translateText({
        text: englishText,
        sourceLang: "en",
        targetLang: "sa",
        includeSecondary: true,
      });
      setOutputText(translated.primary ?? "");
      setSecondaryText(translated.secondary ?? "");
      setEngineUsed(translated.engine_used ?? "");
      setConfidence(typeof translated.confidence === "number" ? translated.confidence : null);
      setOutputIsSanskrit(true);
    } catch (error) {
      setOutputText(error.message || "Translation failed.");
      setSecondaryText("");
      setEngineUsed("");
      setConfidence(null);
      setOutputIsSanskrit(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-card panel-grid">
      <h2 className="panel-title">
        Translation <span className="title-suffix">- अनुवद</span>
      </h2>
      <p className="panel-subtext">Translate both Sanskrit to English and English to Sanskrit.</p>

      <div className="translation-grid">
        <div className="translation-block">
          <label htmlFor="sanskrit-input" className="sanskrit-text">
            Sanskrit to English
          </label>
          <textarea
            id="sanskrit-input"
            className="translate-textarea"
            rows={4}
            placeholder="Enter Sanskrit sentence"
            value={sanskritText}
            onChange={(event) => setSanskritText(event.target.value)}
          />
          <button type="button" className="search-btn" onClick={handleTranslate}>
            {loading ? "Translating..." : "Translate"}
          </button>
        </div>

        <div className="translation-block">
          <label htmlFor="english-input">English to Sanskrit</label>
          <textarea
            id="english-input"
            className="translate-textarea"
            rows={4}
            placeholder="Enter English sentence"
            value={englishText}
            onChange={(event) => setEnglishText(event.target.value)}
          />
          <button
            type="button"
            className="search-btn"
            onClick={handleReverseTranslate}
          >
            {loading ? "Translating..." : "Translate"}
          </button>
        </div>
      </div>

      <div className="result-grid" id="translation-output">
        {outputText ? (
          <div className="result-card">
            <h3>Translation Output</h3>
            <p className={outputIsSanskrit ? "sanskrit-text" : ""}>{outputText}</p>
            {secondaryText ? (
              <>
                <h3>Secondary Output</h3>
                <p className={outputIsSanskrit ? "sanskrit-text" : ""}>{secondaryText}</p>
              </>
            ) : null}
            {engineUsed ? <p><strong>Engine:</strong> {engineUsed}</p> : null}
            {typeof confidence === "number" ? <p><strong>Confidence (agreement):</strong> {confidence}</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default TranslationView;

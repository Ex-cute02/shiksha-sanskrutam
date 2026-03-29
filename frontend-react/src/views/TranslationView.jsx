import { useState } from "react";

async function mockTranslateApi(direction) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (direction === "sa-en") {
        resolve("This is a simple Sanskrit sentence example.");
        return;
      }

      resolve("अयम् एकः सरलः वाक्यः अस्ति।");
    }, 280);
  });
}

function TranslationView() {
  const [sanskritText, setSanskritText] = useState("");
  const [englishText, setEnglishText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [outputIsSanskrit, setOutputIsSanskrit] = useState(false);

  const handleTranslate = async () => {
    if (!sanskritText.trim()) {
      setOutputText("Please enter a Sanskrit sentence first.");
      setOutputIsSanskrit(false);
      return;
    }

    const translated = await mockTranslateApi("sa-en");
    setOutputText(translated);
    setOutputIsSanskrit(false);
  };

  const handleReverseTranslate = async () => {
    if (!englishText.trim()) {
      setOutputText("Please enter an English sentence first.");
      setOutputIsSanskrit(false);
      return;
    }

    const translated = await mockTranslateApi("en-sa");
    setOutputText(translated);
    setOutputIsSanskrit(true);
  };

  return (
    <section className="panel-grid">
      <h2 className="panel-title">Translation - अनुवाद</h2>
      <p className="panel-subtext">Translate between Sanskrit and English in either direction.</p>

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
            Translate to English
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
            Translate to Sanskrit
          </button>
        </div>
      </div>

      <div className="result-grid" id="translation-output">
        {outputText ? (
          <div className="result-card">
            <h3>Translation Output</h3>
            <p className={outputIsSanskrit ? "sanskrit-text" : ""}>{outputText}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default TranslationView;

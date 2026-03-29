const appHeader = document.querySelector(".app-header");
const heroSection = document.getElementById("hero");
const searchRuleInput = document.getElementById("search-rule");
const ruleResult = document.getElementById("rule-result");
const searchWordInput = document.getElementById("search-word");
const definitionResult = document.getElementById("definition-result");
const pronounceBtn = document.getElementById("pronounce-btn");
const sanskritInput = document.getElementById("sanskrit-input");
const englishInput = document.getElementById("english-input");
const translateBtn = document.getElementById("translate-btn");
const reverseTranslateBtn = document.getElementById("reverse-translate-btn");
const translationOutput = document.getElementById("translation-output");
const vibhaktiWordSelect = document.getElementById("vibhakti-word");
const vibhaktiTableBody = document.querySelector("#vibhakti-table-body tbody");
const dhatuRootSelect = document.getElementById("dhatu-root");
const dhatuTableBody = document.querySelector("#dhatu-table-body tbody");
const editorInput = document.getElementById("editor-input");
const analyzeBtn = document.getElementById("analyze-btn");
const editorHighlightDisplay = document.getElementById("editor-highlight-display");
const suggestionsSidebar = document.getElementById("suggestions-sidebar");
const AKSHARAMUKHA_API_URL =
  "https://aksharamukha-plugin.appspot.com/api/public";

const grammarRules = [
  {
    id: "sandhi",
    title: "सन्धि (Compound Joining)",
    summary:
      "When two words come together, their sounds sometimes change to make pronunciation easier...",
    examples: ["देव + इन्द्र → देवेन्द्र", "सा + अपि → सापि"],
  },
  {
    id: "vibhakti",
    title: "विभक्तिः (Case Forms)",
    summary:
      "Sanskrit uses vibhakti endings to show roles like subject, object, etc...",
    examples: [],
  },
];

const dictionary = [
  {
    word: "रामः",
    pos: "पुंल्लिङ्गः",
    meaning: "Rama, a male proper name",
  },
  {
    word: "फलम्",
    pos: "नपुंसकलिङ्गः",
    meaning: "fruit",
  },
];

const vibhaktiData = {
  ram: {
    singular: ["रामः", "रामम्", "रामेण", "रामाय", "रामात्", "रामस्य", "रामे"],
    dual: ["रामौ", "रामौ", "रामाभ्याम्", "रामाभ्याम्", "रामाभ्याम्", "रामयोः", "रामयोः"],
    plural: ["रामाः", "रामान्", "रामैः", "रामेभ्यः", "रामेभ्यः", "रामाणाम्", "रामेषु"],
  },
  sita: {
    singular: ["सीता", "सीताम्", "सीतया", "सीतायै", "सीतायाः", "सीतायाः", "सीतायाम्"],
    dual: ["सीते", "सीते", "सीताभ्याम्", "सीताभ्याम्", "सीताभ्याम्", "सीतयोः", "सीतयोः"],
    plural: ["सीताः", "सीताः", "सीताभिः", "सीताभ्यः", "सीताभ्यः", "सीतानाम्", "सीतासु"],
  },
  phalam: {
    singular: ["फलम्", "फलम्", "फलेन", "फलाय", "फलात्", "फलस्य", "फले"],
    dual: ["फले", "फले", "फलाभ्याम्", "फलाभ्याम्", "फलाभ्याम्", "फलयोः", "फलयोः"],
    plural: ["फलानि", "फलानि", "फलैः", "फलेभ्यः", "फलेभ्यः", "फलानाम्", "फलेषु"],
  },
};

const dhatuData = {
  bhu: {
    persons: ["1st", "2nd", "3rd"],
    present: {
      "1st": "भवामि",
      "2nd": "भवसि",
      "3rd": "भवति",
    },
    perfect: {
      "1st": "बभूव",
      "2nd": "बभूव",
      "3rd": "बभूव",
    },
    future: {
      "1st": "भविष्यामि",
      "2nd": "भविष्यसि",
      "3rd": "भविष्यति",
    },
  },
  kri: {
    persons: ["1st", "2nd", "3rd"],
    present: {
      "1st": "करोमि",
      "2nd": "करोषि",
      "3rd": "करोति",
    },
    perfect: {
      "1st": "चकार",
      "2nd": "चकार",
      "3rd": "चकार",
    },
    future: {
      "1st": "करिष्यामि",
      "2nd": "करिष्यसि",
      "3rd": "करिष्यति",
    },
  },
};

async function transliterateToDevanagari(text) {
  if (!text || !/[a-zA-Z]/.test(text)) {
    return text;
  }

  const transliterationUrl = `${AKSHARAMUKHA_API_URL}?target=Devanagari&source=HK&text=${encodeURIComponent(text)}`;

  try {
    const response = await fetch(transliterationUrl);
    if (!response.ok) {
      throw new Error(`Aksharamukha request failed: ${response.status}`);
    }

    const convertedText = await response.text();
    return convertedText || text;
  } catch {
    return text;
  }
}

function playPronunciation(text) {
  if (!("speechSynthesis" in window)) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "hi-IN";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function debounce(callback, delay) {
  let timeoutId;

  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(...args), delay);
  };
}

function bindTransliteration(inputElement) {
  if (!inputElement) {
    return;
  }

  let requestCounter = 0;

  const debouncedTransliteration = debounce(async () => {
    requestCounter += 1;
    const requestId = requestCounter;
    const sourceText = inputElement.value;
    const transliteratedText = await transliterateToDevanagari(sourceText);

    if (requestId !== requestCounter) {
      return;
    }

    if (inputElement.value === sourceText) {
      inputElement.value = transliteratedText;
    }
  }, 300);

  inputElement.addEventListener("input", () => {
    debouncedTransliteration();
  });
}

function renderRules(rules) {
  if (!ruleResult) {
    return;
  }

  if (rules.length === 0) {
    ruleResult.innerHTML = '<div class="result-card"><p>No matching grammar rule found.</p></div>';
    return;
  }

  const cards = rules
    .map((rule) => {
      const examplesMarkup =
        rule.examples.length > 0
          ? `<ul>${rule.examples
              .map((example) => `<li class="sanskrit-text">${example}</li>`)
              .join("")}</ul>`
          : '<p class="sanskrit-text">Examples will be added soon.</p>';

      return `
        <div class="result-card">
          <h3 class="sanskrit-text">${rule.title}</h3>
          <p>${rule.summary}</p>
          ${examplesMarkup}
        </div>
      `;
    })
    .join("");

  ruleResult.innerHTML = cards;
}

function renderDefinitions(entries) {
  if (!definitionResult) {
    return;
  }

  if (entries.length === 0) {
    definitionResult.innerHTML = '<div class="result-card"><p>No matching word found.</p></div>';
    return;
  }

  const cards = entries
    .map((entry, index) => {
      const headingId = index === 0 ? ' id="result-word"' : "";
      return `
        <div class="result-card">
          <h3 class="sanskrit-text"${headingId}>${entry.word}</h3>
          <span class="pill-pos">${entry.pos}</span>
          <p>${entry.meaning}</p>
        </div>
      `;
    })
    .join("");

  definitionResult.innerHTML = cards;
}

async function mockTranslateApi(text, direction) {
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

function renderTranslationOutput(text, isSanskrit) {
  if (!translationOutput) {
    return;
  }

  translationOutput.innerHTML = `
    <div class="result-card">
      <h3>Translation Output</h3>
      <p class="${isSanskrit ? "sanskrit-text" : ""}">${text}</p>
    </div>
  `;
}

function renderVibhaktiTable(wordKey) {
  if (!vibhaktiTableBody || !vibhaktiData[wordKey]) {
    return;
  }

  vibhaktiTableBody.innerHTML = "";

  const caseNames = [
    "1st (Nominative)",
    "2nd (Accusative)",
    "3rd (Instrumental)",
    "4th (Dative)",
    "5th (Ablative)",
    "6th (Genitive)",
    "7th (Locative)",
  ];

  for (let index = 0; index < 7; index += 1) {
    const row = document.createElement("tr");

    const caseCell = document.createElement("td");
    caseCell.textContent = caseNames[index];

    const singularCell = document.createElement("td");
    singularCell.textContent = vibhaktiData[wordKey].singular[index];

    const dualCell = document.createElement("td");
    dualCell.textContent = vibhaktiData[wordKey].dual[index];

    const pluralCell = document.createElement("td");
    pluralCell.textContent = vibhaktiData[wordKey].plural[index];

    row.append(caseCell, singularCell, dualCell, pluralCell);
    vibhaktiTableBody.appendChild(row);
  }
}

function renderDhatuTable(rootKey) {
  if (!dhatuTableBody || !dhatuData[rootKey]) {
    return;
  }

  dhatuTableBody.innerHTML = "";

  dhatuData[rootKey].persons.forEach((person) => {
    const row = document.createElement("tr");

    const personCell = document.createElement("td");
    personCell.textContent = person;

    const presentCell = document.createElement("td");
    presentCell.textContent = dhatuData[rootKey].present[person];

    const perfectCell = document.createElement("td");
    perfectCell.textContent = dhatuData[rootKey].perfect[person];

    const futureCell = document.createElement("td");
    futureCell.textContent = dhatuData[rootKey].future[person];

    row.append(personCell, presentCell, perfectCell, futureCell);
    dhatuTableBody.appendChild(row);
  });
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderEditorSuggestions(hasGrammarIssue) {
  if (!suggestionsSidebar) {
    return;
  }

  if (!hasGrammarIssue) {
    suggestionsSidebar.innerHTML = `
      <h3>AI Suggestions</h3>
      <div class="suggestion-card">
        <p>No major grammar suggestions for now.</p>
      </div>
    `;
    return;
  }

  suggestionsSidebar.innerHTML = `
    <h3>AI Suggestions</h3>
    <div class="suggestion-card">
      <h4 class="sanskrit-text">Error: गच्छति</h4>
      <p><strong>Suggestion:</strong> <span class="sanskrit-text">गच्छामि</span></p>
      <p>The subject is 'अहम्' (First Person Singular), so the verb must also be First Person Singular (गच्छामि, not गच्छति).</p>
      <div class="suggestion-actions">
        <button id="apply-fix-btn" class="search-btn" type="button">Apply Fix</button>
      </div>
    </div>
  `;

  const applyFixBtn = document.getElementById("apply-fix-btn");
  if (applyFixBtn) {
    applyFixBtn.addEventListener("click", () => {
      if (!editorInput) {
        return;
      }

      editorInput.value = editorInput.value.replaceAll("गच्छति", "गच्छामि");
      mockAnalyzeText();
    });
  }
}

function mockAnalyzeText() {
  if (!editorInput || !editorHighlightDisplay) {
    return;
  }

  const text = editorInput.value;
  const hasGrammarIssue = text.includes("गच्छति");

  if (hasGrammarIssue) {
    editorInput.hidden = true;
    editorHighlightDisplay.hidden = false;
    const escapedText = escapeHtml(text);
    const highlightedText = escapedText.replaceAll(
      "गच्छति",
      '<span class="highlight-grammar" data-error-id="1">गच्छति</span>'
    );
    editorHighlightDisplay.innerHTML = highlightedText;
  } else {
    editorInput.hidden = false;
    editorHighlightDisplay.hidden = true;
    editorHighlightDisplay.innerHTML = "";
  }

  renderEditorSuggestions(hasGrammarIssue);
}

const heroObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!appHeader) {
        return;
      }

      appHeader.classList.toggle("is-visible", !entry.isIntersecting);
    });
  },
  { threshold: 0.4 }
);

if (heroSection) {
  heroObserver.observe(heroSection);
} else if (appHeader) {
  appHeader.classList.add("is-visible");
}

if (searchRuleInput && ruleResult) {
  renderRules(grammarRules);

  searchRuleInput.addEventListener("input", (event) => {
    const query = event.target.value.trim().toLowerCase();

    const filteredRules = grammarRules.filter((rule) => {
      return (
        rule.id.toLowerCase().includes(query) ||
        rule.title.toLowerCase().includes(query)
      );
    });

    renderRules(filteredRules);
  });
}

if (searchWordInput && definitionResult) {
  renderDefinitions(dictionary);

  searchWordInput.addEventListener("input", (event) => {
    const query = event.target.value.trim();

    const filteredEntries = dictionary.filter((entry) => {
      return entry.word.includes(query);
    });

    renderDefinitions(filteredEntries);
  });
}

if (translateBtn && sanskritInput) {
  translateBtn.addEventListener("click", async () => {
    const sourceText = sanskritInput.value.trim();
    if (!sourceText) {
      renderTranslationOutput("Please enter a Sanskrit sentence first.", false);
      return;
    }

    const translatedText = await mockTranslateApi(sourceText, "sa-en");
    renderTranslationOutput(translatedText, false);
  });
}

if (reverseTranslateBtn && englishInput) {
  reverseTranslateBtn.addEventListener("click", async () => {
    const sourceText = englishInput.value.trim();
    if (!sourceText) {
      renderTranslationOutput("Please enter an English sentence first.", false);
      return;
    }

    const translatedText = await mockTranslateApi(sourceText, "en-sa");
    renderTranslationOutput(translatedText, true);
  });
}

if (vibhaktiWordSelect && vibhaktiTableBody) {
  vibhaktiWordSelect.addEventListener("change", (event) => {
    renderVibhaktiTable(event.target.value);
  });

  renderVibhaktiTable("ram");
}

if (dhatuRootSelect && dhatuTableBody) {
  dhatuRootSelect.addEventListener("change", (event) => {
    renderDhatuTable(event.target.value);
  });

  renderDhatuTable("bhu");
}

bindTransliteration(searchWordInput);
bindTransliteration(sanskritInput);
bindTransliteration(editorInput);

if (pronounceBtn) {
  pronounceBtn.addEventListener("click", () => {
    const resultWord = document.getElementById("result-word");
    if (!resultWord) {
      return;
    }

    playPronunciation(resultWord.textContent.trim());
  });
}

if (analyzeBtn) {
  analyzeBtn.addEventListener("click", () => {
    mockAnalyzeText();
  });
}

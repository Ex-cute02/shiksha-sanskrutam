import AppShell from "./layout/AppShell";
import LandingHero from "./components/LandingHero";
import DictionaryView from "./views/DictionaryView";
import DhatuTableView from "./views/DhatuTableView";
import GrammarHelpView from "./views/GrammarHelpView";
import SmartEditorView from "./views/SmartEditorView";
import TranslationView from "./views/TranslationView";
import VibhaktiTableView from "./views/VibhaktiTableView";

function App() {
  return (
    <AppShell>
      <div className="views-stack">
        <LandingHero />

        <div id="grammar-help" className="content-section">
          <GrammarHelpView />
        </div>
        <div id="translation" className="content-section">
          <TranslationView />
        </div>
        <div id="dictionary" className="content-section">
          <DictionaryView />
        </div>
        <div id="smart-editor" className="content-section">
          <SmartEditorView />
        </div>
        <div id="vibhakti-table" className="content-section">
          <VibhaktiTableView />
        </div>
        <div id="dhatu-table" className="content-section">
          <DhatuTableView />
        </div>
      </div>
    </AppShell>
  );
}

export default App;

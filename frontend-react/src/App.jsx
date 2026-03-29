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
      <div className="views-stack sections">
        <LandingHero />

        <section id="grammar-help" className="full-section">
          <GrammarHelpView />
        </section>
        <section id="translation" className="full-section">
          <TranslationView />
        </section>
        <section id="dictionary" className="full-section">
          <DictionaryView />
        </section>
        <section id="smart-editor" className="full-section">
          <SmartEditorView />
        </section>
        <section id="vibhakti-table" className="full-section">
          <VibhaktiTableView />
        </section>
        <section id="dhatu-table" className="full-section">
          <DhatuTableView />
        </section>
      </div>
    </AppShell>
  );
}

export default App;

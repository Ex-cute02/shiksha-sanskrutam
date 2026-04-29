import AppShell from "./layout/AppShell";
import LandingHero from "./components/LandingHero";
import DictionaryView from "./views/DictionaryView";
import DhatuTableView from "./views/DhatuTableView";
import SandhiHelperView from "./views/SandhiHelperView";
import NounTableView from "./views/NounTableView";
import SmartEditorView from "./views/SmartEditorView";
import TranslationView from "./views/TranslationView";

function App() {
  return (
    <AppShell>
      <div className="views-stack sections">
        <LandingHero />

        <section id="sandhi-helper" className="full-section">
          <SandhiHelperView />
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
        <section id="noun-table" className="full-section">
          <NounTableView />
        </section>
        <section id="dhatu-table" className="full-section">
          <DhatuTableView />
        </section>
      </div>
    </AppShell>
  );
}

export default App;

import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./layout/AppShell";
import DictionaryView from "./views/DictionaryView";
import DhatuTableView from "./views/DhatuTableView";
import GrammarHelpView from "./views/GrammarHelpView";
import SmartEditorView from "./views/SmartEditorView";
import TranslationView from "./views/TranslationView";
import VibhaktiTableView from "./views/VibhaktiTableView";

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<SmartEditorView />} />
        <Route path="/grammar-help" element={<GrammarHelpView />} />
        <Route path="/translation" element={<TranslationView />} />
        <Route path="/dictionary" element={<DictionaryView />} />
        <Route path="/vibhakti-table" element={<VibhaktiTableView />} />
        <Route path="/dhatu-table" element={<DhatuTableView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

export default App;

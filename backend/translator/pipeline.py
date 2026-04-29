from difflib import SequenceMatcher

from .google_engine import GoogleTranslationEngine
from .indictrans_engine import IndicTrans2Engine


SUPPORTED_LANGS = {"sa", "en"}


def normalize_lang_code(code: str) -> str:
    value = (code or "").strip().lower()
    aliases = {
        "sanskrit": "sa",
        "san": "sa",
        "english": "en",
        "eng": "en",
    }
    return aliases.get(value, value)


def compute_similarity(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    return round(SequenceMatcher(None, a.strip().lower(), b.strip().lower()).ratio(), 3)


class SanskritTranslationPipeline:
    def __init__(self) -> None:
        self.google = GoogleTranslationEngine()
        self.indic_to_en = IndicTrans2Engine(direction="indic-en")
        self.en_to_indic = IndicTrans2Engine(direction="en-indic")

    def _select_indic_engine(self, source_lang: str, target_lang: str):
        if source_lang == "en" and target_lang == "sa":
            return self.en_to_indic
        if source_lang == "sa" and target_lang == "en":
            return self.indic_to_en
        return None

    def translate(self, text: str, source_lang: str, target_lang: str, include_secondary: bool = True) -> dict:
        source_lang = normalize_lang_code(source_lang)
        target_lang = normalize_lang_code(target_lang)

        if source_lang not in SUPPORTED_LANGS or target_lang not in SUPPORTED_LANGS:
            return {"error": f"Unsupported language code: {source_lang} -> {target_lang}"}

        if source_lang == target_lang:
            return {
                "primary": text,
                "secondary": None,
                "engine_used": "identity",
                "confidence": 1.0,
            }

        indic_engine = self._select_indic_engine(source_lang, target_lang)
        if not indic_engine:
            return {"error": f"Unsupported direction: {source_lang}-{target_lang}"}

        indic_result = indic_engine.translate(text, source_lang, target_lang)
        if "error" not in indic_result:
            secondary = None
            confidence = None

            if include_secondary:
                google_result = self.google.translate(text, source_lang, target_lang)
                if "error" not in google_result:
                    secondary = google_result.get("translated_text")
                    confidence = compute_similarity(indic_result.get("translated_text", ""), secondary or "")

            return {
                "primary": indic_result.get("translated_text"),
                "secondary": secondary,
                "engine_used": "indictrans2",
                "confidence": confidence,
                "source_lang": source_lang,
                "target_lang": target_lang,
            }

        google_result = self.google.translate(text, source_lang, target_lang)
        if "error" not in google_result:
            return {
                "primary": google_result.get("translated_text"),
                "secondary": None,
                "engine_used": "google_fallback",
                "confidence": None,
                "source_lang": source_lang,
                "target_lang": target_lang,
                "fallback_reason": indic_result.get("error"),
            }

        return {
            "error": "Both engines failed",
            "details": {
                "indictrans2": indic_result.get("error"),
                "google": google_result.get("error"),
            },
        }

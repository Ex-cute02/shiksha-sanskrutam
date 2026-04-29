from typing import Optional

try:
    from google.cloud import translate_v2 as translate
except Exception:
    translate = None


class GoogleTranslationEngine:
    def __init__(self) -> None:
        self.client = None
        if translate is None:
            return

        try:
            # Requires GOOGLE_APPLICATION_CREDENTIALS.
            self.client = translate.Client()
        except Exception:
            self.client = None

    def is_available(self) -> bool:
        return self.client is not None

    def translate(self, text: str, source_lang: str, target_lang: str) -> dict:
        if not self.client:
            return {
                "error": "google-cloud-translate is not installed or credentials are unavailable",
                "source": "google",
            }

        try:
            result = self.client.translate(
                text,
                source_language=source_lang,
                target_language=target_lang,
            )
            return {
                "translated_text": result.get("translatedText", ""),
                "source": "google",
                "detected_language": result.get("detectedSourceLanguage"),
            }
        except Exception as exc:
            return {
                "error": str(exc),
                "source": "google",
            }

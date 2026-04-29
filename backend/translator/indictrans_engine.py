from typing import Optional

try:
    import torch
except Exception:
    torch = None

try:
    from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
except Exception:
    AutoModelForSeq2SeqLM = None
    AutoTokenizer = None

try:
    from IndicTransToolkit import IndicProcessor
except Exception:
    IndicProcessor = None


LANG_CODE_MAP = {
    "sa": "san_Deva",
    "en": "eng_Latn",
}


class IndicTrans2Engine:
    def __init__(self, direction: str = "en-indic") -> None:
        self.direction = direction
        self.device = "cpu"
        self.model = None
        self.tokenizer = None
        self.processor = None
        self._init_error = ""

        if torch is None or AutoTokenizer is None or AutoModelForSeq2SeqLM is None or IndicProcessor is None:
            self._init_error = "IndicTrans2 dependencies are not installed"
            return

        model_name = (
            "ai4bharat/indictrans2-en-indic-1B"
            if direction == "en-indic"
            else "ai4bharat/indictrans2-indic-en-1B"
        )

        try:
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            self.tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
            self.model = AutoModelForSeq2SeqLM.from_pretrained(model_name, trust_remote_code=True).to(self.device)
            self.processor = IndicProcessor(inference=True)
        except Exception as exc:
            self._init_error = str(exc)
            self.model = None
            self.tokenizer = None
            self.processor = None

    def is_available(self) -> bool:
        return self.model is not None and self.tokenizer is not None and self.processor is not None

    def translate(self, text: str, source_lang: str, target_lang: str) -> dict:
        if not self.is_available():
            reason = self._init_error or "IndicTrans2 is unavailable"
            return {
                "error": reason,
                "source": "indictrans2",
            }

        src_code = LANG_CODE_MAP.get(source_lang)
        tgt_code = LANG_CODE_MAP.get(target_lang)
        if not src_code or not tgt_code:
            return {
                "error": f"Unsupported language pair: {source_lang} -> {target_lang}",
                "source": "indictrans2",
            }

        try:
            batch = self.processor.preprocess_batch([text], src_lang=src_code, tgt_lang=tgt_code)
            inputs = self.tokenizer(
                batch,
                truncation=True,
                padding="longest",
                return_tensors="pt",
                return_attention_mask=True,
            ).to(self.device)

            with torch.no_grad():
                generated = self.model.generate(
                    **inputs,
                    num_beams=5,
                    num_return_sequences=1,
                    max_length=256,
                    # IndicTrans2 remote code expects older cache semantics.
                    # Disable KV cache to avoid None past-key-value shape errors.
                    use_cache=False,
                )

            output = self.tokenizer.batch_decode(generated, skip_special_tokens=True)
            final = self.processor.postprocess_batch(output, lang=tgt_code)
            return {
                "translated_text": final[0],
                "source": "indictrans2",
            }
        except Exception as exc:
            return {
                "error": str(exc),
                "source": "indictrans2",
            }

from typing import List

import asyncio
import html
import httpx
import json
import re
import sqlite3
import unicodedata
import urllib.parse
import uvicorn
import requests
from pathlib import Path
from threading import Lock
from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from translator.pipeline import SanskritTranslationPipeline

DICTIONARY_DATA = {
    "ram": {
        "word": "रामः",
        "pos": "पुंल्लिङ्गः",
        "meaning": "Rama, a male proper name",
    },
    "sita": {
        "word": "सीता",
        "pos": "स्त्रीलिङ्गः",
        "meaning": "Sita, a female proper name",
    },
    "phalam": {
        "word": "फलम्",
        "pos": "नपुंसकलिङ्गः",
        "meaning": "fruit",
    },
}

WORD_API_GETWORD_URLS = [
    "http://sanskrit-lexicon.uni-koeln.de/scans/MWScan/2020/web/webtc/getword.php",
    "https://sanskrit-lexicon.uni-koeln.de/scans/MWScan/2020/web/webtc/getword.php",
]
WORD_API_LIST_URLS = [
    "http://sanskrit-lexicon.uni-koeln.de/scans/MWScan/2020/web/webtc1/listhier.php",
    "https://sanskrit-lexicon.uni-koeln.de/scans/MWScan/2020/web/webtc1/listhier.php",
]

WORD_API_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "http://sanskrit-lexicon.uni-koeln.de/",
}

SANDHI_JOIN_URLS = [
    "https://sanskrit.uohyd.ac.in/cgi-bin/scl/sandhi/sandhi_json.cgi",
    "http://sanskrit.uohyd.ac.in/cgi-bin/scl/sandhi/sandhi_json.cgi",
]

SANDHI_SPLITTER_URLS = [
    "https://sanskrit.uohyd.ac.in/cgi-bin/scl/MT/prog/sandhi_splitter/sandhi_splitter.cgi",
    "http://sanskrit.uohyd.ac.in/cgi-bin/scl/MT/prog/sandhi_splitter/sandhi_splitter.cgi",
]

MONIER_SQLITE_PATH = (
    Path(__file__).resolve().parents[1]
    / "Monier Williams Sanskrit English Dictionary"
    / "web"
    / "sqlite"
    / "mw.sqlite"
)
MONIER_KEYS_SQLITE_PATH = (
    Path(__file__).resolve().parents[1]
    / "Monier Williams Sanskrit English Dictionary"
    / "web"
    / "sqlite"
    / "mwkeys.sqlite"
)

GRAMMAR_RULES = {
    "sandhi": {
        "id": "sandhi",
        "title": "सन्धि (Compound Joining)",
        "summary": "When two words come together, their sounds may change for smooth pronunciation.",
        "examples": ["देव + इन्द्र → देवेन्द्र", "सा + अपि → सापि"],
    },
    "vibhakti": {
        "id": "vibhakti",
        "title": "विभक्तिः (Case Forms)",
        "summary": "Vibhakti endings mark grammatical roles like subject, object, and possession.",
        "examples": ["रामः पठति", "रामस्य पुस्तकम्"],
    },
}

DHATU_TABLES = {
    "bhu": {
        "persons": ["1st", "2nd", "3rd"],
        "present": {"1st": "भवामि", "2nd": "भवसि", "3rd": "भवति"},
        "perfect": {"1st": "बभूव", "2nd": "बभूव", "3rd": "बभूव"},
        "future": {"1st": "भविष्यामि", "2nd": "भविष्यसि", "3rd": "भविष्यति"},
    },
    "kri": {
        "persons": ["1st", "2nd", "3rd"],
        "present": {"1st": "करोमि", "2nd": "करोषि", "3rd": "करोति"},
        "perfect": {"1st": "चकार", "2nd": "चकार", "3rd": "चकार"},
        "future": {"1st": "करिष्यामि", "2nd": "करिष्यसि", "3rd": "करिष्यति"},
    },
    "gam": {
        "persons": ["1st", "2nd", "3rd"],
        "present": {"1st": "गच्छामि", "2nd": "गच्छसि", "3rd": "गच्छति"},
        "perfect": {"1st": "जगाम", "2nd": "जगाम", "3rd": "जगाम"},
        "future": {"1st": "गमिष्यामि", "2nd": "गमिष्यसि", "3rd": "गमिष्यति"},
    },
}


def build_dhatu_form_index() -> dict:
    form_index: dict = {}

    for root, table in DHATU_TABLES.items():
        for tense in ["present", "perfect", "future"]:
            tense_map = table.get(tense, {})
            for person, form in tense_map.items():
                form_index[form] = {
                    "root": root,
                    "tense": tense,
                    "person": person,
                }

    return form_index


DHATU_FORM_INDEX = build_dhatu_form_index()

TAG_MAP = {
    "1": "1st Person (Uttama Purusha)",
    "2": "2nd Person (Madhyama Purusha)",
    "3": "3rd Person (Prathama Purusha)",
    "d": "Dual (Dvi Vachana)",
    "s": "Singular (Eka Vachana)",
    "p": "Plural (Bahu Vachana)",
}

SUBJECT_RULES = {
    "अहम्": {"person": "उ", "number": "एक", "label": "1st Person Singular (उत्तमपुरुष एकवचन)"},
    "आवाम्": {"person": "उ", "number": "द्वि", "label": "1st Person Dual (उत्तमपुरुष द्विवचन)"},
    "वयम्": {"person": "उ", "number": "बहु", "label": "1st Person Plural (उत्तमपुरुष बहुवचन)"},
    "त्वम्": {"person": "म", "number": "एक", "label": "2nd Person Singular (मध्यमपुरुष एकवचन)"},
    "युवाम्": {"person": "म", "number": "द्वि", "label": "2nd Person Dual (मध्यमपुरुष द्विवचन)"},
    "यूयम्": {"person": "म", "number": "बहु", "label": "2nd Person Plural (मध्यमपुरुष बहुवचन)"}
}

NOUN_CASE_ORDER = [
    "प्रथमा",
    "द्वितीया",
    "तृतीया",
    "चतुर्थी",
    "पञ्चमी",
    "षष्ठी",
    "सप्तमी",
    "सं.प्र",
]

NOUN_NUMBER_ORDER = ["एकवचनम्", "द्विवचनम्", "बहुवचनम्"]

NOUN_CASE_ALIASES = {
    "प्रथमा": "प्रथमा",
    "dvitīyā": "द्वितीया",
    "द्वितीया": "द्वितीया",
    "tṛtīyā": "तृतीया",
    "तृतीया": "तृतीया",
    "caturthī": "चतुर्थी",
    "चतुर्थी": "चतुर्थी",
    "pañcamī": "पञ्चमी",
    "पञ्चमी": "पञ्चमी",
    "ṣaṣṭhī": "षष्ठी",
    "षष्ठी": "षष्ठी",
    "saptamī": "सप्तमी",
    "सप्तमी": "सप्तमी",
    "saṃ.pra": "सं.प्र",
    "सं.प्र": "सं.प्र",
}

NOUN_NUMBER_ALIASES = {
    "एकवचनम्": "एकवचनम्",
    "ekavacanam": "एकवचनम्",
    "द्विवचनम्": "द्विवचनम्",
    "xvivacanam": "द्विवचनम्",
    "dvivacanam": "द्विवचनम्",
    "बहुवचनम्": "बहुवचनम्",
    "bahuvacanam": "बहुवचनम्",
}

VERB_PERSON_ORDER = ["प्रथमपुरुषः", "मध्यमपुरुषः", "उत्तमपुरुषः"]
VERB_NUMBER_ORDER = ["एकवचनम्", "द्विवचनम्", "बहुवचनम्"]
VERB_LAKARA_LABELS = [
    "लट् (वर्तमान)",
    "लिट् (परोक्ष)",
    "लुट् (अनद्यतन भविष्यत्)",
    "लृट् (अद्यतन भविष्यत्)",
    "लोट् (आज्ञार्थ)",
    "लङ् (अनद्यतन भूत)",
    "विधिलिङ्",
    "आशीर्लिङ्",
    "लुङ् (अद्यतन भूत)",
    "लृङ् (भविष्यत्)",
]

VB_TO_DHATU_KEY = {
    "gam1_gamLz_BvAxiH_gawO": "gam",
    "BU1_BU_sattAyAm": "bhu",
    "qukfY_karaNe": "kri",
}


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    text: str


class TranslateRequest(BaseModel):
    text: str
    source_lang: str
    target_lang: str
    include_secondary: bool = True


class ErrorDetail(BaseModel):
    original_text: str
    error_type: str
    correction: str
    explanation: str
    rule_id: str


class AnalyzeResponse(BaseModel):
    errors: List[ErrorDetail]


translation_pipeline = None
translation_pipeline_lock = Lock()


def get_translation_pipeline() -> SanskritTranslationPipeline:
    global translation_pipeline

    if translation_pipeline is None:
        with translation_pipeline_lock:
            if translation_pipeline is None:
                translation_pipeline = SanskritTranslationPipeline()

    return translation_pipeline


async def call_scl_api(text: str) -> dict:
    words = text.split()
    parsed_dict = {}
    
    async with httpx.AsyncClient(follow_redirects=True) as client:
        for word in words:
            encoded_word = urllib.parse.quote(word)
            # Using the official JSON Morph Analyzer endpoint
            url = f"http://sanskrit.uohyd.ac.in/cgi-bin/scl/MT/prog/morph/morph.cgi?morfword={encoded_word}&encoding=Unicode&outencoding=DEV&mode=json"
            
            try:
                response = await client.get(url, timeout=10.0)
                if response.status_code == 200:
                    try:
                        parsed_dict[word] = response.json()
                    except:
                        parsed_dict[word] = {"error": "Invalid JSON response", "raw": response.text}
                else:
                    parsed_dict[word] = {"error": f"HTTP {response.status_code}"}
            except Exception as e:
                parsed_dict[word] = {"error": str(e)}
                
    return parsed_dict


def _extract_dictionary_excerpt(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    headline = soup.find("h1")
    if headline:
        return headline.get_text(" ", strip=True)
    text = soup.get_text(" ", strip=True)
    return text[:1200]


def _normalize_monier_candidates(word: str) -> list:
    base = word.strip()
    if not base:
        return []

    lowered = base.lower()
    folded = unicodedata.normalize("NFKD", base)
    folded = "".join(ch for ch in folded if not unicodedata.combining(ch))
    folded = folded.replace("—", "-").replace("–", "-")
    folded = re.sub(r"[^a-zA-Z0-9_/\-]", "", folded)

    candidates = [base, lowered]

    if any("\u0900" <= ch <= "\u097F" for ch in base):
        slp1_guess = _deva_to_slp1(base)
        if slp1_guess:
            candidates.append(slp1_guess)
            candidates.append(slp1_guess.lower())

    if folded:
        candidates.append(folded)
        candidates.append(folded.lower())

    deduped = []
    for item in candidates:
        if item and item not in deduped:
            deduped.append(item)
    return deduped


def _deva_to_slp1(text: str) -> str:
    independent_vowels = {
        "अ": "a",
        "आ": "A",
        "इ": "i",
        "ई": "I",
        "उ": "u",
        "ऊ": "U",
        "ऋ": "f",
        "ॠ": "F",
        "ऌ": "x",
        "ॡ": "X",
        "ए": "e",
        "ऐ": "E",
        "ओ": "o",
        "औ": "O",
        "ॐ": "oM",
    }

    consonants = {
        "क": "k",
        "ख": "K",
        "ग": "g",
        "घ": "G",
        "ङ": "N",
        "च": "c",
        "छ": "C",
        "ज": "j",
        "झ": "J",
        "ञ": "Y",
        "ट": "w",
        "ठ": "W",
        "ड": "q",
        "ढ": "Q",
        "ण": "R",
        "त": "t",
        "थ": "T",
        "द": "d",
        "ध": "D",
        "न": "n",
        "प": "p",
        "फ": "P",
        "ब": "b",
        "भ": "B",
        "म": "m",
        "य": "y",
        "र": "r",
        "ल": "l",
        "व": "v",
        "श": "S",
        "ष": "z",
        "स": "s",
        "ह": "h",
        "ळ": "L",
    }

    vowel_signs = {
        "ा": "A",
        "ि": "i",
        "ी": "I",
        "ु": "u",
        "ू": "U",
        "ृ": "f",
        "ॄ": "F",
        "ॢ": "x",
        "ॣ": "X",
        "े": "e",
        "ै": "E",
        "ो": "o",
        "ौ": "O",
    }

    signs = {
        "ं": "M",
        "ः": "H",
        "ँ": "~",
        "ऽ": "'",
    }

    virama = "्"
    nukta = "़"

    out = []
    pending_inherent = False

    for ch in unicodedata.normalize("NFC", text.strip()):
        if ch in independent_vowels:
            if pending_inherent:
                out.append("a")
                pending_inherent = False
            out.append(independent_vowels[ch])
            continue

        if ch in consonants:
            if pending_inherent:
                out.append("a")
            out.append(consonants[ch])
            pending_inherent = True
            continue

        if ch in vowel_signs:
            if pending_inherent:
                out.append(vowel_signs[ch])
                pending_inherent = False
            else:
                out.append(vowel_signs[ch])
            continue

        if ch == virama:
            pending_inherent = False
            continue

        if ch == nukta:
            continue

        if ch in signs:
            if pending_inherent:
                out.append("a")
                pending_inherent = False
            out.append(signs[ch])
            continue

        if ch.isspace() or ch in {"-", "_", "/"}:
            if pending_inherent:
                out.append("a")
                pending_inherent = False
            out.append(ch)
            continue

    if pending_inherent:
        out.append("a")

    return "".join(out)


def _xmlish_to_text(value: str) -> str:
    cleaned = re.sub(r"<[^>]+>", " ", value)
    cleaned = html.unescape(cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


SLP1_VOWELS = set("aAiIuUfFxXeEoO")
SLP1_CONSONANTS = {
    "k": "क",
    "K": "ख",
    "g": "ग",
    "G": "घ",
    "N": "ङ",
    "c": "च",
    "C": "छ",
    "j": "ज",
    "J": "झ",
    "Y": "ञ",
    "w": "ट",
    "W": "ठ",
    "q": "ड",
    "Q": "ढ",
    "R": "ण",
    "t": "त",
    "T": "थ",
    "d": "द",
    "D": "ध",
    "n": "न",
    "p": "प",
    "P": "फ",
    "b": "ब",
    "B": "भ",
    "m": "म",
    "y": "य",
    "r": "र",
    "l": "ल",
    "v": "व",
    "S": "श",
    "z": "ष",
    "s": "स",
    "h": "ह",
    "L": "ळ",
}
SLP1_INDEPENDENT_VOWELS = {
    "a": "अ",
    "A": "आ",
    "i": "इ",
    "I": "ई",
    "u": "उ",
    "U": "ऊ",
    "f": "ऋ",
    "F": "ॠ",
    "x": "ऌ",
    "X": "ॡ",
    "e": "ए",
    "E": "ऐ",
    "o": "ओ",
    "O": "औ",
}
SLP1_VOWEL_SIGNS = {
    "A": "ा",
    "i": "ि",
    "I": "ी",
    "u": "ु",
    "U": "ू",
    "f": "ृ",
    "F": "ॄ",
    "x": "ॢ",
    "X": "ॣ",
    "e": "े",
    "E": "ै",
    "o": "ो",
    "O": "ौ",
}
SLP1_SIGNS = {
    "M": "ं",
    "H": "ः",
    "~": "ँ",
    "'": "ऽ",
    "|": "।",
}
MW_POS_MARKER_RE = re.compile(r"\b(?:m|f|n|ind|adj|adv|pron|conj|prep|interj)\.", re.IGNORECASE)
MW_ENGLISH_WORD_RE = re.compile(r"^[a-z]{3,}$")
MW_SANSKRIT_HINT_CHARS = set("AIFXEOqQwWzSRL")


def _slp1_to_deva(text: str) -> str:
    out = []
    pending_consonant = False

    for ch in text:
        if ch in SLP1_CONSONANTS:
            if pending_consonant:
                out.append("्")
            out.append(SLP1_CONSONANTS[ch])
            pending_consonant = True
            continue

        if ch in SLP1_VOWELS:
            if pending_consonant:
                if ch != "a":
                    out.append(SLP1_VOWEL_SIGNS.get(ch, ""))
                pending_consonant = False
            else:
                out.append(SLP1_INDEPENDENT_VOWELS.get(ch, ch))
            continue

        if ch in SLP1_SIGNS:
            pending_consonant = False
            out.append(SLP1_SIGNS[ch])
            continue

        pending_consonant = False
        out.append(ch)

    return "".join(out)


def _transliterate_monier_line(line: str, output_filter: str) -> str:
    mode = (output_filter or "").lower()
    if mode != "deva":
        return line

    marker = MW_POS_MARKER_RE.search(line)
    if marker:
        prefix = line[: marker.start()]
        suffix = line[marker.start() :]
        return f"{_slp1_to_deva(prefix)}{suffix}"

    parts = re.split(r"(\s+)", line)
    converted_parts = []
    encountered_gloss = False

    for part in parts:
        if not part or part.isspace():
            converted_parts.append(part)
            continue

        if encountered_gloss:
            converted_parts.append(part)
            continue

        token = part.strip(".,;:!?()[]{}")
        if not token:
            converted_parts.append(part)
            continue

        if MW_ENGLISH_WORD_RE.fullmatch(token):
            encountered_gloss = True
            converted_parts.append(part)
            continue

        looks_sanskrit = (
            any(ch in MW_SANSKRIT_HINT_CHARS for ch in token)
            or "/" in token
            or token.endswith("a")
        )

        converted_parts.append(_slp1_to_deva(part) if looks_sanskrit else part)

    return "".join(converted_parts)


def _apply_monier_output_filter(entry: dict, output_filter: str) -> dict:
    mode = (output_filter or "").lower()
    if mode == "slp1" or not mode:
        return entry

    if mode != "deva":
        return entry

    converted = dict(entry)
    converted["word"] = _slp1_to_deva(entry.get("word", ""))
    converted["excerpt"] = _transliterate_monier_line(entry.get("excerpt", ""), mode)
    converted["entries"] = [
        _transliterate_monier_line(item, mode) for item in entry.get("entries", [])
    ]
    converted["nearby_words"] = [_slp1_to_deva(item) for item in entry.get("nearby_words", [])]
    converted["output_filter"] = mode
    return converted


def _find_monier_key_match(candidates: list) -> str:
    if not candidates:
        return ""

    with sqlite3.connect(str(MONIER_KEYS_SQLITE_PATH)) as conn:
        cur = conn.cursor()

        for candidate in candidates:
            exact = cur.execute(
                "SELECT key FROM mwkeys WHERE key = ? LIMIT 1",
                (candidate,),
            ).fetchone()
            if exact:
                return exact[0]

            n = len(candidate)
            while n > 0:
                prefix = candidate[:n]
                partial = cur.execute(
                    "SELECT key FROM mwkeys WHERE key LIKE ? ORDER BY key LIMIT 1",
                    (f"{prefix}%",),
                ).fetchone()
                if partial:
                    return partial[0]
                n -= 1

        fallback = cur.execute("SELECT key FROM mwkeys ORDER BY key LIMIT 1").fetchone()
        return fallback[0] if fallback else ""


def _get_monier_nearby_words(center_key: str, nprev: int, nnext: int, direction: str) -> list:
    if not center_key:
        return []

    mode = direction.upper()
    with sqlite3.connect(str(MONIER_KEYS_SQLITE_PATH)) as conn:
        cur = conn.cursor()

        if mode == "UP":
            prev_rows = cur.execute(
                "SELECT key FROM mwkeys WHERE key < ? ORDER BY key DESC LIMIT ?",
                (center_key, nprev + nnext),
            ).fetchall()
            words = [item[0] for item in reversed(prev_rows)]
        elif mode == "DOWN":
            next_rows = cur.execute(
                "SELECT key FROM mwkeys WHERE key >= ? ORDER BY key LIMIT ?",
                (center_key, nprev + nnext + 1),
            ).fetchall()
            words = [item[0] for item in next_rows]
        else:
            prev_rows = cur.execute(
                "SELECT key FROM mwkeys WHERE key < ? ORDER BY key DESC LIMIT ?",
                (center_key, nprev),
            ).fetchall()
            next_rows = cur.execute(
                "SELECT key FROM mwkeys WHERE key >= ? ORDER BY key LIMIT ?",
                (center_key, nnext + 1),
            ).fetchall()
            words = [item[0] for item in reversed(prev_rows)] + [item[0] for item in next_rows]

    deduped = []
    for item in words:
        if item not in deduped:
            deduped.append(item)
    return deduped


def fetch_dictionary_entry_from_monier_local(
    word: str,
    nprev: int = 12,
    nnext: int = 12,
    direction: str = "CENTER",
    output_filter: str = "deva",
) -> dict:
    if not MONIER_SQLITE_PATH.exists() or not MONIER_KEYS_SQLITE_PATH.exists():
        return {}

    candidates = _normalize_monier_candidates(word)
    if not candidates:
        return {}

    matched_key = _find_monier_key_match(candidates)
    if not matched_key:
        return {}

    with sqlite3.connect(str(MONIER_SQLITE_PATH)) as conn:
        cur = conn.cursor()
        rows = cur.execute(
            "SELECT key, lnum, data FROM mw WHERE key = ? ORDER BY lnum LIMIT 12",
            (matched_key,),
        ).fetchall()
        if not rows:
            return {}

    nearby_words = _get_monier_nearby_words(matched_key, nprev=max(0, nprev), nnext=max(0, nnext), direction=direction)

    entry_texts = []
    for _, _, data in rows:
        text = _xmlish_to_text(data)
        if text:
            entry_texts.append(text)

    if not entry_texts:
        return {}

    entry = {
        "source": "monier-local-sqlite",
        "word": matched_key,
        "direction": direction.upper(),
        "excerpt": entry_texts[0][:800],
        "entries": entry_texts,
        "nearby_words": nearby_words,
    }
    return _apply_monier_output_filter(entry, output_filter)


def _extract_nearby_words(html: str) -> list:
    soup = BeautifulSoup(html, "html.parser")
    nearby: List[str] = []

    for anchor in soup.find_all("a"):
        text = anchor.get_text(" ", strip=True)
        if not text:
            continue
        cleaned = text.strip("[]().,;:")
        if not cleaned or cleaned in {"▲", "..", ".", ""}:
            continue
        if any("\u0900" <= ch <= "\u097F" for ch in cleaned) or cleaned[0].isalnum():
            if cleaned not in nearby:
                nearby.append(cleaned)

    return nearby[:25]


async def fetch_dictionary_entry_from_word_api(word: str) -> dict:
    params = {
        "key": word,
        "filter": "deva",
        "noLit": "off",
        "accent": "no",
        "transLit": "slp1",
    }

    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True, headers=WORD_API_HEADERS) as client:
        getword_attempts = []
        response = None
        for url in WORD_API_GETWORD_URLS:
            try:
                candidate = await client.get(url, params=params)
            except httpx.HTTPError as exc:
                getword_attempts.append(f"{url} -> transport_error: {exc}")
                continue
            getword_attempts.append(f"{url} -> {candidate.status_code}")
            if candidate.status_code == 200:
                response = candidate
                break

        if response is None:
            raise HTTPException(
                status_code=502,
                detail=f"Dictionary service unavailable ({'; '.join(getword_attempts)})",
            )

        nearby_response = None
        list_attempts = []
        nearby_params = {
            "key": word,
            "keyboard": "yes",
            "inputType": "phonetic",
            "unicodeInput": "devInscript",
            "phoneticInput": "slp1",
            "serverOptions": "deva",
            "accent": "no",
            "viewAs": "phonetic",
        }

        for url in WORD_API_LIST_URLS:
            try:
                candidate = await client.get(url, params=nearby_params)
            except httpx.HTTPError as exc:
                list_attempts.append(f"{url} -> transport_error: {exc}")
                continue
            list_attempts.append(f"{url} -> {candidate.status_code}")
            if candidate.status_code == 200:
                nearby_response = candidate
                break

    excerpt = _extract_dictionary_excerpt(response.text)
    nearby_words = _extract_nearby_words(nearby_response.text) if nearby_response is not None else []

    return {
        "source": "word-api",
        "word": word,
        "excerpt": excerpt,
        "nearby_words": nearby_words,
    }


def _normalize_local_dictionary_key(word: str) -> str:
    base = word.strip().lower()
    if base in DICTIONARY_DATA:
        return base

    ascii_folded = unicodedata.normalize("NFKD", word)
    ascii_folded = "".join(ch for ch in ascii_folded if not unicodedata.combining(ch))
    ascii_folded = re.sub(r"[^a-zA-Z]", "", ascii_folded).lower()

    if ascii_folded in DICTIONARY_DATA:
        return ascii_folded

    if ascii_folded.endswith("a") and ascii_folded[:-1] in DICTIONARY_DATA:
        return ascii_folded[:-1]

    return ""


def parse_scl_html(html: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    parsed: dict = {}

    def add_tags(word: str, tags: List[str]) -> None:
        clean_word = word.strip()
        if not clean_word:
            return
        if clean_word not in parsed:
            parsed[clean_word] = []
        for tag in tags:
            cleaned = tag.strip().strip("[](){}.,;:")
            if cleaned and cleaned not in parsed[clean_word]:
                parsed[clean_word].append(cleaned)

    def extract_tags(text: str) -> List[str]:
        allowed = {
            "1",
            "2",
            "3",
            "s",
            "d",
            "p",
            "pres",
            "impft",
            "para",
            "atma",
            "imp",
            "opt",
            "lot",
            "lat",
        }
        tags: List[str] = []
        for token in text.replace("|", " ").replace(",", " ").split():
            normalized = token.strip().lower().strip("[](){}.,;:")
            if normalized in allowed and normalized not in tags:
                tags.append(normalized)
        return tags

    for row in soup.select("tr"):
        cells = row.find_all(["td", "th"])
        if len(cells) < 2:
            continue
        word = cells[0].get_text(" ", strip=True)
        tag_text = " ".join(cell.get_text(" ", strip=True) for cell in cells[1:])
        tags = extract_tags(tag_text)
        if tags:
            add_tags(word, tags)

    for node in soup.select("span, div, a"):
        text = node.get_text(" ", strip=True)
        tags = extract_tags(text)
        if not tags:
            continue

        for attr_name in ("data-word", "word", "data-lemma", "title"):
            attr_value = node.attrs.get(attr_name)
            if isinstance(attr_value, str) and attr_value.strip():
                add_tags(attr_value, tags)

    for token in soup.get_text(" ", strip=True).split():
        if any("\u0900" <= ch <= "\u097F" for ch in token):
            normalized = token.strip("[](){}.,;:")
            if normalized and normalized not in parsed:
                parsed[normalized] = []

    return parsed


def parse_ans_string(ans_str: str) -> dict:
    matches = re.findall(r'\{(.*?):(.*?)\}', ans_str)
    return {k: v for k, v in matches}


def _normalize_case(value: str) -> str:
    return NOUN_CASE_ALIASES.get(value.strip(), value.strip())


def _normalize_number(value: str) -> str:
    return NOUN_NUMBER_ALIASES.get(value.strip(), value.strip())


def _build_noun_rows(items: List[dict]) -> List[dict]:
    table = {
        case_name: {number_name: "" for number_name in NOUN_NUMBER_ORDER}
        for case_name in NOUN_CASE_ORDER
    }

    for item in items:
        form = str(item.get("form", "")).strip()
        case_name = _normalize_case(str(item.get("vib", "")).strip())
        number_name = _normalize_number(str(item.get("vac", "")).strip())

        if case_name in table and number_name in table[case_name]:
            table[case_name][number_name] = form

    rows = []
    for case_name in NOUN_CASE_ORDER:
        rows.append(
            {
                "caseName": case_name,
                "singular": table[case_name]["एकवचनम्"],
                "dual": table[case_name]["द्विवचनम्"],
                "plural": table[case_name]["बहुवचनम्"],
            }
        )

    return rows


async def fetch_noun_table(
    rt: str,
    gen: str,
    jAwi: str,
    level: int,
    encoding: str,
    outencoding: str,
) -> List[dict]:
    params = {
        "rt": rt,
        "gen": gen,
        "jAwi": jAwi,
        "level": str(level),
        "mode": "json",
        "encoding": encoding,
        "outencoding": outencoding,
    }

    candidate_urls = [
        "http://sanskrit.uohyd.ac.in/cgi-bin/scl/skt_gen/noun/noun_gen.cgi",
        "https://sanskrit.inria.fr/cgi-bin/scl/skt_gen/noun/noun_gen.cgi",
    ]

    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
        for url in candidate_urls:
            try:
                response = await client.get(url, params=params)
            except httpx.HTTPError:
                continue

            if response.status_code != 200:
                continue

            try:
                payload = response.json()
                if isinstance(payload, list):
                    return payload
            except ValueError:
                pass

            lines = [line.strip() for line in response.text.splitlines() if line.strip()]
            if len(lines) >= 24:
                items: List[dict] = []
                idx = 0
                for case_name in NOUN_CASE_ORDER:
                    for number_name in NOUN_NUMBER_ORDER:
                        form = lines[idx] if idx < len(lines) else ""
                        items.append(
                            {
                                "form": form,
                                "vib": case_name,
                                "vac": number_name,
                            }
                        )
                        idx += 1
                return items

    raise HTTPException(status_code=502, detail="Noun table service unavailable")


def _build_verb_lakaras(payload: dict) -> List[dict]:
    lakaras: List[dict] = []

    for index in range(10):
        forms_key = f"l_forms_{index}"
        label_key = f"lakAra_{index}"

        forms = payload.get(forms_key)
        if not isinstance(forms, list):
            continue

        grid = {
            person: {number: "" for number in VERB_NUMBER_ORDER}
            for person in VERB_PERSON_ORDER
        }

        for cell in forms:
            if not isinstance(cell, dict):
                continue
            person = str(cell.get("person", "")).strip()
            number = str(cell.get("number", "")).strip()
            form = str(cell.get("form", "")).strip()

            if person in grid and number in grid[person]:
                grid[person][number] = form

        rows = [
            {
                "person": person,
                "singular": grid[person]["एकवचनम्"],
                "dual": grid[person]["द्विवचनम्"],
                "plural": grid[person]["बहुवचनम्"],
            }
            for person in VERB_PERSON_ORDER
        ]

        lakaras.append(
            {
                "id": f"lakAra_{index}",
                "label": payload.get(label_key, VERB_LAKARA_LABELS[index]),
                "rows": rows,
            }
        )

    return lakaras


def _parse_line_verb_response(raw_text: str) -> dict:
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    payload: dict = {}

    if len(lines) < 30:
        return payload

    line_index = 0
    for lakara_index, label in enumerate(VERB_LAKARA_LABELS):
        payload[f"lakAra_{lakara_index}"] = label
        forms = []
        for person in VERB_PERSON_ORDER:
            row = lines[line_index].split()
            line_index += 1
            while len(row) < 3:
                row.append("-")
            for number_index, number in enumerate(VERB_NUMBER_ORDER):
                forms.append(
                    {
                        "form": row[number_index],
                        "person": person,
                        "number": number,
                    }
                )
        payload[f"l_forms_{lakara_index}"] = forms

    return payload


def _fallback_payload_from_static(vb: str) -> dict:
    dhatu_key = VB_TO_DHATU_KEY.get(vb)
    if not dhatu_key or dhatu_key not in DHATU_TABLES:
        return {}

    data = DHATU_TABLES[dhatu_key]
    person_map = {"3rd": "प्रथमपुरुषः", "2nd": "मध्यमपुरुषः", "1st": "उत्तमपुरुषः"}

    def make_lakara(forms_by_person: dict) -> List[dict]:
        rows: List[dict] = []
        for person_key in ["3rd", "2nd", "1st"]:
            rows.append(
                {
                    "form": forms_by_person.get(person_key, ""),
                    "person": person_map[person_key],
                    "number": "एकवचनम्",
                }
            )
            rows.append({"form": "-", "person": person_map[person_key], "number": "द्विवचनम्"})
            rows.append({"form": "-", "person": person_map[person_key], "number": "बहुवचनम्"})
        return rows

    payload = {
        "lakAra_0": "लट् (वर्तमान)",
        "l_forms_0": make_lakara(data.get("present", {})),
        "lakAra_1": "लिट् (परोक्ष)",
        "l_forms_1": make_lakara(data.get("perfect", {})),
        "lakAra_3": "लृट् (अद्यतन भविष्यत्)",
        "l_forms_3": make_lakara(data.get("future", {})),
    }
    return payload


async def fetch_verb_table(
    vb: str,
    prayoga_paxI: str,
    upasarga: str,
    encoding: str,
    outencoding: str,
) -> dict:
    params = {
        "vb": vb,
        "prayoga_paxI": prayoga_paxI,
        "upasarga": upasarga,
        "encoding": encoding,
        "outencoding": outencoding,
        "mode": "json",
    }

    candidate_urls = [
        "https://sanskrit.uohyd.ac.in/cgi-bin/scl/skt_gen/verb/verb_gen.cgi",
        "http://sanskrit.uohyd.ac.in/cgi-bin/scl/skt_gen/verb/verb_gen.cgi",
        "https://sanskrit.inria.fr/cgi-bin/scl/skt_gen/verb/verb_gen.cgi",
    ]

    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
        for url in candidate_urls:
            try:
                response = await client.get(url, params=params)
            except httpx.HTTPError:
                continue

            if response.status_code != 200:
                continue

            try:
                payload = response.json()
            except ValueError:
                payload = {}

            if not isinstance(payload, dict):
                payload = {}

            if not payload:
                text = response.text.strip()
                if text.startswith("{"):
                    try:
                        payload = json.loads(text)
                    except ValueError:
                        payload = {}

            if not payload:
                payload = _parse_line_verb_response(response.text)

            if payload:
                return payload

    fallback = _fallback_payload_from_static(vb)
    if fallback:
        return fallback

    raise HTTPException(status_code=502, detail="Verb table service unavailable")


async def fetch_sandhi_join(word1: str, word2: str, encoding: str, outencoding: str) -> List[dict]:
    params = {
        "word1": word1,
        "word2": word2,
        "encoding": encoding,
        "outencoding": outencoding,
    }

    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
        for url in SANDHI_JOIN_URLS:
            try:
                response = await client.get(url, params=params)
            except httpx.HTTPError:
                continue

            if response.status_code != 200:
                continue

            try:
                payload = response.json()
            except ValueError:
                payload = []

            if isinstance(payload, list):
                return payload

            if isinstance(payload, dict) and payload:
                return [payload]

    raise HTTPException(status_code=502, detail="Sandhi join service unavailable")


def _normalize_sandhi_split_outencoding(outencoding: str) -> str:
    mode = (outencoding or "").strip().lower()
    if mode in {"unicode", "deva", "d"}:
        return "D"
    if mode in {"iast", "roman", "r"}:
        return "I"
    return outencoding or "D"


async def fetch_sandhi_split(word: str, encoding: str, outencoding: str, mode: str) -> dict:
    params = {
        "word": word,
        "encoding": encoding,
        "outencoding": _normalize_sandhi_split_outencoding(outencoding),
        "mode": mode,
        "disp_mode": "json",
    }

    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
        for url in SANDHI_SPLITTER_URLS:
            try:
                response = await client.get(url, params=params)
            except httpx.HTTPError:
                continue

            if response.status_code != 200:
                continue

            try:
                payload = response.json()
            except ValueError:
                payload = {}

            if isinstance(payload, dict) and payload:
                return payload

    raise HTTPException(status_code=502, detail="Sandhi splitter service unavailable")


def evaluate_grammar(parsed_data: dict) -> list:
    errors = []
    detected_subject = None
    detected_verb_info = None
    verb_word = None

    for word, analyses in parsed_data.items():
        if word in SUBJECT_RULES:
            detected_subject = word

        if isinstance(analyses, list):
            for analysis in analyses:
                if isinstance(analysis, dict) and analysis.get('APP') == 'verb':
                    verb_word = word
                    ans_str = analysis.get('ANS', '')
                    detected_verb_info = parse_ans_string(ans_str)
                    break

    if detected_subject and detected_verb_info:
        expected = SUBJECT_RULES[detected_subject]
        actual_person = detected_verb_info.get('पुरुषः')
        actual_number = detected_verb_info.get('वचनम्')

        if actual_person != expected['person'] or actual_number != expected['number']:
            person_map = {'उ': '1st Person', 'म': '2nd Person', 'प्र': '3rd Person'}
            number_map = {'एक': 'Singular', 'द्वि': 'Dual', 'बहु': 'Plural'}

            act_p_str = person_map.get(actual_person, str(actual_person))
            act_n_str = number_map.get(actual_number, str(actual_number))

            explanation = (
                f"The subject '{detected_subject}' requires a verb in the {expected['label']}. "
                f"The verb '{verb_word}' is currently formatted as {act_p_str} {act_n_str}."
            )

            errors.append(ErrorDetail(
                original_text=verb_word,
                error_type="Syntax Error (Subject-Verb Agreement)",
                correction=f"Requires {expected['person']} person, {expected['number']} number",
                explanation=explanation,
                rule_id="verb_agreement"
            ))

    return errors

@app.get("/")
def health_check() -> dict:
    return {"status": "Sanskrit API is running"}


@app.post("/api/v1/analyze")
async def analyze_text(request: AnalyzeRequest):
    # Fetch the JSON data for all words in the sentence
    parsed_data = await call_scl_api(request.text)
    
    # Print the raw JSON dictionary to the terminal to see the exact SCL tags
    print("\n--- RAW JSON FROM SCL ---")
    print(parsed_data)
    print("-------------------------\n")
    
    # Safe fallback if API fails completely
    if not parsed_data or all("error" in v for v in parsed_data.values()):
        error = ErrorDetail(
            original_text="API Error", 
            error_type="Connection", 
            correction="", 
            explanation="Could not fetch data from Samsaadhanii API.",
            rule_id="api_connection_error"
        )
        return AnalyzeResponse(errors=[error])

    # evaluate_grammar will be updated next once we see the JSON structure
    errors = evaluate_grammar(parsed_data)
    
    return AnalyzeResponse(errors=errors)


@app.post("/api/v1/translate")
async def translate_text(request: TranslateRequest) -> dict:
    text = (request.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    result = get_translation_pipeline().translate(
        text=text,
        source_lang=request.source_lang,
        target_lang=request.target_lang,
        include_secondary=request.include_secondary,
    )

    if "error" in result:
        raise HTTPException(status_code=502, detail=result)

    return result

@app.get("/api/v1/dictionary/{word}")
async def get_dictionary_entry(
    word: str,
    direction: str = Query(default="CENTER", pattern="^(CENTER|UP|DOWN)$"),
    nprev: int = Query(default=12, ge=0, le=100),
    nnext: int = Query(default=12, ge=0, le=100),
    transLit: str = Query(default="slp1"),
    filter: str = Query(default="deva"),
    accent: str = Query(default="no"),
) -> dict:
    monier_entry = fetch_dictionary_entry_from_monier_local(
        word,
        nprev=nprev,
        nnext=nnext,
        direction=direction,
        output_filter=filter,
    )
    if monier_entry:
        monier_entry["transLit"] = transLit
        monier_entry["accent"] = accent
        return monier_entry

    try:
        return await fetch_dictionary_entry_from_word_api(word)
    except HTTPException as upstream_error:
        key = _normalize_local_dictionary_key(word)
        if not key:
            raise HTTPException(
                status_code=503,
                detail=f"Upstream dictionary unavailable; no local fallback found. {upstream_error.detail}",
            )

        entry = DICTIONARY_DATA[key]
        return {
            "source": "local-fallback",
            "word": entry["word"],
            "pos": entry["pos"],
            "meaning": entry["meaning"],
            "excerpt": f"{entry['word']} — {entry['meaning']}",
            "nearby_words": [],
        }


@app.get("/api/v1/grammar/{query}")
def get_grammar_rule(query: str) -> dict:
    normalized_query = query.strip().lower()

    for rule in GRAMMAR_RULES.values():
        if (
            normalized_query == rule["id"].lower()
            or normalized_query in rule["title"].lower()
        ):
            return rule

    raise HTTPException(status_code=404, detail="Grammar rule not found")


@app.get("/api/v1/sandhi/join")
async def get_sandhi_join(
    word1: str = Query(..., min_length=1),
    word2: str = Query(..., min_length=1),
    encoding: str = Query(default="WX"),
    outencoding: str = Query(default="Unicode"),
) -> dict:
    results = await fetch_sandhi_join(word1, word2, encoding, outencoding)
    return {
        "input": {
            "word1": word1,
            "word2": word2,
            "encoding": encoding,
            "outencoding": outencoding,
        },
        "results": results,
    }


@app.get("/api/v1/sandhi/split")
async def get_sandhi_split(
    word: str = Query(..., min_length=1),
    encoding: str = Query(default="WX"),
    outencoding: str = Query(default="Unicode"),
    mode: str = Query(default="word", pattern="^(word|sent)$"),
) -> dict:
    payload = await fetch_sandhi_split(word, encoding, outencoding, mode)
    return {
        "input": {
            "word": word,
            "encoding": encoding,
            "outencoding": outencoding,
            "mode": mode,
        },
        **payload,
    }


@app.get("/api/v1/tables/dhatu/{root}")
def get_dhatu_table(root: str) -> dict:
    key = root.strip().lower()
    if key not in DHATU_TABLES:
        raise HTTPException(status_code=404, detail="Dhatu table not found")

    return DHATU_TABLES[key]


@app.get("/api/v1/tables/verb")
async def get_verb_table(
    vb: str = "gam1_gamLz_BvAxiH_gawO",
    prayoga_paxI: str = "karwari-parasmEpaxI",
    upasarga: str = "-",
    encoding: str = "WX",
    outencoding: str = "Unicode",
) -> dict:
    payload = await fetch_verb_table(vb, prayoga_paxI, upasarga, encoding, outencoding)
    lakaras = _build_verb_lakaras(payload)

    return {
        "input": {
            "vb": vb,
            "prayoga_paxI": prayoga_paxI,
            "upasarga": upasarga,
            "encoding": encoding,
            "outencoding": outencoding,
        },
        "lakaras": lakaras,
    }


@app.get("/api/v1/tables/verb/raw")
async def get_raw_verb_table(
    vb: str = "gam1_gamLz_BvAxiH_gawO",
    prayoga_paxI: str = "karwari-parasmEpaxI",
    upasarga: str = "-",
    encoding: str = "WX",
    outencoding: str = "Unicode",
) -> dict:
    payload = await fetch_verb_table(vb, prayoga_paxI, upasarga, encoding, outencoding)
    return {
        "input": {
            "vb": vb,
            "prayoga_paxI": prayoga_paxI,
            "upasarga": upasarga,
            "encoding": encoding,
            "outencoding": outencoding,
        },
        "payload": payload,
    }


@app.get("/api/v1/tables/noun")
async def get_noun_table(
    rt: str,
    gen: str = "puM",
    jAwi: str = "nA",
    level: int = 1,
    encoding: str = "Unicode",
    outencoding: str = "Unicode",
) -> dict:
    items = await fetch_noun_table(rt, gen, jAwi, level, encoding, outencoding)
    rows = _build_noun_rows(items)

    return {
        "input": {
            "rt": rt,
            "gen": gen,
            "jAwi": jAwi,
            "level": level,
            "encoding": encoding,
            "outencoding": outencoding,
        },
        "items": items,
        "rows": rows,
    }


if __name__ == "__main__":
    import os

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)

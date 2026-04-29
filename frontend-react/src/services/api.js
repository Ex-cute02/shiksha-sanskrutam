export const BASE_URL = "http://localhost:8000/api/v1";

async function parseResponse(response) {
  const contentType = response.headers.get("content-type");
  
  if (!response.ok) {
    let errorMessage = "Unknown error";
    if (contentType && contentType.includes("application/json")) {
      const error = await response.json();
      errorMessage = error.detail || error.message || errorMessage;
    } else {
      const text = await response.text();
      errorMessage = text || `HTTP ${response.status}`;
    }
    throw new Error(errorMessage);
  }

  if (contentType && contentType.includes("application/json")) {
    return await response.json();
  }

  return await response.text();
}

async function requestJson(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  return parseResponse(response);
}

export async function analyzeText(text) {
  try {
    return await requestJson("/analyze", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  } catch (error) {
    throw new Error(`Failed to analyze text: ${error.message}`);
  }
}

export async function translateText(params) {
  try {
    return await requestJson("/translate", {
      method: "POST",
      body: JSON.stringify({
        text: params?.text ?? "",
        source_lang: params?.sourceLang ?? "sa",
        target_lang: params?.targetLang ?? "en",
        include_secondary: params?.includeSecondary ?? true,
      }),
    });
  } catch (error) {
    throw new Error(`Failed to translate text: ${error.message}`);
  }
}

export async function getDictionary(word, params = {}) {
  const query = new URLSearchParams({
    direction: params.direction ?? "CENTER",
    nprev: String(params.nprev ?? 12),
    nnext: String(params.nnext ?? 12),
    transLit: params.transLit ?? "deva",
    filter: params.filter ?? "deva",
    accent: params.accent ?? "no",
  });

  try {
    return await requestJson(`/dictionary/${encodeURIComponent(word)}?${query.toString()}`);
  } catch (error) {
    throw new Error(`Failed to fetch dictionary: ${error.message}`);
  }
}

export async function getGrammarRule(query) {
  try {
    return await requestJson(`/grammar/${encodeURIComponent(query)}`);
  } catch (error) {
    throw new Error(`Failed to fetch grammar rule: ${error.message}`);
  }
}

export async function getSandhiJoin(params) {
  const query = new URLSearchParams({
    word1: params?.word1 ?? "",
    word2: params?.word2 ?? "",
    encoding: params?.encoding ?? "WX",
    outencoding: params?.outencoding ?? "Unicode",
  });

  try {
    return await requestJson(`/sandhi/join?${query.toString()}`);
  } catch (error) {
    throw new Error(`Failed to join sandhi: ${error.message}`);
  }
}

export async function getSandhiSplit(params) {
  const query = new URLSearchParams({
    word: params?.word ?? "",
    encoding: params?.encoding ?? "WX",
    outencoding: params?.outencoding ?? "Unicode",
    mode: params?.mode ?? "word",
  });

  try {
    return await requestJson(`/sandhi/split?${query.toString()}`);
  } catch (error) {
    throw new Error(`Failed to split sandhi: ${error.message}`);
  }
}

export async function getDhatu(root) {
  try {
    return await requestJson(`/tables/dhatu/${encodeURIComponent(root)}`);
  } catch (error) {
    throw new Error(`Failed to fetch dhatu table: ${error.message}`);
  }
}

export async function getNounTable(params) {
  const query = new URLSearchParams({
    rt: params?.rt ?? "राम",
    gen: params?.gen ?? "puM",
    jAwi: params?.jAwi ?? "nA",
    level: String(params?.level ?? 1),
    encoding: params?.encoding ?? "Unicode",
    outencoding: params?.outencoding ?? "Unicode",
  });

  try {
    return await requestJson(`/tables/noun?${query.toString()}`);
  } catch (error) {
    throw new Error(`Failed to fetch noun table: ${error.message}`);
  }
}

export async function getVerbTable(params) {
  const query = new URLSearchParams({
    vb: params?.vb ?? "gam1_gamLz_BvAxiH_gawO",
    prayoga_paxI: params?.prayoga_paxI ?? "karwari-parasmEpaxI",
    upasarga: params?.upasarga ?? "-",
    encoding: params?.encoding ?? "WX",
    outencoding: params?.outencoding ?? "Unicode",
  });

  try {
    return await requestJson(`/tables/verb?${query.toString()}`);
  } catch (error) {
    throw new Error(`Failed to fetch verb table: ${error.message}`);
  }
}

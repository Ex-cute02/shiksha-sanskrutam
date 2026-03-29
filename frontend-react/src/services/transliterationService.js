const AKSHARAMUKHA_API_URL =
  "https://aksharamukha-plugin.appspot.com/api/public";

export async function transliterateToDevanagari(text) {
  if (!text || !/[a-zA-Z]/.test(text)) {
    return text;
  }

  const url = `${AKSHARAMUKHA_API_URL}?target=Devanagari&source=HK&text=${encodeURIComponent(text)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Aksharamukha request failed: ${response.status}`);
    }

    const convertedText = await response.text();
    return convertedText || text;
  } catch {
    return text;
  }
}

export function debounce(callback, delay = 300) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(...args), delay);
  };
}

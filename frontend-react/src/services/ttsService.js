export function playPronunciation(text) {
  if (!text || !("speechSynthesis" in window)) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "hi-IN";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function analyzeSmartEditorText(text) {
  const issueWord = "गच्छति";
  const hasGrammarIssue = text.includes(issueWord);

  return {
    hasGrammarIssue,
    issueWord,
    suggestion: "गच्छामि",
    reason:
      "The subject is 'अहम्' (First Person Singular), so the verb must also be First Person Singular (गच्छामि, not गच्छति).",
  };
}

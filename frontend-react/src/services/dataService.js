export const grammarRules = [
  {
    id: "sandhi",
    title: "सन्धि (Compound Joining)",
    summary:
      "When two words come together, their sounds sometimes change to make pronunciation easier...",
    examples: ["देव + इन्द्र → देवेन्द्र", "सा + अपि → सापि"],
  },
  {
    id: "vibhakti",
    title: "विभक्तिः (Case Forms)",
    summary:
      "Sanskrit uses vibhakti endings to show roles like subject, object, etc...",
    examples: [],
  },
];

export const dictionary = [
  { word: "रामः", pos: "पुंल्लिङ्गः", meaning: "Rama, a male proper name" },
  { word: "फलम्", pos: "नपुंसकलिङ्गः", meaning: "fruit" },
];

export const vibhaktiData = {
  ram: {
    singular: ["रामः", "रामम्", "रामेण", "रामाय", "रामात्", "रामस्य", "रामे"],
    dual: ["रामौ", "रामौ", "रामाभ्याम्", "रामाभ्याम्", "रामाभ्याम्", "रामयोः", "रामयोः"],
    plural: ["रामाः", "रामान्", "रामैः", "रामेभ्यः", "रामेभ्यः", "रामाणाम्", "रामेषु"],
  },
  sita: {
    singular: ["सीता", "सीताम्", "सीतया", "सीतायै", "सीतायाः", "सीतायाः", "सीतायाम्"],
    dual: ["सीते", "सीते", "सीताभ्याम्", "सीताभ्याम्", "सीताभ्याम्", "सीतयोः", "सीतयोः"],
    plural: ["सीताः", "सीताः", "सीताभिः", "सीताभ्यः", "सीताभ्यः", "सीतानाम्", "सीतासु"],
  },
  phalam: {
    singular: ["फलम्", "फलम्", "फलेन", "फलाय", "फलात्", "फलस्य", "फले"],
    dual: ["फले", "फले", "फलाभ्याम्", "फलाभ्याम्", "फलाभ्याम्", "फलयोः", "फलयोः"],
    plural: ["फलानि", "फलानि", "फलैः", "फलेभ्यः", "फलेभ्यः", "फलानाम्", "फलेषु"],
  },
};

export const dhatuData = {
  bhu: {
    persons: ["1st", "2nd", "3rd"],
    present: { "1st": "भवामि", "2nd": "भवसि", "3rd": "भवति" },
    perfect: { "1st": "बभूव", "2nd": "बभूव", "3rd": "बभूव" },
    future: { "1st": "भविष्यामि", "2nd": "भविष्यसि", "3rd": "भविष्यति" },
  },
  kri: {
    persons: ["1st", "2nd", "3rd"],
    present: { "1st": "करोमि", "2nd": "करोषि", "3rd": "करोति" },
    perfect: { "1st": "चकार", "2nd": "चकार", "3rd": "चकार" },
    future: { "1st": "करिष्यामि", "2nd": "करिष्यसि", "3rd": "करिष्यति" },
  },
  gam: {
    persons: ["1st", "2nd", "3rd"],
    present: { "1st": "गच्छामि", "2nd": "गच्छसि", "3rd": "गच्छति" },
    perfect: { "1st": "जगाम", "2nd": "जगाम", "3rd": "जगाम" },
    future: { "1st": "गमिष्यामि", "2nd": "गमिष्यसि", "3rd": "गमिष्यति" },
  },
};

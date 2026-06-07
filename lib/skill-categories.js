const SKILL_CATEGORIES = {
  languages: "Languages",
  embedded: "Embedded",
  tools: "Tools",
  domains: "Domains",
};

const SKILL_CATEGORY_KEYS = Object.keys(SKILL_CATEGORIES);

function isValidCategory(category) {
  return SKILL_CATEGORY_KEYS.includes(category);
}

function normalizeCategory(category) {
  return isValidCategory(category) ? category : "tools";
}

module.exports = { SKILL_CATEGORIES, SKILL_CATEGORY_KEYS, isValidCategory, normalizeCategory };

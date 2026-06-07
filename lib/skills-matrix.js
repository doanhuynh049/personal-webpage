const { SKILL_CATEGORIES, SKILL_CATEGORY_KEYS } = require("./skill-categories");

function groupSkillsByCategory(skills) {
  const grouped = {};
  for (const key of SKILL_CATEGORY_KEYS) grouped[key] = [];
  for (const skill of skills || []) {
    const cat = SKILL_CATEGORY_KEYS.includes(skill.category) ? skill.category : "tools";
    grouped[cat].push(skill);
  }
  for (const key of SKILL_CATEGORY_KEYS) {
    grouped[key].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name));
  }
  return grouped;
}

function findSkillsExperience(experiences) {
  return experiences.find((e) => e.is_skills);
}

module.exports = { groupSkillsByCategory, findSkillsExperience, SKILL_CATEGORIES, SKILL_CATEGORY_KEYS };

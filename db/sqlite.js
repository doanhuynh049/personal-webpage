const { DatabaseSync } = require("node:sqlite");
const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

let db;

function getDb() {
  if (!db) {
    db = new DatabaseSync(path.join(dataDir, "site.db"));
    db.exec("PRAGMA journal_mode = WAL");
    db.exec("PRAGMA foreign_keys = ON");
  }
  return db;
}

function getSql() {
  return sqlTag;
}

async function sqlTag(strings, ...values) {
  let text = strings[0];
  for (let i = 0; i < values.length; i++) {
    text += "?" + strings[i + 1];
  }

  const conn = getDb();
  const upper = text.trim().toUpperCase();

  if (upper.startsWith("SELECT")) {
    const stmt = conn.prepare(text);
    const rows = stmt.all(...values);
    if (upper.includes("WHERE ID = 1") && !upper.includes("ORDER BY")) {
      return rows.length ? [rows[0]] : [];
    }
    return rows;
  }

  if (upper.startsWith("INSERT") && upper.includes("RETURNING")) {
    const insertSql = text.replace(/\s+RETURNING\s+\w+\s*$/i, "");
    const info = conn.prepare(insertSql).run(...values);
    return [{ id: Number(info.lastInsertRowid) }];
  }

  conn.prepare(text).run(...values);
  return [];
}

async function initDb() {
  const conn = getDb();
  conn.exec(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT NOT NULL DEFAULT 'Your Name',
      greeting TEXT DEFAULT 'Hello, I''m',
      tagline TEXT DEFAULT '',
      intro TEXT DEFAULT '',
      profile_image TEXT DEFAULT '/images/profile.svg'
    );
    CREATE TABLE IF NOT EXISTS about (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      heading TEXT DEFAULT 'A little about who I am',
      bio TEXT DEFAULT '',
      location TEXT DEFAULT '',
      focus TEXT DEFAULT '',
      currently TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS sections (
      section_key TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      heading TEXT NOT NULL,
      description TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS education (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period TEXT NOT NULL,
      title TEXT NOT NULL,
      institution TEXT NOT NULL,
      description TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period TEXT NOT NULL,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      description TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS experiences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      is_skills INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      experience_id INTEGER NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'tools',
      sort_order INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS roadmap (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed')),
      sort_order INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_path TEXT NOT NULL,
      caption TEXT DEFAULT '',
      alt_text TEXT DEFAULT '',
      layout TEXT DEFAULT 'normal' CHECK (layout IN ('normal', 'wide', 'tall')),
      sort_order INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      value TEXT NOT NULL,
      url TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    );
  `);

  migrateSchema(conn);

  const existing = conn.prepare("SELECT id FROM profile WHERE id = 1").get();
  if (!existing) await seedDb();
}

function migrateSchema(conn) {
  const skillCols = conn.prepare("PRAGMA table_info(skills)").all().map((c) => c.name);
  if (skillCols.length && !skillCols.includes("category")) {
    conn.exec("ALTER TABLE skills ADD COLUMN category TEXT NOT NULL DEFAULT 'tools'");
  }
  if (skillCols.length && !skillCols.includes("sort_order")) {
    conn.exec("ALTER TABLE skills ADD COLUMN sort_order INTEGER DEFAULT 0");
  }

  conn.exec(`
    CREATE TABLE IF NOT EXISTS roadmap (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed')),
      sort_order INTEGER DEFAULT 0
    )
  `);

  const roadmapSection = conn.prepare("SELECT section_key FROM sections WHERE section_key = 'roadmap'").get();
  if (!roadmapSection) {
    conn.prepare(
      "INSERT INTO sections (section_key, label, heading, description) VALUES (?, ?, ?, ?)"
    ).run(
      "roadmap",
      "Career Roadmap",
      "Where I'm headed",
      "My career targets and learning path — goals I'm working toward in embedded systems and software engineering."
    );
  }
}

async function seedDb() {
  const conn = getDb();

  conn.prepare(`
    INSERT INTO profile (id, name, greeting, tagline, intro, profile_image) VALUES (
      1, 'Your Name', 'Hello, I''m',
      'Student · Professional · Photographer',
      'Welcome to my personal page. Here you''ll find my academic background, professional journey, and a collection of moments I''ve captured through my lens.',
      '/images/profile.svg'
    )
  `).run();
  conn.prepare(`
    INSERT INTO about (id, heading, bio, location, focus, currently) VALUES (
      1, 'A little about who I am',
      'Replace this with a short bio about yourself — your interests, what drives you, and what you''re currently focused on.',
      'City, Country', 'Your main field or passion', 'What you''re doing right now'
    )
  `).run();

  const insertSection = conn.prepare("INSERT INTO sections (section_key, label, heading, description) VALUES (?, ?, ?, ?)");
  [
    ["about", "About Me", "A little about who I am", ""],
    ["study", "Education", "Where I've studied", ""],
    ["work", "Career", "Where I've worked", ""],
    ["roadmap", "Career Roadmap", "Where I'm headed", "My career targets and learning path — goals I'm working toward."],
    ["experience", "Experience", "Projects & milestones", ""],
    ["gallery", "Photography", "Moments I've captured", "A selection of photos I've taken — landscapes, portraits, street scenes, and more."],
    ["contact", "Contact", "Let's connect", "Feel free to reach out for collaborations, questions, or just to say hello."],
  ].forEach((s) => insertSection.run(...s));

  const insertEdu = conn.prepare("INSERT INTO education (period, title, institution, description, sort_order) VALUES (?, ?, ?, ?, ?)");
  insertEdu.run("2022 — Present", "Degree or Program Name", "University or School Name", "Brief description of your studies.", 0);
  insertEdu.run("2018 — 2022", "Previous Degree or Program", "Institution Name", "Add details about earlier education.", 1);

  const insertJob = conn.prepare("INSERT INTO jobs (period, title, company, description, sort_order) VALUES (?, ?, ?, ?, ?)");
  insertJob.run("2023 — Present", "Job Title", "Company Name", "Describe your role and contributions.", 0);
  insertJob.run("2021 — 2023", "Previous Job Title", "Previous Company", "Share what you learned.", 1);

  const insertExp = conn.prepare("INSERT INTO experiences (title, description, is_skills, sort_order) VALUES (?, ?, ?, ?)");
  insertExp.run("Project or Achievement Name", "Describe a significant project or milestone.", 0, 0);
  insertExp.run("Another Highlight", "Add competitions, publications, or other experiences.", 0, 1);
  const exp3 = insertExp.run("Skills Matrix", "", 1, 2);

  const insertSkill = conn.prepare("INSERT INTO skills (experience_id, name, category, sort_order) VALUES (?, ?, ?, ?)");
  [
    ["C++", "languages", 0],
    ["Java", "languages", 1],
    ["Skill 3", "tools", 2],
    ["Photography", "domains", 3],
    ["Your hobby", "domains", 4],
  ].forEach(([name, category, sort_order], i) => {
    insertSkill.run(Number(exp3.lastInsertRowid), name, category, sort_order ?? i);
  });

  const insertGallery = conn.prepare("INSERT INTO gallery (image_path, caption, alt_text, layout, sort_order) VALUES (?, ?, ?, ?, ?)");
  [
    ["/images/photos/photo-01.svg", "Photo title or location", "Photo description 1", "wide", 0],
    ["/images/photos/photo-02.svg", "Photo title or location", "Photo description 2", "normal", 1],
    ["/images/photos/photo-03.svg", "Photo title or location", "Photo description 3", "normal", 2],
    ["/images/photos/photo-04.svg", "Photo title or location", "Photo description 4", "normal", 3],
    ["/images/photos/photo-05.svg", "Photo title or location", "Photo description 5", "tall", 4],
    ["/images/photos/photo-06.svg", "Photo title or location", "Photo description 6", "normal", 5],
  ].forEach((g) => insertGallery.run(...g));

  const insertContact = conn.prepare("INSERT INTO contacts (label, value, url, sort_order) VALUES (?, ?, ?, ?)");
  insertContact.run("Email", "your.email@example.com", "mailto:your.email@example.com", 0);
  insertContact.run("LinkedIn", "linkedin.com/in/yourprofile", "https://linkedin.com/in/yourprofile", 1);
  insertContact.run("GitHub", "github.com/yourusername", "https://github.com/yourusername", 2);
}

async function getPublicContent() {
  const conn = getDb();
  const profile = conn.prepare("SELECT * FROM profile WHERE id = 1").get();
  const about = conn.prepare("SELECT * FROM about WHERE id = 1").get();
  const sections = conn.prepare("SELECT * FROM sections").all();
  const education = conn.prepare("SELECT * FROM education ORDER BY sort_order, id").all();
  const jobs = conn.prepare("SELECT * FROM jobs ORDER BY sort_order, id").all();
  const experiences = conn.prepare("SELECT * FROM experiences ORDER BY sort_order, id").all();
  const skills = conn.prepare("SELECT * FROM skills ORDER BY category, sort_order, id").all();
  const gallery = conn.prepare("SELECT * FROM gallery ORDER BY sort_order, id").all();
  const contacts = conn.prepare("SELECT * FROM contacts ORDER BY sort_order, id").all();
  const roadmap = conn.prepare("SELECT * FROM roadmap ORDER BY sort_order, id").all();

  const skillsByExp = {};
  skills.forEach((s) => {
    if (!skillsByExp[s.experience_id]) skillsByExp[s.experience_id] = [];
    skillsByExp[s.experience_id].push(s);
  });

  const sectionsMap = {};
  sections.forEach((s) => {
    sectionsMap[s.section_key] = {
      key: s.section_key,
      label: s.label,
      heading: s.heading,
      description: s.description,
    };
  });

  return {
    profile,
    about,
    sections: sectionsMap,
    education,
    jobs,
    experiences: experiences.map((e) => ({
      ...e,
      is_skills: e.is_skills ? 1 : 0,
      skills: skillsByExp[e.id] || [],
    })),
    gallery,
    contacts,
    roadmap,
    site: require("../config/site").getSiteConfig(),
  };
}

module.exports = { getSql, initDb, getPublicContent };

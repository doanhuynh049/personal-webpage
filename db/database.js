const { DatabaseSync } = require("node:sqlite");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, "site.db"));
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

function initDb(adminPassword) {
  db.exec(`
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
      key TEXT PRIMARY KEY,
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
      name TEXT NOT NULL
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

    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      password_hash TEXT NOT NULL
    );
  `);

  const hasProfile = db.prepare("SELECT id FROM profile WHERE id = 1").get();
  if (!hasProfile) seedDb(adminPassword);
}

function seedDb(adminPassword) {
  const hash = bcrypt.hashSync(adminPassword, 10);

  db.prepare("INSERT INTO admin (id, password_hash) VALUES (1, ?)").run(hash);

  db.prepare(`
    INSERT INTO profile (id, name, greeting, tagline, intro, profile_image) VALUES (
      1, 'Your Name', 'Hello, I''m',
      'Student · Professional · Photographer',
      'Welcome to my personal page. Here you''ll find my academic background, professional journey, and a collection of moments I''ve captured through my lens.',
      '/images/profile.svg'
    )
  `).run();

  db.prepare(`
    INSERT INTO about (id, heading, bio, location, focus, currently) VALUES (
      1, 'A little about who I am',
      'Replace this with a short bio about yourself — your interests, what drives you, and what you''re currently focused on.',
      'City, Country', 'Your main field or passion', 'What you''re doing right now'
    )
  `).run();

  const sections = [
    ["about", "About Me", "A little about who I am", ""],
    ["study", "Education", "Where I've studied", ""],
    ["work", "Career", "Where I've worked", ""],
    ["experience", "Experience", "Projects & milestones", ""],
    ["gallery", "Photography", "Moments I've captured", "A selection of photos I've taken — landscapes, portraits, street scenes, and more."],
    ["contact", "Contact", "Let's connect", "Feel free to reach out for collaborations, questions, or just to say hello."],
  ];
  const insertSection = db.prepare("INSERT INTO sections (key, label, heading, description) VALUES (?, ?, ?, ?)");
  sections.forEach((s) => insertSection.run(...s));

  const insertEdu = db.prepare("INSERT INTO education (period, title, institution, description, sort_order) VALUES (?, ?, ?, ?, ?)");
  insertEdu.run("2022 — Present", "Degree or Program Name", "University or School Name", "Brief description of your studies — major, focus areas, achievements, or notable projects during this period.", 0);
  insertEdu.run("2018 — 2022", "Previous Degree or Program", "Institution Name", "Add details about earlier education, certifications, or self-directed learning.", 1);

  const insertJob = db.prepare("INSERT INTO jobs (period, title, company, description, sort_order) VALUES (?, ?, ?, ?, ?)");
  insertJob.run("2023 — Present", "Job Title", "Company Name", "Describe your role, responsibilities, and key contributions.", 0);
  insertJob.run("2021 — 2023", "Previous Job Title", "Previous Company", "Share what you learned and accomplished in this position.", 1);

  const insertExp = db.prepare("INSERT INTO experiences (title, description, is_skills, sort_order) VALUES (?, ?, ?, ?)");
  insertExp.run("Project or Achievement Name", "Describe a significant project, internship, volunteer work, or personal milestone.", 0, 0);
  insertExp.run("Another Highlight", "Add competitions, publications, open-source contributions, or other experiences worth sharing.", 0, 1);
  const exp3 = insertExp.run("Skills & Interests", "", 1, 2);

  const insertSkill = db.prepare("INSERT INTO skills (experience_id, name) VALUES (?, ?)");
  ["Skill 1", "Skill 2", "Skill 3", "Photography", "Your hobby"].forEach((name) => {
    insertSkill.run(Number(exp3.lastInsertRowid), name);
  });

  const gallery = [
    ["/images/photos/photo-01.svg", "Photo title or location", "Photo description 1", "wide", 0],
    ["/images/photos/photo-02.svg", "Photo title or location", "Photo description 2", "normal", 1],
    ["/images/photos/photo-03.svg", "Photo title or location", "Photo description 3", "normal", 2],
    ["/images/photos/photo-04.svg", "Photo title or location", "Photo description 4", "normal", 3],
    ["/images/photos/photo-05.svg", "Photo title or location", "Photo description 5", "tall", 4],
    ["/images/photos/photo-06.svg", "Photo title or location", "Photo description 6", "normal", 5],
  ];
  const insertGallery = db.prepare("INSERT INTO gallery (image_path, caption, alt_text, layout, sort_order) VALUES (?, ?, ?, ?, ?)");
  gallery.forEach((g) => insertGallery.run(...g));

  const insertContact = db.prepare("INSERT INTO contacts (label, value, url, sort_order) VALUES (?, ?, ?, ?)");
  insertContact.run("Email", "your.email@example.com", "mailto:your.email@example.com", 0);
  insertContact.run("LinkedIn", "linkedin.com/in/yourprofile", "https://linkedin.com/in/yourprofile", 1);
  insertContact.run("GitHub", "github.com/yourusername", "https://github.com/yourusername", 2);
}

function getPublicContent() {
  const profile = db.prepare("SELECT * FROM profile WHERE id = 1").get();
  const about = db.prepare("SELECT * FROM about WHERE id = 1").get();
  const sections = db.prepare("SELECT * FROM sections").all();
  const education = db.prepare("SELECT * FROM education ORDER BY sort_order, id").all();
  const jobs = db.prepare("SELECT * FROM jobs ORDER BY sort_order, id").all();
  const experiences = db.prepare("SELECT * FROM experiences ORDER BY sort_order, id").all();
  const skills = db.prepare("SELECT * FROM skills ORDER BY id").all();
  const gallery = db.prepare("SELECT * FROM gallery ORDER BY sort_order, id").all();
  const contacts = db.prepare("SELECT * FROM contacts ORDER BY sort_order, id").all();

  const skillsByExp = {};
  skills.forEach((s) => {
    if (!skillsByExp[s.experience_id]) skillsByExp[s.experience_id] = [];
    skillsByExp[s.experience_id].push(s);
  });

  const sectionsMap = {};
  sections.forEach((s) => { sectionsMap[s.key] = s; });

  return {
    profile,
    about,
    sections: sectionsMap,
    education,
    jobs,
    experiences: experiences.map((e) => ({
      ...e,
      skills: skillsByExp[e.id] || [],
    })),
    gallery,
    contacts,
  };
}

function verifyPassword(password) {
  const row = db.prepare("SELECT password_hash FROM admin WHERE id = 1").get();
  return row && bcrypt.compareSync(password, row.password_hash);
}

function updatePassword(newPassword) {
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE admin SET password_hash = ? WHERE id = 1").run(hash);
}

module.exports = { db, initDb, getPublicContent, verifyPassword, updatePassword };

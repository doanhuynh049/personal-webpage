const { ensureConnected, getSql } = require("../lib/db-connect");

async function initDb() {
  await ensureConnected();
  const db = getSql();

  await db`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT NOT NULL DEFAULT 'Your Name',
      greeting TEXT DEFAULT 'Hello, I''m',
      tagline TEXT DEFAULT '',
      intro TEXT DEFAULT '',
      profile_image TEXT DEFAULT '/images/profile.svg'
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS about (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      heading TEXT DEFAULT 'A little about who I am',
      bio TEXT DEFAULT '',
      location TEXT DEFAULT '',
      focus TEXT DEFAULT '',
      currently TEXT DEFAULT ''
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS sections (
      section_key TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      heading TEXT NOT NULL,
      description TEXT DEFAULT ''
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS education (
      id SERIAL PRIMARY KEY,
      period TEXT NOT NULL,
      title TEXT NOT NULL,
      institution TEXT NOT NULL,
      description TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      period TEXT NOT NULL,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      description TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS experiences (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      is_skills BOOLEAN DEFAULT false,
      sort_order INTEGER DEFAULT 0
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS skills (
      id SERIAL PRIMARY KEY,
      experience_id INTEGER NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'tools',
      sort_order INTEGER DEFAULT 0
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS roadmap (
      id SERIAL PRIMARY KEY,
      period TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed')),
      sort_order INTEGER DEFAULT 0
    )
  `;

  await migrateSchema(db);

  await db`
    CREATE TABLE IF NOT EXISTS gallery (
      id SERIAL PRIMARY KEY,
      image_path TEXT NOT NULL,
      caption TEXT DEFAULT '',
      alt_text TEXT DEFAULT '',
      layout TEXT DEFAULT 'normal' CHECK (layout IN ('normal', 'wide', 'tall', 'large')),
      sort_order INTEGER DEFAULT 0
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS contacts (
      id SERIAL PRIMARY KEY,
      label TEXT NOT NULL,
      value TEXT NOT NULL,
      url TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS upload_files (
      filename TEXT PRIMARY KEY,
      data BYTEA NOT NULL,
      mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  const existing = await db`SELECT id FROM profile WHERE id = 1`;
  if (existing.length === 0) {
    await seedDb();
  }
}

async function migrateSchema(db) {
  await db`ALTER TABLE skills ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'tools'`;
  await db`ALTER TABLE skills ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0`;

  try {
    await db`ALTER TABLE gallery DROP CONSTRAINT IF EXISTS gallery_layout_check`;
    await db`
      ALTER TABLE gallery ADD CONSTRAINT gallery_layout_check
      CHECK (layout IN ('normal', 'wide', 'tall', 'large'))
    `;
  } catch {
    /* constraint already updated or table uses inline check from create */
  }

  const roadmapSection = await db`SELECT section_key FROM sections WHERE section_key = 'roadmap'`;
  if (!roadmapSection.length) {
    await db`
      INSERT INTO sections (section_key, label, heading, description)
      VALUES (
        'roadmap',
        'Career Roadmap',
        'Where I''m headed',
        'My career targets and learning path — goals I''m working toward in embedded systems and software engineering.'
      )
    `;
  }
}

async function seedDb() {
  const db = getSql();

  await db`
    INSERT INTO profile (id, name, greeting, tagline, intro, profile_image) VALUES (
      1, 'Your Name', 'Hello, I''m',
      'Student · Professional · Photographer',
      'Welcome to my personal page. Here you''ll find my academic background, professional journey, and a collection of moments I''ve captured through my lens.',
      '/images/profile.svg'
    )
  `;

  await db`
    INSERT INTO about (id, heading, bio, location, focus, currently) VALUES (
      1, 'A little about who I am',
      'Replace this with a short bio about yourself — your interests, what drives you, and what you''re currently focused on.',
      'City, Country', 'Your main field or passion', 'What you''re doing right now'
    )
  `;

  const sections = [
    ["about", "About Me", "A little about who I am", ""],
    ["study", "Education", "Where I've studied", ""],
    ["work", "Career", "Where I've worked", ""],
    ["roadmap", "Career Roadmap", "Where I'm headed", "My career targets and learning path — goals I'm working toward."],
    ["experience", "Experience", "Projects & milestones", ""],
    ["gallery", "Photography", "Moments I've captured", "A selection of photos I've taken — landscapes, portraits, street scenes, and more."],
    ["contact", "Contact", "Let's connect", "Feel free to reach out for collaborations, questions, or just to say hello."],
  ];
  for (const [key, label, heading, description] of sections) {
    await db`
      INSERT INTO sections (section_key, label, heading, description)
      VALUES (${key}, ${label}, ${heading}, ${description})
      ON CONFLICT (section_key) DO NOTHING
    `;
  }

  await db`
    INSERT INTO education (period, title, institution, description, sort_order) VALUES
    ('2022 — Present', 'Degree or Program Name', 'University or School Name', 'Brief description of your studies — major, focus areas, achievements, or notable projects during this period.', 0),
    ('2018 — 2022', 'Previous Degree or Program', 'Institution Name', 'Add details about earlier education, certifications, or self-directed learning.', 1)
  `;

  await db`
    INSERT INTO jobs (period, title, company, description, sort_order) VALUES
    ('2023 — Present', 'Job Title', 'Company Name', 'Describe your role, responsibilities, and key contributions.', 0),
    ('2021 — 2023', 'Previous Job Title', 'Previous Company', 'Share what you learned and accomplished in this position.', 1)
  `;

  await db`
    INSERT INTO experiences (title, description, is_skills, sort_order) VALUES
    ('Project or Achievement Name', 'Describe a significant project, internship, volunteer work, or personal milestone.', false, 0),
    ('Another Highlight', 'Add competitions, publications, open-source contributions, or other experiences worth sharing.', false, 1)
  `;

  const [skillsExp] = await db`
    INSERT INTO experiences (title, description, is_skills, sort_order)
    VALUES ('Skills Matrix', '', true, 2)
    RETURNING id
  `;

  const defaultSkills = [
    ["C++", "languages", 0],
    ["Java", "languages", 1],
    ["Skill 3", "tools", 2],
    ["Photography", "domains", 3],
    ["Your hobby", "domains", 4],
  ];
  for (const [name, category, sort_order] of defaultSkills) {
    await db`INSERT INTO skills (experience_id, name, category, sort_order) VALUES (${skillsExp.id}, ${name}, ${category}, ${sort_order})`;
  }

  const gallery = [
    ["/images/photos/photo-01.svg", "Photo title or location", "Photo description 1", "wide", 0],
    ["/images/photos/photo-02.svg", "Photo title or location", "Photo description 2", "normal", 1],
    ["/images/photos/photo-03.svg", "Photo title or location", "Photo description 3", "normal", 2],
    ["/images/photos/photo-04.svg", "Photo title or location", "Photo description 4", "normal", 3],
    ["/images/photos/photo-05.svg", "Photo title or location", "Photo description 5", "tall", 4],
    ["/images/photos/photo-06.svg", "Photo title or location", "Photo description 6", "normal", 5],
  ];
  for (const [image_path, caption, alt_text, layout, sort_order] of gallery) {
    await db`INSERT INTO gallery (image_path, caption, alt_text, layout, sort_order) VALUES (${image_path}, ${caption}, ${alt_text}, ${layout}, ${sort_order})`;
  }

  await db`
    INSERT INTO contacts (label, value, url, sort_order) VALUES
    ('Email', 'your.email@example.com', 'mailto:your.email@example.com', 0),
    ('LinkedIn', 'linkedin.com/in/yourprofile', 'https://linkedin.com/in/yourprofile', 1),
    ('GitHub', 'github.com/yourusername', 'https://github.com/yourusername', 2)
  `;
}

async function getPublicContent() {
  const db = getSql();

  const [profileRows, aboutRows, sections, education, jobs, experiences, skills, gallery, contacts, roadmap] = await Promise.all([
    db`SELECT * FROM profile WHERE id = 1`,
    db`SELECT * FROM about WHERE id = 1`,
    db`SELECT * FROM sections`,
    db`SELECT * FROM education ORDER BY sort_order, id`,
    db`SELECT * FROM jobs ORDER BY sort_order, id`,
    db`SELECT * FROM experiences ORDER BY sort_order, id`,
    db`SELECT * FROM skills ORDER BY category, sort_order, id`,
    db`SELECT * FROM gallery ORDER BY sort_order, id`,
    db`SELECT * FROM contacts ORDER BY sort_order, id`,
    db`SELECT * FROM roadmap ORDER BY sort_order, id`,
  ]);

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
    profile: profileRows[0],
    about: aboutRows[0],
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

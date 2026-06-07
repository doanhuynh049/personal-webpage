/**
 * Seed ALL personal webpage data (profile, about, education, work, experience, contact).
 * Usage: npm run seed
 */
require("dotenv").config();

const { getSql, initDb } = require("../db/database");

const profile = {
  name: "Quat Doan",
  greeting: "Hello, I'm",
  tagline: "Advanced Software Engineer · Embedded Systems · UI Development",
  intro:
    "I build reliable software for embedded and consumer devices — from Linux BSP and Yocto platforms to Set-Top Box user interfaces. Based in Bangkok, with a background in automation engineering from Ho Chi Minh City University of Technology.",
  profile_image: "/images/profile.svg",
};

const about = {
  heading: "A little about who I am",
  bio:
    "I'm an Advanced Software Engineer at Hitachi Digital Services, focused on Set-Top Box UI development in Bangkok. Before that, I spent a year as an Embedded Engineer at Hitachi Vantara Vietnam, working on medical systems, Linux BSP maintenance, and CCTV platforms on R-Car hardware. I enjoy turning complex requirements into stable, performant software — whether that's an accessible Talking Guide on a TV interface or a kernel driver passing full BSP validation. I hold a Bachelor's in Automation Engineering (GPA 3.7/4) and bring hands-on experience with C++, Java, Qt, Yocto, and GTEST across embedded and application layers.",
  location: "Bangkok, Thailand",
  focus: "Embedded Linux · STB UI · BSP & Yocto",
  currently: "Advanced Software Engineer at Hitachi Digital Services",
};

const sections = {
  about: { label: "About Me", heading: "A little about who I am", description: "" },
  study: { label: "Education", heading: "Where I've studied", description: "" },
  work: { label: "Career", heading: "Where I've worked", description: "" },
  roadmap: {
    label: "Career Roadmap",
    heading: "Where I'm headed",
    description: "My career targets and learning path — goals I'm working toward in embedded systems and software engineering.",
  },
  experience: { label: "Experience", heading: "Projects & milestones", description: "" },
  gallery: {
    label: "Photography",
    heading: "Moments I've captured",
    description: "A hobby I enjoy — landscapes, street scenes, and everyday moments. Add as many photos as you like from the admin gallery.",
  },
  contact: {
    label: "Contact",
    heading: "Let's connect",
    description: "Open to opportunities, collaborations, and conversations about embedded systems and software engineering.",
  },
};

const education = [
  {
    period: "Aug 2019 — May 2023",
    title: "Bachelor's degree, Automation Engineer Technology/Technician",
    institution: "Ho Chi Minh City University of Technology (HCMUT)",
    description:
      "Grade: 3.7/4. Studied automation systems, control engineering, C++, LabVIEW, and embedded fundamentals — foundation for my career in embedded and application software.",
    sort_order: 0,
  },
];

const jobs = [
  {
    period: "Mar 2024 — Present",
    title: "Advanced Software Engineer",
    company: "Hitachi Digital Services · Contract",
    description: `Bangkok, Thailand · On-site

Set-Top Box (STB) Project
UI development for consumer Set-Top Box products.
• Design and implement interactive menu features, Pay-Per-View content rows, and Program Information Pages.
• Build accessible Talking Guide features with focus and action event management for users with disabilities.
• Analyze requirements, profile UI performance, identify bottlenecks, and ship optimizations for responsiveness and stability.

Tech: Buildroot, Java, UI performance tuning, accessibility`,
    sort_order: 0,
  },
  {
    period: "Apr 2023 — Mar 2024",
    title: "Fresher Embedded Engineer",
    company: "Hitachi Vantara Vietnam · Full-time",
    description: `Ho Chi Minh City, Vietnam · On-site

Therapy Control System (MGH)
Proton Therapy System software for Massachusetts General Hospital.
• Unit testing, function stubbing, and requirements investigation.

Gen 3 Linux BSP Maintenance
Linux BSP updates across R-Car H3, M3, M3N, and E3 device families.
• Kernel upgrade 5.10.41 → 5.10.194, Yocto builds, MMNGR, and Wayland.
• Full validation of kernel driver BSP, MMNGR, and multimedia modules.

CCTV Platform
Linux-based camera capture, processing, database storage, and Qt UI.
• User management, change requests, specification and unit testing.

Tech: GTEST, Qt Creator, Linux BSP, Yocto, embedded C/C++`,
    sort_order: 1,
  },
];

const experiences = [
  {
    title: "Set-Top Box UI (STB Project)",
    description:
      "End-to-end UI feature ownership for STB products — menus, Pay-Per-View, Talking Guide accessibility, Program Info pages, and measurable performance improvements.",
    is_skills: false,
    sort_order: 0,
  },
  {
    title: "Therapy Control System (MGH)",
    description:
      "Software renovation for Massachusetts General Hospital's Proton Therapy System — rigorous unit testing and virtual function stubbing in a safety-critical domain.",
    is_skills: false,
    sort_order: 1,
  },
  {
    title: "Gen 3 Linux BSP Maintenance",
    description:
      "Kernel and BSP maintenance on Renesas R-Car platforms — Yocto image builds, driver testing, and kernel upgrades across multiple SoC variants.",
    is_skills: false,
    sort_order: 2,
  },
  {
    title: "CCTV Platform on Linux",
    description:
      "Full-stack embedded CCTV solution: video pipeline, database integration, user management, and Qt-based UI with comprehensive test coverage.",
    is_skills: false,
    sort_order: 3,
  },
  {
    title: "Skills Matrix",
    description: "",
    is_skills: true,
    sort_order: 4,
    skills: [
      { name: "C++", category: "languages" },
      { name: "Java", category: "languages" },
      { name: "Buildroot", category: "embedded" },
      { name: "Yocto", category: "embedded" },
      { name: "Linux BSP", category: "embedded" },
      { name: "Wayland", category: "embedded" },
      { name: "Qt / Qt Creator", category: "tools" },
      { name: "GTEST", category: "tools" },
      { name: "LabVIEW", category: "tools" },
      { name: "Embedded Systems", category: "domains" },
      { name: "STB UI Development", category: "domains" },
      { name: "Automation Engineering", category: "domains" },
    ],
  },
];

const roadmap = [
  {
    period: "2025 — 2026",
    title: "Deepen STB accessibility & UI performance",
    description: "Ship measurable Talking Guide improvements, profile UI bottlenecks, and document performance patterns for the STB platform team.",
    status: "in_progress",
    sort_order: 0,
  },
  {
    period: "2026",
    title: "Lead a cross-team UI platform initiative",
    description: "Drive shared components, build standards, and mentor engineers on embedded UI best practices.",
    status: "planned",
    sort_order: 1,
  },
  {
    period: "2027+",
    title: "Staff / Principal embedded engineer path",
    description: "Grow into system-level ownership across BSP, UI, and product delivery in consumer embedded devices.",
    status: "planned",
    sort_order: 2,
  },
];

const gallery = [
  { image_path: "/images/photos/photo-01.svg", caption: "Add your photo", alt_text: "Gallery photo 1", layout: "wide", sort_order: 0 },
  { image_path: "/images/photos/photo-02.svg", caption: "Add your photo", alt_text: "Gallery photo 2", layout: "normal", sort_order: 1 },
  { image_path: "/images/photos/photo-03.svg", caption: "Add your photo", alt_text: "Gallery photo 3", layout: "normal", sort_order: 2 },
  { image_path: "/images/photos/photo-04.svg", caption: "Add your photo", alt_text: "Gallery photo 4", layout: "normal", sort_order: 3 },
  { image_path: "/images/photos/photo-05.svg", caption: "Add your photo", alt_text: "Gallery photo 5", layout: "tall", sort_order: 4 },
  { image_path: "/images/photos/photo-06.svg", caption: "Add your photo", alt_text: "Gallery photo 6", layout: "normal", sort_order: 5 },
];

const contacts = [
  { label: "Email", value: "quat.doan@example.com", url: "mailto:quat.doan@example.com", sort_order: 0 },
  { label: "LinkedIn", value: "linkedin.com/in/quatdoan", url: "https://linkedin.com/in/quatdoan", sort_order: 1 },
  { label: "GitHub", value: "github.com/quathd_t", url: "https://github.com/quathd_t", sort_order: 2 },
];

function migrateSqliteSchema() {
  if (process.env.USE_SQLITE !== "1" && process.env.USE_SQLITE !== "true") return;
  const { DatabaseSync } = require("node:sqlite");
  const path = require("path");
  const db = new DatabaseSync(path.join(__dirname, "../data/site.db"));
  const sectionCols = db.prepare("PRAGMA table_info(sections)").all().map((c) => c.name);
  if (sectionCols.includes("key") && !sectionCols.includes("section_key")) {
    db.exec("ALTER TABLE sections RENAME COLUMN key TO section_key");
    console.log("Migrated sections table: key → section_key");
  }
  const skillCols = db.prepare("PRAGMA table_info(skills)").all().map((c) => c.name);
  if (skillCols.length && !skillCols.includes("category")) {
    db.exec("ALTER TABLE skills ADD COLUMN category TEXT NOT NULL DEFAULT 'tools'");
    console.log("Migrated skills: added category column");
  }
  if (skillCols.length && !skillCols.includes("sort_order")) {
    db.exec("ALTER TABLE skills ADD COLUMN sort_order INTEGER DEFAULT 0");
    console.log("Migrated skills: added sort_order column");
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS roadmap (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed')),
      sort_order INTEGER DEFAULT 0
    )
  `);
  const hasRoadmapSection = db.prepare("SELECT 1 FROM sections WHERE section_key = 'roadmap'").get();
  if (!hasRoadmapSection) {
    db.prepare(
      "INSERT INTO sections (section_key, label, heading, description) VALUES (?, ?, ?, ?)"
    ).run(
      "roadmap",
      "Career Roadmap",
      "Where I'm headed",
      "My career targets and learning path — goals I'm working toward in embedded systems and software engineering."
    );
    console.log("Added roadmap section");
  }
}

async function seed() {
  migrateSqliteSchema();
  await initDb();
  const sql = getSql();

  console.log("Updating profile...");
  await sql`
    UPDATE profile SET
      name = ${profile.name},
      greeting = ${profile.greeting},
      tagline = ${profile.tagline},
      intro = ${profile.intro},
      profile_image = ${profile.profile_image}
    WHERE id = 1
  `;

  console.log("Updating about...");
  await sql`
    UPDATE about SET
      heading = ${about.heading},
      bio = ${about.bio},
      location = ${about.location},
      focus = ${about.focus},
      currently = ${about.currently}
    WHERE id = 1
  `;

  console.log("Updating section titles...");
  for (const [key, sec] of Object.entries(sections)) {
    await sql`
      UPDATE sections SET label = ${sec.label}, heading = ${sec.heading}, description = ${sec.description}
      WHERE section_key = ${key}
    `;
  }

  console.log("Replacing education, jobs, experience, gallery, contacts, roadmap...");
  await sql`DELETE FROM skills`;
  await sql`DELETE FROM experiences`;
  await sql`DELETE FROM education`;
  await sql`DELETE FROM jobs`;
  await sql`DELETE FROM gallery`;
  await sql`DELETE FROM contacts`;
  await sql`DELETE FROM roadmap`;

  for (const row of education) {
    await sql`
      INSERT INTO education (period, title, institution, description, sort_order)
      VALUES (${row.period}, ${row.title}, ${row.institution}, ${row.description}, ${row.sort_order})
    `;
  }

  for (const row of jobs) {
    await sql`
      INSERT INTO jobs (period, title, company, description, sort_order)
      VALUES (${row.period}, ${row.title}, ${row.company}, ${row.description}, ${row.sort_order})
    `;
  }

  for (const row of experiences) {
    const inserted = await sql`
      INSERT INTO experiences (title, description, is_skills, sort_order)
      VALUES (${row.title}, ${row.description}, ${row.is_skills ? 1 : 0}, ${row.sort_order})
      RETURNING id
    `;
    if (row.skills) {
      for (let i = 0; i < row.skills.length; i++) {
        const skill = row.skills[i];
        const name = typeof skill === "string" ? skill : skill.name;
        const category = typeof skill === "string" ? "tools" : (skill.category || "tools");
        await sql`INSERT INTO skills (experience_id, name, category, sort_order) VALUES (${inserted[0].id}, ${name}, ${category}, ${i})`;
      }
    }
  }

  for (const row of roadmap) {
    await sql`
      INSERT INTO roadmap (period, title, description, status, sort_order)
      VALUES (${row.period}, ${row.title}, ${row.description}, ${row.status}, ${row.sort_order})
    `;
  }

  for (const row of gallery) {
    await sql`
      INSERT INTO gallery (image_path, caption, alt_text, layout, sort_order)
      VALUES (${row.image_path}, ${row.caption}, ${row.alt_text}, ${row.layout}, ${row.sort_order})
    `;
  }

  for (const row of contacts) {
    await sql`
      INSERT INTO contacts (label, value, url, sort_order)
      VALUES (${row.label}, ${row.value}, ${row.url}, ${row.sort_order})
    `;
  }

  console.log("");
  console.log("All fields updated successfully!");
  console.log("  Profile:  " + profile.name);
  console.log("  Location: " + about.location);
  console.log("  Jobs:     " + jobs.length);
  console.log("  Projects: " + (experiences.length - 1));
  console.log("  Roadmap:  " + roadmap.length);
  console.log("");
  console.log("View: http://localhost:8637");
  console.log("Edit: http://localhost:8637/admin");
  console.log("");
  console.log("Note: Update email, LinkedIn URL, profile photo, and gallery images in the admin panel.");
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});

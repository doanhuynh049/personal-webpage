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
  experience: { label: "Experience", heading: "Projects & milestones", description: "" },
  gallery: {
    label: "Photography",
    heading: "Moments I've captured",
    description: "A collection of photos from daily life and travels — update with your own images in the admin panel.",
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
    title: "Skills & Technologies",
    description: "",
    is_skills: true,
    sort_order: 4,
    skills: [
      "C++",
      "Java",
      "Buildroot",
      "Yocto",
      "Linux BSP",
      "Qt / Qt Creator",
      "GTEST",
      "LabVIEW",
      "Wayland",
      "Embedded Systems",
      "UI Development",
      "Automation Engineering",
    ],
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
  const cols = db.prepare("PRAGMA table_info(sections)").all().map((c) => c.name);
  if (cols.includes("key") && !cols.includes("section_key")) {
    db.exec("ALTER TABLE sections RENAME COLUMN key TO section_key");
    console.log("Migrated sections table: key → section_key");
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

  console.log("Replacing education, jobs, experience, gallery, contacts...");
  await sql`DELETE FROM skills`;
  await sql`DELETE FROM experiences`;
  await sql`DELETE FROM education`;
  await sql`DELETE FROM jobs`;
  await sql`DELETE FROM gallery`;
  await sql`DELETE FROM contacts`;

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
      for (const name of row.skills) {
        await sql`INSERT INTO skills (experience_id, name) VALUES (${inserted[0].id}, ${name})`;
      }
    }
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

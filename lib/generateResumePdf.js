const { groupSkillsByCategory, findSkillsExperience, SKILL_CATEGORIES } = require("./skills-matrix");

function stripFormat(text) {
  if (!text) return "";
  return text.replace(/\n• /g, "\n- ").trim();
}

async function generateResumePdf(data) {
  return new Promise((resolve, reject) => {
    const { profile, about, education, jobs, experiences } = data;
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks = [];

    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const accent = "#2d4a3e";

    doc.fillColor(accent).fontSize(22).font("Helvetica-Bold").text(profile.name, { align: "left" });
    doc.moveDown(0.2);
    doc.fillColor("#444").fontSize(11).font("Helvetica").text(profile.tagline || "");
    doc.moveDown(0.3);
    doc.fontSize(10).text(`${about.location || ""}  ·  ${about.currently || ""}`.trim());
    doc.moveDown(0.5);
    doc.fillColor("#333").fontSize(10).text(profile.intro || "", { lineGap: 3 });
    doc.moveDown(1);

    doc.fillColor(accent).fontSize(13).font("Helvetica-Bold").text("About");
    doc.moveDown(0.3);
    doc.fillColor("#333").fontSize(10).font("Helvetica").text(about.bio || "", { lineGap: 3 });
    doc.moveDown(1);

    if (education.length) {
      doc.fillColor(accent).fontSize(13).font("Helvetica-Bold").text("Education");
      doc.moveDown(0.4);
      education.forEach((e) => {
        doc.fillColor("#111").fontSize(11).font("Helvetica-Bold").text(`${e.title} — ${e.institution}`);
        doc.fillColor("#666").fontSize(9).font("Helvetica").text(e.period);
        doc.fillColor("#333").fontSize(10).text(stripFormat(e.description), { lineGap: 2 });
        doc.moveDown(0.6);
      });
      doc.moveDown(0.4);
    }

    if (jobs.length) {
      doc.fillColor(accent).fontSize(13).font("Helvetica-Bold").text("Experience");
      doc.moveDown(0.4);
      jobs.forEach((j) => {
        doc.fillColor("#111").fontSize(11).font("Helvetica-Bold").text(`${j.title} — ${j.company}`);
        doc.fillColor("#666").fontSize(9).font("Helvetica").text(j.period);
        doc.fillColor("#333").fontSize(10).text(stripFormat(j.description), { lineGap: 2 });
        doc.moveDown(0.6);
      });
      doc.moveDown(0.4);
    }

    const projects = experiences.filter((e) => !e.is_skills);
    const skillsExp = findSkillsExperience(experiences);

    if (projects.length) {
      doc.fillColor(accent).fontSize(13).font("Helvetica-Bold").text("Projects");
      doc.moveDown(0.4);
      projects.forEach((p) => {
        doc.fillColor("#111").fontSize(11).font("Helvetica-Bold").text(p.title);
        doc.fillColor("#333").fontSize(10).font("Helvetica").text(p.description || "", { lineGap: 2 });
        doc.moveDown(0.5);
      });
    }

    if (skillsExp && skillsExp.skills?.length) {
      const grouped = groupSkillsByCategory(skillsExp.skills);
      doc.moveDown(0.3);
      doc.fillColor(accent).fontSize(13).font("Helvetica-Bold").text("Skills");
      doc.moveDown(0.3);
      for (const [key, label] of Object.entries(SKILL_CATEGORIES)) {
        const items = grouped[key];
        if (!items.length) continue;
        doc.fillColor("#111").fontSize(10).font("Helvetica-Bold").text(label);
        doc.fillColor("#333").fontSize(10).font("Helvetica").text(items.map((s) => s.name).join("  ·  "));
        doc.moveDown(0.35);
      }
    }

    doc.end();
  });
}

module.exports = { generateResumePdf };

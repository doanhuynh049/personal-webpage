(function () {
  "use strict";

  const app = document.getElementById("app");

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Turn structured job/edu text into HTML (blocks separated by blank lines). */
  function formatRichContent(text) {
    if (!text) return "";
    const blocks = text.trim().split(/\n\n+/);

    return blocks.map((block) => {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) return "";

      // Location line: "City · On-site"
      if (lines.length === 1 && lines[0].includes("·") && !lines[0].startsWith("•") && !lines[0].startsWith("Tech:")) {
        return `<p class="content-location">${escapeHtml(lines[0])}</p>`;
      }

      // Tech line
      if (lines.length === 1 && lines[0].startsWith("Tech:")) {
        const skills = lines[0].replace(/^Tech:\s*/i, "").split(",").map((s) => s.trim()).filter(Boolean);
        return `<div class="content-tags">${skills.map((s) => `<span class="tag">${escapeHtml(s)}</span>`).join("")}</div>`;
      }

      // Bullet-only block
      if (lines.every((l) => l.startsWith("• "))) {
        return `<ul class="content-list">${lines.map((l) => `<li>${escapeHtml(l.slice(2))}</li>`).join("")}</ul>`;
      }

      // Project block: title [, subtitle] + bullets
      const bullets = lines.filter((l) => l.startsWith("• "));
      const nonBullets = lines.filter((l) => !l.startsWith("• "));

      if (bullets.length > 0 && nonBullets.length >= 1) {
        const title = nonBullets[0];
        const subtitle = nonBullets.length > 1 ? nonBullets.slice(1).join(" ") : null;
        return `<div class="content-block">
          <h4 class="content-block-title">${escapeHtml(title)}</h4>
          ${subtitle && !subtitle.startsWith("•") ? `<p class="content-block-desc">${escapeHtml(subtitle)}</p>` : ""}
          <ul class="content-list">${bullets.map((l) => `<li>${escapeHtml(l.slice(2))}</li>`).join("")}</ul>
        </div>`;
      }

      // Title + single subtitle (no bullets)
      if (lines.length === 2 && !lines[1].startsWith("•")) {
        return `<div class="content-block">
          <h4 class="content-block-title">${escapeHtml(lines[0])}</h4>
          <p class="content-block-desc">${escapeHtml(lines[1])}</p>
        </div>`;
      }

      return `<p class="content-paragraph">${escapeHtml(lines.join(" "))}</p>`;
    }).join("");
  }

  function layoutClass(layout) {
    if (layout === "wide") return "gallery-item--wide";
    if (layout === "tall") return "gallery-item--tall";
    if (layout === "large") return "gallery-item--large";
    return "";
  }

  const SKILL_CATEGORIES = {
    languages: "Languages",
    embedded: "Embedded",
    tools: "Tools",
    domains: "Domains",
  };

  function renderSkillsMatrix(skillsExp) {
    if (!skillsExp?.skills?.length) return "";
    const grouped = {};
    for (const key of Object.keys(SKILL_CATEGORIES)) grouped[key] = [];
    for (const skill of skillsExp.skills) {
      const cat = SKILL_CATEGORIES[skill.category] ? skill.category : "tools";
      grouped[cat].push(skill);
    }
    const groups = Object.entries(SKILL_CATEGORIES)
      .map(([key, label]) => {
        const items = grouped[key];
        if (!items.length) return "";
        return `
          <div class="skills-matrix-group">
            <h3 class="skills-matrix-label">${escapeHtml(label)}</h3>
            <div class="tags">${items.map((s) => `<span class="tag">${escapeHtml(s.name)}</span>`).join("")}</div>
          </div>`;
      })
      .join("");
    if (!groups) return "";
    return `<div class="skills-matrix">${groups}</div>`;
  }

  function renderPage(data) {
    const { profile, about, sections, education, jobs, experiences, gallery, contacts, site } = data;
    const projectExperiences = experiences.filter((e) => !e.is_skills);
    const skillsExperience = experiences.find((e) => e.is_skills);
    const adminUrl = site?.adminUrl || "/admin";
    const showAdminLink = site?.showAdminLink !== false;

    document.title = `${profile.name} — Personal Page`;
    document.querySelector('meta[name="description"]').content =
      `${profile.name} — ${profile.tagline || "Personal portfolio"}`;

    app.innerHTML = `
      <header class="site-header">
        <nav class="nav">
          <a href="#home" class="nav-logo">${escapeHtml(profile.name)}</a>
          <button class="nav-toggle" aria-label="Open menu" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
          <ul class="nav-links">
            <li><a href="#about">${escapeHtml(sections.about?.label || "About")}</a></li>
            <li><a href="#study">${escapeHtml(sections.study?.label || "Study")}</a></li>
            <li><a href="#work">${escapeHtml(sections.work?.label || "Work")}</a></li>
            <li><a href="#experience">${escapeHtml(sections.experience?.label || "Experience")}</a></li>
            <li><a href="#gallery">${escapeHtml(sections.gallery?.label || "Gallery")}</a></li>
            <li><a href="#contact">${escapeHtml(sections.contact?.label || "Contact")}</a></li>
          </ul>
        </nav>
      </header>

      <main>
        <section id="home" class="hero">
          <div class="hero-content">
            <div class="hero-text">
              <p class="hero-greeting">${escapeHtml(profile.greeting)}</p>
              <h1>${escapeHtml(profile.name)}</h1>
              <p class="hero-tagline">${escapeHtml(profile.tagline)}</p>
              <p class="hero-intro">${escapeHtml(profile.intro)}</p>
              <div class="hero-actions">
                <a href="#gallery" class="btn btn-primary">View My Photos</a>
                <a href="#work" class="btn btn-outline">View Career</a>
                <a href="#contact" class="btn btn-outline">Get in Touch</a>
                <a href="/api/resume.pdf" class="btn btn-outline" download>Download Resume</a>
              </div>
            </div>
            <figure class="hero-photo">
              <img src="${escapeHtml(profile.profile_image)}" alt="Portrait of ${escapeHtml(profile.name)}" width="420" height="520">
            </figure>
          </div>
          <a href="#about" class="scroll-hint" aria-label="Scroll down"><span></span></a>
        </section>

        <section id="about" class="section about">
          <div class="container">
            <header class="section-header">
              <span class="section-label">${escapeHtml(sections.about?.label)}</span>
              <h2>${escapeHtml(about.heading)}</h2>
            </header>
            <div class="about-grid">
              <p>${escapeHtml(about.bio)}</p>
              <ul class="about-highlights">
                <li><strong>Location</strong><span>${escapeHtml(about.location)}</span></li>
                <li><strong>Focus</strong><span>${escapeHtml(about.focus)}</span></li>
                <li><strong>Currently</strong><span>${escapeHtml(about.currently)}</span></li>
              </ul>
            </div>
          </div>
        </section>

        <section id="study" class="section study">
          <div class="container">
            <header class="section-header">
              <span class="section-label">${escapeHtml(sections.study?.label)}</span>
              <h2>${escapeHtml(sections.study?.heading)}</h2>
            </header>
            <div class="timeline">
              ${education.map((item) => `
                <article class="timeline-item">
                  <time>${escapeHtml(item.period)}</time>
                  <h3>${escapeHtml(item.title)}</h3>
                  <p class="timeline-place">${escapeHtml(item.institution)}</p>
                  <div class="timeline-desc">${formatRichContent(item.description)}</div>
                </article>
              `).join("")}
            </div>
          </div>
        </section>

        <section id="work" class="section work">
          <div class="container">
            <header class="section-header">
              <span class="section-label">${escapeHtml(sections.work?.label)}</span>
              <h2>${escapeHtml(sections.work?.heading)}</h2>
            </header>
            <div class="career-list">
              ${jobs.map((item) => `
                <article class="career-card">
                  <header class="career-card-header">
                    <time class="career-period">${escapeHtml(item.period)}</time>
                    <div>
                      <h3 class="career-title">${escapeHtml(item.title)}</h3>
                      <p class="career-company">${escapeHtml(item.company)}</p>
                    </div>
                  </header>
                  <div class="career-body">${formatRichContent(item.description)}</div>
                </article>
              `).join("")}
            </div>
          </div>
        </section>

        <section id="experience" class="section experience">
          <div class="container">
            <header class="section-header">
              <span class="section-label">${escapeHtml(sections.experience?.label)}</span>
              <h2>${escapeHtml(sections.experience?.heading)}</h2>
            </header>
            <div class="experience-list">
              ${projectExperiences.map((item, i) => `
                <article class="experience-item">
                  <div class="experience-icon" aria-hidden="true">${String(i + 1).padStart(2, "0")}</div>
                  <div>
                    <h3>${escapeHtml(item.title)}</h3>
                    <p>${escapeHtml(item.description)}</p>
                  </div>
                </article>
              `).join("")}
            </div>
            ${renderSkillsMatrix(skillsExperience)}
          </div>
        </section>

        <section id="gallery" class="section gallery">
          <div class="container">
            <header class="section-header">
              <span class="section-label">${escapeHtml(sections.gallery?.label)}</span>
              <h2>${escapeHtml(sections.gallery?.heading)}</h2>
              ${sections.gallery?.description ? `<p class="section-desc">${escapeHtml(sections.gallery.description)}</p>` : ""}
            </header>
            <div class="gallery-grid">
              ${gallery.map((item) => `
                <figure class="gallery-item ${layoutClass(item.layout)}">
                  <img src="${escapeHtml(item.image_path)}" alt="${escapeHtml(item.alt_text || item.caption)}" loading="lazy">
                  ${item.caption ? `<figcaption>${escapeHtml(item.caption)}</figcaption>` : ""}
                </figure>
              `).join("")}
            </div>
          </div>
        </section>

        <section id="contact" class="section contact">
          <div class="container">
            <header class="section-header section-header--center">
              <span class="section-label">${escapeHtml(sections.contact?.label)}</span>
              <h2>${escapeHtml(sections.contact?.heading)}</h2>
              ${sections.contact?.description ? `<p class="section-desc">${escapeHtml(sections.contact.description)}</p>` : ""}
            </header>
            <div class="contact-links">
              ${contacts.map((item) => {
                const isExternal = !item.url.startsWith("mailto:");
                return `
                <a href="${escapeHtml(item.url)}" class="contact-link"${isExternal ? ' target="_blank" rel="noopener noreferrer"' : ""}>
                  <span class="contact-label">${escapeHtml(item.label)}</span>
                  <span>${escapeHtml(item.value)}</span>
                </a>`;
              }).join("")}
            </div>
          </div>
        </section>
      </main>

      <footer class="site-footer">
        <div class="container">
          <p>&copy; <span id="year">${new Date().getFullYear()}</span> ${escapeHtml(profile.name)}. Made with care.</p>
        </div>
      </footer>

      ${showAdminLink ? `
      <a href="${escapeHtml(adminUrl)}" class="admin-link" aria-label="Open admin panel" title="Admin panel">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
        </svg>
      </a>` : ""}
    `;

    initInteractions();
  }

  function initInteractions() {
    const toggle = document.querySelector(".nav-toggle");
    const navLinks = document.querySelector(".nav-links");

    toggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("is-open");
      toggle.classList.toggle("is-active", isOpen);
      toggle.setAttribute("aria-expanded", isOpen);
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("is-open");
        toggle.classList.remove("is-active");
        toggle.setAttribute("aria-expanded", "false");
      });
    });

    const lightbox = document.getElementById("lightbox");
    const lightboxImg = lightbox.querySelector("img");
    const lightboxCaption = lightbox.querySelector("figcaption");
    let galleryItems = [];
    let currentIndex = 0;

    function bindGallery() {
      galleryItems = [...document.querySelectorAll(".gallery-item")];
      galleryItems.forEach((item, index) => {
        item.addEventListener("click", () => openLightbox(index));
      });
    }

    function openLightbox(index) {
      currentIndex = index;
      const item = galleryItems[index];
      const img = item.querySelector("img");
      const caption = item.querySelector("figcaption");
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightboxCaption.textContent = caption ? caption.textContent : "";
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
      lightbox.hidden = true;
      document.body.style.overflow = "";
    }

    function showPrev() {
      currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
      openLightbox(currentIndex);
    }

    function showNext() {
      currentIndex = (currentIndex + 1) % galleryItems.length;
      openLightbox(currentIndex);
    }

    bindGallery();

    lightbox.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
    lightbox.querySelector(".lightbox-prev").addEventListener("click", showPrev);
    lightbox.querySelector(".lightbox-next").addEventListener("click", showNext);
    lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });

    document.addEventListener("keydown", (e) => {
      if (lightbox.hidden) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    });

    const header = document.querySelector(".site-header");
    window.addEventListener("scroll", () => {
      header.style.boxShadow = window.scrollY > 20 ? "var(--shadow-sm)" : "none";
    }, { passive: true });
  }

  fetch("/api/content")
    .then(async (res) => {
      if (!res.ok) {
        let detail = res.statusText;
        try {
          const body = await res.json();
          if (body.error) detail = body.error;
        } catch {
          /* ignore */
        }
        throw new Error(detail || "Failed to load content");
      }
      return res.json();
    })
    .then(renderPage)
    .catch((err) => {
      const hint =
        err.message && err.message !== "Failed to load content"
          ? escapeHtml(err.message)
          : "Check Vercel env vars (DATABASE_URL) and function logs.";
      app.innerHTML = `
        <div class="page-error">
          <h1>Unable to load page</h1>
          <p>${hint}</p>
        </div>
      `;
    });
})();

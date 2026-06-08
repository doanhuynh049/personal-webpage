(function () {
  "use strict";

  let content = null;
  let profileImage = "";

  const $ = (sel) => document.querySelector(sel);
  const loginScreen = $("#login-screen");
  const dashboard = $("#dashboard");
  const loginForm = $("#login-form");
  const loginError = $("#login-error");
  const toast = $("#toast");

  const panelTitles = {
    profile: "Profile",
    about: "About",
    education: "Education",
    jobs: "Work",
    experience: "Experience",
    skills: "Skills Matrix",
    roadmap: "Career Roadmap",
    gallery: "Gallery",
    contact: "Contact",
  };

  const SKILL_CATEGORIES = {
    languages: "Languages",
    embedded: "Embedded",
    tools: "Tools",
    domains: "Domains",
  };

  const ROADMAP_STATUS = {
    planned: "Planned",
    in_progress: "In Progress",
    completed: "Completed",
  };

  async function api(url, options = {}) {
    const res = await fetch(url, {
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });
    if (res.status === 401 && !url.includes("/login")) {
      showLogin();
      throw new Error("Unauthorized");
    }
    const data = res.headers.get("content-type")?.includes("json") ? await res.json() : null;
    if (!res.ok) {
      const msg = data?.error || "Request failed";
      throw new Error(msg);
    }
    return data;
  }

  async function uploadImage(file, options = {}) {
    const form = new FormData();
    form.append("image", file);
    if (options.country) form.append("country", options.country);
    if (options.caption) form.append("caption", options.caption);
    if (options.galleryId) form.append("gallery_id", options.galleryId);
    const res = await fetch("/api/upload", { method: "POST", credentials: "same-origin", body: form });
    if (res.status === 401) { showLogin(); throw new Error("Unauthorized"); }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data.path;
  }

  async function uploadToGallerySlot(id, file, options = {}) {
    const form = new FormData();
    form.append("image", file);
    if (options.country) form.append("country", options.country);
    if (options.caption) form.append("caption", options.caption);
    const res = await fetch(`/api/gallery/${id}/image`, { method: "POST", credentials: "same-origin", body: form });
    if (res.status === 401) { showLogin(); throw new Error("Unauthorized"); }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data;
  }

  function showToast(msg, isError = false) {
    toast.textContent = msg;
    toast.classList.toggle("error", isError);
    toast.hidden = false;
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => { toast.hidden = true; }, 2800);
  }

  AdminTools.init({ api, showToast, query: $ });

  function applySiteLinks() {
    const site = content?.site || {};
    const publicUrl = site.publicUrl || "/";
    const viewSite = document.getElementById("sidebar-view-site");
    if (viewSite) viewSite.href = publicUrl;

    const preview = document.getElementById("live-preview");
    if (preview) {
      const base = publicUrl.startsWith("http")
        ? publicUrl.replace(/\/$/, "")
        : window.location.origin;
      preview.src = `${base}/?preview=${Date.now()}`;
    }
  }

  function showLogin() {
    loginScreen.hidden = false;
    dashboard.hidden = true;
    document.body.classList.remove("is-authenticated");
  }

  function showDashboard() {
    loginScreen.hidden = true;
    dashboard.hidden = false;
    document.body.classList.add("is-authenticated");
  }

  async function checkAuth() {
    const { authenticated } = await api("/api/auth/check");
    if (authenticated) {
      showDashboard();
      await loadContent();
    } else {
      showLogin();
    }
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.hidden = true;
    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ password: $("#password").value }),
      });
    } catch (err) {
      loginError.textContent = err.message || "Login failed";
      loginError.hidden = false;
      return;
    }
    showDashboard();
    try {
      await loadContent();
    } catch (err) {
      showToast("Logged in but failed to load content: " + err.message, true);
    }
  });

  $("#logout-btn").addEventListener("click", async () => {
    await api("/api/auth/logout", { method: "POST" });
    showLogin();
  });

  // Panel navigation
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      const panel = btn.dataset.panel;
      $(`#panel-${panel}`).classList.add("active");
      $("#panel-title").textContent = panelTitles[panel];
    });
  });

  async function loadContent() {
    content = await api("/api/content");
    applySiteLinks();
    renderProfile();
    renderAbout();
    renderEducation();
    renderJobs();
    renderExperience();
    renderSkillsMatrixAdmin();
    renderRoadmap();
    renderGallery();
    renderContacts();
    AdminTools.bindAiButtons(document);
    AdminTools.initAllSortables();
    AdminTools.refreshPreview();
  }

  function renderProfile() {
    const p = content.profile;
    profileImage = p.profile_image;
    $("#profile-name").value = p.name;
    $("#profile-greeting").value = p.greeting;
    $("#profile-tagline").value = p.tagline;
    $("#profile-intro").value = p.intro;
    $("#profile-preview").src = p.profile_image;
  }

  function renderAbout() {
    const a = content.about;
    $("#about-heading").value = a.heading;
    $("#about-bio").value = a.bio;
    $("#about-location").value = a.location;
    $("#about-focus").value = a.focus;
    $("#about-currently").value = a.currently;
  }

  $("#save-profile").addEventListener("click", async () => {
    try {
      await api("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: $("#profile-name").value,
          greeting: $("#profile-greeting").value,
          tagline: $("#profile-tagline").value,
          intro: $("#profile-intro").value,
          profile_image: profileImage,
        }),
      });
      showToast("Profile saved");
      AdminTools.refreshPreview();
    } catch (err) { showToast(err.message, true); }
  });

  $("#save-about").addEventListener("click", async () => {
    try {
      await api("/api/about", {
        method: "PUT",
        body: JSON.stringify({
          heading: $("#about-heading").value,
          bio: $("#about-bio").value,
          location: $("#about-location").value,
          focus: $("#about-focus").value,
          currently: $("#about-currently").value,
        }),
      });
      showToast("About saved");
      AdminTools.refreshPreview();
    } catch (err) { showToast(err.message, true); }
  });

  $("#profile-upload").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      profileImage = await uploadImage(file);
      $("#profile-preview").src = profileImage;
      showToast("Photo uploaded — click Save Profile");
    } catch (err) { showToast(err.message, true); }
    e.target.value = "";
  });

  // Education
  function renderEducation() {
    const list = $("#education-list");
    list.innerHTML = content.education.map((item) => `
      <div class="item-card sortable-item" data-id="${item.id}">
        <div class="item-card-header">
          <span class="drag-handle" draggable="true" title="Drag to reorder">⠿</span>
          <h4>Education</h4>
        </div>
        <div class="form-row">
          <div class="form-group"><label for="edu-period-${item.id}">Period</label><input type="text" id="edu-period-${item.id}" name="edu-period-${item.id}" class="edu-period" value="${esc(item.period)}"></div>
          <div class="form-group"><label for="edu-title-${item.id}">Degree / Program</label><input type="text" id="edu-title-${item.id}" name="edu-title-${item.id}" class="edu-title" value="${esc(item.title)}"></div>
        </div>
        <div class="form-group"><label for="edu-institution-${item.id}">Institution</label><input type="text" id="edu-institution-${item.id}" name="edu-institution-${item.id}" class="edu-institution" value="${esc(item.institution)}"></div>
        <div class="form-group"><label for="edu-desc-${item.id}">Description</label><textarea id="edu-desc-${item.id}" name="edu-desc-${item.id}" class="edu-desc" rows="2">${esc(item.description)}</textarea></div>
        <div class="item-card-actions">
          <button type="button" class="btn btn-ai btn-sm" data-ai-section="education_description" data-ai-target="edu-desc-${item.id}" data-ai-title="${esc(item.title)}" data-ai-institution="${esc(item.institution)}">✦ Suggest</button>
          <button class="btn btn-primary btn-sm save-edu">Save</button>
          <button class="btn btn-danger btn-sm delete-edu">Delete</button>
        </div>
      </div>
    `).join("");
    bindEducationEvents();
  }

  function bindEducationEvents() {
    $("#education-list").querySelectorAll(".save-edu").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const card = btn.closest(".item-card");
        const id = card.dataset.id;
        try {
          await api(`/api/education/${id}`, {
            method: "PUT",
            body: JSON.stringify({
              period: card.querySelector(".edu-period").value,
              title: card.querySelector(".edu-title").value,
              institution: card.querySelector(".edu-institution").value,
              description: card.querySelector(".edu-desc").value,
            }),
          });
          showToast("Education saved");
          AdminTools.refreshPreview();
        } catch (err) { showToast(err.message, true); }
      });
    });
    $("#education-list").querySelectorAll(".delete-edu").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this entry?")) return;
        const id = btn.closest(".item-card").dataset.id;
        await api(`/api/education/${id}`, { method: "DELETE" });
        await loadContent();
        showToast("Deleted");
      });
    });
  }

  $("#add-education").addEventListener("click", async () => {
    await api("/api/education", {
      method: "POST",
      body: JSON.stringify({ period: "Year — Year", title: "New Degree", institution: "School Name", description: "" }),
    });
    await loadContent();
    showToast("Education added");
  });

  // Jobs
  function renderJobs() {
    $("#jobs-list").innerHTML = content.jobs.map((item) => `
      <div class="item-card sortable-item" data-id="${item.id}">
        <div class="item-card-header">
          <span class="drag-handle" draggable="true" title="Drag to reorder">⠿</span>
          <h4>Job</h4>
        </div>
        <div class="form-row">
          <div class="form-group"><label for="job-period-${item.id}">Period</label><input type="text" id="job-period-${item.id}" name="job-period-${item.id}" class="job-period" value="${esc(item.period)}"></div>
          <div class="form-group"><label for="job-title-${item.id}">Title</label><input type="text" id="job-title-${item.id}" name="job-title-${item.id}" class="job-title" value="${esc(item.title)}"></div>
        </div>
        <div class="form-group"><label for="job-company-${item.id}">Company</label><input type="text" id="job-company-${item.id}" name="job-company-${item.id}" class="job-company" value="${esc(item.company)}"></div>
        <div class="form-group"><label for="job-desc-${item.id}">Description</label><textarea id="job-desc-${item.id}" name="job-desc-${item.id}" class="job-desc" rows="4">${esc(item.description)}</textarea></div>
        <div class="item-card-actions">
          <button type="button" class="btn btn-ai btn-sm" data-ai-section="job_description" data-ai-target="job-desc-${item.id}" data-ai-title="${esc(item.title)}" data-ai-company="${esc(item.company)}">✦ Suggest</button>
          <button class="btn btn-primary btn-sm save-job">Save</button>
          <button class="btn btn-danger btn-sm delete-job">Delete</button>
        </div>
      </div>
    `).join("");
    bindJobEvents();
  }

  function bindJobEvents() {
    $("#jobs-list").querySelectorAll(".save-job").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const card = btn.closest(".item-card");
        try {
          await api(`/api/jobs/${card.dataset.id}`, {
            method: "PUT",
            body: JSON.stringify({
              period: card.querySelector(".job-period").value,
              title: card.querySelector(".job-title").value,
              company: card.querySelector(".job-company").value,
              description: card.querySelector(".job-desc").value,
            }),
          });
          showToast("Job saved");
          AdminTools.refreshPreview();
        } catch (err) { showToast(err.message, true); }
      });
    });
    $("#jobs-list").querySelectorAll(".delete-job").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this job?")) return;
        await api(`/api/jobs/${btn.closest(".item-card").dataset.id}`, { method: "DELETE" });
        await loadContent();
        showToast("Deleted");
      });
    });
  }

  $("#add-job").addEventListener("click", async () => {
    await api("/api/jobs", {
      method: "POST",
      body: JSON.stringify({ period: "Year — Present", title: "Job Title", company: "Company", description: "" }),
    });
    await loadContent();
    showToast("Job added");
  });

  // Experience (projects only)
  function renderExperience() {
    const projects = content.experiences.filter((item) => !item.is_skills);
    $("#experience-list").innerHTML = projects.map((item) => `
      <div class="item-card" data-id="${item.id}">
        <div class="item-card-header"><h4>Project</h4></div>
        <div class="form-group"><label for="exp-title-${item.id}">Title</label><input type="text" id="exp-title-${item.id}" name="exp-title-${item.id}" class="exp-title" value="${esc(item.title)}"></div>
        <div class="form-group"><label for="exp-desc-${item.id}">Description</label><textarea id="exp-desc-${item.id}" name="exp-desc-${item.id}" class="exp-desc" rows="2">${esc(item.description)}</textarea></div>
        <div class="item-card-actions">
          <button type="button" class="btn btn-ai btn-sm" data-ai-section="experience_description" data-ai-target="exp-desc-${item.id}" data-ai-title="${esc(item.title)}">✦ Suggest</button>
          <button class="btn btn-primary btn-sm save-exp">Save</button>
          <button class="btn btn-danger btn-sm delete-exp">Delete</button>
        </div>
      </div>
    `).join("");
    bindExperienceEvents();
  }

  function bindExperienceEvents() {
    $("#experience-list").querySelectorAll(".save-exp").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const card = btn.closest(".item-card");
        try {
          await api(`/api/experiences/${card.dataset.id}`, {
            method: "PUT",
            body: JSON.stringify({
              title: card.querySelector(".exp-title").value,
              description: card.querySelector(".exp-desc").value,
              is_skills: false,
            }),
          });
          showToast("Project saved");
          AdminTools.refreshPreview();
        } catch (err) { showToast(err.message, true); }
      });
    });
    $("#experience-list").querySelectorAll(".delete-exp").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this project?")) return;
        await api(`/api/experiences/${btn.closest(".item-card").dataset.id}`, { method: "DELETE" });
        await loadContent();
        showToast("Deleted");
      });
    });
  }

  $("#add-experience").addEventListener("click", async () => {
    await api("/api/experiences", {
      method: "POST",
      body: JSON.stringify({ title: "New Project", description: "", is_skills: false }),
    });
    await loadContent();
    showToast("Project added");
  });

  function getSkillsExperience() {
    return content.experiences.find((item) => item.is_skills);
  }

  async function ensureSkillsExperience() {
    let exp = getSkillsExperience();
    if (!exp) {
      await api("/api/experiences", {
        method: "POST",
        body: JSON.stringify({ title: "Skills Matrix", description: "", is_skills: true }),
      });
      await loadContent();
      exp = getSkillsExperience();
    }
    return exp;
  }

  function renderSkillsMatrixAdmin() {
    const root = $("#skills-matrix-admin");
    const exp = getSkillsExperience();
    if (!exp) {
      root.innerHTML = `
        <div class="card-form">
          <p class="panel-intro">No skills matrix yet.</p>
          <button type="button" class="btn btn-primary btn-sm" id="init-skills-matrix">Create Skills Matrix</button>
        </div>`;
      $("#init-skills-matrix")?.addEventListener("click", async () => {
        await ensureSkillsExperience();
        showToast("Skills matrix created");
      });
      return;
    }

    const byCategory = {};
    for (const key of Object.keys(SKILL_CATEGORIES)) byCategory[key] = [];
    for (const skill of exp.skills) {
      const cat = SKILL_CATEGORIES[skill.category] ? skill.category : "tools";
      byCategory[cat].push(skill);
    }

    root.innerHTML = Object.entries(SKILL_CATEGORIES).map(([key, label]) => `
      <div class="skills-category-card" data-category="${key}">
        <h4>${label}</h4>
        <div class="skills-input-row" id="skills-cat-${key}">
          ${byCategory[key].map((s) => `
            <span class="skill-tag">
              ${esc(s.name)}
              <button type="button" data-skill-id="${s.id}" aria-label="Remove skill">&times;</button>
            </span>`).join("")}
        </div>
        <div class="add-skill-row">
          <label for="new-skill-${key}" class="visually-hidden">Add ${label} skill</label>
          <input type="text" id="new-skill-${key}" class="new-skill-input" placeholder="Add ${label.toLowerCase()} skill...">
          <button type="button" class="btn btn-secondary btn-sm add-skill-cat-btn" data-category="${key}">Add</button>
        </div>
      </div>
    `).join("");

    root.querySelectorAll(".add-skill-cat-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const category = btn.dataset.category;
        const input = root.querySelector(`#new-skill-${category}`);
        const name = input.value.trim();
        if (!name) return;
        await api(`/api/experiences/${exp.id}/skills`, {
          method: "POST",
          body: JSON.stringify({ name, category }),
        });
        await loadContent();
        showToast("Skill added");
        AdminTools.refreshPreview();
      });
    });

    root.querySelectorAll(".skill-tag button").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await api(`/api/skills/${btn.dataset.skillId}`, { method: "DELETE" });
        await loadContent();
        showToast("Skill removed");
        AdminTools.refreshPreview();
      });
    });
  }

  function renderRoadmap() {
    const list = content.roadmap || [];
    $("#roadmap-list").innerHTML = list.map((item) => `
      <div class="item-card sortable-item roadmap-card" data-id="${item.id}">
        <div class="item-card-header">
          <span class="drag-handle" draggable="true" title="Drag to reorder">⠿</span>
          <span class="roadmap-status roadmap-status--${item.status}">${esc(ROADMAP_STATUS[item.status] || item.status)}</span>
        </div>
        <div class="form-row">
          <div class="form-group"><label for="road-period-${item.id}">Period</label><input type="text" id="road-period-${item.id}" class="road-period" value="${esc(item.period)}"></div>
          <div class="form-group">
            <label for="road-status-${item.id}">Status</label>
            <select id="road-status-${item.id}" class="road-status">
              ${Object.entries(ROADMAP_STATUS).map(([val, lab]) => `<option value="${val}" ${item.status === val ? "selected" : ""}>${lab}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="form-group"><label for="road-title-${item.id}">Goal</label><input type="text" id="road-title-${item.id}" class="road-title" value="${esc(item.title)}"></div>
        <div class="form-group"><label for="road-desc-${item.id}">Description</label><textarea id="road-desc-${item.id}" class="road-desc" rows="3">${esc(item.description)}</textarea></div>
        <div class="item-card-actions">
          <button type="button" class="btn btn-ai btn-sm" data-ai-section="roadmap_description" data-ai-target="road-desc-${item.id}" data-ai-title="${esc(item.title)}" data-ai-status="${esc(item.status)}">✦ Suggest</button>
          <button class="btn btn-primary btn-sm save-road">Save</button>
          <button class="btn btn-danger btn-sm delete-road">Delete</button>
        </div>
      </div>
    `).join("");
    bindRoadmapEvents();
  }

  function bindRoadmapEvents() {
    $("#roadmap-list").querySelectorAll(".save-road").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const card = btn.closest(".item-card");
        try {
          await api(`/api/roadmap/${card.dataset.id}`, {
            method: "PUT",
            body: JSON.stringify({
              period: card.querySelector(".road-period").value,
              title: card.querySelector(".road-title").value,
              description: card.querySelector(".road-desc").value,
              status: card.querySelector(".road-status").value,
            }),
          });
          showToast("Roadmap saved");
          AdminTools.refreshPreview();
        } catch (err) { showToast(err.message, true); }
      });
    });
    $("#roadmap-list").querySelectorAll(".delete-road").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this milestone?")) return;
        await api(`/api/roadmap/${btn.closest(".item-card").dataset.id}`, { method: "DELETE" });
        await loadContent();
        showToast("Deleted");
      });
    });
  }

  $("#add-roadmap").addEventListener("click", async () => {
    await api("/api/roadmap", {
      method: "POST",
      body: JSON.stringify({
        period: "2026",
        title: "New career goal",
        description: "",
        status: "planned",
      }),
    });
    await loadContent();
    showToast("Milestone added");
  });

  // Gallery — visual layout editor
  const GALLERY_LAYOUTS = AdminTools.GALLERY_LAYOUTS;

  function galleryLayoutClass(layout) {
    const meta = GALLERY_LAYOUTS[layout] || GALLERY_LAYOUTS.normal;
    return meta.className;
  }

  function galleryLayoutLabel(layout) {
    return (GALLERY_LAYOUTS[layout] || GALLERY_LAYOUTS.normal).label;
  }

  function galleryImgSrc(item) {
    if (!item?.image_path) return "";
    const sep = item.image_path.includes("?") ? "&" : "?";
    return `${item.image_path}${sep}v=${item.id}`;
  }

  function galleryImgStyle(item) {
    const fx = item.focal_x ?? 50;
    const fy = item.focal_y ?? 50;
    return `object-position:${fx}% ${fy}%`;
  }

  function isGalleryPlaceholder(item) {
    return /^\/images\/photos\/photo-\d+\.svg$/i.test(item?.image_path || "");
  }

  function renderGallery() {
    const items = content.gallery || [];
    const list = $("#gallery-list");
    const empty = $("#gallery-empty");
    const countEl = $("#gallery-count");
    const emptyStat = $("#gallery-empty-count");
    const countries = [...new Set(items.map((i) => i.country).filter(Boolean))];
    const filled = items.filter((i) => !isGalleryPlaceholder(i.image_path));
    const emptySlots = items.filter((i) => isGalleryPlaceholder(i.image_path));

    empty.hidden = items.length > 0;
    list.hidden = items.length === 0;
    if (countEl) {
      const countryNote = countries.length ? ` · ${countries.length} countr${countries.length === 1 ? "y" : "ies"}` : "";
      countEl.textContent = `${filled.length} photo${filled.length === 1 ? "" : "s"}${countryNote}`;
    }
    if (emptyStat) {
      if (emptySlots.length) {
        emptyStat.hidden = false;
        emptyStat.textContent = `${emptySlots.length} empty slot${emptySlots.length === 1 ? "" : "s"} — uploads fill these first`;
      } else {
        emptyStat.hidden = true;
      }
    }

    if (!items.length) {
      list.innerHTML = "";
      return;
    }

    list.innerHTML = items.map((item, index) => {
      const layout = item.layout || "normal";
      const fx = item.focal_x ?? 50;
      const fy = item.focal_y ?? 50;
      const placeholder = isGalleryPlaceholder(item);
      const emptySlot = placeholder
        ? `<div class="gallery-empty-slot">
            <span class="gallery-empty-slot-num">${index + 1}</span>
            <p>Empty slot</p>
            <label class="btn btn-secondary btn-sm gallery-slot-upload-label">
              Add photo
              <input type="file" class="gallery-slot-upload-input" accept="image/*,.heic,.heif" hidden>
            </label>
          </div>`
        : "";
      return `
      <div class="gallery-editor-item ${galleryLayoutClass(layout)}${placeholder ? " is-empty-slot" : ""}" data-id="${item.id}" data-layout="${esc(layout)}" data-focal-x="${fx}" data-focal-y="${fy}">
        <span class="gallery-editor-pos">${index + 1}</span>
        <span class="gallery-size-badge">${galleryLayoutLabel(layout)}</span>
        ${item.country ? `<span class="gallery-country-badge">${esc(item.country)}</span>` : ""}
        <div class="gallery-image-frame">
          ${placeholder ? "" : `<img src="${esc(galleryImgSrc(item))}" alt="${esc(item.alt_text || item.caption || "Photo")}" loading="lazy" style="${galleryImgStyle(item)}" draggable="false">`}
          ${emptySlot}
          <button type="button" class="gallery-focal-marker" style="left:${fx}%;top:${fy}%" title="Drag or click to set visible area" aria-label="Adjust photo position"></button>
          <div class="gallery-focal-hint">Click or drag to adjust frame</div>
        </div>
        <div class="gallery-broken-msg">
          <p>Image file missing</p>
          <label class="btn btn-secondary btn-sm gallery-reupload-label">
            Re-upload
            <input type="file" class="gallery-reupload-input" accept="image/*,.heic,.heif" hidden>
          </label>
        </div>
        <button type="button" class="gallery-resize-handle" title="Drag corner to resize tile" aria-label="Resize photo tile"></button>
        <div class="gallery-editor-overlay">
          <div class="gallery-editor-top">
            <span class="drag-handle" draggable="true" title="Drag to reorder">⠿</span>
            <div class="gallery-layout-btns">
              ${Object.entries(GALLERY_LAYOUTS).map(([key, meta]) => `
                <button type="button" class="gallery-layout-btn ${layout === key ? "is-active" : ""}" data-layout="${key}" title="${meta.label}">${meta.label}</button>
              `).join("")}
            </div>
          </div>
          <div class="gallery-editor-bottom">
            <input type="text" class="gal-country" value="${esc(item.country || "")}" placeholder="Country (e.g. Thailand)" aria-label="Country">
            <input type="text" class="gal-caption" value="${esc(item.caption)}" placeholder="Place / caption (optional)" aria-label="Caption">
            <input type="text" class="gal-alt" value="${esc(item.alt_text)}" placeholder="Alt text" aria-label="Alt text">
            <div class="gallery-editor-actions">
              <button type="button" class="btn btn-danger btn-sm delete-gal">Delete</button>
            </div>
          </div>
        </div>
      </div>`;
    }).join("");
    bindGalleryEvents();
  }

  async function saveGalleryItem(card, layoutOverride) {
    const id = card.dataset.id;
    const orig = content.gallery.find((g) => g.id == id);
    if (!orig) return;
    const layout =
      layoutOverride ||
      card.querySelector(".gallery-layout-btn.is-active")?.dataset.layout ||
      card.dataset.layout ||
      orig.layout ||
      "normal";
    const focal_x = Number(card.dataset.focalX ?? 50);
    const focal_y = Number(card.dataset.focalY ?? 50);
    const country = card.querySelector(".gal-country")?.value?.trim() || "";
    const caption = card.querySelector(".gal-caption")?.value?.trim() || "";
    const alt_text = card.querySelector(".gal-alt")?.value?.trim() || "";
    await api(`/api/gallery/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        image_path: orig.image_path,
        caption,
        alt_text,
        layout,
        country,
        focal_x,
        focal_y,
      }),
    });
    orig.layout = layout;
    orig.caption = caption;
    orig.alt_text = alt_text;
    orig.country = country;
    orig.focal_x = focal_x;
    orig.focal_y = focal_y;
    card.dataset.layout = layout;
  }

  function setGalleryFocal(card, x, y) {
    const fx = Math.max(0, Math.min(100, Math.round(x)));
    const fy = Math.max(0, Math.min(100, Math.round(y)));
    card.dataset.focalX = String(fx);
    card.dataset.focalY = String(fy);
    const img = card.querySelector(".gallery-image-frame img");
    const marker = card.querySelector(".gallery-focal-marker");
    if (img) img.style.objectPosition = `${fx}% ${fy}%`;
    if (marker) {
      marker.style.left = `${fx}%`;
      marker.style.top = `${fy}%`;
    }
  }

  function bindGalleryFocal(card) {
    const frame = card.querySelector(".gallery-image-frame");
    const marker = card.querySelector(".gallery-focal-marker");
    if (!frame || frame.dataset.focalBound) return;
    frame.dataset.focalBound = "1";

    const updateFromEvent = (e) => {
      const rect = frame.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setGalleryFocal(card, x, y);
    };

    frame.addEventListener("click", async (e) => {
      if (e.target.closest(".gallery-focal-marker")) return;
      updateFromEvent(e);
      await saveGalleryItem(card);
      showToast("Frame position saved");
      AdminTools.refreshPreview();
    });

    if (marker) {
      let dragging = false;
      marker.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragging = true;
      });
      document.addEventListener("mousemove", (e) => {
        if (!dragging) return;
        updateFromEvent(e);
      });
      document.addEventListener("mouseup", async () => {
        if (!dragging) return;
        dragging = false;
        await saveGalleryItem(card);
        showToast("Frame position saved");
        AdminTools.refreshPreview();
      });
    }
  }

  function bindGalleryEvents() {
    const list = $("#gallery-list");

    AdminTools.initGalleryLayoutEditor(
      list,
      async (ids) => {
        await api("/api/gallery/reorder", { method: "PUT", body: JSON.stringify({ ids }) });
        showToast("Photo order saved");
        AdminTools.refreshPreview();
      },
      async (card, layout) => {
        card.querySelectorAll(".gallery-layout-btn").forEach((b) => {
          b.classList.toggle("is-active", b.dataset.layout === layout);
        });
        await saveGalleryItem(card, layout);
        showToast(`Tile size ${galleryLayoutLabel(layout)}`);
        AdminTools.refreshPreview();
      }
    );

    list.querySelectorAll(".gallery-editor-item").forEach((card) => {
      bindGalleryFocal(card);
      const img = card.querySelector(".gallery-image-frame img");
      img?.addEventListener("error", () => {
        card.classList.add("is-broken");
        img.hidden = true;
      });

      card.querySelectorAll(".gallery-layout-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const layout = btn.dataset.layout;
          AdminTools.applyGalleryLayoutClass(card, layout);
          card.querySelectorAll(".gallery-layout-btn").forEach((b) => {
            b.classList.toggle("is-active", b === btn);
          });
          await saveGalleryItem(card, layout);
          showToast(`Tile size ${galleryLayoutLabel(layout)}`);
          AdminTools.refreshPreview();
        });
      });

      card.querySelector(".gal-caption")?.addEventListener("change", async () => {
        await saveGalleryItem(card);
        showToast("Caption saved");
        AdminTools.refreshPreview();
      });
      card.querySelector(".gal-country")?.addEventListener("change", async () => {
        await saveGalleryItem(card);
        showToast("Country saved");
        AdminTools.refreshPreview();
      });
      card.querySelector(".gal-alt")?.addEventListener("change", async () => {
        await saveGalleryItem(card);
        showToast("Alt text saved");
      });

      const reuploadInput = card.querySelector(".gallery-reupload-input");
      reuploadInput?.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = "";
        await handleSlotUpload(card, file);
      });

      const slotUploadInput = card.querySelector(".gallery-slot-upload-input");
      slotUploadInput?.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = "";
        await handleSlotUpload(card, file);
      });
    });

    list.querySelectorAll(".delete-gal").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this photo?")) return;
        await api(`/api/gallery/${btn.closest(".gallery-editor-item").dataset.id}`, { method: "DELETE" });
        await loadContent();
        showToast("Photo deleted");
        AdminTools.refreshPreview();
      });
    });
  }

  async function handleSlotUpload(card, file) {
    const id = card.dataset.id;
    const country =
      card.querySelector(".gal-country")?.value?.trim() ||
      $("#gallery-default-country")?.value?.trim() ||
      "";
    const caption = card.querySelector(".gal-caption")?.value?.trim() || "";
    try {
      const data = await uploadToGallerySlot(id, file, { country, caption });
      const orig = content.gallery.find((g) => g.id == id);
      if (orig) {
        orig.image_path = data.image_path;
        orig.caption = data.caption;
        orig.alt_text = data.alt_text;
        if (data.country) orig.country = data.country;
      }
      showToast(`Slot ${card.querySelector(".gallery-editor-pos")?.textContent || ""} updated`);
      await loadContent();
      AdminTools.refreshPreview();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  async function batchUploadGallery(files) {
    if (!files.length) return;
    const country = $("#gallery-default-country")?.value?.trim() || "";
    const form = new FormData();
    files.forEach((f) => form.append("images", f));
    if (country) form.append("country", country);
    const res = await fetch("/api/gallery/batch", { method: "POST", credentials: "same-origin", body: form });
    if (res.status === 401) { showLogin(); throw new Error("Unauthorized"); }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");

    const filled = data.filled || 0;
    const added = data.added || 0;
    let msg;
    if (filled && added) msg = `Filled ${filled} slot${filled === 1 ? "" : "s"}, added ${added} new`;
    else if (filled) msg = `Filled ${filled} empty slot${filled === 1 ? "" : "s"}`;
    else msg = files.length === 1 ? "Photo added" : `${data.count} photos added`;
    showToast(msg);
    await loadContent();
    AdminTools.refreshPreview();
  }

  $("#gallery-upload").addEventListener("change", async (e) => {
    const files = [...e.target.files];
    e.target.value = "";
    try {
      await batchUploadGallery(files);
    } catch (err) { showToast(err.message, true); }
  });

  const dropzone = $("#gallery-dropzone");
  if (dropzone) {
    ["dragenter", "dragover"].forEach((ev) => {
      dropzone.addEventListener(ev, (e) => {
        e.preventDefault();
        dropzone.classList.add("is-dragover");
      });
    });
    ["dragleave", "drop"].forEach((ev) => {
      dropzone.addEventListener(ev, (e) => {
        e.preventDefault();
        dropzone.classList.remove("is-dragover");
      });
    });
    dropzone.addEventListener("drop", async (e) => {
      const files = [...e.dataTransfer.files].filter((f) => f.type.startsWith("image/") || /\.heic$|\.heif$/i.test(f.name));
      if (!files.length) {
        showToast("Drop image files only", true);
        return;
      }
      try {
        await batchUploadGallery(files);
      } catch (err) {
        showToast(err.message, true);
      }
    });
  }

  // Contacts
  function renderContacts() {
    $("#contact-list").innerHTML = content.contacts.map((item) => `
      <div class="item-card" data-id="${item.id}">
        <div class="form-row form-row--3">
          <div class="form-group"><label for="con-label-${item.id}">Label</label><input type="text" id="con-label-${item.id}" name="con-label-${item.id}" class="con-label" value="${esc(item.label)}"></div>
          <div class="form-group"><label for="con-value-${item.id}">Display Text</label><input type="text" id="con-value-${item.id}" name="con-value-${item.id}" class="con-value" value="${esc(item.value)}"></div>
          <div class="form-group"><label for="con-url-${item.id}">URL</label><input type="url" id="con-url-${item.id}" name="con-url-${item.id}" class="con-url" value="${esc(item.url)}"></div>
        </div>
        <div class="item-card-actions">
          <button class="btn btn-primary btn-sm save-con">Save</button>
          <button class="btn btn-danger btn-sm delete-con">Delete</button>
        </div>
      </div>
    `).join("");
    bindContactEvents();
  }

  function bindContactEvents() {
    $("#contact-list").querySelectorAll(".save-con").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const card = btn.closest(".item-card");
        try {
          await api(`/api/contacts/${card.dataset.id}`, {
            method: "PUT",
            body: JSON.stringify({
              label: card.querySelector(".con-label").value,
              value: card.querySelector(".con-value").value,
              url: card.querySelector(".con-url").value,
            }),
          });
          showToast("Contact saved");
        } catch (err) { showToast(err.message, true); }
      });
    });
    $("#contact-list").querySelectorAll(".delete-con").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this contact?")) return;
        await api(`/api/contacts/${btn.closest(".item-card").dataset.id}`, { method: "DELETE" });
        await loadContent();
        showToast("Deleted");
      });
    });
  }

  $("#add-contact").addEventListener("click", async () => {
    await api("/api/contacts", {
      method: "POST",
      body: JSON.stringify({ label: "New Link", value: "example.com", url: "https://example.com" }),
    });
    await loadContent();
    showToast("Contact added");
  });

  function esc(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  checkAuth();
})();

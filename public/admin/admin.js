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
    gallery: "Gallery",
    contact: "Contact",
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

  async function uploadImage(file) {
    const form = new FormData();
    form.append("image", file);
    const res = await fetch("/api/upload", { method: "POST", credentials: "same-origin", body: form });
    if (res.status === 401) { showLogin(); throw new Error("Unauthorized"); }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data.path;
  }

  function showToast(msg, isError = false) {
    toast.textContent = msg;
    toast.classList.toggle("error", isError);
    toast.hidden = false;
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => { toast.hidden = true; }, 2800);
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
    renderProfile();
    renderAbout();
    renderEducation();
    renderJobs();
    renderExperience();
    renderGallery();
    renderContacts();
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
      <div class="item-card" data-id="${item.id}">
        <div class="item-card-header"><h4>Education</h4></div>
        <div class="form-row">
          <div class="form-group"><label for="edu-period-${item.id}">Period</label><input type="text" id="edu-period-${item.id}" name="edu-period-${item.id}" class="edu-period" value="${esc(item.period)}"></div>
          <div class="form-group"><label for="edu-title-${item.id}">Degree / Program</label><input type="text" id="edu-title-${item.id}" name="edu-title-${item.id}" class="edu-title" value="${esc(item.title)}"></div>
        </div>
        <div class="form-group"><label for="edu-institution-${item.id}">Institution</label><input type="text" id="edu-institution-${item.id}" name="edu-institution-${item.id}" class="edu-institution" value="${esc(item.institution)}"></div>
        <div class="form-group"><label for="edu-desc-${item.id}">Description</label><textarea id="edu-desc-${item.id}" name="edu-desc-${item.id}" class="edu-desc" rows="2">${esc(item.description)}</textarea></div>
        <div class="item-card-actions">
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
      <div class="item-card" data-id="${item.id}">
        <div class="item-card-header"><h4>Job</h4></div>
        <div class="form-row">
          <div class="form-group"><label for="job-period-${item.id}">Period</label><input type="text" id="job-period-${item.id}" name="job-period-${item.id}" class="job-period" value="${esc(item.period)}"></div>
          <div class="form-group"><label for="job-title-${item.id}">Title</label><input type="text" id="job-title-${item.id}" name="job-title-${item.id}" class="job-title" value="${esc(item.title)}"></div>
        </div>
        <div class="form-group"><label for="job-company-${item.id}">Company</label><input type="text" id="job-company-${item.id}" name="job-company-${item.id}" class="job-company" value="${esc(item.company)}"></div>
        <div class="form-group"><label for="job-desc-${item.id}">Description</label><textarea id="job-desc-${item.id}" name="job-desc-${item.id}" class="job-desc" rows="2">${esc(item.description)}</textarea></div>
        <div class="item-card-actions">
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

  // Experience
  function renderExperience() {
    $("#experience-list").innerHTML = content.experiences.map((item) => `
      <div class="item-card" data-id="${item.id}" data-skills="${item.is_skills}">
        <div class="item-card-header"><h4>${item.is_skills ? "Skills & Interests" : "Experience"}</h4></div>
        <div class="form-group"><label for="exp-title-${item.id}">Title</label><input type="text" id="exp-title-${item.id}" name="exp-title-${item.id}" class="exp-title" value="${esc(item.title)}"></div>
        ${item.is_skills ? "" : `<div class="form-group"><label for="exp-desc-${item.id}">Description</label><textarea id="exp-desc-${item.id}" name="exp-desc-${item.id}" class="exp-desc" rows="2">${esc(item.description)}</textarea></div>`}
        ${item.is_skills ? `
          <div class="skills-input-row" id="skills-${item.id}">
            ${item.skills.map((s) => `<span class="skill-tag">${esc(s.name)}<button type="button" data-skill-id="${s.id}" aria-label="Remove skill">&times;</button></span>`).join("")}
          </div>
          <div class="add-skill-row">
            <label for="new-skill-${item.id}" class="visually-hidden">Add skill</label>
            <input type="text" id="new-skill-${item.id}" name="new-skill-${item.id}" class="new-skill-input" placeholder="Add skill...">
            <button type="button" class="btn btn-secondary btn-sm add-skill-btn">Add</button>
          </div>
        ` : ""}
        <div class="item-card-actions">
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
        const isSkills = card.dataset.skills === "1";
        try {
          await api(`/api/experiences/${card.dataset.id}`, {
            method: "PUT",
            body: JSON.stringify({
              title: card.querySelector(".exp-title").value,
              description: isSkills ? "" : card.querySelector(".exp-desc").value,
              is_skills: isSkills,
            }),
          });
          showToast("Experience saved");
        } catch (err) { showToast(err.message, true); }
      });
    });
    $("#experience-list").querySelectorAll(".delete-exp").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this entry?")) return;
        await api(`/api/experiences/${btn.closest(".item-card").dataset.id}`, { method: "DELETE" });
        await loadContent();
        showToast("Deleted");
      });
    });
    $("#experience-list").querySelectorAll(".add-skill-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const card = btn.closest(".item-card");
        const input = card.querySelector(".new-skill-input");
        const name = input.value.trim();
        if (!name) return;
        await api(`/api/experiences/${card.dataset.id}/skills`, {
          method: "POST",
          body: JSON.stringify({ name }),
        });
        await loadContent();
        showToast("Skill added");
      });
    });
    $("#experience-list").querySelectorAll(".skill-tag button").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await api(`/api/skills/${btn.dataset.skillId}`, { method: "DELETE" });
        await loadContent();
        showToast("Skill removed");
      });
    });
  }

  $("#add-experience").addEventListener("click", async () => {
    await api("/api/experiences", {
      method: "POST",
      body: JSON.stringify({ title: "New Experience", description: "", is_skills: false }),
    });
    await loadContent();
    showToast("Experience added");
  });

  // Gallery
  function renderGallery() {
    $("#gallery-list").innerHTML = content.gallery.map((item) => `
      <div class="gallery-admin-card" data-id="${item.id}">
        <img src="${esc(item.image_path)}" alt="${esc(item.alt_text || item.caption || "Gallery photo")}">
        <div class="gallery-admin-body">
          <label for="gal-caption-${item.id}">Caption</label>
          <input type="text" id="gal-caption-${item.id}" name="gal-caption-${item.id}" class="gal-caption" value="${esc(item.caption)}" placeholder="Caption">
          <label for="gal-alt-${item.id}">Alt text</label>
          <input type="text" id="gal-alt-${item.id}" name="gal-alt-${item.id}" class="gal-alt" value="${esc(item.alt_text)}" placeholder="Alt text">
          <label for="gal-layout-${item.id}">Layout</label>
          <select id="gal-layout-${item.id}" name="gal-layout-${item.id}" class="gal-layout">
            <option value="normal" ${item.layout === "normal" ? "selected" : ""}>Normal</option>
            <option value="wide" ${item.layout === "wide" ? "selected" : ""}>Wide</option>
            <option value="tall" ${item.layout === "tall" ? "selected" : ""}>Tall</option>
          </select>
          <div class="gallery-admin-actions">
            <button class="btn btn-primary btn-sm save-gal">Save</button>
            <button class="btn btn-danger btn-sm delete-gal">Delete</button>
          </div>
        </div>
      </div>
    `).join("");
    bindGalleryEvents();
  }

  function bindGalleryEvents() {
    $("#gallery-list").querySelectorAll(".save-gal").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const card = btn.closest(".gallery-admin-card");
        const id = card.dataset.id;
        const orig = content.gallery.find((g) => g.id == id);
        try {
          await api(`/api/gallery/${id}`, {
            method: "PUT",
            body: JSON.stringify({
              image_path: orig.image_path,
              caption: card.querySelector(".gal-caption").value,
              alt_text: card.querySelector(".gal-alt").value,
              layout: card.querySelector(".gal-layout").value,
            }),
          });
          showToast("Photo saved");
        } catch (err) { showToast(err.message, true); }
      });
    });
    $("#gallery-list").querySelectorAll(".delete-gal").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this photo?")) return;
        await api(`/api/gallery/${btn.closest(".gallery-admin-card").dataset.id}`, { method: "DELETE" });
        await loadContent();
        showToast("Photo deleted");
      });
    });
  }

  $("#gallery-upload").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const path = await uploadImage(file);
      await api("/api/gallery", {
        method: "POST",
        body: JSON.stringify({ image_path: path, caption: "", alt_text: file.name, layout: "normal" }),
      });
      await loadContent();
      showToast("Photo uploaded");
    } catch (err) { showToast(err.message, true); }
    e.target.value = "";
  });

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

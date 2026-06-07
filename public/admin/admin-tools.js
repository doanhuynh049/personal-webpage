(function (AdminTools) {
  "use strict";

  let apiFn = null;
  let showToastFn = null;
  let $ = null;
  let aiTarget = null;

  function refreshPreview() {
    const iframe = document.getElementById("live-preview");
    if (!iframe) return;
    iframe.src = "/?preview=" + Date.now();
  }

  function initSortable(listEl, type) {
    if (!listEl) return;
    let dragEl = null;

    listEl.querySelectorAll(".sortable-item").forEach((card) => {
      const handle = card.querySelector(".drag-handle");
      if (!handle) return;

      handle.addEventListener("dragstart", (e) => {
        dragEl = card;
        card.classList.add("is-dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", card.dataset.id);
      });

      card.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (!dragEl || dragEl === card) return;
        const rect = card.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        if (e.clientY < mid) listEl.insertBefore(dragEl, card);
        else listEl.insertBefore(dragEl, card.nextSibling);
      });

      card.addEventListener("dragend", async () => {
        card.classList.remove("is-dragging");
        if (!dragEl) return;
        dragEl = null;
        const ids = [...listEl.querySelectorAll(".sortable-item")].map((el) => Number(el.dataset.id));
        try {
          await apiFn(`/api/${type}/reorder`, {
            method: "PUT",
            body: JSON.stringify({ ids }),
          });
          showToastFn("Order saved");
          refreshPreview();
        } catch (err) {
          showToastFn(err.message, true);
        }
      });
    });
  }

  function initAllSortables() {
    initSortable(document.getElementById("education-list"), "education");
    initSortable(document.getElementById("jobs-list"), "jobs");
    initSortable(document.getElementById("gallery-list"), "gallery");
    initSortable(document.getElementById("roadmap-list"), "roadmap");
  }

  async function openAiPanel(section, textarea, context) {
    const drawer = document.getElementById("ai-drawer");
    const body = document.getElementById("ai-suggestion-text");
    const note = document.getElementById("ai-note");
    if (!drawer || !body || !textarea) return;

    aiTarget = textarea;
    drawer.hidden = false;
    body.textContent = "Generating suggestion…";
    note.textContent = "";

    try {
      const result = await apiFn("/api/ai/suggest", {
        method: "POST",
        body: JSON.stringify({ section, currentText: textarea.value, context }),
      });
      body.textContent = result.suggestion || "No suggestion returned.";
      note.textContent = result.note || (result.source === "ollama" ? "Generated via local Ollama" : "Template suggestions — install Ollama for free AI");
    } catch (err) {
      body.textContent = err.message;
    }
  }

  function closeAiPanel() {
    const drawer = document.getElementById("ai-drawer");
    if (drawer) drawer.hidden = true;
    aiTarget = null;
  }

  function applyAiSuggestion() {
    if (!aiTarget) return;
    const text = document.getElementById("ai-suggestion-text")?.textContent || "";
    if (text && !text.startsWith("Generating")) {
      aiTarget.value = text;
      showToastFn("Suggestion applied — review and Save");
      closeAiPanel();
    }
  }

  function bindAiButton(btn) {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.aiTarget;
      const section = btn.dataset.aiSection;
      const textarea = document.getElementById(targetId);
      if (!textarea) return;
      const context = {};
      if (btn.dataset.aiTitle) context.title = btn.dataset.aiTitle;
      if (btn.dataset.aiCompany) context.company = btn.dataset.aiCompany;
      if (btn.dataset.aiInstitution) context.institution = btn.dataset.aiInstitution;
      if (btn.dataset.aiStatus) context.status = btn.dataset.aiStatus;
      openAiPanel(section, textarea, context);
    });
  }

  function bindAiButtons(root) {
    (root || document).querySelectorAll("[data-ai-section]").forEach(bindAiButton);
  }

  function initPreviewPanel() {
    const panel = document.getElementById("preview-panel");
    const toggle = document.getElementById("toggle-preview");
    const refresh = document.getElementById("refresh-preview");

    if (toggle && panel) {
      toggle.addEventListener("click", () => {
        panel.classList.toggle("is-collapsed");
        toggle.textContent = panel.classList.contains("is-collapsed") ? "Show Preview" : "Hide Preview";
      });
    }

    if (refresh) refresh.addEventListener("click", refreshPreview);
  }

  AdminTools.initPreviewPanel = initPreviewPanel;
  AdminTools.init = function ({ api, showToast, query }) {
    apiFn = api;
    showToastFn = showToast;
    $ = query;
    initPreviewPanel();
    document.getElementById("ai-close")?.addEventListener("click", closeAiPanel);
    document.getElementById("ai-close-2")?.addEventListener("click", closeAiPanel);
    document.getElementById("ai-apply")?.addEventListener("click", applyAiSuggestion);
    document.getElementById("ai-drawer-backdrop")?.addEventListener("click", closeAiPanel);
  };

  AdminTools.refreshPreview = refreshPreview;
  AdminTools.initAllSortables = initAllSortables;
  AdminTools.bindAiButtons = bindAiButtons;
})(window.AdminTools = window.AdminTools || {});
